import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, type FashionTest as PrismaFashionTest } from "@prisma/client";
import { SubmitPublicResponseDto } from "../dto/public-response.dto";
import { mapCollection, mapModel, mapQuestion, mapSettings } from "./mappers";
import { PrismaService } from "./prisma.service";
import { shuffle } from "./shuffle";
import {
  assertRespondentMatchesSettings,
  assertTestCanReceiveResponses,
  assertValidAnswer
} from "./validators";
import type { Collection, FashionQuestion, FashionTestSettings } from "../types";

const DEFAULT_COMPLETION_MESSAGE = "Merci, ton avis aide le createur a produire juste.";

@Injectable()
export class PublicResponsesService {
  constructor(private readonly prisma: PrismaService) {}

  async getBySlug(slug: string) {
    const test = await this.prisma.fashionTest.findUnique({ where: { slug } });
    if (!test) throw new NotFoundException("Fashion test not found");
    await this.assertTestAcceptsResponses(test);

    const [collection, models, questions] = await Promise.all([
      this.publicCollectionSummary(test.collectionId),
      this.prisma.fashionModel.findMany({
        where: { collectionId: test.collectionId },
        orderBy: { sortOrder: "asc" }
      }),
      this.prisma.question.findMany({ where: { testId: test.id }, orderBy: { sortOrder: "asc" } })
    ]);

    const settings = mapSettings(test.settings);
    const mappedQuestions = questions.map(mapQuestion);
    return {
      slug: test.slug,
      title: test.title,
      description: test.description ?? undefined,
      settings,
      collection: {
        title: collection.title,
        description: collection.description,
        season: collection.season,
        category: collection.category,
        targetAudience: collection.targetAudience
      },
      models: models.map((model) => {
        const mapped = mapModel(model);
        return {
          id: mapped.id,
          name: mapped.name,
          description: mapped.description,
          photoUrls: mapped.photoUrls,
          sketchUrl: mapped.sketchUrl,
          videoUrl: mapped.videoUrl,
          colors: mapped.colors,
          desiredPrice: mapped.desiredPrice,
          sortOrder: mapped.sortOrder
        };
      }),
      questions: (settings.randomizeQuestions ? shuffle(mappedQuestions) : mappedQuestions).map((question) => ({
        id: question.id,
        text: question.text,
        type: question.type,
        required: question.required,
        options: question.options,
        min: question.min,
        max: question.max,
        sortOrder: question.sortOrder,
        helpText: question.helpText,
        modelId: question.modelId
      }))
    };
  }

  async submit(slug: string, input: SubmitPublicResponseDto) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          const test = await tx.fashionTest.findUnique({ where: { slug } });
          if (!test) throw new NotFoundException("Fashion test not found");
          const settings = mapSettings(test.settings);
          if (input.idempotencyKey) {
            const existing = await tx.publicResponse.findUnique({
              where: { testId_idempotencyKey: { testId: test.id, idempotencyKey: input.idempotencyKey } }
            });
            if (existing) return this.submissionResult(existing.id, settings, input);
          }
          const responsesCount = await tx.publicResponse.count({ where: { testId: test.id } });
          assertTestCanReceiveResponses(test, settings, responsesCount);
          const questions = (
            await tx.question.findMany({ where: { testId: test.id }, orderBy: { sortOrder: "asc" } })
          ).map(mapQuestion);
          this.assertResponseValid(questions, settings, input);
          const response = await tx.publicResponse.create({
            data: {
              testId: test.id,
              idempotencyKey: input.idempotencyKey,
              respondent: settings.anonymousResponses
                ? undefined
                : (input.respondent as Prisma.InputJsonValue | undefined),
              answers: input.answers as Prisma.InputJsonValue,
              startedAt: new Date(input.startedAt),
              completedAt: new Date(input.completedAt)
            }
          });
          return this.submissionResult(response.id, settings, input);
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      } catch (error) {
        const code = (error as { code?: string }).code;
        if ((code === "P2034" || code === "P2002") && attempt < 2) continue;
        throw error;
      }
    }
    throw new BadRequestException("Response could not be submitted safely; please retry");
  }

  private async assertTestAcceptsResponses(test: { id: string; status: string; settings: Prisma.JsonValue }) {
    const settings = mapSettings(test.settings);
    const responsesCount = await this.prisma.publicResponse.count({ where: { testId: test.id } });
    assertTestCanReceiveResponses(test as unknown as PrismaFashionTest, settings, responsesCount);
  }

  private assertResponseValid(
    questions: FashionQuestion[],
    settings: FashionTestSettings,
    input: SubmitPublicResponseDto
  ) {
    if (new Date(input.completedAt).getTime() < new Date(input.startedAt).getTime()) {
      throw new BadRequestException("completedAt must be after startedAt");
    }
    const now = Date.now();
    const startedAt = new Date(input.startedAt).getTime();
    const completedAt = new Date(input.completedAt).getTime();
    if (startedAt > now + 5 * 60_000 || completedAt > now + 5 * 60_000) {
      throw new BadRequestException("Response timestamps cannot be in the future");
    }
    if (completedAt - startedAt > 24 * 60 * 60_000) {
      throw new BadRequestException("Response duration cannot exceed 24 hours");
    }
    assertRespondentMatchesSettings(settings, input.respondent);

    const required = questions.filter((question) => question.required || settings.requireAllQuestions);
    const missing = required.filter((question) => input.answers[question.id] === undefined);
    if (missing.length > 0) {
      throw new BadRequestException(
        `Missing required answers: ${missing.map((question) => question.id).join(", ")}`
      );
    }

    const known = new Set(questions.map((question) => question.id));
    for (const questionId of Object.keys(input.answers)) {
      if (!known.has(questionId)) {
        throw new BadRequestException(`Answer for unknown question: ${questionId}`);
      }
    }

    for (const question of questions) {
      const value = input.answers[question.id];
      if (value === undefined) continue;
      assertValidAnswer(question, value);
    }
  }

  private submissionResult(responseId: string, settings: FashionTestSettings, input: SubmitPublicResponseDto) {
    return {
      responseId,
      message: settings.completionMessage || DEFAULT_COMPLETION_MESSAGE,
      answersCount: Object.keys(input.answers).length
    };
  }

  private async publicCollectionSummary(collectionId: string): Promise<
    Collection & { modelsCount: number; testsCount: number; responsesCount: number }
  > {
    const collection = await this.prisma.collection.findUnique({ where: { id: collectionId } });
    if (!collection) throw new NotFoundException("Collection not found");
    const [modelsCount, tests, responsesCount] = await Promise.all([
      this.prisma.fashionModel.count({ where: { collectionId } }),
      this.prisma.fashionTest.findMany({ where: { collectionId }, select: { id: true } }),
      this.prisma.publicResponse.count({ where: { test: { collectionId } } })
    ]);
    return { ...mapCollection(collection), modelsCount, testsCount: tests.length, responsesCount };
  }
}
