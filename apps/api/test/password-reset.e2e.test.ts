import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import bcrypt from "bcryptjs";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { LogEmailService } from "../src/notifications/log-email.service";
import { EMAIL_SERVICE } from "../src/notifications/email.service";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/services/prisma.service";

interface CapturedLog {
  text: string;
}

describe("Password reset (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let logs: CapturedLog[] = [];

  async function cleanup() {
    await prisma.passwordResetToken.deleteMany({});
    await prisma.user.update({
      where: { email: "creator@sutura.app" },
      data: { passwordHash: await bcrypt.hash("password123", 12), failedLoginCount: 0, lockedUntil: null }
    });
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

  beforeEach(() => {
    logs = [];
  });

  function lastToken(): string {
    const last = logs[logs.length - 1];
    const m = last.text.match(/token=([A-Za-z0-9_-]+)/);
    if (!m) throw new Error(`no token found in logs: ${JSON.stringify(logs)}`);
    return m[1];
  }

  it("sends a reset link to a known email and stores a hashed token", async () => {
    const before = await prisma.passwordResetToken.count();
    const res = await request(app.getHttpServer())
      .post("/api/auth/forgot-password")
      .send({ email: "creator@sutura.app" })
      .expect(200);
    expect(res.body).toEqual({ ok: true });

    const after = await prisma.passwordResetToken.count();
    expect(after).toBe(before + 1);

    const capture = logs.find((l) => l.text.includes("Password reset for creator@sutura.app"));
    expect(capture).toBeDefined();
    expect(capture!.text).toMatch(/\/auth\/reset-password\?token=[A-Za-z0-9_-]+/);
  });

  it("returns 200 even for unknown emails (no information leak)", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/auth/forgot-password")
      .send({ email: "ghost@nowhere.local" })
      .expect(200);
    expect(res.body).toEqual({ ok: true });
    expect(logs.length).toBe(0);
  });

  it("consumes a valid token, updates the password, and marks the token used", async () => {
    await request(app.getHttpServer())
      .post("/api/auth/forgot-password")
      .send({ email: "creator@sutura.app" })
      .expect(200);
    const token = lastToken();

    await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "creator@sutura.app", password: "password123" })
      .expect(201);

    await request(app.getHttpServer())
      .post("/api/auth/reset-password")
      .send({ token, newPassword: "newSecureP4ss" })
      .expect(200);

    await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "creator@sutura.app", password: "newSecureP4ss" })
      .expect(201);

    await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "creator@sutura.app", password: "password123" })
      .expect(401);
  });

  it("rejects a token used a second time", async () => {
    await request(app.getHttpServer())
      .post("/api/auth/forgot-password")
      .send({ email: "creator@sutura.app" })
      .expect(200);
    const token = lastToken();
    await request(app.getHttpServer())
      .post("/api/auth/reset-password")
      .send({ token, newPassword: "anotherP4ss9!" })
      .expect(200);
    await request(app.getHttpServer())
      .post("/api/auth/reset-password")
      .send({ token, newPassword: "yetAnotherP4ss" })
      .expect(400);
  });

  it("rejects a forged token", async () => {
    await request(app.getHttpServer())
      .post("/api/auth/reset-password")
      .send({ token: "forged-token-with-enough-length-for-validation", newPassword: "whateverPass" })
      .expect(400);
  });

  it("rejects too-short password", async () => {
    await request(app.getHttpServer())
      .post("/api/auth/forgot-password")
      .send({ email: "creator@sutura.app" })
      .expect(200);
    const token = lastToken();
    await request(app.getHttpServer())
      .post("/api/auth/reset-password")
      .send({ token, newPassword: "short" })
      .expect(400);
  });

  it("exposes a validate endpoint that reports token usability", async () => {
    await request(app.getHttpServer())
      .post("/api/auth/forgot-password")
      .send({ email: "creator@sutura.app" })
      .expect(200);
    const token = lastToken();
    const ok = await request(app.getHttpServer())
      .get(`/api/auth/reset-password/validate`)
      .query({ token });
    expect(ok.status).toBe(200);
    expect(ok.body).toEqual({ valid: true });

    await request(app.getHttpServer())
      .post("/api/auth/reset-password")
      .send({ token, newPassword: "validateAfterP4ss" })
      .expect(200);

    const gone = await request(app.getHttpServer())
      .get(`/api/auth/reset-password/validate`)
      .query({ token });
    expect(gone.body).toEqual({ valid: false });
  });
});
