import { Injectable, Logger } from "@nestjs/common";
import { RecommendationProvider, type RecommendationContext, type RecommendationItem, type RecommendationResult } from "./recommendation.provider";

@Injectable()
export class LocalRecommendationProvider extends RecommendationProvider {
  readonly name = "local" as const;
  private readonly logger = new Logger(LocalRecommendationProvider.name);

  async generate(ctx: RecommendationContext): Promise<RecommendationResult> {
    const { analytics } = ctx;
    const items: RecommendationItem[] = [];

    items.push(...this.productionItems(analytics));
    items.push(...this.pricingItems(analytics));
    items.push(...this.audienceItems(analytics));
    items.push(...this.riskItems(analytics));
    items.push(...this.contentItems(analytics));

    items.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    });

    return {
      provider: "local",
      dataPolicy: "Recommendations are generated only from collected fashion test data (heuristic local rules).",
      recommendations: items,
      generatedAt: new Date().toISOString()
    };
  }

  private productionItems(a: RecommendationContext["analytics"]): RecommendationItem[] {
    if (a.desirabilityScore >= 75) {
      return [
        {
          priority: "high",
          category: "production",
          message: "Le desirability score est eleve. Lance une petite serie sur les pieces les plus notees pour valider la demande reelle.",
          rationale: `Desirability score = ${a.desirabilityScore}/100 (seuil 75).`
        }
      ];
    }
    if (a.desirabilityScore >= 55) {
      return [
        {
          priority: "medium",
          category: "production",
          message: "Le desirability est moyen. Continue la collecte sur 2-3 semaines avant de decider du mix produit.",
          rationale: `Desirability score = ${a.desirabilityScore}/100 (zone d'incertitude).`
        }
      ];
    }
    return [
      {
        priority: "high",
        category: "production",
        message: "Le desirability est faible. Repense les pieces ou les couleurs avant de produire.",
        rationale: `Desirability score = ${a.desirabilityScore}/100 (sous le seuil 55).`
      }
    ];
  }

  private pricingItems(a: RecommendationContext["analytics"]): RecommendationItem[] {
    const priceAvg = (a.questionBreakdown ?? []).find((q: { type: string }) => q.type === "price")?.average;
    if (priceAvg == null) return [];
    return [
      {
        priority: priceAvg > 50000 ? "low" : "medium",
        category: "pricing",
        message: `Le prix moyen souhaite est ~${Math.round(priceAvg)}. Ajuste ta grille en consequence.`,
        rationale: `Moyenne issue de la question 'price' = ${Math.round(priceAvg)}.`
      }
    ];
  }

  private audienceItems(a: RecommendationContext["analytics"]): RecommendationItem[] {
    if (!a.demographics) return [];
    if (a.demographics.averageAge != null && a.demographics.averageAge < 25) {
      return [
        {
          priority: "medium",
          category: "audience",
          message: "Audience jeune. Privilegie les canaux Instagram et TikTok pour la promotion."
        }
      ];
    }
    return [];
  }

  private riskItems(a: RecommendationContext["analytics"]): RecommendationItem[] {
    const items: RecommendationItem[] = [];
    if (a.unsoldRiskScore > 60) {
      items.push({
        priority: "high",
        category: "risk",
        message: "Risque d'invendu eleve. Reduis le volume initial et prepare un plan B (destockage, seconde selection).",
        rationale: `Unsold risk = ${a.unsoldRiskScore}/100 (seuil 60).`
      });
    } else if (a.unsoldRiskScore > 40) {
      items.push({
        priority: "medium",
        category: "risk",
        message: "Risque d'invendu modere. Surveille les conversions et sois pret a ajuster les volumes."
      });
    }
    return items;
  }

  private contentItems(a: RecommendationContext["analytics"]): RecommendationItem[] {
    if ((a.responses ?? 0) < 30) {
      return [
        {
          priority: "low",
          category: "content",
          message: "Echantillon encore faible. Continue a partager le test pour atteindre au moins 30 reponses.",
          rationale: `Reponses collectees = ${a.responses}.`
        }
      ];
    }
    return [];
  }
}
