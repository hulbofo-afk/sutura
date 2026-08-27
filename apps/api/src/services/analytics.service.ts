import { Injectable } from "@nestjs/common";
import { buildMeta, type PaginatedResult } from "../common/pagination";
import { RecommendationProvider } from "../recommendations/recommendation.provider";
import { FashionTestsService } from "./fashion-tests.service";
import { PrismaService } from "./prisma.service";
import { ScoresService } from "./scores.service";
import type { PublicResponse } from "../types";

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tests: FashionTestsService,
    readonly scores: ScoresService,
    private readonly recommendations: RecommendationProvider
  ) {}

  async buildForTest(creatorId: string, testId: string) {
    await this.tests.get(creatorId, testId);
    const [questions, responses, shares] = await Promise.all([
      this.tests.listQuestions(creatorId, testId),
      this.listResponses(creatorId, testId),
      this.tests.listShares(creatorId, testId)
    ]);
    return this.scores.buildAnalytics(testId, questions, responses, shares);
  }

  async listResponses(creatorId: string, testId: string): Promise<PublicResponse[]> {
    const responses = await this.prisma.publicResponse.findMany({
      where: { testId, test: { collection: { creatorId } } },
      orderBy: { createdAt: "asc" }
    });
    return responses.map((response) => ({
      id: response.id,
      testId: response.testId,
      respondent: (response.respondent as PublicResponse["respondent"]) ?? undefined,
      answers: response.answers as PublicResponse["answers"],
      startedAt: response.startedAt.toISOString(),
      completedAt: response.completedAt.toISOString(),
      createdAt: response.createdAt.toISOString()
    }));
  }

  async listResponsesPage(
    creatorId: string,
    testId: string,
    page: number,
    limit: number,
    sort: "asc" | "desc" = "desc"
  ): Promise<PaginatedResult<PublicResponse>> {
    await this.tests.get(creatorId, testId);
    const where = { testId, test: { collection: { creatorId } } };
    const [total, responses] = await this.prisma.$transaction([
      this.prisma.publicResponse.count({ where }),
      this.prisma.publicResponse.findMany({
        where,
        orderBy: { createdAt: sort },
        skip: (page - 1) * limit,
        take: limit
      })
    ]);
    const data = responses.map((response) => ({
      id: response.id,
      testId: response.testId,
      respondent: (response.respondent as PublicResponse["respondent"]) ?? undefined,
      answers: response.answers as PublicResponse["answers"],
      startedAt: response.startedAt.toISOString(),
      completedAt: response.completedAt.toISOString(),
      createdAt: response.createdAt.toISOString()
    }));
    return { data, meta: buildMeta(total, page, limit) };
  }

  async buildForRecommendation(creatorId: string, testId: string) {
    const analytics = await this.buildForTest(creatorId, testId);
    return this.recommendations.generate({ testId, analytics });
  }
}
