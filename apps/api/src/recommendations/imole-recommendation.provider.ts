import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash } from "node:crypto";
import { LocalRecommendationProvider } from "./local-recommendation.provider";
import { RecommendationProvider, type RecommendationContext, type RecommendationResult } from "./recommendation.provider";

interface ImoleResponsesResponse {
  output_text?: string;
  output?: Array<{
    content?: Array<{ type?: string; text?: string }>;
  }>;
}

@Injectable()
export class ImoleRecommendationProvider extends RecommendationProvider {
  readonly name = "imole" as const;
  private readonly logger = new Logger(ImoleRecommendationProvider.name);
  private readonly cache = new Map<string, { expiresAt: number; result: RecommendationResult }>();

  constructor(
    private readonly config: ConfigService,
    private readonly local: LocalRecommendationProvider
  ) {
    super();
  }

  async generate(ctx: RecommendationContext): Promise<RecommendationResult> {
    const apiKey = this.config.get<string>("IMOLE_API_KEY");
    if (!apiKey) return this.local.generate(ctx);
    const cacheKey = createHash("sha256").update(JSON.stringify(ctx)).digest("hex");
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.result;

    try {
      const baseUrl = (this.config.get<string>("IMOLE_BASE_URL") ?? "https://api.imole.app/v1").replace(/\/$/, "");
      const model = this.config.get<string>("IMOLE_MODEL") ?? "gpt-5.6-luna";
      const response = await fetch(`${baseUrl}/responses`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        signal: AbortSignal.timeout(12_000),
        body: JSON.stringify({
          model,
          max_output_tokens: 768,
          reasoning: { effort: "low" },
          instructions: "Tu es un conseiller de production mode pour des créateurs d'Afrique de l'Ouest. Utilise exclusivement les mesures fournies. Signale un échantillon insuffisant, n'invente aucun fait et réponds en français.",
          input: JSON.stringify({ objective: "Proposer des décisions de production, prix, audience, contenu et risque", testId: ctx.testId, analytics: ctx.analytics }),
          text: {
            format: {
              type: "json_schema",
              name: "sutura_recommendations",
              strict: true,
              schema: {
                type: "object",
                additionalProperties: false,
                required: ["recommendations"],
                properties: {
                  recommendations: {
                    type: "array",
                    minItems: 1,
                    maxItems: 10,
                    items: {
                      type: "object",
                      additionalProperties: false,
                      required: ["priority", "category", "message", "rationale"],
                      properties: {
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                        category: { type: "string", enum: ["production", "pricing", "audience", "content", "risk"] },
                        message: { type: "string", maxLength: 500 },
                        rationale: { type: "string", maxLength: 1000 }
                      }
                    }
                  }
                }
              }
            }
          }
        })
      });

      if (!response.ok) throw new Error(`Imole returned HTTP ${response.status}`);
      const payload = (await response.json()) as ImoleResponsesResponse;
      const text = payload.output_text ?? payload.output?.flatMap((item) => item.content ?? []).map((part) => part.text ?? "").join("");
      if (!text) throw new Error("Imole response did not contain message content");

      const parsed = parseJsonPayload(text) as { recommendations?: unknown };
      const recommendations = validateRecommendations(parsed.recommendations);

      const result: RecommendationResult = {
        provider: "imole",
        dataPolicy: "Recommandations générées par Imọlẹ à partir d'analytics agrégés. Aucune réponse brute ni donnée personnelle n'a été transmise.",
        recommendations,
        generatedAt: new Date().toISOString()
      };
      this.cache.set(cacheKey, { expiresAt: Date.now() + 5 * 60_000, result });
      if (this.cache.size > 200) this.cache.delete(this.cache.keys().next().value as string);
      return result;
    } catch (error) {
      this.logger.warn(`Imole recommendation failed; using local heuristics: ${(error as Error).message}`);
      const fallback = await this.local.generate(ctx);
      return {
        ...fallback,
        dataPolicy: `${fallback.dataPolicy} Imọlẹ indisponible : fallback local utilisé.`
      };
    }
  }
}

function validateRecommendations(value: unknown): RecommendationResult["recommendations"] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 10) {
    throw new Error("Imole response must contain 1 to 10 recommendations");
  }
  const priorities = new Set(["high", "medium", "low"]);
  const categories = new Set(["production", "pricing", "audience", "content", "risk"]);
  return value.map((item) => {
    if (!item || typeof item !== "object") throw new Error("Invalid recommendation item");
    const candidate = item as Record<string, unknown>;
    if (!priorities.has(String(candidate.priority)) || !categories.has(String(candidate.category))) {
      throw new Error("Invalid recommendation priority or category");
    }
    if (typeof candidate.message !== "string" || candidate.message.length < 1 || candidate.message.length > 500) {
      throw new Error("Invalid recommendation message");
    }
    if (candidate.rationale !== undefined && (typeof candidate.rationale !== "string" || candidate.rationale.length > 1_000)) {
      throw new Error("Invalid recommendation rationale");
    }
    return {
      priority: candidate.priority as "high" | "medium" | "low",
      category: candidate.category as "production" | "pricing" | "audience" | "content" | "risk",
      message: candidate.message,
      ...(typeof candidate.rationale === "string" ? { rationale: candidate.rationale } : {})
    };
  });
}

function parseJsonPayload(text: string): unknown {
  const unfenced = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  try {
    return JSON.parse(unfenced);
  } catch {
    const start = unfenced.indexOf("{");
    if (start < 0) throw new Error("Imole response did not contain a JSON object");
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let index = start; index < unfenced.length; index += 1) {
      const char = unfenced[index];
      if (inString) {
        if (escaped) escaped = false;
        else if (char === "\\") escaped = true;
        else if (char === '"') inString = false;
        continue;
      }
      if (char === '"') {
        inString = true;
      } else if (char === "{") {
        depth += 1;
      } else if (char === "}") {
        depth -= 1;
        if (depth === 0) return JSON.parse(unfenced.slice(start, index + 1));
      }
    }
    throw new Error("Imole response did not contain a complete JSON object");
  }
}
