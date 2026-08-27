import type { Prisma } from "@prisma/client";
import type { Collection as DbCollection, FashionModel as DbFashionModel, FashionTest as DbFashionTest, Question as DbQuestion } from "@prisma/client";
import { normalizeImageUrl } from "../common/normalize-image";
import type { Collection, FashionModel, FashionQuestion, FashionTest, FashionTestSettings, QuestionType, TestStatus } from "../types";

const DEFAULT_COMPLETION_MESSAGE = "Merci, ton avis aide le createur a produire juste.";
const DEFAULT_RESPONDENT_FIELDS: Array<keyof import("../types").RespondentProfile> = [
  "firstName",
  "sex",
  "age",
  "city",
  "country",
  "whatsapp",
  "email",
  "profession"
];

export function mapCollection(collection: DbCollection): Collection {
  return {
    id: collection.id,
    creatorId: collection.creatorId,
    title: collection.title,
    description: collection.description ?? undefined,
    season: collection.season ?? undefined,
    category: collection.category ?? undefined,
    targetAudience: collection.targetAudience ?? undefined,
    launchDate: collection.launchDate ? collection.launchDate.toISOString() : undefined,
    status: collection.status as TestStatus,
    createdAt: collection.createdAt.toISOString(),
    updatedAt: collection.updatedAt.toISOString()
  };
}

export function mapModel(model: DbFashionModel): FashionModel {
  return {
    id: model.id,
    collectionId: model.collectionId,
    name: model.name,
    description: model.description ?? undefined,
    photoUrls: model.photoUrls.map((url) => normalizeImageUrl(url)),
    sketchUrl: model.sketchUrl ? normalizeImageUrl(model.sketchUrl) : undefined,
    videoUrl: model.videoUrl ? normalizeImageUrl(model.videoUrl) : undefined,
    colors: model.colors,
    desiredPrice: model.desiredPrice === null ? undefined : Number(model.desiredPrice),
    sortOrder: model.sortOrder,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString()
  };
}

export function mapQuestion(question: DbQuestion): FashionQuestion {
  return {
    id: question.id,
    testId: question.testId,
    text: question.text,
    type: question.type as QuestionType,
    required: question.required,
    options: question.options,
    min: question.min ?? undefined,
    max: question.max ?? undefined,
    sortOrder: question.sortOrder,
    helpText: question.helpText ?? undefined,
    modelId: question.modelId ?? undefined
  };
}

export function mapTest(test: DbFashionTest): FashionTest {
  return {
    id: test.id,
    collectionId: test.collectionId,
    slug: test.slug,
    title: test.title,
    description: test.description ?? undefined,
    status: test.status as TestStatus,
    settings: mapSettings(test.settings),
    createdAt: test.createdAt.toISOString(),
    updatedAt: test.updatedAt.toISOString()
  };
}

export function mapSettings(value: Prisma.JsonValue): FashionTestSettings {
  const settings = value as Partial<FashionTestSettings> | null;
  return {
    randomizeQuestions: settings?.randomizeQuestions ?? false,
    requireAllQuestions: settings?.requireAllQuestions ?? true,
    completionMessage: settings?.completionMessage ?? DEFAULT_COMPLETION_MESSAGE,
    closesAt: settings?.closesAt,
    maxResponses: settings?.maxResponses,
    anonymousResponses: settings?.anonymousResponses ?? false,
    collectRespondentProfile: settings?.collectRespondentProfile ?? DEFAULT_RESPONDENT_FIELDS
  };
}

export function settingsToJson(settings: FashionTestSettings): Prisma.InputJsonValue {
  return settings as unknown as Prisma.InputJsonValue;
}
