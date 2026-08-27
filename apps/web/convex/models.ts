import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function currentUserId(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } }) {
  return (await ctx.auth.getUserIdentity())?.subject ?? null;
}

export const list = query({
  args: { collectionId: v.id("collections") },
  handler: async (ctx, { collectionId }) => {
    const userId = await currentUserId(ctx);
    const collection = await ctx.db.get(collectionId);
    if (!userId || !collection || collection.creatorId !== userId) return [];
    return ctx.db.query("models").withIndex("by_collection", (q) => q.eq("collectionId", collectionId)).collect();
  },
});

export const create = mutation({
  args: {
    collectionId: v.id("collections"),
    name: v.string(),
    description: v.optional(v.string()),
    photoIds: v.array(v.id("_storage")),
    colors: v.array(v.string()),
    desiredPrice: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await currentUserId(ctx);
    const collection = await ctx.db.get(args.collectionId);
    if (!userId || !collection || collection.creatorId !== userId) throw new Error("Collection introuvable");
    if (!args.name.trim()) throw new Error("Le nom du modèle est requis");
    const existing = await ctx.db.query("models").withIndex("by_collection", (q) => q.eq("collectionId", args.collectionId)).collect();
    const now = Date.now();
    return ctx.db.insert("models", { ...args, name: args.name.trim(), creatorId: userId, sortOrder: existing.length, createdAt: now, updatedAt: now });
  },
});
