import { mutation, query, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { v } from "convex/values";
import { assertOwnedCollection, publicQuestion, publicSettings, requireUserId } from "./lib";

const status = v.union(v.literal("draft"), v.literal("published"), v.literal("archived"));

async function summary(ctx: QueryCtx, collection: Doc<"collections">) {
  const models = await ctx.db.query("models").withIndex("by_collection", q => q.eq("collectionId", collection._id)).collect();
  const tests = await ctx.db.query("fashionTests").withIndex("by_collection", q => q.eq("collectionId", collection._id)).collect();
  const responses = (await Promise.all(tests.map(test => ctx.db.query("publicResponses").withIndex("by_test", q => q.eq("testId", test._id)).collect()))).flat();
  return { ...collection, id: collection._id, createdAt: new Date(collection.createdAt).toISOString(), updatedAt: new Date(collection.updatedAt).toISOString(), modelsCount: models.length, testsCount: tests.length, responsesCount: responses.length };
}

export const list = query({ args: { status: v.optional(status) }, handler: async (ctx, args) => {
  const userId = await requireUserId(ctx);
  const rows = await ctx.db.query("collections").withIndex("by_creator", q => q.eq("creatorId", userId)).order("desc").collect();
  return Promise.all(rows.filter(row => !args.status || row.status === args.status).map(row => summary(ctx, row)));
}});

export const getDetailed = query({ args: { id: v.id("collections") }, handler: async (ctx, { id }) => {
  const userId = await requireUserId(ctx); const collection = await assertOwnedCollection(ctx, id, userId);
  const models = await ctx.db.query("models").withIndex("by_collection", q => q.eq("collectionId", id)).collect();
  const tests = await ctx.db.query("fashionTests").withIndex("by_collection", q => q.eq("collectionId", id)).collect();
  const modelDtos = await Promise.all(models.sort((a,b)=>a.sortOrder-b.sortOrder).map(async model => ({ ...model, id:model._id, photoUrls:(await Promise.all(model.photoIds.map(file=>ctx.storage.getUrl(file)))).filter((url):url is string=>Boolean(url)), sketchUrl:model.sketchId ? await ctx.storage.getUrl(model.sketchId) ?? undefined : undefined, videoUrl:model.videoId ? await ctx.storage.getUrl(model.videoId) ?? undefined : undefined })));
  const testDtos = await Promise.all(tests.map(async test => { const questions=await ctx.db.query("questions").withIndex("by_test",q=>q.eq("testId",test._id)).collect(); const responses=await ctx.db.query("publicResponses").withIndex("by_test",q=>q.eq("testId",test._id)).collect(); return {...test,id:test._id,settings:publicSettings(test.settings),questions:questions.sort((a,b)=>a.sortOrder-b.sortOrder).map(publicQuestion),responsesCount:responses.length,modelsCount:models.length,createdAt:new Date(test.createdAt).toISOString(),updatedAt:new Date(test.updatedAt).toISOString(),publicUrl:null}; }));
  return { collection: await summary(ctx, collection), models:modelDtos, tests:testDtos };
}});

export const create = mutation({ args:{ title:v.string(),description:v.optional(v.string()),season:v.optional(v.string()),category:v.optional(v.string()),targetAudience:v.optional(v.string()),launchDate:v.optional(v.string()) }, handler:async(ctx,args)=>{const creatorId=await requireUserId(ctx);const title=args.title.trim();if(!title)throw new Error("Le nom de la collection est requis.");const now=Date.now();return ctx.db.insert("collections",{...args,title,creatorId,status:"draft",createdAt:now,updatedAt:now});} });
export const update = mutation({ args:{id:v.id("collections"),title:v.optional(v.string()),description:v.optional(v.string()),season:v.optional(v.string()),category:v.optional(v.string()),targetAudience:v.optional(v.string()),launchDate:v.optional(v.string()),status:v.optional(status)},handler:async(ctx,{id,...patch})=>{const userId=await requireUserId(ctx);await assertOwnedCollection(ctx,id,userId);await ctx.db.patch(id,{...patch,updatedAt:Date.now()});return id;} });
export const archive = mutation({args:{id:v.id("collections")},handler:async(ctx,{id})=>{const userId=await requireUserId(ctx);await assertOwnedCollection(ctx,id,userId);await ctx.db.patch(id,{status:"archived",updatedAt:Date.now()});return id;}});
