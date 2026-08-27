import { Controller, Get, Injectable } from "@nestjs/common";
import { PrismaService } from "../services/prisma.service";
import * as os from "node:os";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface HealthCheck {
  status: "ok" | "degraded" | "down";
  service: string;
  version: string;
  buildRef: string;
  uptime: number;
  checks: {
    database: "ok" | "down";
    migrations: "ok" | "untracked";
    smtp: "ok" | "down" | "skipped";
    memory: { heapUsedMb: number; heapTotalMb: number; rssMb: number };
    load: number[];
  };
  timestamp: string;
}

const VERSION = (() => {
  const candidates = [resolve(process.cwd(), "package.json"), resolve(__dirname, "..", "package.json"), resolve(__dirname, "..", "..", "package.json"), "/app/package.json"];
  for (const p of candidates) {
    try {
      const pkg = JSON.parse(readFileSync(p, "utf-8")) as { version?: string; name?: string };
      if (pkg.version) return { version: pkg.version, name: pkg.name ?? "sutura-api" };
    } catch {
      // continue
    }
  }
  return { version: "0.0.0", name: "sutura-api" };
})();
const BUILD_REF = process.env.BUILD_REF ?? "unknown";

@Injectable()
@Controller("health")
export class HealthExtended {
  private readonly startedAt = Date.now();
  private readonly version = VERSION.version;
  private readonly serviceName = VERSION.name;

  constructor(private readonly prisma: PrismaService) {
  }

  @Get()
  async check(): Promise<HealthCheck> {
    const dbOk = await this.checkDb();
    const migrations = dbOk ? await this.checkMigrations() : "untracked";
    const mem = process.memoryUsage();
    return {
      status: dbOk && migrations === "ok" ? "ok" : "degraded",
      service: this.serviceName,
      version: this.version,
      buildRef: BUILD_REF,
      uptime: Math.round((Date.now() - this.startedAt) / 1000),
      checks: {
        database: dbOk ? "ok" : "down",
        migrations,
        smtp: "skipped",
        memory: { heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024), heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024), rssMb: Math.round(mem.rss / 1024 / 1024) },
        load: os.loadavg()
      },
      timestamp: new Date().toISOString()
    };
  }

  @Get("live")
  live() {
    return { status: "ok", timestamp: new Date().toISOString() };
  }

  @Get("ready")
  async ready() {
    const dbOk = await this.checkDb();
    const migrations = dbOk ? await this.checkMigrations() : "untracked";
    return {
      status: dbOk && migrations === "ok" ? "ok" : "down",
      db: dbOk ? "ok" : "down",
      migrations
    };
  }

  private async checkDb(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  private async checkMigrations(): Promise<"ok" | "untracked"> {
    try {
      const rows = await this.prisma.$queryRaw<Array<{ tracked: boolean }>>`
        SELECT
          to_regclass('public._prisma_migrations') IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM public."_prisma_migrations"
            WHERE migration_name = '20260803000000_init'
              AND finished_at IS NOT NULL AND rolled_back_at IS NULL
          )
          AND EXISTS (
            SELECT 1 FROM public."_prisma_migrations"
            WHERE migration_name = '20260803000001_align_current_mvp'
              AND finished_at IS NOT NULL AND rolled_back_at IS NULL
          ) AS tracked
      `;
      return rows[0]?.tracked ? "ok" : "untracked";
    } catch {
      return "untracked";
    }
  }
}
