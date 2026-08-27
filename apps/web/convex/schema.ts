import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const timestamps = {
  createdAt: v.number(),
  updatedAt: v.number(),
};

export default defineSchema({
  ...authTables,
  profiles: defineTable({
    userId: v.string(),
    name: v.string(),
    brandName: v.string(),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    ...timestamps,
  }).index("by_user", ["userId"]),
  collections: defineTable({
    creatorId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    season: v.optional(v.string()),
    category: v.optional(v.string()),
    targetAudience: v.optional(v.string()),
    launchDate: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
    ...timestamps,
  }).index("by_creator", ["creatorId"]).index("by_creator_status", ["creatorId", "status"]),
  models: defineTable({
    creatorId: v.string(),
    collectionId: v.id("collections"),
    name: v.string(),
    description: v.optional(v.string()),
    photoIds: v.array(v.id("_storage")),
    sketchId: v.optional(v.id("_storage")),
    videoId: v.optional(v.id("_storage")),
    colors: v.array(v.string()),
    desiredPrice: v.optional(v.number()),
    sortOrder: v.number(),
    ...timestamps,
  }).index("by_collection", ["collectionId"]).index("by_creator", ["creatorId"]),
  fashionTests: defineTable({
    creatorId: v.string(),
    collectionId: v.id("collections"),
    slug: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("closed")),
    settings: v.object({
      maxResponses: v.optional(v.number()),
      closesAt: v.optional(v.number()),
      anonymousResponses: v.boolean(),
      collectRespondentProfile: v.boolean(),
    }),
    ...timestamps,
  }).index("by_slug", ["slug"]).index("by_creator", ["creatorId"]).index("by_collection", ["collectionId"]),
  questions: defineTable({
    testId: v.id("fashionTests"),
    modelId: v.optional(v.id("models")),
    text: v.string(),
    type: v.string(),
    required: v.boolean(),
    options: v.array(v.string()),
    min: v.optional(v.number()),
    max: v.optional(v.number()),
    helpText: v.optional(v.string()),
    sortOrder: v.number(),
  }).index("by_test", ["testId"]),
  publicResponses: defineTable({
    testId: v.id("fashionTests"),
    respondent: v.optional(v.any()),
    answers: v.any(),
    startedAt: v.number(),
    completedAt: v.number(),
    idempotencyKey: v.optional(v.string()),
  }).index("by_test", ["testId"]).index("by_test_idempotency", ["testId", "idempotencyKey"]),
  shareEvents: defineTable({
    testId: v.id("fashionTests"),
    channel: v.string(),
    createdAt: v.number(),
  }).index("by_test", ["testId"]),
});
