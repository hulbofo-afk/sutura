import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash, randomBytes } from "node:crypto";
import { PrismaService } from "./prisma.service";

const REFRESH_TTL_DAYS = 30;

@Injectable()
export class RefreshTokenService {
  constructor(private readonly prisma: PrismaService, _config: ConfigService) {}

  async issue(userId: string, meta: { ip?: string; userAgent?: string } = {}): Promise<{ token: string; expiresAt: Date }> {
    const raw = this.generate();
    const tokenHash = this.hash(raw);
    const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
        ip: meta.ip ?? null,
        userAgent: meta.userAgent?.slice(0, 256) ?? null
      }
    });
    return { token: raw, expiresAt };
  }

  async rotate(raw: string, meta: { ip?: string; userAgent?: string } = {}): Promise<{ token: string; userId: string; expiresAt: Date } | null> {
    if (typeof raw !== "string" || raw.length < 32) return null;
    const tokenHash = this.hash(raw);
    const replacementRaw = this.generate();
    const replacementHash = this.hash(replacementRaw);
    const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
    return this.prisma.$transaction(async (tx) => {
      const record = await tx.refreshToken.findUnique({ where: { tokenHash } });
      if (!record || record.revokedAt || record.expiresAt.getTime() < Date.now()) return null;
      const consumed = await tx.refreshToken.updateMany({
        where: { id: record.id, revokedAt: null, expiresAt: { gt: new Date() } },
        data: { revokedAt: new Date() }
      });
      if (consumed.count !== 1) return null;
      await tx.refreshToken.create({
        data: {
          userId: record.userId,
          tokenHash: replacementHash,
          expiresAt,
          ip: meta.ip ?? null,
          userAgent: meta.userAgent?.slice(0, 256) ?? null
        }
      });
      return { token: replacementRaw, userId: record.userId, expiresAt };
    });
  }

  async revokeAllForUser(userId: string): Promise<number> {
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
    return count;
  }

  async purgeExpired(): Promise<number> {
    const { count } = await this.prisma.refreshToken.deleteMany({
      where: { OR: [{ expiresAt: { lt: new Date() } }, { revokedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }] }
    });
    return count;
  }

  private generate(): string {
    return randomBytes(48).toString("base64url");
  }

  private hash(raw: string): string {
    return createHash("sha256").update(raw).digest("hex");
  }
}
