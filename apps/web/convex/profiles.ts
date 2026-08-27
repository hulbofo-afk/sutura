import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function currentUserId(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } }) {
  return (await ctx.auth.getUserIdentity())?.subject ?? null;
}

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await currentUserId(ctx);
    if (!userId) return null;
    return ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", userId)).unique();
  },
});

export const upsert = mutation({
  args: { name: v.string(), brandName: v.string(), city: v.optional(v.string()), country: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await currentUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");
    const now = Date.now();
    const existing = await ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: now });
      return existing._id;
    }
    return ctx.db.insert("profiles", { ...args, userId, createdAt: now, updatedAt: now });
  },
});
