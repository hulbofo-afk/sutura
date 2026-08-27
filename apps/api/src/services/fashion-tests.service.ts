import { BadRequestException, ConflictException, Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { buildMeta, type PaginatedResult } from "../common/pagination";
import {
  CreateFashionTestDto,
  CreateQuestionDto,
  TrackShareDto,
  UpdateFashionTestDto,
  UpdateQuestionDto
} from "../dto/fashion-test.dto";
import type { TestSummary } from "./collections.service";
import { CollectionsService } from "./collections.service";
import { findOwnedCollection, findOwnedQuestion, findOwnedTest } from "./ownership";
import { mapQuestion, mapSettings, settingsToJson } from "./mappers";
import { PrismaService } from "./prisma.service";
import { uniqueSlug } from "./slug";
import { assertTestCanBePublished, assertValidQuestionShape } from "./validators";
import type { FashionQuestion, FashionTestSettings, ShareChannel, ShareEvent } from "../types";

export interface ListTestsOptions {
  page: number;
  limit: number;
  sort: string;
  search?: string;
  status?: "draft" | "published" | "closed" | "archived";
  collectionId?: string;
}

@Injectable()
export class FashionTestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly collections: CollectionsService
  ) {}

  async list(
    creatorId: string,
    options: ListTestsOptions
  ): Promise<PaginatedResult<TestSummary>> {
    const where: Prisma.FashionTestWhereInput = { collection: { creatorId } };
    if (options.collectionId) {
      where.collectionId = options.collectionId;
    }
    if (options.search) {
      where.title = { contains: options.search, mode: "insensitive" };
    }
    if (options.status) {
      where.status = options.status;
    }
    const sortField = options.sort.startsWith("title") ? "title" : "createdAt";
    const sortDir = options.sort.endsWith("asc") ? "asc" : "desc";
    const orderBy: Prisma.FashionTestOrderByWithRelationInput = { [sortField]: sortDir };
    const skip = (options.page - 1) * options.limit;
    const [total, tests] = await this.prisma.$transaction([
      this.prisma.fashionTest.count({ where }),
      this.prisma.fashionTest.findMany({ where, orderBy, skip, take: options.limit })
    ]);
    const data = await Promise.all(tests.map((test) => this.collections.testSummary(creatorId, test)));
    return { data, meta: buildMeta(total, options.page, options.limit) };
  }

  async create(creatorId: string, collectionId: string, input: CreateFashionTestDto): Promise<TestSummary> {
    await findOwnedCollection(this.prisma, creatorId, collectionId);
    const existing = await this.prisma.fashionTest.findMany({ select: { slug: true } });
    const test = await this.prisma.fashionTest.create({
      data: {
        collectionId,
        slug: uniqueSlug(input.title, existing.map((item) => item.slug)),
        title: input.title,
        description: input.description,
        status: "draft",
        settings: settingsToJson(this.buildSettings(input.settings))
      }
    });
    return this.collections.testSummary(creatorId, test);
  }

  async get(creatorId: string, testId: string): Promise<TestSummary> {
    const test = await findOwnedTest(this.prisma, creatorId, testId);
    return this.collections.testSummary(creatorId, test);
  }

  async update(creatorId: string, testId: string, input: UpdateFashionTestDto): Promise<TestSummary> {
    const test = await findOwnedTest(this.prisma, creatorId, testId);
    this.assertDraft(test.status);
    await this.prisma.fashionTest.update({
      where: { id: testId },
      data: {
        title: input.title,
        description: input.description,
        settings: input.settings
          ? settingsToJson(this.buildSettings(input.settings, mapSettings(test.settings)))
          : undefined
      }
    });
    return this.collections.testSummary(creatorId, test);
  }

  async publish(creatorId: string, testId: string) {
    const test = await findOwnedTest(this.prisma, creatorId, testId);
    this.assertDraft(test.status);
    const [questions, models, responsesCount] = await Promise.all([
      this.prisma.question.findMany({ where: { testId } }),
      this.prisma.fashionModel.findMany({ where: { collectionId: test.collectionId } }),
      this.prisma.publicResponse.count({ where: { testId } })
    ]);
    const collection = await findOwnedCollection(this.prisma, creatorId, test.collectionId);
    assertTestCanBePublished({
      test,
      settings: mapSettings(test.settings),
      questions,
      models,
      collection,
      responsesCount
    });
    await this.prisma.fashionTest.update({ where: { id: testId }, data: { status: "published" } });
    return this.sharePayload(creatorId, testId);
  }

  async close(creatorId: string, testId: string): Promise<TestSummary> {
    const test = await findOwnedTest(this.prisma, creatorId, testId);
    if (test.status !== "published") throw new ConflictException("Only a published test can be closed");
    await this.prisma.fashionTest.update({ where: { id: testId }, data: { status: "closed" } });
    return this.collections.testSummary(creatorId, test);
  }

  async addQuestion(creatorId: string, testId: string, input: CreateQuestionDto): Promise<FashionQuestion> {
    const ownedTest = await findOwnedTest(this.prisma, creatorId, testId);
    this.assertDraft(ownedTest.status);
    if (input.modelId) {
      const test = await this.prisma.fashionTest.findUnique({ where: { id: testId }, select: { collectionId: true } });
      if (test) {
        await this.assertModelBelongsToCollection(creatorId, test.collectionId, input.modelId);
      }
    }
    const normalized = { ...input, options: input.options ?? [] };
    assertValidQuestionShape(normalized);
    const sortOrder = (await this.prisma.question.count({ where: { testId } })) + 1;
    const question = await this.prisma.question.create({
      data: {
        testId,
        text: normalized.text,
        type: normalized.type,
        required: normalized.required,
        options: normalized.options,
        min: normalized.min,
        max: normalized.max,
        helpText: normalized.helpText,
        modelId: normalized.modelId,
        sortOrder
      }
    });
    return mapQuestion(question);
  }

  async updateQuestion(
    creatorId: string,
    testId: string,
    questionId: string,
    input: UpdateQuestionDto
  ): Promise<FashionQuestion> {
    const question = await findOwnedQuestion(this.prisma, creatorId, testId, questionId);
    const ownedTest = await findOwnedTest(this.prisma, creatorId, testId);
    this.assertDraft(ownedTest.status);
    if (input.modelId) {
      const test = await this.prisma.fashionTest.findUnique({ where: { id: testId }, select: { collectionId: true } });
      if (test) {
        await this.assertModelBelongsToCollection(creatorId, test.collectionId, input.modelId);
      }
    }
    const nextQuestion = {
      type: input.type ?? (question.type as FashionQuestion["type"]),
      options: input.options ?? question.options,
      min: input.min ?? question.min ?? undefined,
      max: input.max ?? question.max ?? undefined
    };
    assertValidQuestionShape(nextQuestion);
    const updated = await this.prisma.question.update({
      where: { id: questionId },
      data: {
        text: input.text,
        type: input.type,
        required: input.required,
        options: input.options,
        min: input.min,
        max: input.max,
        helpText: input.helpText,
        modelId: input.modelId
      }
    });
    return mapQuestion(updated);
  }

  async deleteQuestion(
    creatorId: string,
    testId: string,
    questionId: string
  ): Promise<{ deleted: true; questionId: string }> {
    await findOwnedQuestion(this.prisma, creatorId, testId, questionId);
    const ownedTest = await findOwnedTest(this.prisma, creatorId, testId);
    this.assertDraft(ownedTest.status);
    await this.prisma.question.delete({ where: { id: questionId } });
    const remaining = await this.prisma.question.findMany({ where: { testId }, orderBy: { sortOrder: "asc" } });
    await this.reorderQuestions(creatorId, testId, remaining.map((question) => question.id));
    return { deleted: true, questionId };
  }

  async reorderQuestions(creatorId: string, testId: string, questionIds: string[]): Promise<FashionQuestion[]> {
    const ownedTest = await findOwnedTest(this.prisma, creatorId, testId);
    this.assertDraft(ownedTest.status);
    const current = await this.prisma.question.findMany({ where: { testId } });
    if (current.length !== questionIds.length || current.some((question) => !questionIds.includes(question.id))) {
      throw new BadRequestException("questionIds must contain every question for this test exactly once");
    }
    await this.prisma.$transaction(
      questionIds.map((id, index) =>
        this.prisma.question.update({ where: { id }, data: { sortOrder: index + 1 } })
      )
    );
    return this.listQuestions(creatorId, testId);
  }

  async listQuestions(creatorId: string, testId: string): Promise<FashionQuestion[]> {
    const questions = await this.prisma.question.findMany({
      where: { testId, test: { collection: { creatorId } } },
      orderBy: { sortOrder: "asc" }
    });
    return questions.map(mapQuestion);
  }

  async sharePayload(creatorId: string, testId: string) {
    const test = await findOwnedTest(this.prisma, creatorId, testId);
    const publicUrl = `/s/${test.slug}`;
    return {
      testId,
      slug: test.slug,
      publicUrl,
      qrPayload: publicUrl,
      channels: {
        whatsapp: `https://wa.me/?text=${encodeURIComponent(publicUrl)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}`,
        instagram: publicUrl,
        tiktok: publicUrl,
        copy_link: publicUrl
      }
    };
  }

  async trackShare(creatorId: string, testId: string, input: TrackShareDto) {
    await findOwnedTest(this.prisma, creatorId, testId);
    return this.prisma.shareEvent.create({ data: { testId, channel: input.channel } });
  }

  async listShares(creatorId: string, testId: string): Promise<ShareEvent[]> {
    const shares = await this.prisma.shareEvent.findMany({
      where: { testId, test: { collection: { creatorId } } },
      orderBy: { createdAt: "asc" }
    });
    return shares.map((share) => ({
      id: share.id,
      testId: share.testId,
      channel: share.channel as ShareChannel,
      createdAt: share.createdAt.toISOString()
    }));
  }

  private buildSettings(input?: Partial<FashionTestSettings>, base?: FashionTestSettings): FashionTestSettings {
    return {
      randomizeQuestions: input?.randomizeQuestions ?? base?.randomizeQuestions ?? false,
      requireAllQuestions: input?.requireAllQuestions ?? base?.requireAllQuestions ?? true,
      completionMessage: input?.completionMessage ?? base?.completionMessage ?? "Merci, ton avis aide le createur a produire juste.",
      closesAt: input?.closesAt ?? base?.closesAt,
      maxResponses: input?.maxResponses ?? base?.maxResponses,
      anonymousResponses: input?.anonymousResponses ?? base?.anonymousResponses ?? false,
      collectRespondentProfile:
        input?.collectRespondentProfile ??
        base?.collectRespondentProfile ?? ["firstName", "sex", "age", "city", "country", "whatsapp", "email", "profession"]
    };
  }

  private async assertModelBelongsToCollection(creatorId: string, collectionId: string, modelId: string) {
    const model = await this.prisma.fashionModel.findFirst({
      where: { id: modelId, collectionId, collection: { creatorId } }
    });
    if (!model) {
      throw new BadRequestException(`Model ${modelId} does not belong to this collection`);
    }
  }

  private assertDraft(status: string): void {
    if (status !== "draft") {
      throw new ConflictException("Published or closed tests are immutable");
    }
  }
}
