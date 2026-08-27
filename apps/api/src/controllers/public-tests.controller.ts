import { ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { SubmitPublicResponseDto } from "../dto/public-response.dto";
import { PublicResponsesService } from "../services/public-responses.service";

@Controller("public-tests")
@ApiTags('public-tests')
export class PublicTestsController {
  constructor(private readonly publicResponses: PublicResponsesService) {}

  @Throttle({ short: { limit: 30, ttl: 1000 }, medium: { limit: 120, ttl: 60_000 } })
  @Get(":slug")
  @ApiOperation({ summary: "Get a public test by slug", description: "Returns the test details and questions for a public (no auth) fashion test." })
  @ApiResponse({ status: 200, description: "Public test data" })
  @ApiResponse({ status: 404, description: "Test not found or not published" })
  getBySlug(@Param("slug") slug: string) {
    return this.publicResponses.getBySlug(slug);
  }

  @Throttle({ short: { limit: 2, ttl: 10_000 }, medium: { limit: 30, ttl: 60_000 } })
  @Post(":slug/responses")
  @ApiOperation({ summary: "Submit a public fashion test response", description: "Submits answers for a public test. No authentication required." })
  @ApiResponse({ status: 201, description: "Response submitted successfully" })
  @ApiBody({ type: SubmitPublicResponseDto })
  submit(@Param("slug") slug: string, @Body() input: SubmitPublicResponseDto) {
    return this.publicResponses.submit(slug, input);
  }
}
