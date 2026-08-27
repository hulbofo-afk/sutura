import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/jwt-auth.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AnalyticsService } from "../services/analytics.service";

@Controller("ai-recommendations")
@ApiTags('recommendations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RecommendationsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get(":testId")
  @Throttle({ medium: { limit: 5, ttl: 60_000 }, long: { limit: 30, ttl: 3_600_000 } })
  @ApiOperation({ summary: "Get AI recommendations for a fashion test", description: "Returns recommendations from Imole when configured, otherwise local heuristics, based on test analytics." })
  @ApiResponse({ status: 200, description: "Recommendation data" })
  @ApiResponse({ status: 404, description: "Test not found or access denied" })
  async get(@CurrentUser() user: AuthUser, @Param("testId") testId: string) {
    return this.analytics.buildForRecommendation(user.id, testId);
  }
}
