import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import bcrypt from "bcryptjs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/services/prisma.service";

describe("Sutura API", () => {
  let app: INestApplication;
  let creatorToken: string;
  let creatorId: string;
  let otherCreatorToken: string;
  let otherCreatorId: string;

  const temporaryCollections = { title: { startsWith: "Capsule" } };

  function fixturePhotoUrl(name: string): string {
    return `http://localhost:4000/api/uploads-local/get?key=${encodeURIComponent(`models/${creatorId}/${name}.png`)}`;
  }

  async function cleanupTemporary() {
    const prisma = app.get(PrismaService);
    await prisma.shareEvent.deleteMany({ where: { test: { collection: temporaryCollections } } });
    await prisma.publicResponse.deleteMany({ where: { test: { collection: temporaryCollections } } });
    await prisma.question.deleteMany({ where: { test: { collection: temporaryCollections } } });
    await prisma.fashionTest.deleteMany({ where: { collection: temporaryCollections } });
    await prisma.fashionModel.deleteMany({ where: { collection: temporaryCollections } });
    await prisma.collection.deleteMany({ where: temporaryCollections });
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true
      })
    );
    app.setGlobalPrefix("api");
    await app.init();

    await cleanupTemporary();

    const login = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "creator@sutura.app", password: "password123" })
      .expect(201);
    creatorToken = login.body.token;
    creatorId = login.body.user.id;
    const fixtureDir = join(process.cwd(), "uploads", "models", creatorId);
    await mkdir(fixtureDir, { recursive: true });
    await writeFile(join(fixtureDir, "app-e2e.png"), "local e2e fixture");

    const prisma = app.get(PrismaService);
    const otherEmail = `other-${Date.now()}@sutura.app`;
    const otherCreator = await prisma.user.create({
      data: {
        email: otherEmail,
        passwordHash: await bcrypt.hash("password123", 12),
        name: "Other Creator",
        brandName: "Other Studio",
        city: "Lome",
        country: "Togo"
      }
    });
    otherCreatorId = otherCreator.id;
    const otherLogin = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: otherEmail, password: "password123" })
      .expect(201);
    otherCreatorToken = otherLogin.body.token;
  });

  afterAll(async () => {
    const prisma = app.get(PrismaService);
    await cleanupTemporary();
    await prisma.user.deleteMany({ where: { id: otherCreatorId } });
    await app.close();
  });

  it("returns health status", async () => {
    const response = await request(app.getHttpServer()).get("/api/health").expect(200);
    expect(response.body.status).toBe("ok");

    const readiness = await request(app.getHttpServer()).get("/api/health/ready").expect(200);
    expect(readiness.body).toEqual({ status: "ok", db: "ok", migrations: "ok" });
  });

  it("rejects private creator routes without a bearer token", async () => {
    await request(app.getHttpServer()).get("/api/collections").expect(401);
  });

  it("returns paginated collections with search and sort", async () => {
    const stamp = Date.now();
    for (let i = 0; i < 3; i++) {
      await request(app.getHttpServer())
        .post("/api/collections")
        .set("Authorization", `Bearer ${creatorToken}`)
        .send({ title: `PaginationTest ${stamp} ${String(i).padStart(2, "0")}`, category: "Pret-a-porter" })
        .expect(201);
    }
    const res = await request(app.getHttpServer())
      .get("/api/collections")
      .query({ search: `PaginationTest ${stamp}`, page: 1, limit: 2, sort: "title:asc" })
      .set("Authorization", `Bearer ${creatorToken}`)
      .expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta).toMatchObject({ page: 1, limit: 2 });
    expect(res.body.meta.total).toBe(3);
    expect(res.body.meta.hasMore).toBe(true);
    expect(res.body.data[0].title).toBe(`PaginationTest ${stamp} 00`);
    expect(res.body.data[1].title).toBe(`PaginationTest ${stamp} 01`);
  });

  it("supports the creator collection and model workflow", async () => {
    const collection = await request(app.getHttpServer())
      .post("/api/collections")
      .set("Authorization", `Bearer ${creatorToken}`)
      .send({
        title: "Capsule Test",
        category: "Pret-a-porter",
        targetAudience: "Femmes urbaines"
      })
      .expect(201);

    const model = await request(app.getHttpServer())
      .post(`/api/collections/${collection.body.id}/models`)
      .set("Authorization", `Bearer ${creatorToken}`)
      .send({
        name: "Robe Beta",
        photoUrls: [fixturePhotoUrl("app-e2e")],
        colors: ["#E91E63"],
        desiredPrice: 35000
      })
      .expect(201);

    expect(model.body).toMatchObject({ name: "Robe Beta", sortOrder: 1 });
  });

  it("supports Fashion Test creation, questions, publication and sharing", async () => {
    const collection = await request(app.getHttpServer())
      .post("/api/collections")
      .set("Authorization", `Bearer ${creatorToken}`)
      .send({ title: "Capsule Publication" })
      .expect(201);

    const model = await request(app.getHttpServer())
      .post(`/api/collections/${collection.body.id}/models`)
      .set("Authorization", `Bearer ${creatorToken}`)
      .send({
        name: "Veste Publish",
        photoUrls: [fixturePhotoUrl("app-e2e")],
        colors: ["#E91E63"]
      })
      .expect(201);

    const test = await request(app.getHttpServer())
      .post(`/api/collections/${collection.body.id}/fashion-tests`)
      .set("Authorization", `Bearer ${creatorToken}`)
      .send({
        title: "Test public capsule",
        settings: {
          anonymousResponses: false,
          requireAllQuestions: true,
          completionMessage: "Merci pour ton avis."
        }
      })
      .expect(201);

    const question = await request(app.getHttpServer())
      .post(`/api/fashion-tests/${test.body.id}/questions`)
      .set("Authorization", `Bearer ${creatorToken}`)
      .send({
        text: "Quelle piece porterais-tu ?",
        type: "single_choice",
        required: true,
        options: ["Veste Publish", "Robe Beta"],
        modelId: model.body.id
      })
      .expect(201);

    const share = await request(app.getHttpServer())
      .post(`/api/fashion-tests/${test.body.id}/publish`)
      .set("Authorization", `Bearer ${creatorToken}`)
      .expect(201);

    expect(share.body.publicUrl).toBe("/s/test-public-capsule");

    await request(app.getHttpServer())
      .post(`/api/fashion-tests/${test.body.id}/share-events`)
      .set("Authorization", `Bearer ${creatorToken}`)
      .send({ channel: "whatsapp" })
      .expect(201);

    expect(question.body.modelId).toBe(model.body.id);
  });

  it("blocks publication when no model is attached to the collection", async () => {
    const collection = await request(app.getHttpServer())
      .post("/api/collections")
      .set("Authorization", `Bearer ${creatorToken}`)
      .send({ title: "Capsule NoModel" })
      .expect(201);

    const test = await request(app.getHttpServer())
      .post(`/api/collections/${collection.body.id}/fashion-tests`)
      .set("Authorization", `Bearer ${creatorToken}`)
      .send({ title: "Sans modele" })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/fashion-tests/${test.body.id}/questions`)
      .set("Authorization", `Bearer ${creatorToken}`)
      .send({ text: "Choisis", type: "yes_no", required: true })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post(`/api/fashion-tests/${test.body.id}/publish`)
      .set("Authorization", `Bearer ${creatorToken}`)
      .expect(400);
    expect(response.body.message).toMatch(/at least one model/);
  });

  it("blocks publication when a question references a model from another collection", async () => {
    const collectionA = await request(app.getHttpServer())
      .post("/api/collections")
      .set("Authorization", `Bearer ${creatorToken}`)
      .send({ title: "Capsule Owner A" })
      .expect(201);

    const collectionB = await request(app.getHttpServer())
      .post("/api/collections")
      .set("Authorization", `Bearer ${creatorToken}`)
      .send({ title: "Capsule Owner B" })
      .expect(201);

    const modelB = await request(app.getHttpServer())
      .post(`/api/collections/${collectionB.body.id}/models`)
      .set("Authorization", `Bearer ${creatorToken}`)
      .send({ name: "Model B", photoUrls: [fixturePhotoUrl("app-e2e")], colors: ["#000"] })
      .expect(201);

    const testA = await request(app.getHttpServer())
      .post(`/api/collections/${collectionA.body.id}/fashion-tests`)
      .set("Authorization", `Bearer ${creatorToken}`)
      .send({ title: "Test cross collection" })
      .expect(201);

    const question = await request(app.getHttpServer())
      .post(`/api/fashion-tests/${testA.body.id}/questions`)
      .set("Authorization", `Bearer ${creatorToken}`)
      .send({
        text: "Lie au modele B",
        type: "single_choice",
        required: true,
        options: ["A", "B"],
        modelId: modelB.body.id
      });
    expect(question.status).toBe(400);
    expect(question.body.message).toMatch(/does not belong/);
  });

  it("rejects single_choice answers that do not match an option", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/public-tests/rose-cotonou/responses")
      .send({
        respondent: { firstName: "Testeur", city: "Cotonou", email: "test@sutura.app" },
        answers: {
          q_choice: "Option inconnue",
          q_price: 45000,
          q_rating: 5,
          q_comment: "RAS"
        },
        startedAt: "2026-07-23T12:00:00.000Z",
        completedAt: "2026-07-23T12:02:00.000Z"
      })
      .expect(400);
    expect(response.body.message).toMatch(/must be one of the declared options/);
  });

  it("rejects scale answers that exceed the question max", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/public-tests/rose-cotonou/responses")
      .send({
        respondent: { firstName: "Testeur", city: "Cotonou", email: "test@sutura.app" },
        answers: {
          q_choice: "Veste Sika",
          q_price: 45000,
          q_rating: 9,
          q_comment: "Trop"
        },
        startedAt: "2026-07-23T12:00:00.000Z",
        completedAt: "2026-07-23T12:02:00.000Z"
      })
      .expect(400);
    expect(response.body.message).toMatch(/must be <= 5/);
  });

  it("rejects answers that reference an unknown question", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/public-tests/rose-cotonou/responses")
      .send({
        respondent: { firstName: "Testeur", city: "Cotonou", email: "test@sutura.app" },
        answers: {
          q_choice: "Veste Sika",
          q_price: 45000,
          q_rating: 5,
          q_comment: "RAS",
          q_unknown: "x"
        },
        startedAt: "2026-07-23T12:00:00.000Z",
        completedAt: "2026-07-23T12:02:00.000Z"
      })
      .expect(400);
    expect(response.body.message).toMatch(/unknown question/);
  });

  it("submits a public fashion test response and returns analytics", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/public-tests/rose-cotonou/responses")
      .send({
        respondent: { firstName: "Testeur", city: "Cotonou", email: "test@sutura.app" },
        answers: {
          q_choice: "Veste Sika",
          q_price: 45000,
          q_rating: 5,
          q_comment: "La coupe est forte."
        },
        startedAt: "2026-07-23T12:00:00.000Z",
        completedAt: "2026-07-23T12:02:00.000Z"
      })
      .expect(201);

    expect(response.body.answersCount).toBe(4);
    expect(response.body.message).toContain("Merci");

    const analytics = await request(app.getHttpServer())
      .get("/api/analytics/test_rose")
      .set("Authorization", `Bearer ${creatorToken}`)
      .expect(200);
    expect(analytics.body.desirabilityScore).toBeGreaterThan(0);
    expect(analytics.body.questionBreakdown.length).toBeGreaterThan(0);
    expect(analytics.body.demographics.cities).toBeDefined();

    const responses = await request(app.getHttpServer())
      .get("/api/analytics/test_rose/responses")
      .query({ page: 1, limit: 1, sort: "createdAt:desc" })
      .set("Authorization", `Bearer ${creatorToken}`)
      .expect(200);
    expect(responses.body.data).toHaveLength(1);
    expect(responses.body.meta).toMatchObject({ page: 1, limit: 1 });
    expect(responses.body.meta.total).toBeGreaterThanOrEqual(1);

    await request(app.getHttpServer())
      .get("/api/analytics/test_rose/responses")
      .set("Authorization", `Bearer ${otherCreatorToken}`)
      .expect(404);
  });

  it("exports a PDF report", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/reports/fashion-tests/test_rose.pdf")
      .set("Authorization", `Bearer ${creatorToken}`)
      .expect(200);
    expect(response.headers["content-type"]).toContain("application/pdf");
    expect(response.headers["content-disposition"]).toContain('attachment; filename="sutura-rose-cotonou.pdf"');
    expect(response.body).toBeInstanceOf(Buffer);
    expect(response.body.length).toBeGreaterThan(1000);
    expect(response.body.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("isolates data between two creators", async () => {
    const collection = await request(app.getHttpServer())
      .post("/api/collections")
      .set("Authorization", `Bearer ${creatorToken}`)
      .send({ title: "Capsule Isolation" })
      .expect(201);

    const model = await request(app.getHttpServer())
      .post(`/api/collections/${collection.body.id}/models`)
      .set("Authorization", `Bearer ${creatorToken}`)
      .send({ name: "Solo", photoUrls: [fixturePhotoUrl("app-e2e")], colors: ["#fff"] })
      .expect(201);

    const test = await request(app.getHttpServer())
      .post(`/api/collections/${collection.body.id}/fashion-tests`)
      .set("Authorization", `Bearer ${creatorToken}`)
      .send({ title: "Isolation test" })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/api/fashion-tests/${test.body.id}`)
      .set("Authorization", `Bearer ${otherCreatorToken}`)
      .expect(404);

    await request(app.getHttpServer())
      .get(`/api/collections/${collection.body.id}`)
      .set("Authorization", `Bearer ${otherCreatorToken}`)
      .expect(404);

    await request(app.getHttpServer())
      .get(`/api/collections/${collection.body.id}/models`)
      .set("Authorization", `Bearer ${otherCreatorToken}`)
      .expect(404);

    await request(app.getHttpServer())
      .patch(`/api/collections/${collection.body.id}/models/${model.body.id}`)
      .set("Authorization", `Bearer ${otherCreatorToken}`)
      .send({ name: "Powned" })
      .expect(404);
  });
});
