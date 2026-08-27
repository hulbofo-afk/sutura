import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "node:crypto";
import { PrismaService } from "./prisma.service";
import { EMAIL_SERVICE, type EmailService } from "../notifications/email.service";

const TOKEN_TTL_MINUTES = 60;
const TOKEN_BYTES = 32;

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);
  private readonly publicAppUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(EMAIL_SERVICE) private readonly email: EmailService
  ) {
    this.publicAppUrl = (this.config.get<string>("PUBLIC_APP_URL") ?? "http://localhost:4000").replace(/\/$/, "");
  }

  async requestReset(email: string): Promise<void> {
    const normalized = email.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({ where: { email: { equals: normalized, mode: "insensitive" } } });
    if (!user) {
      this.logger.log(`password reset requested for unknown email ${normalized} (no-op)`);
      return;
    }

    const rawToken = crypto.randomBytes(TOKEN_BYTES).toString("base64url");
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60_000);

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
      this.prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt }
      })
    ]);

    const resetLink = `${this.publicAppUrl}/auth/reset-password?token=${encodeURIComponent(rawToken)}`;
    await this.email.sendPasswordReset({
      to: user.email,
      resetLink,
      expiresInMinutes: TOKEN_TTL_MINUTES
    });
    this.logger.log(`password reset email dispatched to ${user.email}`);
  }

  async consumeReset(rawToken: string, newPassword: string): Promise<void> {
    if (typeof rawToken !== "string" || rawToken.length < 16) {
      throw new BadRequestException("Invalid reset token");
    }
    if (typeof newPassword !== "string" || newPassword.length < 8) {
      throw new BadRequestException("Password must be at least 8 characters");
    }

    const tokenHash = this.hashToken(rawToken);
    const record = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!record) throw new BadRequestException("Invalid or expired reset token");
    if (record.usedAt) throw new BadRequestException("Reset token already used");
    if (record.expiresAt.getTime() < Date.now()) throw new BadRequestException("Reset token expired");

    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash, sessionVersion: { increment: 1 } }
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() }
      }),
      this.prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } })
    ]);
  }

  async isTokenValid(rawToken: string): Promise<boolean> {
    if (typeof rawToken !== "string" || rawToken.length < 16) return false;
    const tokenHash = this.hashToken(rawToken);
    const record = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!record) return false;
    if (record.usedAt) return false;
    if (record.expiresAt.getTime() < Date.now()) return false;
    return true;
  }

  async purgeExpired(): Promise<number> {
    const { count } = await this.prisma.passwordResetToken.deleteMany({
      where: { expiresAt: { lt: new Date() } }
    });
    return count;
  }

  private hashToken(rawToken: string): string {
    return crypto.createHash("sha256").update(rawToken).digest("hex");
  }
}
