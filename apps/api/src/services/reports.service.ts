import { Injectable, Logger } from "@nestjs/common";
import PDFDocument = require("pdfkit");
import type { Response } from "express";
import { findOwnedCollection, findOwnedTest } from "./ownership";
import { AnalyticsService } from "./analytics.service";
import { PrismaService } from "./prisma.service";
import { mapCollection } from "./mappers";
import { mapTest } from "./mappers";
import { RecommendationProvider } from "../recommendations/recommendation.provider";
import type { AnalyticsResult } from "./scores.service";
import type { Collection, FashionTest, ShareChannel, ShareEvent } from "../types";

interface PdfContext {
  creator: { name: string; brandName: string; city?: string; country?: string };
  collection: Pick<Collection, "id" | "title" | "season" | "category" | "targetAudience" | "launchDate">;
  test: Pick<FashionTest, "id" | "title" | "description" | "slug" | "status" | "createdAt">;
  analytics: AnalyticsResult;
  recommendations: { dataPolicy: string; recommendations: Array<{ priority: string; category: string; message: string }> };
}

const SAMPLE_WARN_THRESHOLD = 30;
const COLORS = {
  primary: "#C8763A",
  text: "#1C1A14",
  muted: "#5C5C5C",
  high: "#B91C1C",
  medium: "#B45309",
  low: "#15803D",
  border: "#E5E5E5",
  band: "#FAFAFA"
};

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly analytics: AnalyticsService,
    private readonly recommendations: RecommendationProvider
  ) {}

  async streamFashionTestPdf(creatorId: string, testId: string, response: Response): Promise<void> {
    const creator = await this.prisma.user.findUnique({ where: { id: creatorId } });
    if (!creator) throw new Error("creator not found");

    const dbTest = await findOwnedTest(this.prisma, creatorId, testId);
    const collection = await findOwnedCollection(this.prisma, creatorId, dbTest.collectionId);

    const [questions, rawResponses, rawShares] = await Promise.all([
      this.prisma.question.findMany({ where: { testId }, orderBy: { sortOrder: "asc" } }),
      this.prisma.publicResponse.findMany({ where: { testId, test: { collection: { creatorId } } }, orderBy: { createdAt: "asc" } }),
      this.prisma.shareEvent.findMany({ where: { testId, test: { collection: { creatorId } } }, orderBy: { createdAt: "asc" } })
    ]);
    const shares: ShareEvent[] = rawShares.map((s) => ({ ...s, channel: s.channel as ShareChannel, createdAt: s.createdAt.toISOString() }));

    const responses = rawResponses.map((r) => ({
      id: r.id,
      testId: r.testId,
      respondent: (r.respondent as never) ?? undefined,
      answers: r.answers as never,
      startedAt: r.startedAt.toISOString(),
      completedAt: r.completedAt.toISOString(),
      createdAt: r.createdAt.toISOString()
    }));

    const analytics = this.analytics.scores.buildAnalytics(testId, questions as never, responses, shares);
    const recs = await this.recommendations.generate({ testId, analytics });

    const input: PdfContext = {
      creator: { name: creator.name, brandName: creator.brandName, city: creator.city ?? undefined, country: creator.country ?? undefined },
      collection: mapCollection(collection),
      test: mapTest(dbTest),
      analytics,
      recommendations: { dataPolicy: recs.dataPolicy, recommendations: recs.recommendations as never }
    };

    const fileName = `sutura-${input.test.slug || input.test.id}.pdf`;
    this.logger.log(`Generating PDF for test=${input.test.id}`);
    response.setHeader("Content-Type", "application/pdf");
    response.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    const pdf = new PDFDocument({ size: "A4", margin: 48 });
    pdf.pipe(response);

    this.renderHeader(pdf, input);
    this.renderIdentity(pdf, input);
    this.renderKpis(pdf, input.analytics);
    this.renderExecutiveSummary(pdf, input.analytics);
    this.renderModelBreakdown(pdf, input.analytics);
    this.renderPriceDistribution(pdf, input.analytics);
    this.renderQuestionBreakdown(pdf, input.analytics);
    this.renderRecommendations(pdf, input.recommendations);
    this.renderFooter(pdf, input);

    pdf.end();
  }

  private renderHeader(pdf: PDFKit.PDFDocument, input: PdfContext) {
    pdf.fillColor(COLORS.primary).fontSize(22).font("Helvetica-Bold").text("Sutura", { continued: true });
    pdf.fillColor(COLORS.muted).fontSize(12).font("Helvetica").text("  — Rapport Fashion Test", { align: "left" });
    pdf.moveDown(0.2);
    pdf.fillColor(COLORS.muted).fontSize(9).text(`Généré le ${new Date().toLocaleString("fr-FR")} • v0.1.0`);
    pdf.moveDown(0.6);
    pdf.strokeColor(COLORS.border).lineWidth(1).moveTo(48, pdf.y).lineTo(547, pdf.y).stroke();
    pdf.moveDown(0.8);
  }

  private renderIdentity(pdf: PDFKit.PDFDocument, input: PdfContext) {
    pdf.fillColor(COLORS.text).fontSize(18).font("Helvetica-Bold").text(input.test.title);
    if (input.test.description) {
      pdf.moveDown(0.2);
      pdf.fillColor(COLORS.muted).fontSize(11).text(input.test.description);
    }
    pdf.moveDown(0.6);

    pdf.fontSize(10).fillColor(COLORS.text);
    const lines: [string, string][] = [
      ["Créateur", `${input.creator.name} (${input.creator.brandName})`],
      ["Collection", input.collection.title + (input.collection.season ? ` — ${input.collection.season}` : "")],
      ["Catégorie", input.collection.category ?? "—"],
      ["Audience cible", input.collection.targetAudience ?? "—"],
      ["Lien public", input.test.status === "published" ? `/s/${input.test.slug}` : "non publié"],
      ["Statut", input.test.status],
      ["Réponses", `${input.analytics.responses}`]
    ];
    if (input.creator.city || input.creator.country) {
      lines.push(["Localisation créateur", [input.creator.city, input.creator.country].filter(Boolean).join(", ")]);
    }
    for (const [k, v] of lines) {
      pdf.font("Helvetica-Bold").text(`${k.padEnd(20, " ")} `, { continued: true });
      pdf.font("Helvetica").text(v);
    }
    pdf.moveDown(0.8);
  }

  private renderKpis(pdf: PDFKit.PDFDocument, a: AnalyticsResult) {
    pdf.fillColor(COLORS.text).fontSize(13).font("Helvetica-Bold").text("Indicateurs clés");
    pdf.moveDown(0.3);

    const cards: Array<[string, string, string]> = [
      ["Désirabilité", `${a.desirabilityScore}/100`, a.desirabilityScore >= 75 ? COLORS.low : a.desirabilityScore >= 55 ? COLORS.medium : COLORS.high],
      ["Risque d'invendu", `${a.unsoldRiskScore}/100`, a.unsoldRiskScore <= 40 ? COLORS.low : a.unsoldRiskScore <= 60 ? COLORS.medium : COLORS.high],
      ["Réponses", `${a.responses}`, COLORS.text],
      ["Conversion", a.conversionRate === null ? "Non mesurée" : `${Math.round(a.conversionRate * 100)}%`, COLORS.text],
      ["Abandon", a.abandonmentRate === null ? "Non mesuré" : `${Math.round(a.abandonmentRate * 100)}%`, COLORS.text],
      ["Temps moyen", `${a.averageResponseSeconds}s`, COLORS.text]
    ];

    const colW = (547 - 48) / 3;
    const startY = pdf.y;
    for (let i = 0; i < cards.length; i += 1) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = 48 + col * colW;
      const y = startY + row * 60;
      pdf.rect(x, y, colW - 8, 50).fillAndStroke(COLORS.band, COLORS.border);
      pdf.fillColor(COLORS.muted).fontSize(8).font("Helvetica").text(cards[i][0], x + 8, y + 6, { width: colW - 24 });
      pdf.fillColor(cards[i][2]).fontSize(16).font("Helvetica-Bold").text(cards[i][1], x + 8, y + 20, { width: colW - 24 });
    }
    pdf.y = startY + 2 * 60 + 10;
    pdf.moveDown(0.5);
  }

  private renderExecutiveSummary(pdf: PDFKit.PDFDocument, a: AnalyticsResult) {
    pdf.fillColor(COLORS.text).fontSize(13).font("Helvetica-Bold").text("Synthèse exécutive");
    pdf.moveDown(0.3);
    pdf.fillColor(COLORS.text).fontSize(11).text(a.executiveSummary, { align: "justify" });
    if (a.responses < SAMPLE_WARN_THRESHOLD) {
      pdf.moveDown(0.4);
      pdf.fillColor(COLORS.medium).fontSize(10).text(
        `⚠ Échantillon encore faible (${a.responses} réponses). Les indicateurs sont indicatifs et non statistiquement significatifs.`
      );
    }
    pdf.moveDown(0.8);
  }

  private renderModelBreakdown(pdf: PDFKit.PDFDocument, a: AnalyticsResult) {
    const models = a.modelBreakdown ?? [];
    if (models.length === 0) return;
    pdf.fillColor(COLORS.text).fontSize(13).font("Helvetica-Bold").text("Performance par modèle");
    pdf.moveDown(0.3);
    pdf.fillColor(COLORS.muted).fontSize(9).text("Réponses obtenues sur les questions liées à chaque modèle.");
    pdf.moveDown(0.2);
    for (const m of models) {
      const bar = "█".repeat(Math.round(m.answerRate * 30));
      pdf.fillColor(COLORS.text).fontSize(10).text(`Modèle ${m.modelId.slice(0, 8)}…`);
      pdf.fillColor(COLORS.muted).fontSize(9).text(`  réponses: ${m.responsesWithAnswer}  ·  questions: ${m.questionsCount}  ·  ${Math.round(m.answerRate * 100)}%`);
      pdf.fillColor(COLORS.primary).font("Courier").text(`  ${bar} ${Math.round(m.answerRate * 100)}%`);
      pdf.font("Helvetica").moveDown(0.3);
    }
    pdf.moveDown(0.5);
  }

  private renderPriceDistribution(pdf: PDFKit.PDFDocument, a: AnalyticsResult) {
    const dist = a.priceDistribution ?? [];
    if (dist.length === 0) return;
    pdf.fillColor(COLORS.text).fontSize(13).font("Helvetica-Bold").text("Distribution des prix souhaités");
    pdf.moveDown(0.3);
    const max = Math.max(...dist.map((d) => d.count));
    for (const d of dist) {
      const bar = "█".repeat(max > 0 ? Math.round((d.count / max) * 25) : 0);
      pdf.fillColor(COLORS.text).fontSize(10).text(`${d.label.padEnd(15, " ")} `, { continued: true });
      pdf.fillColor(COLORS.primary).font("Courier").text(` ${bar} ${d.count}`);
      pdf.font("Helvetica").moveDown(0.2);
    }
    pdf.moveDown(0.5);
  }

  private renderQuestionBreakdown(pdf: PDFKit.PDFDocument, a: AnalyticsResult) {
    const breakdown = a.questionBreakdown ?? [];
    if (breakdown.length === 0) return;
    pdf.fillColor(COLORS.text).fontSize(13).font("Helvetica-Bold").text("Détail par question");
    pdf.moveDown(0.3);
    for (const q of breakdown) {
      pdf.fillColor(COLORS.text).fontSize(11).font("Helvetica-Bold").text(`${q.text}  `, { continued: true });
      pdf.fillColor(COLORS.muted).font("Helvetica").text(`(${q.type}, ${q.answersCount} réponses)`);
      pdf.moveDown(0.2);
      const topEntries = Object.entries(q.distribution)
        .sort((a, b) => Number(b[1]) - Number(a[1]))
        .slice(0, 4);
      for (const [k, n] of topEntries) {
        pdf.fillColor(COLORS.muted).fontSize(9).text(`  • ${k}: ${n}`);
      }
      if (q.average != null) {
        pdf.fillColor(COLORS.muted).fontSize(9).text(`  moyenne: ${q.average}`);
      }
      pdf.moveDown(0.4);
    }
    pdf.moveDown(0.3);
  }

  private renderRecommendations(
    pdf: PDFKit.PDFDocument,
    recs: PdfContext["recommendations"]
  ) {
    pdf.fillColor(COLORS.text).fontSize(13).font("Helvetica-Bold").text("Recommandations");
    pdf.moveDown(0.3);
    pdf.fillColor(COLORS.muted).fontSize(9).text(recs.dataPolicy);
    pdf.moveDown(0.3);
    for (const r of recs.recommendations) {
      const color = r.priority === "high" ? COLORS.high : r.priority === "medium" ? COLORS.medium : COLORS.low;
      pdf.fillColor(color).fontSize(11).font("Helvetica-Bold").text(`[${r.priority.toUpperCase()}] ${r.category}`, { continued: true });
      pdf.fillColor(COLORS.text).font("Helvetica").text(` — ${r.message}`);
      pdf.moveDown(0.3);
    }
    pdf.moveDown(0.5);
  }

  private renderFooter(pdf: PDFKit.PDFDocument, input: PdfContext) {
    pdf.fillColor(COLORS.muted).fontSize(8).text(
      `Sutura © ${new Date().getFullYear()} — ${input.creator.brandName} — test ${input.test.id}`,
      { align: "center" }
    );
  }
}
