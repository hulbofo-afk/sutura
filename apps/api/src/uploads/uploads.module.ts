import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { LocalStorageService } from "./local-storage.service";
import { R2StorageService } from "./r2-storage.service";
import { StorageService } from "./storage.service";
import { LocalUploadsController, UploadsController } from "./uploads.controller";
import { UploadsService } from "./uploads.service";

@Module({
  controllers: [UploadsController, LocalUploadsController],
  providers: [
    LocalStorageService,
    R2StorageService,
    {
      provide: StorageService,
      inject: [ConfigService, LocalStorageService, R2StorageService],
      useFactory: (config: ConfigService, local: LocalStorageService, r2: R2StorageService) =>
        (config.get<string>("STORAGE_DRIVER") ?? "local").toLowerCase() === "r2" ? r2 : local
    },
    UploadsService
  ],
  exports: [UploadsService, StorageService, LocalStorageService]
})
export class UploadsModule {}
