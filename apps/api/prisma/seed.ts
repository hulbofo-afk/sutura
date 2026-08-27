import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { collections, creator, models, questions, responses, tests } from "./seed-data";

const connectionString = process.env.DATABASE_URL ?? "postgresql://sutura:sutura@localhost:55432/sutura";
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString })
});

async function main() {
  await prisma.shareEvent.deleteMany();
  await prisma.publicResponse.deleteMany();
  await prisma.question.deleteMany();
  await prisma.fashionTest.deleteMany();
  await prisma.fashionModel.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: {
      id: creator.id,
      email: creator.email,
      passwordHash: await bcrypt.hash("password123", 12),
      name: creator.name,
      brandName: creator.brandName,
      city: creator.city,
      country: creator.country
    }
  });

  for (const collection of collections) {
    await prisma.collection.create({
      data: {
        id: collection.id,
        creatorId: collection.creatorId,
        title: collection.title,
        description: collection.description,
        season: collection.season,
        category: collection.category,
        targetAudience: collection.targetAudience,
        launchDate: collection.launchDate ? new Date(collection.launchDate) : undefined,
        status: collection.status,
        createdAt: new Date(collection.createdAt),
        updatedAt: new Date(collection.updatedAt)
      }
    });
  }

  for (const model of models) {
    await prisma.fashionModel.create({
      data: {
        id: model.id,
        collectionId: model.collectionId,
        name: model.name,
        description: model.description,
        photoUrls: model.photoUrls,
        sketchUrl: model.sketchUrl,
        videoUrl: model.videoUrl,
        colors: model.colors,
        desiredPrice: model.desiredPrice,
        sortOrder: model.sortOrder
      }
    });
  }

  for (const test of tests) {
    await prisma.fashionTest.create({
      data: {
        id: test.id,
        collectionId: test.collectionId,
        slug: test.slug,
        title: test.title,
        description: test.description,
        status: test.status,
        settings: test.settings,
        createdAt: new Date(test.createdAt),
        updatedAt: new Date(test.updatedAt)
      }
    });
  }

  for (const question of questions) {
    await prisma.question.create({
      data: {
        id: question.id,
        testId: question.testId,
        text: question.text,
        type: question.type,
        required: question.required,
        options: question.options,
        min: question.min,
        max: question.max,
        helpText: question.helpText,
        modelId: question.modelId,
        sortOrder: question.sortOrder
      }
    });
  }

  for (const response of responses) {
    await prisma.publicResponse.create({
      data: {
        id: response.id,
        testId: response.testId,
        respondent: response.respondent ?? undefined,
        answers: response.answers,
        startedAt: new Date(response.startedAt),
        completedAt: new Date(response.completedAt),
        createdAt: new Date(response.createdAt)
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
