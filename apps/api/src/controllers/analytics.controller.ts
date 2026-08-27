import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/jwt-auth.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PaginationDto } from "../common/pagination";
import { AnalyticsService } from "../services/analytics.service";

@Controller("analytics")
@ApiTags('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get(":testId")
  @ApiOperation({ summary: "Get analytics for a fashion test", description: "Returns KPIs, desirability score, recommendation risk, model breakdown, funnel, and demographics for a given test." })
  @ApiResponse({ status: 200, description: "Analytics report" })
  @ApiResponse({ status: 404, description: "Test not found or access denied" })
  async get(@CurrentUser() user: AuthUser, @Param("testId") testId: string) {
    return this.analytics.buildForTest(user.id, testId);
  }

  @Get(":testId/responses")
  @ApiOperation({ summary: "List responses for a fashion test", description: "Returns paginated respondent answers for the authenticated creator's test." })
  @ApiResponse({ status: 200, description: "Paginated private responses" })
  @ApiResponse({ status: 404, description: "Test not found or access denied" })
  async responses(
    @CurrentUser() user: AuthUser,
    @Param("testId") testId: string,
    @Query() query: PaginationDto
  ) {
    return this.analytics.listResponsesPage(
      user.id,
      testId,
      query.page ?? 1,
      query.limit ?? 20,
      query.sort?.endsWith(":asc") ? "asc" : "desc"
    );
  }
}
