import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function currentUserId(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } }) {
  return (await ctx.auth.getUserIdentity())?.subject ?? null;
}

export const list = query({
  args: { status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("archived"))) },
  handler: async (ctx, args) => {
    const userId = await currentUserId(ctx);
    if (!userId) return [];
    const collections = await ctx.db.query("collections").withIndex("by_creator", (q) => q.eq("creatorId", userId)).collect();
    return args.status ? collections.filter((collection) => collection.status === args.status) : collections;
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    season: v.optional(v.string()),
    category: v.optional(v.string()),
    targetAudience: v.optional(v.string()),
    launchDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const creatorId = await currentUserId(ctx);
    if (!creatorId) throw new Error("Unauthenticated");
    const title = args.title.trim();
    if (!title) throw new Error("Le nom de la collection est requis");
    const now = Date.now();
    return ctx.db.insert("collections", { ...args, title, creatorId, status: "draft", createdAt: now, updatedAt: now });
  },
});

export const get = query({
  args: { id: v.id("collections") },
  handler: async (ctx, args) => {
    const userId = await currentUserId(ctx);
    const collection = await ctx.db.get(args.id);
    if (!userId || !collection || collection.creatorId !== userId) return null;
    return collection;
  },
});
