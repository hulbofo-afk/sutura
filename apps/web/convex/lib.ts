import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import type { DataModel, Doc, Id } from "./_generated/dataModel";

export type DbCtx = GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>;

export async function requireUserId(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } }) {
  const id = (await ctx.auth.getUserIdentity())?.subject;
  if (!id) throw new Error("Vous devez être connecté.");
  return id;
}

export function publicSettings(settings: Doc<"fashionTests">["settings"]) {
  const fields = Array.isArray(settings.collectRespondentProfile)
    ? settings.collectRespondentProfile
    : settings.collectRespondentProfile
      ? ["firstName", "city", "country"]
      : [];
  return {
    randomizeQuestions: settings.randomizeQuestions ?? false,
    requireAllQuestions: settings.requireAllQuestions ?? false,
    completionMessage: settings.completionMessage ?? "Merci, ta réponse a bien été enregistrée.",
    closesAt: settings.closesAt ? new Date(settings.closesAt).toISOString() : undefined,
    maxResponses: settings.maxResponses,
    anonymousResponses: settings.anonymousResponses,
    collectRespondentProfile: fields,
  };
}

export function publicQuestion(question: Doc<"questions">) {
  return { ...question, id: question._id };
}

export async function assertOwnedTest(ctx: DbCtx, id: Id<"fashionTests">, userId: string) {
  const test = await ctx.db.get(id);
  if (!test || test.creatorId !== userId) throw new Error("Test introuvable.");
  return test;
}

export async function assertOwnedCollection(ctx: DbCtx, id: Id<"collections">, userId: string) {
  const collection = await ctx.db.get(id);
  if (!collection || collection.creatorId !== userId) throw new Error("Collection introuvable.");
  return collection;
}
