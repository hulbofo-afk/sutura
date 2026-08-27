import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function currentUserId(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } }) {
  return (await ctx.auth.getUserIdentity())?.subject ?? null;
}

const status = v.union(v.literal("draft"), v.literal("published"), v.literal("closed"));

export const list = query({
  args: { status: v.optional(status) },
  handler: async (ctx, args) => {
    const userId = await currentUserId(ctx);
    if (!userId) return [];
    const tests = await ctx.db.query("fashionTests").withIndex("by_creator", (q) => q.eq("creatorId", userId)).collect();
    return args.status ? tests.filter((test) => test.status === args.status) : tests;
  },
});

export const create = mutation({
  args: { collectionId: v.id("collections"), title: v.string(), description: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const creatorId = await currentUserId(ctx);
    const collection = await ctx.db.get(args.collectionId);
    if (!creatorId || !collection || collection.creatorId !== creatorId) throw new Error("Collection introuvable");
    const title = args.title.trim();
    if (!title) throw new Error("Le titre du test est requis");
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now().toString(36)}`;
    const now = Date.now();
    return ctx.db.insert("fashionTests", { ...args, title, creatorId, slug, status: "draft", settings: { anonymousResponses: true, collectRespondentProfile: false }, createdAt: now, updatedAt: now });
  },
});

export const addQuestion = mutation({
  args: { testId: v.id("fashionTests"), text: v.string(), type: v.string(), required: v.boolean(), options: v.array(v.string()), modelId: v.optional(v.id("models")) },
  handler: async (ctx, args) => {
    const creatorId = await currentUserId(ctx);
    const test = await ctx.db.get(args.testId);
    if (!creatorId || !test || test.creatorId !== creatorId || test.status !== "draft") throw new Error("Test non modifiable");
    const questions = await ctx.db.query("questions").withIndex("by_test", (q) => q.eq("testId", args.testId)).collect();
    return ctx.db.insert("questions", { ...args, sortOrder: questions.length });
  },
});
