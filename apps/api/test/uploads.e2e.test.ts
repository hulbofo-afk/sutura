import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import * as fs from "node:fs";
import * as path from "node:path";
import bcrypt from "bcryptjs";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/services/prisma.service";
import { LocalStorageService } from "../src/uploads/local-storage.service";
import { StorageService } from "../src/uploads/storage.service";

describe("Uploads API (e2e + local storage)", () => {
  let app: INestApplication;
  let creatorToken: string;
  let creatorId: string;
  let otherToken: string;
  let otherCreatorId: string;

  const tempCollections = { title: { startsWith: "CapsuleUpload" } };

  async function cleanupTemporary() {
    const prisma = app.get(PrismaService);
    await prisma.shareEvent.deleteMany({ where: { test: { collection: tempCollections } } });
    await prisma.publicResponse.deleteMany({ where: { test: { collection: tempCollections } } });
    await prisma.question.deleteMany({ where: { test: { collection: tempCollections } } });
    await prisma.fashionTest.deleteMany({ where: { collection: tempCollections } });
    await prisma.fashionModel.deleteMany({ where: { collection: tempCollections } });
    await prisma.collection.deleteMany({ where: tempCollections });
  }

  async function cleanupOtherCreator() {
    if (!otherCreatorId) return;
    const prisma = app.get(PrismaService);
    const cols = await prisma.collection.findMany({ where: { creatorId: otherCreatorId }, select: { id: true } });
    const colIds = cols.map((c) => c.id);
    if (colIds.length > 0) {
      await prisma.shareEvent.deleteMany({ where: { test: { collectionId: { in: colIds } } } });
      await prisma.publicResponse.deleteMany({ where: { test: { collectionId: { in: colIds } } } });
      await prisma.question.deleteMany({ where: { test: { collectionId: { in: colIds } } } });
      await prisma.fashionTest.deleteMany({ where: { collectionId: { in: colIds } } });
      await prisma.fashionModel.deleteMany({ where: { collectionId: { in: colIds } } });
      await prisma.collection.deleteMany({ where: { creatorId: otherCreatorId } });
    }
    await prisma.user.deleteMany({ where: { id: otherCreatorId } });
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    app.setGlobalPrefix("api");
    await app.init();

    await cleanupTemporary();
    await cleanupOtherCreator();

    const login = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "creator@sutura.app", password: "password123" })
      .expect(201);
    creatorToken = login.body.token;
    creatorId = login.body.user.id;

    const prisma = app.get(PrismaService);
    const otherEmail = `other-upload-${Date.now()}@sutura.app`;
    const other = await prisma.user.create({
      data: {
        email: otherEmail,
        passwordHash: await bcrypt.hash("password123", 12),
        name: "Other",
        brandName: "Other Studio"
      }
    });
    otherCreatorId = other.id;
    const otherLogin = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: otherEmail, password: "password123" })
      .expect(201);
    otherToken = otherLogin.body.token;
  });

  afterAll(async () => {
    await cleanupTemporary();
    await cleanupOtherCreator();
    await app.close();
  });

  it("rejects unauthenticated sign request", async () => {
    await request(app.getHttpServer())
      .post("/api/uploads/sign")
      .send({ kind: "photo", contentType: "image/jpeg", contentLength: 1000 })
      .expect(401);
  });

  it("rejects sign with bad contentType for the kind", async () => {
    await request(app.getHttpServer())
      .post("/api/uploads/sign")
      .set("Authorization", `Bearer ${creatorToken}`)
      .send({ kind: "photo", contentType: "video/mp4", contentLength: 1000 })
      .expect(400);
  });

  it("rejects sign with size over the kind limit", async () => {
    await request(app.getHttpServer())
      .post("/api/uploads/sign")
      .set("Authorization", `Bearer ${creatorToken}`)
      .send({ kind: "photo", contentType: "image/jpeg", contentLength: 11 * 1024 * 1024 })
      .expect(400);
  });

  it("signs a photo upload and returns a usable local presigned URL", async () => {
    const contentLength = 1024;
    const res = await request(app.getHttpServer())
      .post("/api/uploads/sign")
      .set("Authorization", `Bearer ${creatorToken}`)
      .send({ kind: "photo", contentType: "image/jpeg", contentLength })
      .expect(201);

    expect(res.body).toMatchObject({
      method: "PUT",
      headers: { "Content-Type": "image/jpeg", "Content-Length": String(contentLength) }
    });
    expect(res.body.key).toMatch(new RegExp(`^models/${creatorId}/[a-f0-9-]+\\.jpg$`));
    expect(res.body.uploadUrl).toMatch(/^http:\/\/[^/]+\/api\/uploads-local\/upload/);
    expect(res.body.publicUrl).toMatch(/^http:\/\/[^/]+\/api\/uploads-local\/get/);
  });

  it("does a full sign → PUT → confirm flow on local storage", async () => {
    const payload = Buffer.from("hello world from sutura");
    const sign = await request(app.getHttpServer())
      .post("/api/uploads/sign")
      .set("Authorization", `Bearer ${creatorToken}`)
      .send({ kind: "sketch", contentType: "image/png", contentLength: payload.length })
      .expect(201);

    const { key, uploadUrl } = sign.body;
    const token = new URL(uploadUrl).searchParams.get("token") ?? "";

    const uploadUrlObj = new URL(uploadUrl);
    const putRes = await request(app.getHttpServer())
      .put(uploadUrlObj.pathname)
      .query(Object.fromEntries(uploadUrlObj.searchParams))
      .set("Content-Type", "image/png")
      .set("Content-Length", String(payload.length))
      .send(payload)
      .expect(200);
    expect(putRes.body.ok).toBe(true);
    expect(putRes.body.key).toBe(key);

    const storage = app.get(LocalStorageService);
    const filePath = path.join(storage.getUploadsDir(), key);
    const onDisk = fs.readFileSync(filePath);
    expect(onDisk.equals(payload)).toBe(true);

    const confirm = await request(app.getHttpServer())
      .post("/api/uploads/confirm")
      .set("Authorization", `Bearer ${creatorToken}`)
      .send({ key })
      .expect(200);
    expect(confirm.body.exists).toBe(true);
    expect(confirm.body.size).toBe(payload.length);
    expect(confirm.body.contentType).toBeUndefined();
    expect(confirm.body.key).toBe(key);

    const getRes = await request(app.getHttpServer())
      .get(`/api/uploads-local/get`)
      .query({ key })
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => callback(null, Buffer.concat(chunks)));
      })
      .expect(200);
    expect(getRes.body.equals(payload)).toBe(true);

    fs.unlinkSync(filePath);
  });

  it("rejects PUT with bad token", async () => {
    const sign = await request(app.getHttpServer())
      .post("/api/uploads/sign")
      .set("Authorization", `Bearer ${creatorToken}`)
      .send({ kind: "photo", contentType: "image/jpeg", contentLength: 10 })
      .expect(201);

    const { uploadUrl } = sign.body;
    const uploadUrlObj = new URL(uploadUrl);
    await request(app.getHttpServer())
      .put(uploadUrlObj.pathname)
      .query({ ...Object.fromEntries(uploadUrlObj.searchParams), token: "forged-token" })
      .set("Content-Type", "image/jpeg")
      .send("x")
      .expect(403);
  });

  it("rejects confirm for a key that doesn't belong to the creator", async () => {
    await request(app.getHttpServer())
      .post("/api/uploads/confirm")
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ key: `models/${creatorId}/somefile.jpg` })
      .expect(403);
  });

  it("rejects delete for a key that doesn't belong to the creator", async () => {
    await request(app.getHttpServer())
      .delete("/api/uploads")
      .set("Authorization", `Bearer ${otherToken}`)
      .query({ key: `models/${creatorId}/somefile.jpg` })
      .expect(403);
  });

  it("StorageService token round-trip rejects wrong content-type", async () => {
    const storage = app.get(StorageService);
    if (storage instanceof LocalStorageService) {
      const realKey = `models/${creatorId}/tokentest.png`;
      const fakeKey = `models/${otherCreatorId}/tokentest.png`;
      const payload = Buffer.from("data");
      const sign = await storage.signUpload({
        key: realKey,
        contentType: "image/png",
        contentLength: payload.length,
        expiresIn: 60
      });
      const token = new URL(sign.uploadUrl).searchParams.get("token") ?? "";
      expect(storage.verifyToken(token, realKey, "image/png", payload.length)).toBe(true);
      expect(storage.verifyToken(token, realKey, "image/jpeg", payload.length)).toBe(false);
      expect(storage.verifyToken(token, fakeKey, "image/png", payload.length)).toBe(false);
    } else {
      expect(true).toBe(true);
    }
  });
});
