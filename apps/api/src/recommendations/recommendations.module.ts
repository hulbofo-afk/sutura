import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { LocalRecommendationProvider } from "./local-recommendation.provider";
import { ImoleRecommendationProvider } from "./imole-recommendation.provider";
import { RecommendationProvider } from "./recommendation.provider";

@Module({
  providers: [
    LocalRecommendationProvider,
    ImoleRecommendationProvider,
    {
      provide: RecommendationProvider,
      inject: [ConfigService, LocalRecommendationProvider, ImoleRecommendationProvider],
      useFactory: (
        config: ConfigService,
        local: LocalRecommendationProvider,
        imole: ImoleRecommendationProvider
      ) => {
        const useImole = !!config.get<string>("IMOLE_API_KEY");
        return useImole ? imole : local;
      }
    }
  ],
  exports: [RecommendationProvider]
})
export class RecommendationsModule {}
