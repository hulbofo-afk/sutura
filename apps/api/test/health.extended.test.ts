import { describe, expect, it, vi } from "vitest";
import { HealthExtended } from "../src/health/health.extended";

describe("HealthExtended migration readiness", () => {
  it("reports a legacy database as degraded and not ready", async () => {
    const prisma = {
      $queryRaw: vi.fn()
        .mockResolvedValueOnce([{ ok: 1 }])
        .mockResolvedValueOnce([{ tracked: false }])
        .mockResolvedValueOnce([{ ok: 1 }])
        .mockResolvedValueOnce([{ tracked: false }])
    };
    const health = new HealthExtended(prisma as never);

    const extended = await health.check();
    expect(extended.status).toBe("degraded");
    expect(extended.checks.database).toBe("ok");
    expect(extended.checks.migrations).toBe("untracked");

    await expect(health.ready()).resolves.toEqual({
      status: "down",
      db: "ok",
      migrations: "untracked"
    });
  });

  it("reports a tracked database as ready", async () => {
    const prisma = {
      $queryRaw: vi.fn()
        .mockResolvedValueOnce([{ ok: 1 }])
        .mockResolvedValueOnce([{ tracked: true }])
    };
    const health = new HealthExtended(prisma as never);

    await expect(health.ready()).resolves.toEqual({
      status: "ok",
      db: "ok",
      migrations: "ok"
    });
  });

  it("is not ready when migration history exists but the required alignment is missing", async () => {
    const prisma = {
      $queryRaw: vi.fn()
        .mockResolvedValueOnce([{ ok: 1 }])
        .mockResolvedValueOnce([{ tracked: false }])
    };
    const health = new HealthExtended(prisma as never);

    await expect(health.ready()).resolves.toEqual({
      status: "down",
      db: "ok",
      migrations: "untracked"
    });
  });
});
