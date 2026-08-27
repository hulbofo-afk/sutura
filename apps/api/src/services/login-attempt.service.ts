import { ForbiddenException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "./prisma.service";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

@Injectable()
export class LoginAttemptService {
  private readonly logger = new Logger(LoginAttemptService.name);

  constructor(private readonly prisma: PrismaService, _config: ConfigService) {}

  async record(email: string, ip: string, success: boolean, reason?: string, userId?: string): Promise<void> {
    await this.prisma.loginAttempt.create({
      data: { userId, email: email.toLowerCase(), ip, success, reason, userAgent: null }
    });
  }

  async isLocked(userId: string): Promise<{ locked: boolean; until?: Date }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { lockedUntil: true, failedLoginCount: true } });
    if (!user) return { locked: false };
    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      return { locked: true, until: user.lockedUntil };
    }
    return { locked: false };
  }

  async onFailedLogin(userId: string): Promise<{ locked: boolean; until?: Date }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { locked: false };
    const next = (user.failedLoginCount ?? 0) + 1;
    if (next >= MAX_FAILED_ATTEMPTS) {
      const until = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
      await this.prisma.user.update({ where: { id: userId }, data: { failedLoginCount: 0, lockedUntil: until } });
      this.logger.warn(`user ${userId} locked until ${until.toISOString()}`);
      return { locked: true, until };
    }
    await this.prisma.user.update({ where: { id: userId }, data: { failedLoginCount: next } });
    return { locked: false };
  }

  async onSuccessfulLogin(userId: string): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { failedLoginCount: 0, lockedUntil: null } });
  }

  async assertNotLocked(userId: string): Promise<void> {
    const { locked, until } = await this.isLocked(userId);
    if (locked) {
      throw new ForbiddenException(`Account temporarily locked until ${until?.toISOString()} (${LOCK_MINUTES}min after ${MAX_FAILED_ATTEMPTS} failed attempts)`);
    }
  }
}
