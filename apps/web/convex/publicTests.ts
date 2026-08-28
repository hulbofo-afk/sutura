import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { publicQuestion, publicSettings } from "./lib";
import { validatePublicSubmission } from "./validation";

export const getBySlug = query({ args: { slug: v.string() }, handler: async (ctx, { slug }) => {
  const normalizedSlug = slug.trim().toLowerCase();
  const test = await ctx.db.query("fashionTests").withIndex("by_slug", q => q.eq("slug", normalizedSlug)).unique();
  if (!test || test.status !== "published") return null;
  const responses = await ctx.db.query("publicResponses").withIndex("by_test", q => q.eq("testId", test._id)).collect();
  if ((test.settings.closesAt && test.settings.closesAt <= Date.now()) || (test.settings.maxResponses && responses.length >= test.settings.maxResponses)) return null;
  const collection = await ctx.db.get(test.collectionId);
  if (!collection) return null;
  const questions = (await ctx.db.query("questions").withIndex("by_test", q => q.eq("testId", test._id)).collect()).sort((a, b) => a.sortOrder - b.sortOrder);
  const models = await ctx.db.query("models").withIndex("by_collection", q => q.eq("collectionId", test.collectionId)).collect();
  const modelDtos = await Promise.all(models.map(async model => ({ ...model, id: model._id, photoUrls: (await Promise.all(model.photoIds.map(id => ctx.storage.getUrl(id)))).filter((url): url is string => Boolean(url)) })));
  const modelById = new Map(modelDtos.map(model => [model.id, model]));
  const orderedQuestions = test.settings.randomizeQuestions ? seededShuffle(questions, test._id) : questions;
  const questionDtos = orderedQuestions.map(question => ({ ...publicQuestion(question), model: question.modelId ? modelById.get(question.modelId) ?? null : null }));
  return { id: test._id, slug: test.slug, title: test.title, description: test.description, settings: publicSettings(test.settings), collection: { title: collection.title, description: collection.description, season: collection.season, category: collection.category, targetAudience: collection.targetAudience }, questions: questionDtos, models: modelDtos };
} });

function seededShuffle<T>(items: T[], seed: string) {
  const result = [...items];
  let state = Array.from(seed).reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7);
  for (let index = result.length - 1; index > 0; index -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const target = state % (index + 1);
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_SUBMISSIONS = 5;

export const submitResponse = mutation({ args: { testId: v.id("fashionTests"), answers: v.any(), startedAt: v.number(), idempotencyKey: v.string(), respondent: v.optional(v.any()), clientKey: v.optional(v.string()) }, handler: async (ctx, args) => {
  const test = await ctx.db.get(args.testId);
  if (!test || test.status !== "published") throw new Error("Ce test n'est plus disponible.");
  const existing = await ctx.db.query("publicResponses").withIndex("by_test_idempotency", q => q.eq("testId", args.testId).eq("idempotencyKey", args.idempotencyKey)).unique();
  if (existing) return { id: existing._id, message: test.settings.completionMessage ?? "Merci, ta réponse a bien été enregistrée." };
  const responses = await ctx.db.query("publicResponses").withIndex("by_test", q => q.eq("testId", args.testId)).collect();
  if (test.settings.maxResponses && responses.length >= test.settings.maxResponses) throw new Error("Ce test a atteint sa limite de réponses.");
  if (test.settings.closesAt && test.settings.closesAt <= Date.now()) throw new Error("Ce test est terminé.");
  const questions = await ctx.db.query("questions").withIndex("by_test", q => q.eq("testId", args.testId)).collect();
  validatePublicSubmission(questions, test.settings, args.answers, args.respondent, args.idempotencyKey);
  if (args.clientKey !== undefined) {
    if (!/^[A-Za-z0-9_-]{16,128}$/.test(args.clientKey)) throw new Error("Identifiant de session invalide.");
    const now = Date.now();
    const existingLimit = await ctx.db.query("publicSubmissionLimits").withIndex("by_test_client", q => q.eq("testId", args.testId).eq("clientKey", args.clientKey!)).unique();
    if (existingLimit && now - existingLimit.windowStartedAt < RATE_LIMIT_WINDOW_MS) {
      if (existingLimit.submissionCount >= RATE_LIMIT_MAX_SUBMISSIONS) throw new Error("Trop de réponses depuis cette session. Réessayez plus tard.");
      await ctx.db.patch(existingLimit._id, { submissionCount: existingLimit.submissionCount + 1, updatedAt: now });
    } else if (existingLimit) {
      await ctx.db.patch(existingLimit._id, { windowStartedAt: now, submissionCount: 1, updatedAt: now });
    } else {
      await ctx.db.insert("publicSubmissionLimits", { testId: args.testId, clientKey: args.clientKey, windowStartedAt: now, submissionCount: 1, updatedAt: now });
    }
  }
  const id = await ctx.db.insert("publicResponses", { testId: args.testId, answers: args.answers, startedAt: Math.min(args.startedAt, Date.now()), completedAt: Date.now(), idempotencyKey: args.idempotencyKey, respondent: args.respondent });
  return { id, message: test.settings.completionMessage ?? "Merci, ta réponse a bien été enregistrée." };
} });
