import { Module, ValidationPipe } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD, APP_PIPE } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AnalyticsController } from "./controllers/analytics.controller";
import { AuthController } from "./controllers/auth.controller";
import { CollectionsController } from "./controllers/collections.controller";
import { FashionTestsController } from "./controllers/fashion-tests.controller";
import { HealthController, HealthExtendedController } from "./controllers/health.controller";
import { HealthExtended } from "./health/health.extended";
import { ModelsController } from "./controllers/models.controller";
import { PasswordResetController } from "./controllers/password-reset.controller";
import { PublicTestsController } from "./controllers/public-tests.controller";
import { RecommendationsController } from "./controllers/recommendations.controller";
import { ReportsController } from "./controllers/reports.controller";
import { RecommendationsModule } from "./recommendations/recommendations.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { AnalyticsService } from "./services/analytics.service";
import { AuthService } from "./services/auth.service";
import { CollectionsService } from "./services/collections.service";
import { FashionTestsService } from "./services/fashion-tests.service";
import { LoginAttemptService } from "./services/login-attempt.service";
import { ModelsService } from "./services/models.service";
import { PasswordResetService } from "./services/password-reset.service";
import { PrismaService } from "./services/prisma.service";
import { PrismaModule } from "./services/prisma.module";
import { PublicResponsesService } from "./services/public-responses.service";
import { RefreshTokenService } from "./services/refresh-token.service";
import { ReportsService } from "./services/reports.service";
import { ScoresService } from "./services/scores.service";
import { UploadsModule } from "./uploads/uploads.module";
import { JwtAuthGuard } from "./auth/jwt-auth.guard";

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const nodeEnv = config.get<string>("NODE_ENV") ?? "development";
        const secret = config.get<string>("JWT_SECRET");
        if (nodeEnv === "production" && (!secret || secret.length < 32)) {
          throw new Error("JWT_SECRET is required and must be ≥ 32 chars in production");
        }
        if (nodeEnv === "production" && (config.get<string>("STORAGE_DRIVER") ?? "local").toLowerCase() !== "r2") {
          throw new Error("STORAGE_DRIVER=r2 is required in production; local uploads are not persistent");
        }
        if (nodeEnv === "production" && !config.get<string>("SMTP_HOST")) {
          throw new Error("SMTP_HOST is required in production; password reset emails cannot use the development logger");
        }
        return {
          secret: secret ?? "local-dev-secret",
          signOptions: { expiresIn: "15m" }
        };
      }
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isTest = config.get<string>("NODE_ENV") === "test";
        if (isTest) {
          return [{ name: "test", ttl: 1, limit: 10_000_000 }];
        }
        return [
          { name: "short", ttl: 1000, limit: 5 },
          { name: "medium", ttl: 60_000, limit: 60 },
          { name: "long", ttl: 3_600_000, limit: 1000 }
        ];
      }
    }),
    UploadsModule,
    RecommendationsModule,
    NotificationsModule
  ],
  controllers: [
    HealthController,
    HealthExtendedController,
    AuthController,
    PasswordResetController,
    CollectionsController,
    ModelsController,
    FashionTestsController,
    PublicTestsController,
    AnalyticsController,
    RecommendationsController,
    ReportsController
  ],
  providers: [
    AuthService,
    PasswordResetService,
    RefreshTokenService,
    LoginAttemptService,
    HealthExtended,
    CollectionsService,
    ModelsService,
    FashionTestsService,
    PublicResponsesService,
    AnalyticsService,
    ReportsService,
    ScoresService,
    JwtAuthGuard,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          whitelist: true,
          transform: true,
          forbidNonWhitelisted: true
        })
    }
  ]
})
export class AppModule {}
