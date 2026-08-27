import { BadRequestException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import {
  assertRespondentMatchesSettings,
  assertTestCanBePublished,
  assertTestCanReceiveResponses,
  assertValidAnswer,
  assertValidQuestionShape
} from "../src/services/validators";
import type { FashionQuestion, FashionTestSettings } from "../src/types";

const baseSettings: FashionTestSettings = {
  randomizeQuestions: false,
  requireAllQuestions: true,
  completionMessage: "Merci",
  anonymousResponses: false,
  collectRespondentProfile: ["firstName", "city"]
};

const choiceQuestion: FashionQuestion = {
  id: "q1",
  testId: "t1",
  text: "Choisis",
  type: "single_choice",
  required: true,
  options: ["A", "B"],
  sortOrder: 1
};

describe("assertValidQuestionShape", () => {
  it("rejects choice questions with fewer than two options", () => {
    expect(() => assertValidQuestionShape({ type: "single_choice", options: ["only"] })).toThrow(BadRequestException);
  });

  it("rejects scale questions without valid min/max", () => {
    expect(() => assertValidQuestionShape({ type: "scale", options: [], min: 5, max: 5 })).toThrow(BadRequestException);
    expect(() => assertValidQuestionShape({ type: "rating", options: [], min: 1, max: 5 })).not.toThrow();
  });
});

describe("assertValidAnswer", () => {
  it("accepts a single choice that matches an option", () => {
    expect(() => assertValidAnswer(choiceQuestion, "A")).not.toThrow();
  });

  it("rejects a single choice that does not match an option", () => {
    expect(() => assertValidAnswer(choiceQuestion, "C")).toThrow(BadRequestException);
  });

  it("accepts a multiple choice with valid options", () => {
    const multi: FashionQuestion = { ...choiceQuestion, type: "multiple_choice" };
    expect(() => assertValidAnswer(multi, ["A", "B"])).not.toThrow();
  });

  it("rejects a multiple choice with an unknown option", () => {
    const multi: FashionQuestion = { ...choiceQuestion, type: "multiple_choice" };
    expect(() => assertValidAnswer(multi, ["A", "Z"])).toThrow(BadRequestException);
  });

  it("accepts a scale value within bounds", () => {
    const scale: FashionQuestion = { ...choiceQuestion, type: "scale", min: 1, max: 5, options: [] };
    expect(() => assertValidAnswer(scale, 3)).not.toThrow();
  });

  it("rejects a scale value outside bounds", () => {
    const scale: FashionQuestion = { ...choiceQuestion, type: "scale", min: 1, max: 5, options: [] };
    expect(() => assertValidAnswer(scale, 6)).toThrow(BadRequestException);
  });

  it("rejects a price value that is not a number", () => {
    const price: FashionQuestion = { ...choiceQuestion, type: "price", min: 0, max: 100, options: [] };
    expect(() => assertValidAnswer(price, "5000")).toThrow(BadRequestException);
  });

  it("rejects a yes_no value that is not boolean", () => {
    const yesNo: FashionQuestion = { ...choiceQuestion, type: "yes_no", options: [] };
    expect(() => assertValidAnswer(yesNo, "yes")).toThrow(BadRequestException);
    expect(() => assertValidAnswer(yesNo, true)).not.toThrow();
  });

  it("rejects a ranking that does not contain all options exactly once", () => {
    const ranking: FashionQuestion = { ...choiceQuestion, type: "ranking" };
    expect(() => assertValidAnswer(ranking, ["A"])).toThrow(BadRequestException);
    expect(() => assertValidAnswer(ranking, ["A", "A"])).toThrow(BadRequestException);
    expect(() => assertValidAnswer(ranking, ["A", "B"])).not.toThrow();
  });
});

describe("assertRespondentMatchesSettings", () => {
  it("requires declared fields when not anonymous", () => {
    expect(() => assertRespondentMatchesSettings(baseSettings, { firstName: "A" })).toThrow(BadRequestException);
    expect(() => assertRespondentMatchesSettings(baseSettings, { firstName: "A", city: "Cotonou" })).not.toThrow();
  });

  it("skips respondent check when anonymousResponses is true", () => {
    expect(() =>
      assertRespondentMatchesSettings({ ...baseSettings, anonymousResponses: true }, undefined)
    ).not.toThrow();
  });
});

describe("assertTestCanBePublished", () => {
  const baseInput = {
    test: { id: "t1", collectionId: "c1", slug: "s", title: "T", description: null, status: "draft", settings: {}, createdAt: new Date(), updatedAt: new Date() } as never,
    settings: baseSettings,
    questions: [],
    models: [{ id: "m1" } as never],
    collection: { id: "c1" } as never,
    responsesCount: 0
  };

  it("rejects when there is no question", () => {
    expect(() => assertTestCanBePublished(baseInput)).toThrow(BadRequestException);
  });

  it("rejects when there is no model", () => {
    expect(() => assertTestCanBePublished({ ...baseInput, questions: [{ id: "q1" } as never], models: [] })).toThrow(
      BadRequestException
    );
  });

  it("rejects when closesAt is in the past", () => {
    expect(() =>
      assertTestCanBePublished({
        ...baseInput,
        questions: [{ id: "q1" } as never],
        models: [{ id: "m1" } as never],
        settings: { ...baseSettings, closesAt: "2000-01-01T00:00:00.000Z" }
      })
    ).toThrow(BadRequestException);
  });

  it("rejects when maxResponses is below current responses", () => {
    expect(() =>
      assertTestCanBePublished({
        ...baseInput,
        questions: [{ id: "q1" } as never],
        models: [{ id: "m1" } as never],
        settings: { ...baseSettings, maxResponses: 2 },
        responsesCount: 5
      })
    ).toThrow(BadRequestException);
  });

  it("rejects when a question references a model that is not in the collection", () => {
    expect(() =>
      assertTestCanBePublished({
        ...baseInput,
        questions: [{ id: "q1", modelId: "m2" } as never],
        models: [{ id: "m1" } as never]
      })
    ).toThrow(BadRequestException);
  });

  it("accepts a healthy test", () => {
    expect(() =>
      assertTestCanBePublished({
        ...baseInput,
        questions: [{ id: "q1", modelId: null } as never],
        models: [{ id: "m1" } as never]
      })
    ).not.toThrow();
  });
});

describe("assertTestCanReceiveResponses", () => {
  const test = { status: "published" } as never;

  it("rejects unpublished tests", () => {
    expect(() => assertTestCanReceiveResponses({ status: "draft" } as never, baseSettings, 0)).toThrow(
      BadRequestException
    );
  });

  it("rejects tests past their closesAt", () => {
    expect(() =>
      assertTestCanReceiveResponses(test, { ...baseSettings, closesAt: "2000-01-01T00:00:00.000Z" }, 0)
    ).toThrow(BadRequestException);
  });

  it("rejects tests that reached maxResponses", () => {
    expect(() => assertTestCanReceiveResponses(test, { ...baseSettings, maxResponses: 3 }, 3)).toThrow(
      BadRequestException
    );
  });

  it("accepts an open, published test", () => {
    expect(() => assertTestCanReceiveResponses(test, baseSettings, 0)).not.toThrow();
  });
});
