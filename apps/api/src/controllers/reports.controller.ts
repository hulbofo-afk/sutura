import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Controller, Get, Param, Res, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/jwt-auth.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { Response } from "express";
import { ReportsService } from "../services/reports.service";

@Controller("reports")
@ApiTags('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get("fashion-tests/:testId.pdf")
  @ApiOperation({ summary: "Export fashion test PDF report", description: "Streams a PDF report with analytics, responses, and scores for a fashion test." })
  @ApiResponse({ status: 200, description: "PDF file stream" })
  @ApiResponse({ status: 404, description: "Test not found or access denied" })
  async exportPdf(
    @CurrentUser() user: AuthUser,
    @Param("testId") testId: string,
    @Res() response: Response
  ) {
    const userId = user.id;
    const id = testId;
    const res = response;
    await this.reports.streamFashionTestPdf(userId, id, res);
  }
}
