import { ConfigService } from "@nestjs/config";
import { describe, expect, it, vi } from "vitest";
import { LocalRecommendationProvider } from "../src/recommendations/local-recommendation.provider";
import { ImoleRecommendationProvider } from "../src/recommendations/imole-recommendation.provider";

const context = {
  testId: "test-1",
  analytics: {
    desirabilityScore: 70,
    unsoldRiskScore: 35,
    responses: 12,
    questionBreakdown: [],
    demographics: { averageAge: 28 }
  }
} as never;

describe("ImoleRecommendationProvider", () => {
  it("uses local heuristics when no API key is configured", async () => {
    const local = new LocalRecommendationProvider();
    const config = { get: vi.fn().mockReturnValue(undefined) } as unknown as ConfigService;
    const provider = new ImoleRecommendationProvider(config, local);

    const result = await provider.generate(context);

    expect(result.provider).toBe("local");
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it("falls back to local heuristics when Imole is unavailable", async () => {
    const local = new LocalRecommendationProvider();
    const config = {
      get: vi.fn((key: string) => (key === "IMOLE_API_KEY" ? "test-key" : "gpt-test"))
    } as unknown as ConfigService;
    const provider = new ImoleRecommendationProvider(config, local);
    const fetchMock = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network unavailable"));

    const result = await provider.generate(context);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(result.provider).toBe("local");
    expect(result.dataPolicy).toContain("fallback local");
    fetchMock.mockRestore();
  });

  it("parses a structured Imole response", async () => {
    const local = new LocalRecommendationProvider();
    const config = {
      get: vi.fn((key: string) => {
        if (key === "IMOLE_API_KEY") return "test-key";
        if (key === "IMOLE_BASE_URL") return "https://api.imole.app/v1";
        return "test-model";
      })
    } as unknown as ConfigService;
    const provider = new ImoleRecommendationProvider(config, local);
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({
        output_text: "```json\n" + JSON.stringify({ recommendations: [{ priority: "high", category: "risk", message: "Réduire la série initiale", rationale: "Risque élevé" }] }) + "\n```\nTexte additionnel ignoré"
      }), { status: 200, headers: { "Content-Type": "application/json" } })
    );

    const result = await provider.generate(context);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.imole.app/v1/responses",
      expect.objectContaining({ method: "POST" })
    );
    expect(result.provider).toBe("imole");
    expect(result.recommendations[0]?.category).toBe("risk");
    fetchMock.mockRestore();
  });
});
