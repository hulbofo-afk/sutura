import { NotFoundException } from "@nestjs/common";
import type { PrismaService } from "./prisma.service";
import type { Collection, FashionModel, FashionTest, Question } from "@prisma/client";

export async function findOwnedCollection(prisma: PrismaService, creatorId: string, id: string): Promise<Collection> {
  const collection = await prisma.collection.findFirst({ where: { id, creatorId } });
  if (!collection) throw new NotFoundException("Collection not found");
  return collection;
}

export async function findOwnedTest(prisma: PrismaService, creatorId: string, id: string): Promise<FashionTest> {
  const test = await prisma.fashionTest.findFirst({ where: { id, collection: { creatorId } } });
  if (!test) throw new NotFoundException("Fashion test not found");
  return test;
}

export async function findOwnedModel(
  prisma: PrismaService,
  creatorId: string,
  collectionId: string,
  modelId: string
): Promise<FashionModel> {
  const model = await prisma.fashionModel.findFirst({
    where: { id: modelId, collectionId, collection: { creatorId } }
  });
  if (!model) throw new NotFoundException("Fashion model not found");
  return model;
}

export async function findOwnedQuestion(
  prisma: PrismaService,
  creatorId: string,
  testId: string,
  questionId: string
): Promise<Question> {
  const question = await prisma.question.findFirst({
    where: { id: questionId, testId, test: { collection: { creatorId } } }
  });
  if (!question) throw new NotFoundException("Question not found");
  return question;
}
