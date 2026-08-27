import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { buildMeta, type PaginatedResult } from "../common/pagination";
import { CreateCollectionDto, UpdateCollectionDto } from "../dto/collection.dto";
import { findOwnedCollection } from "./ownership";
import { mapCollection, mapModel, mapQuestion, mapTest } from "./mappers";
import { PrismaService } from "./prisma.service";
import type { FashionTest as PrismaFashionTest } from "@prisma/client";
import type { Collection, FashionModel, FashionQuestion, FashionTest } from "../types";

export interface CollectionSummary extends Collection {
  modelsCount: number;
  testsCount: number;
  responsesCount: number;
}

export interface TestSummary extends FashionTest {
  modelsCount: number;
  questions: FashionQuestion[];
  responsesCount: number;
  publicUrl: string | null;
}

export interface ListCollectionsOptions {
  page: number;
  limit: number;
  sort: string;
  search?: string;
  status?: "draft" | "published" | "closed" | "archived";
}

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    creatorId: string,
    options: ListCollectionsOptions
  ): Promise<PaginatedResult<CollectionSummary>> {
    const where: Prisma.CollectionWhereInput = { creatorId };
    if (options.search) {
      where.title = { contains: options.search, mode: "insensitive" };
    }
    if (options.status) {
      where.status = options.status;
    }
    const orderBy: Prisma.CollectionOrderByWithRelationInput =
      options.sort === "title:asc" || options.sort === "title:desc"
        ? { title: options.sort.endsWith("asc") ? "asc" : "desc" }
        : { createdAt: options.sort.endsWith("asc") ? "asc" : "desc" };
    const skip = (options.page - 1) * options.limit;
    const [total, collections] = await this.prisma.$transaction([
      this.prisma.collection.count({ where }),
      this.prisma.collection.findMany({ where, orderBy, skip, take: options.limit })
    ]);
    const data = await Promise.all(collections.map((c) => this.summary(creatorId, c.id)));
    return { data, meta: buildMeta(total, options.page, options.limit) };
  }

  async create(creatorId: string, input: CreateCollectionDto): Promise<CollectionSummary> {
    const collection = await this.prisma.collection.create({
      data: {
        creatorId,
        title: input.title,
        description: input.description,
        season: input.season,
        category: input.category,
        targetAudience: input.targetAudience,
        launchDate: input.launchDate ? new Date(input.launchDate) : undefined,
        status: "draft"
      }
    });
    return this.summary(creatorId, collection.id);
  }

  async update(creatorId: string, id: string, input: UpdateCollectionDto): Promise<CollectionSummary> {
    await findOwnedCollection(this.prisma, creatorId, id);
    await this.prisma.collection.update({
      where: { id },
      data: {
        title: input.title,
        description: input.description,
        season: input.season,
        category: input.category,
        targetAudience: input.targetAudience,
        launchDate: input.launchDate ? new Date(input.launchDate) : undefined
      }
    });
    return this.summary(creatorId, id);
  }

  async archive(creatorId: string, id: string): Promise<CollectionSummary> {
    await findOwnedCollection(this.prisma, creatorId, id);
    await this.prisma.$transaction([
      this.prisma.fashionTest.updateMany({
        where: { collectionId: id, status: { not: "archived" } },
        data: { status: "archived" }
      }),
      this.prisma.collection.update({ where: { id }, data: { status: "archived" } })
    ]);
    return this.summary(creatorId, id);
  }

  async getWithChildren(
    creatorId: string,
    id: string
  ): Promise<{
    collection: CollectionSummary;
    models: FashionModel[];
    tests: TestSummary[];
  }> {
    await findOwnedCollection(this.prisma, creatorId, id);
    const tests = await this.prisma.fashionTest.findMany({
      where: { collectionId: id },
      orderBy: { createdAt: "desc" }
    });
    return {
      collection: await this.summary(creatorId, id),
      models: await this.listModels(creatorId, id),
      tests: await Promise.all(tests.map((test) => this.testSummary(creatorId, test)))
    };
  }

  async summary(creatorId: string, id: string): Promise<CollectionSummary> {
    const collection = mapCollection(await findOwnedCollection(this.prisma, creatorId, id));
    const [modelsCount, tests, responsesCount] = await Promise.all([
      this.prisma.fashionModel.count({ where: { collectionId: id } }),
      this.prisma.fashionTest.findMany({ where: { collectionId: id }, select: { id: true } }),
      this.prisma.publicResponse.count({ where: { test: { collectionId: id } } })
    ]);
    return { ...collection, modelsCount, testsCount: tests.length, responsesCount };
  }

  async listModels(creatorId: string, collectionId: string): Promise<FashionModel[]> {
    await findOwnedCollection(this.prisma, creatorId, collectionId);
    const models = await this.prisma.fashionModel.findMany({
      where: { collectionId },
      orderBy: { sortOrder: "asc" }
    });
    return models.map(mapModel);
  }

  async testSummary(creatorId: string, test: PrismaFashionTest): Promise<TestSummary> {
    await findOwnedCollection(this.prisma, creatorId, test.collectionId);
    const [questions, modelsCount, responsesCount] = await Promise.all([
      this.prisma.question.findMany({ where: { testId: test.id }, orderBy: { sortOrder: "asc" } }),
      this.prisma.fashionModel.count({ where: { collectionId: test.collectionId } }),
      this.prisma.publicResponse.count({ where: { testId: test.id } })
    ]);
    return {
      ...mapTest(test),
      modelsCount,
      questions: questions.map(mapQuestion),
      responsesCount,
      publicUrl: test.status === "published" ? `/s/${test.slug}` : null
    };
  }

  async countResponses(creatorId: string, collectionId: string): Promise<number> {
    await findOwnedCollection(this.prisma, creatorId, collectionId);
    return this.prisma.publicResponse.count({ where: { test: { collectionId } } });
  }
}
