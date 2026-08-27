import "reflect-metadata";
import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/global-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.enableShutdownHooks(["SIGTERM", "SIGINT"]);
  const config = app.get(ConfigService);
  const publicAppUrl = config.get<string>("PUBLIC_APP_URL");
  const nodeEnv = config.get<string>("NODE_ENV") ?? "development";
  const apiVersion = config.get<string>("API_VERSION") ?? "0.1.0";
  // Production has exactly one trusted reverse proxy: Caddy. This keeps
  // req.ip and the throttler client-specific without trusting arbitrary
  // user-supplied X-Forwarded-For hops.
  app.getHttpAdapter().getInstance().set("trust proxy", 1);
  const configuredOrigins = (config.get<string>("CORS_ORIGINS") ?? publicAppUrl ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowedOrigins = nodeEnv === "production"
    ? configuredOrigins
    : [...configuredOrigins, "http://localhost:5173", "http://localhost:3000"];

  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
    credentials: true
  });
  app.use((req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => {
    res.setHeader("X-API-Version", apiVersion);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
    next();
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true
    })
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.setGlobalPrefix("api");

  if (nodeEnv !== "production" || config.get<string>("ENABLE_SWAGGER") === "true") {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("Sutura API")
      .setDescription("Backend for the Sutura mobile beta — auth, collections, models, fashion tests, analytics, uploads")
      .setVersion(apiVersion)
      .addBearerAuth({ type: "http", scheme: "bearer", bearerFormat: "JWT" }, "bearer")
      .addTag("auth", "Register / login / refresh / change password / change email / forgot / reset")
      .addTag("collections", "Creator collections (paginated)")
      .addTag("models", "Fashion models within a collection")
      .addTag("fashion-tests", "Fashion tests + questions + shares")
      .addTag("public-tests", "Public questionnaire (no auth)")
      .addTag("analytics", "KPIs, desirability, risk, model breakdown, funnel, demographics")
      .addTag("recommendations", "AI-assisted recommendations (Imole or local heuristics)")
      .addTag("reports", "PDF report export")
      .addTag("uploads", "Media uploads (R2 presigned or local)")
      .addTag("health", "Health endpoint")
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("api/docs", app, document, {
      swaggerOptions: { persistAuthorization: true }
    });
  }

  const port = config.get<number>("PORT") ?? 4000;
  await app.listen(port);
  Logger.log(`sutura-api listening on :${port} (env=${nodeEnv}, version=${apiVersion})`, "Bootstrap");
}

void bootstrap();
