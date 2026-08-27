import { Injectable } from "@nestjs/common";
import type { FashionQuestion, PublicResponse, ShareEvent } from "../types";

@Injectable()
export class ScoresService {
  buildAnalytics(
    testId: string,
    questions: FashionQuestion[],
    responses: PublicResponse[],
    shares: ShareEvent[] = []
  ) {
    const completedDurations = responses.map((response) =>
      Math.max(
        0,
        (new Date(response.completedAt).getTime() - new Date(response.startedAt).getTime()) / 1000
      )
    );
    const averageRating = this.averageNumericAnswer("rating", questions, responses);
    const desirabilityScore = this.desirabilityScore(averageRating, responses.length);
    const unsoldRiskScore = this.unsoldRiskScore(desirabilityScore, 0, 0);

    return {
      testId,
      executiveSummary: this.executiveSummary(desirabilityScore, unsoldRiskScore, responses.length),
      desirabilityScore,
      unsoldRiskScore,
      unsoldRiskLabel: this.riskLabel(unsoldRiskScore),
      visitors: null,
      responses: responses.length,
      conversionRate: null,
      averageResponseSeconds: Math.round(this.average(completedDurations)),
      shares: shares.length,
      sharesByChannel: distribution(shares.map((share) => share.channel)),
      abandonmentRate: null,
      trafficMeasurementStatus: "not_collected",
      demographics: this.demographics(responses),
      modelStats: this.modelBreakdown(questions, responses),
      modelBreakdown: this.modelBreakdown(questions, responses),
      funnel: this.funnel(questions, responses),
      priceDistribution: this.priceDistribution(questions, responses),
      questionBreakdown: this.questionBreakdown(questions, responses)
    };
  }

  desirabilityScore(averageRating: number, responseCount: number) {
    if (responseCount === 0) return 0;
    const ratingScore = averageRating > 0 ? averageRating / 5 : 0.5;
    const confidence = Math.min(1, responseCount / 30);
    return clampScore((ratingScore * 0.75 + confidence * 0.25) * 100);
  }

  unsoldRiskScore(desirabilityScore: number, conversionRate: number, abandonmentRate: number) {
    const desirabilityRisk = 100 - desirabilityScore;
    return clampScore(desirabilityRisk);
  }

  riskLabel(score: number) {
    if (score <= 25) return "very_low";
    if (score <= 50) return "moderate";
    return "high";
  }

  private averageNumericAnswer(questionType: string, questions: FashionQuestion[], responses: PublicResponse[]) {
    const ids = questions.filter((question) => question.type === questionType).map((question) => question.id);
    const values = responses.flatMap((response) =>
      ids
        .map((id) => response.answers[id])
        .filter((value): value is number => typeof value === "number")
    );
    return this.average(values);
  }

  private questionBreakdown(questions: FashionQuestion[], responses: PublicResponse[]) {
    return questions.map((question) => {
      const answers = responses
        .map((response) => response.answers[question.id])
        .filter((answer) => answer !== undefined);

      return {
        questionId: question.id,
        text: question.text,
        type: question.type,
        required: question.required,
        answersCount: answers.length,
        distribution: distribution(answers),
        average: averageIfNumeric(answers)
      };
    });
  }

  private demographics(responses: PublicResponse[]) {
    return {
      cities: distribution(responses.map((response) => response.respondent?.city).filter(Boolean)),
      countries: distribution(responses.map((response) => response.respondent?.country).filter(Boolean)),
      sex: distribution(responses.map((response) => response.respondent?.sex).filter(Boolean)),
      averageAge: Math.round(
        this.average(
          responses
            .map((response) => response.respondent?.age)
            .filter((age): age is number => typeof age === "number")
        )
      )
    };
  }

