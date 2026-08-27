import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import * as crypto from "node:crypto";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { LogEmailService } from "../src/notifications/log-email.service";
import { EMAIL_SERVICE } from "../src/notifications/email.service";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/services/prisma.service";

interface CapturedLog {
  text: string;
}

describe("Auth enhancements (e2e: refresh, change-password, change-email, lockout)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let logs: CapturedLog[] = [];
  let testUserId: string;
  const testEmail = `auth-test-${Date.now()}@sutura.app`;

  async function cleanup() {
    await prisma.refreshToken.deleteMany({ where: { user: { email: testEmail } } });
    await prisma.loginAttempt.deleteMany({ where: { email: testEmail } });
    await prisma.user.deleteMany({ where: { email: testEmail } });
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(EMAIL_SERVICE)
      .useFactory({
        factory: () => {
          const log = new LogEmailService();
          log["logger"]["warn"] = (msg: string) => logs.push({ text: String(msg) });
          return log;
        }
      })
      .compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    app.setGlobalPrefix("api");
    await app.init();
    prisma = app.get(PrismaService);
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  beforeEach(async () => {
    await cleanup();
    logs = [];
  });

  async function registerTestUser() {
    const res = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({ name: "Test", brandName: "Test", email: testEmail, password: "OriginalP4ss1" });
    expect(res.status).toBe(201);
    testUserId = res.body.user.id;
    return res.body;
  }

  it("issues refresh tokens on register and login", async () => {
    const reg = await registerTestUser();
    expect(reg.token).toBeDefined();
    expect(reg.refreshToken).toBeDefined();
    expect(reg.refreshToken.length).toBeGreaterThanOrEqual(32);

    const login = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: testEmail, password: "OriginalP4ss1" })
      .expect(201);
    expect(login.body.refreshToken).toBeDefined();
  });

  it("normalizes email addresses for registration and login", async () => {
    const mixedCaseEmail = `Auth-Normalized-${Date.now()}@SUTURA.APP`;
    const registration = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({ name: "Test", brandName: "Test", email: mixedCaseEmail, password: "OriginalP4ss1" })
      .expect(201);

    expect(registration.body.user.email).toBe(mixedCaseEmail.toLowerCase());
    await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: mixedCaseEmail.toUpperCase(), password: "OriginalP4ss1" })
      .expect(201);

    await prisma.user.delete({ where: { id: registration.body.user.id } });
  });

  it("rotates refresh tokens: old becomes invalid after use", async () => {
    const reg = await registerTestUser();
    const oldRefresh = reg.refreshToken;

    const r1 = await request(app.getHttpServer())
      .post("/api/auth/refresh")
      .send({ refreshToken: oldRefresh })
      .expect(200);
    expect(r1.body.token).toBeDefined();
    expect(r1.body.refreshToken).toBeDefined();
    expect(r1.body.refreshToken).not.toBe(oldRefresh);

    const r2 = await request(app.getHttpServer())
      .post("/api/auth/refresh")
      .send({ refreshToken: oldRefresh })
      .expect(401);
  });

  it("logout revokes all refresh tokens for the user", async () => {
    const reg = await registerTestUser();
    const r1 = await request(app.getHttpServer())
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${reg.token}`)
      .expect(200);

    await request(app.getHttpServer())
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${reg.token}`)
      .expect(200);

    await request(app.getHttpServer())
      .post("/api/auth/refresh")
      .send({ refreshToken: reg.refreshToken })
      .expect(401);
  });

  it("change-password requires current + rejects wrong current", async () => {
    const reg = await registerTestUser();
    await request(app.getHttpServer())
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${reg.token}`)
      .send({ currentPassword: "wrong-password", newPassword: "NewSecureP4ss" })
      .expect(401);

    await request(app.getHttpServer())
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${reg.token}`)
      .send({ currentPassword: "OriginalP4ss1", newPassword: "NewSecureP4ss" })
      .expect(200);

    await request(app.getHttpServer())
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${reg.token}`)
      .send({ currentPassword: "NewSecureP4ss", newPassword: "ChangedP4ss2!" })
      .expect(200);

    await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: testEmail, password: "ChangedP4ss2!" })
      .expect(201);
    await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: testEmail, password: "OriginalP4ss1" })
      .expect(401);
  });

  it("locks the account after 5 failed login attempts for 15 minutes", async () => {
    await registerTestUser();
    for (let i = 0; i < 5; i += 1) {
      await request(app.getHttpServer())
        .post("/api/auth/login")
        .send({ email: testEmail, password: "wrong-password" })
        .expect(401);
    }
    await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: testEmail, password: "OriginalP4ss1" })
      .expect(403);
    const user = await prisma.user.findUnique({ where: { id: testUserId } });
    expect(user?.lockedUntil?.getTime()).toBeGreaterThan(Date.now());
  });

  it("change-email requests verification and confirms", async () => {
    const reg = await registerTestUser();
    const newEmail = `auth-test-new-${Date.now()}@sutura.app`;

    await request(app.getHttpServer())
      .post("/api/auth/change-email/request")
      .set("Authorization", `Bearer ${reg.token}`)
      .send({ newEmail })
      .expect(200);

    const lastWarn = [...logs].reverse().find((l) => l.text.includes("Email change verification"));
    expect(lastWarn).toBeDefined();
    const tokenMatch = lastWarn!.text.match(/token=([A-Za-z0-9_-]+)/);
    expect(tokenMatch).toBeDefined();
    const token = tokenMatch![1];

    await request(app.getHttpServer())
      .post("/api/auth/change-email/confirm")
      .set("Authorization", `Bearer ${reg.token}`)
      .send({ token: "forged-token-with-enough-length", newEmail })
      .expect(400);

    await request(app.getHttpServer())
      .post("/api/auth/change-email/confirm")
      .set("Authorization", `Bearer ${reg.token}`)
      .send({ token })
      .expect(200);

    const updated = await prisma.user.findUnique({ where: { id: testUserId } });
    expect(updated?.email).toBe(newEmail.toLowerCase());
    expect(updated?.emailVerified).toBe(true);

    await prisma.user.update({ where: { id: testUserId }, data: { email: testEmail, emailVerified: false, emailVerifiedAt: null, pendingEmail: null, emailVerifyTokenHash: null, emailVerifyExp: null } });
  });
});
