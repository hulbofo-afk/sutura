import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const test = await ctx.db.query("fashionTests").withIndex("by_slug", (q) => q.eq("slug", slug)).unique();
    if (!test || test.status !== "published") return null;
    const collection = await ctx.db.get(test.collectionId);
    const questions = await ctx.db.query("questions").withIndex("by_test", (q) => q.eq("testId", test._id)).order("asc").collect();
    const models = await ctx.db.query("models").withIndex("by_collection", (q) => q.eq("collectionId", test.collectionId)).collect();
    return { test, collection: collection ? { title: collection.title } : null, questions, models };
  },
});

export const submitResponse = mutation({
  args: { testId: v.id("fashionTests"), answers: v.any(), startedAt: v.number(), idempotencyKey: v.string(), respondent: v.optional(v.any()) },
  handler: async (ctx, args) => {
    const test = await ctx.db.get(args.testId);
    if (!test || test.status !== "published") throw new Error("Ce test n'est plus disponible");
    const existing = await ctx.db.query("publicResponses").withIndex("by_test_idempotency", (q) => q.eq("testId", args.testId).eq("idempotencyKey", args.idempotencyKey)).unique();
    if (existing) return existing._id;
    return ctx.db.insert("publicResponses", { ...args, completedAt: Date.now() });
  },
});
