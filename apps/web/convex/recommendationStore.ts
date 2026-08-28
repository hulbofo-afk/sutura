import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

const recommendation = v.object({
  priority: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
  category: v.union(v.literal("production"), v.literal("pricing"), v.literal("audience"), v.literal("content"), v.literal("risk")),
  message: v.string(),
  rationale: v.optional(v.string()),
});

export const context = internalQuery({
  args: { testId: v.id("fashionTests"), creatorId: v.string() },
  handler: async (ctx, args) => {
    const test = await ctx.db.get(args.testId);
    if (!test || test.creatorId !== args.creatorId) throw new Error("Test introuvable.");
    const responses = await ctx.db.query("publicResponses").withIndex("by_test", q => q.eq("testId", args.testId)).collect();
    const questions = await ctx.db.query("questions").withIndex("by_test", q => q.eq("testId", args.testId)).collect();
    const cached = await ctx.db.query("recommendationCache").withIndex("by_test", q => q.eq("testId", args.testId)).unique();
    const answerSummary = questions.map(question => {
      const values = responses
        .map(response => (response.answers as Record<string, unknown>)[String(question._id)])
        .filter(value => value !== undefined && value !== null && String(value).trim() !== "");
      const distribution: Record<string, number> = {};
      for (const value of values.flatMap(item => Array.isArray(item) ? item : [item])) {
        if (typeof value === "string" && value.length > 240) continue;
        const label = typeof value === "boolean" ? (value ? "Oui" : "Non") : String(value);
        distribution[label] = (distribution[label] ?? 0) + 1;
      }
      const numeric = values.map(Number).filter(Number.isFinite);
      return {
        id: String(question._id),
        text: question.text,
        type: question.type,
        answeredCount: values.length,
        distribution: ["short_text", "paragraph"].includes(question.type) ? {} : distribution,
        average: numeric.length ? Math.round(numeric.reduce((sum, value) => sum + value, 0) / numeric.length * 10) / 10 : null,
      };
    });
    return {
      test: { title: test.title, description: test.description },
      responseCount: responses.length,
      answerSummary,
      cached,
    };
  },
});

export const save = internalMutation({
  args: {
    testId: v.id("fashionTests"), creatorId: v.string(), responseCount: v.number(),
    provider: v.union(v.literal("local"), v.literal("imole")), dataPolicy: v.string(),
    recommendations: v.array(recommendation),
  },
  handler: async (ctx, args) => {
    const old = await ctx.db.query("recommendationCache").withIndex("by_test", q => q.eq("testId", args.testId)).unique();
    const data = { ...args, generatedAt: Date.now() };
    if (old) { await ctx.db.replace(old._id, data); return old._id; }
    return ctx.db.insert("recommendationCache", data);
  },
});
