import { BadRequestException, ConflictException, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcryptjs";
import * as crypto from "node:crypto";
import { ConfigService } from "@nestjs/config";
import { LoginDto, RegisterDto, UpdateProfileDto } from "../dto/auth.dto";
import { PrismaService } from "./prisma.service";
import { LoginAttemptService } from "./login-attempt.service";
import { RefreshTokenService } from "./refresh-token.service";
import { mapCollection, mapModel, mapQuestion, mapTest } from "./mappers";
import { EmailService } from "../notifications/email.service";
import { Inject } from "@nestjs/common";
import { EMAIL_SERVICE } from "../notifications/email.service";

const EMAIL_VERIFY_TTL_HOURS = 24;
const EMAIL_VERIFY_BYTES = 32;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly attempts: LoginAttemptService,
    private readonly refreshTokens: RefreshTokenService,
    @Inject(EMAIL_SERVICE) private readonly email: EmailService
  ) {}

  async register(
    input: RegisterDto,
    meta: { ip?: string; userAgent?: string } = {}
  ) {
    const email = input.email.trim().toLowerCase();
    const existing = await this.prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
    if (existing) throw new ConflictException("Email already registered");

    const user = await this.prisma.user.create({
      data: {
        name: input.name,
        brandName: input.brandName,
        email,
        passwordHash: await bcrypt.hash(input.password, 12),
        city: input.city,
        country: input.country
      }
    });
    return this.session(user, meta);
  }

  async login(
    input: LoginDto,
    meta: { ip?: string; userAgent?: string } = {}
  ) {
    const email = input.email.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
    if (!user) {
      await this.attempts.record(email, meta.ip ?? "?", false, "user_not_found");
      throw new UnauthorizedException("Invalid email or password");
    }
    await this.attempts.assertNotLocked(user.id);
    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      await this.attempts.record(email, meta.ip ?? "?", false, "bad_password", user.id);
      const lock = await this.attempts.onFailedLogin(user.id);
      if (lock.locked) {
        this.logger.warn(`user ${user.email} locked after ${lock.until?.toISOString()}`);
      }
      throw new UnauthorizedException("Invalid email or password");
    }
    if (user.status !== "active") {
      await this.attempts.record(email, meta.ip ?? "?", false, "user_inactive", user.id);
      throw new UnauthorizedException("Account is not active");
    }
    await this.attempts.record(email, meta.ip ?? "?", true, undefined, user.id);
    await this.attempts.onSuccessfulLogin(user.id);
    return this.session(user, meta);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException("User no longer exists");
    return sanitizeUser(user);
  }

  async updateProfile(userId: string, input: UpdateProfileDto) {
    const current = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!current) throw new UnauthorizedException("User no longer exists");
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: input.name?.trim(),
        brandName: input.brandName?.trim(),
        city: input.city?.trim() || (input.city === "" ? null : undefined),
        country: input.country?.trim() || (input.country === "" ? null : undefined)
      }
    });
    return sanitizeUser(user);
  }

  async refresh(refreshToken: string, meta: { ip?: string; userAgent?: string } = {}) {
    const result = await this.refreshTokens.rotate(refreshToken, meta);
    if (!result) throw new UnauthorizedException("Invalid refresh token");
    const user = await this.prisma.user.findUnique({ where: { id: result.userId } });
    if (!user) throw new UnauthorizedException("User no longer exists");
    if (user.status !== "active") throw new UnauthorizedException("Account is not active");
    return this.issueTokens(user, result.token, meta);
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { sessionVersion: { increment: 1 } } }),
      this.prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } })
    ]);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException("User no longer exists");
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException("Current password is incorrect");
    if (currentPassword === newPassword) {
      throw new BadRequestException("New password must be different from current password");
    }
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
      this.prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } })
    ]);
  }

  async requestEmailChange(userId: string, newEmail: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException("User no longer exists");
    const normalized = newEmail.toLowerCase().trim();
    if (normalized === user.email) throw new BadRequestException("New email is the same as the current one");
    const existing = await this.prisma.user.findFirst({ where: { email: { equals: normalized, mode: "insensitive" } } });
    if (existing) throw new ConflictException("Email already in use");
    const token = crypto.randomBytes(EMAIL_VERIFY_BYTES).toString("base64url");
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + EMAIL_VERIFY_TTL_HOURS * 60 * 60 * 1000);
    await this.prisma.user.update({
      where: { id: userId },
      data: { pendingEmail: normalized, emailVerifyTokenHash: tokenHash, emailVerifyExp: expiresAt }
    });
    const publicAppUrl = (this.config.get<string>("PUBLIC_APP_URL") ?? "http://localhost:4000").replace(/\/$/, "");
    const link = `${publicAppUrl}/auth/confirm-email-change?token=${encodeURIComponent(token)}`;
    await this.email.sendEmailChangeVerification({
      to: normalized,
      from: user.email,
      link,
      expiresInHours: EMAIL_VERIFY_TTL_HOURS
    });
  }

  async confirmEmailChange(userId: string, token: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException("User no longer exists");
    if (!user.pendingEmail || !user.emailVerifyTokenHash || !user.emailVerifyExp) {
      throw new BadRequestException("No pending email change");
    }
    const suppliedHash = this.hashToken(token);
    const actual = Buffer.from(user.emailVerifyTokenHash, "hex");
    const supplied = Buffer.from(suppliedHash, "hex");
    if (actual.length !== supplied.length || !crypto.timingSafeEqual(actual, supplied)) {
      throw new BadRequestException("Invalid email change token");
    }
    if (user.emailVerifyExp.getTime() < Date.now()) throw new BadRequestException("Email change token expired");
    const newEmail = user.pendingEmail;
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { email: newEmail, emailVerified: true, emailVerifiedAt: new Date(), pendingEmail: null, emailVerifyTokenHash: null, emailVerifyExp: null, sessionVersion: { increment: 1 } }
      }),
      this.prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } })
    ]);
  }

  private async session(
    user: { id: string; email: string; name: string; brandName: string; city: string | null; country: string | null; status: string; sessionVersion: number },
    meta: { ip?: string; userAgent?: string }
  ) {
    const refresh = await this.refreshTokens.issue(user.id, meta);
    return this.issueTokens(user, refresh.token, meta);
  }

  private issueTokens(
    user: { id: string; email: string; name: string; brandName: string; city: string | null; country: string | null; status: string; sessionVersion: number },
    refreshToken: string,
    _meta: { ip?: string; userAgent?: string }
  ) {
    return {
      token: this.jwt.sign({ sub: user.id, email: user.email, sv: user.sessionVersion }),
      refreshToken,
      user: sanitizeUser(user)
    };
  }

  private hashToken(raw: string): string {
    return crypto.createHash("sha256").update(raw).digest("hex");
  }
}

function sanitizeUser(user: { id: string; email: string; name: string; brandName: string; city: string | null; country: string | null }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    brandName: user.brandName,
    city: user.city,
    country: user.country
  };
}
