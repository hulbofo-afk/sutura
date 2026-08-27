export interface RecommendationContext {
  testId: string;
  analytics: import("../services/scores.service").AnalyticsResult;
  locale?: string;
}

export interface RecommendationItem {
  priority: "high" | "medium" | "low";
  category: "production" | "pricing" | "audience" | "content" | "risk";
  message: string;
  rationale?: string;
}

export interface RecommendationResult {
  provider: "local" | "imole";
  dataPolicy: string;
  recommendations: RecommendationItem[];
  generatedAt: string;
}

export abstract class RecommendationProvider {
  abstract readonly name: "local" | "imole";
  abstract generate(ctx: RecommendationContext): Promise<RecommendationResult>;
}