  private modelBreakdown(questions: FashionQuestion[], responses: PublicResponse[]) {
    const linkedQuestions = questions.filter((q) => !!q.modelId);
    const perModel: Record<string, { modelId: string; questionIds: Set<string>; responseIds: Set<string>; answers: Array<string | string[] | number | boolean | undefined> }> = {};
    for (const question of linkedQuestions) {
      const modelId = question.modelId as string;
      perModel[modelId] ??= { modelId, questionIds: new Set(), responseIds: new Set(), answers: [] };
      perModel[modelId].questionIds.add(question.id);
      for (const response of responses) {
        const value = response.answers[question.id];
        if (value !== undefined) {
          perModel[modelId].responseIds.add(response.id);
          perModel[modelId].answers.push(value);
        }
      }
    }
    const totalResponses = responses.length || 1;
    return Object.values(perModel)
      .map((m) => ({
        modelId: m.modelId,
        questionsCount: m.questionIds.size,
        responsesWithAnswer: m.responseIds.size,
        answerRate: roundRatio(m.responseIds.size / totalResponses),
        answerDistribution: distribution(m.answers)
      }))
      .sort((a, b) => b.responsesWithAnswer - a.responsesWithAnswer);
  }

  private funnel(questions: FashionQuestion[], responses: PublicResponse[]) {
    const sorted = [...questions].sort((a, b) => a.sortOrder - b.sortOrder);
    const total = responses.length;
    return sorted.map((q) => {
      const answerCount = responses.filter((r) => r.answers[q.id] !== undefined).length;
      return {
        questionId: q.id,
        order: q.sortOrder,
        text: q.text,
        type: q.type,
        required: q.required,
        answerCount,
        answerRate: total > 0 ? roundRatio(answerCount / total) : 0
      };
    });
  }

  private priceDistribution(questions: FashionQuestion[], responses: PublicResponse[]) {
    const priceQ = questions.find((q) => q.type === "price");
    if (!priceQ) return [];
    const values = responses
      .map((r) => r.answers[priceQ.id])
      .filter((v): v is number => typeof v === "number");
    if (values.length === 0) return [];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const buckets = 5;
    const step = Math.max(1, Math.ceil((max - min) / buckets));
    const ranges: { min: number; max: number; count: number; label: string }[] = [];
    for (let i = 0; i < buckets; i += 1) {
      const lo = min + i * step;
      const hi = i === buckets - 1 ? max : lo + step - 1;
      ranges.push({ min: lo, max: hi, count: 0, label: `${lo}–${hi}` });
    }
    for (const v of values) {
      const idx = Math.min(buckets - 1, Math.floor((v - min) / step));
      ranges[idx].count += 1;
    }
    return ranges;
  }

  private executiveSummary(desirabilityScore: number, riskScore: number, responseCount: number) {
    if (responseCount < 10) {
      return "Pas encore assez de reponses pour une lecture fiable. Continue a partager le test pour atteindre au moins 30 reponses.";
    }
    if (desirabilityScore >= 75 && riskScore <= 50) {
      return "La collection montre une traction solide. Lance une petite serie sur les pieces les mieux notees.";
    }
    if (riskScore > 50) {
      return "Le risque d invendu est encore eleve. Ajuste le modele, le prix ou la cible avant production.";
    }
    return "Les signaux sont encourageants mais demandent plus de reponses avant une decision large.";
  }

  private average(values: number[]) {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }
}

export type AnalyticsResult = ReturnType<ScoresService["buildAnalytics"]>;

function distribution(values: Array<string | string[] | number | boolean | undefined>) {
  return values.reduce<Record<string, number>>((acc, value) => {
    if (value === undefined) return acc;
    const key = Array.isArray(value) ? value.join(", ") : String(value);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function averageIfNumeric(values: Array<string | string[] | number | boolean>) {
  const numeric = values.filter((value): value is number => typeof value === "number");
  if (numeric.length === 0) return null;
  return Math.round((numeric.reduce((sum, value) => sum + value, 0) / numeric.length) * 100) / 100;
}

function roundRatio(value: number) {
  return Math.round(value * 100) / 100;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
