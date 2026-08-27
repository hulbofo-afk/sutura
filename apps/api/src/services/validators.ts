import { BadRequestException } from "@nestjs/common";
import type { Collection, FashionModel, FashionTest, Question } from "@prisma/client";
import type { FashionQuestion, FashionTestSettings, QuestionType, RespondentProfile } from "../types";

export interface QuestionShape {
  type: QuestionType;
  options: string[];
  min?: number;
  max?: number;
}

export function assertValidQuestionShape(question: QuestionShape): void {
  if (["single_choice", "multiple_choice", "ranking"].includes(question.type) && question.options.length < 2) {
    throw new BadRequestException(`${question.type} requires at least two options`);
  }
  if (["scale", "rating", "price"].includes(question.type)) {
    if (typeof question.min !== "number" || typeof question.max !== "number" || question.min >= question.max) {
      throw new BadRequestException(`${question.type} requires valid min and max values`);
    }
  }
}

export interface TestForPublish {
  test: FashionTest;
  settings: FashionTestSettings;
  questions: Question[];
  models: FashionModel[];
  collection: Collection;
  responsesCount: number;
}

export function assertTestCanBePublished(input: TestForPublish): void {
  const { settings, questions, models, responsesCount } = input;

  if (questions.length === 0) {
    throw new BadRequestException("A test needs at least one question before publish");
  }
  if (models.length === 0) {
    throw new BadRequestException("A test needs at least one model before publish");
  }
  if (settings.closesAt && new Date(settings.closesAt).getTime() < Date.now()) {
    throw new BadRequestException("closesAt must be in the future");
  }
  if (settings.maxResponses && settings.maxResponses < responsesCount) {
    throw new BadRequestException("maxResponses cannot be lower than responses already collected");
  }

  const modelIds = new Set(models.map((model) => model.id));
  const orphan = questions.find((question) => question.modelId && !modelIds.has(question.modelId));
  if (orphan) {
    throw new BadRequestException(`Question "${orphan.text}" references a model that does not belong to this collection`);
  }
}

export function assertTestCanReceiveResponses(test: FashionTest, settings: FashionTestSettings, responsesCount: number): void {
  if (test.status !== "published") {
    throw new BadRequestException("Fashion test is not public");
  }
  if (settings.closesAt && new Date(settings.closesAt).getTime() < Date.now()) {
    throw new BadRequestException("Fashion test is closed");
  }
  if (settings.maxResponses && responsesCount >= settings.maxResponses) {
    throw new BadRequestException("Fashion test response limit reached");
  }
}

export type AnswerValue = string | string[] | number | boolean;

export function assertValidAnswer(question: FashionQuestion, value: AnswerValue): void {
  switch (question.type) {
    case "single_choice": {
      if (typeof value !== "string" || !question.options.includes(value)) {
        throw new BadRequestException(`Answer for "${question.text}" must be one of the declared options`);
      }
      return;
    }
    case "multiple_choice": {
      if (!Array.isArray(value) || value.length === 0) {
        throw new BadRequestException(`Answer for "${question.text}" must be a non-empty array of options`);
      }
      const invalid = value.find((entry) => typeof entry !== "string" || !question.options.includes(entry));
      if (invalid !== undefined) {
        throw new BadRequestException(`Answer for "${question.text}" contains an option that is not declared`);
      }
      return;
    }
    case "ranking": {
      if (!Array.isArray(value)) {
        throw new BadRequestException(`Answer for "${question.text}" must be an ordered list of options`);
      }
      if (value.length !== question.options.length) {
        throw new BadRequestException(`Answer for "${question.text}" must rank every option exactly once`);
      }
      const seen = new Set<string>();
      for (const entry of value) {
        if (typeof entry !== "string" || !question.options.includes(entry) || seen.has(entry)) {
          throw new BadRequestException(`Answer for "${question.text}" must rank every option exactly once`);
        }
        seen.add(entry);
      }
      return;
    }
    case "scale":
    case "rating":
    case "price": {
      if (typeof value !== "number" || Number.isNaN(value)) {
        throw new BadRequestException(`Answer for "${question.text}" must be a number`);
      }
      if (typeof question.min === "number" && value < question.min) {
        throw new BadRequestException(`Answer for "${question.text}" must be >= ${question.min}`);
      }
      if (typeof question.max === "number" && value > question.max) {
        throw new BadRequestException(`Answer for "${question.text}" must be <= ${question.max}`);
      }
      return;
    }
    case "yes_no": {
      if (typeof value !== "boolean") {
        throw new BadRequestException(`Answer for "${question.text}" must be true or false`);
      }
      return;
    }
    case "short_text":
    case "paragraph": {
      if (typeof value !== "string") {
        throw new BadRequestException(`Answer for "${question.text}" must be a string`);
      }
      const maxLength = question.type === "short_text" ? 500 : 5_000;
      if (value.length > maxLength) {
        throw new BadRequestException(`Answer for "${question.text}" is too long`);
      }
      return;
    }
    default:
      return;
  }
}

export function assertRespondentMatchesSettings(
  settings: FashionTestSettings,
  respondent: RespondentProfile | undefined
): void {
  if (settings.anonymousResponses) return;
  if (!respondent) {
    throw new BadRequestException("Respondent profile is required when anonymousResponses is false");
  }
  const declared = new Set(settings.collectRespondentProfile);
  for (const field of declared) {
    if (respondent[field] === undefined || respondent[field] === null || respondent[field] === "") {
      throw new BadRequestException(`Missing respondent field: ${field}`);
    }
  }
}
