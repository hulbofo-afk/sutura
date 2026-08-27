import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const connectionString = process.env.DATABASE_URL ?? "postgresql://sutura:sutura@localhost:55432/sutura";
    const poolMax = Number(process.env.PRISMA_POOL_MAX ?? "10");
    const poolMin = Number(process.env.PRISMA_POOL_MIN ?? "1");
    const connectionTimeout = Number(process.env.PRISMA_CONNECTION_TIMEOUT_MS ?? "5000");
    const statementTimeout = Number(process.env.PRISMA_STATEMENT_TIMEOUT_MS ?? "15000");
    if (!Number.isInteger(poolMax) || poolMax < 1 || !Number.isInteger(poolMin) || poolMin < 0 || poolMin > poolMax) {
      throw new Error("Invalid Prisma pool configuration: PRISMA_POOL_MIN/MAX");
    }
    if (!Number.isInteger(connectionTimeout) || connectionTimeout < 1 || !Number.isInteger(statementTimeout) || statementTimeout < 1) {
      throw new Error("Invalid Prisma timeout configuration");
    }
    const adapter = new PrismaPg(
      new pg.Pool({
        connectionString,
        max: poolMax,
        min: poolMin,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: connectionTimeout,
        statement_timeout: statementTimeout,
      })
    );
    super({
      adapter,
      log: process.env.PRISMA_LOG === "true" ? ["query", "info", "warn", "error"] : ["warn", "error"]
    });
    this.logger.log(`Prisma pool: min=${poolMin} max=${poolMax} connTimeout=${connectionTimeout}ms stmtTimeout=${statementTimeout}ms`);
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
