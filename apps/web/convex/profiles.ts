import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUserId } from "./lib";

export const get = query({args:{},handler:async ctx=>{const userId=await requireUserId(ctx);return ctx.db.query("profiles").withIndex("by_user",q=>q.eq("userId",userId)).unique();}});
export const upsert = mutation({args:{name:v.string(),brandName:v.string(),city:v.optional(v.string()),country:v.optional(v.string())},handler:async(ctx,args)=>{const userId=await requireUserId(ctx);const name=args.name.trim(),brandName=args.brandName.trim();if(!name||!brandName)throw new Error("Le nom et la marque sont requis.");const now=Date.now();const existing=await ctx.db.query("profiles").withIndex("by_user",q=>q.eq("userId",userId)).unique();if(existing){await ctx.db.patch(existing._id,{...args,name,brandName,updatedAt:now});return existing._id;}return ctx.db.insert("profiles",{...args,name,brandName,userId,createdAt:now,updatedAt:now});}});
