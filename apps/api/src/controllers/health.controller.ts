import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Controller, Get, ServiceUnavailableException, UseGuards } from "@nestjs/common";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { HealthCheck, HealthExtended } from "../health/health.extended";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

const VERSION = (() => {
  const candidates = [resolve(process.cwd(), "package.json"), resolve(__dirname, "..", "package.json"), "/app/package.json"];
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

@Controller("health")
@ApiTags("health")
export class HealthController {
  @Get()
  @ApiOperation({ summary: "Health check", description: "Basic liveness check returning status, service name, version, and timestamp." })
  @ApiResponse({ status: 200, description: "Service is healthy" })
  check() {
    return {
      status: "ok",
      service: VERSION.name,
      version: VERSION.version,
      buildRef: BUILD_REF,
      timestamp: new Date().toISOString()
    };
  }
}

@Controller("health")
@ApiTags("health")
export class HealthExtendedController {
  constructor(private readonly ext: HealthExtended) {}

  @Get("extended")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Extended health check", description: "Deep health check including database ping, memory usage, CPU load, uptime, and version." })
  @ApiResponse({ status: 200, description: "Extended health data" })
  async extended(): Promise<HealthCheck> {
    return this.ext.check();
  }

  @Get("ready")
  @ApiOperation({ summary: "Readiness check", description: "Confirms that the API can reach its database." })
  @ApiResponse({ status: 200, description: "Service is ready" })
  @ApiResponse({ status: 503, description: "Database is unavailable" })
  async ready() {
    const result = await this.ext.ready();
    if (result.status !== "ok") {
      throw new ServiceUnavailableException(result);
    }
    return result;
  }
}
