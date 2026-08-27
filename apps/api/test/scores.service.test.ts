import { describe, expect, it } from "vitest";
import { ScoresService } from "../src/services/scores.service";

describe("ScoresService", () => {
  const service = new ScoresService();

  it("keeps desirability on a 0-100 scale", () => {
    expect(service.desirabilityScore(5, 30)).toBe(100);
    expect(service.desirabilityScore(0, 0)).toBe(0);
  });

  it("uses the MVP unsold-risk bands", () => {
    expect(service.riskLabel(25)).toBe("very_low");
    expect(service.riskLabel(50)).toBe("moderate");
    expect(service.riskLabel(51)).toBe("high");
  });
});
