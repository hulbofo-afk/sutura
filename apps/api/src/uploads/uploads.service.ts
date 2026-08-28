import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { StorageService } from "./storage.service";

export type UploadKind = "photo" | "sketch" | "video";

const RULES: Record<UploadKind, { prefix: string; max: number; types: Record<string, string> }> = {
  photo: { prefix: "models", max: 10 * 1024 * 1024, types: { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" } },
  sketch: { prefix: "sketches", max: 2 * 1024 * 1024, types: { "image/svg+xml": "svg", "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" } },
  video: { prefix: "videos", max: 100 * 1024 * 1024, types: { "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov" } }
};

@Injectable()
export class UploadsService {
  constructor(private readonly storage: StorageService) {}

  async sign(creatorId: string, input: { kind: UploadKind; contentType: string; contentLength: number }) {
    const rule = RULES[input.kind];
    if (!rule) throw new BadRequestException("Unsupported upload kind");
    const extension = rule.types[input.contentType];
    if (!extension) throw new BadRequestException(`Unsupported contentType for ${input.kind}`);
    if (!Number.isInteger(input.contentLength) || input.contentLength < 1 || input.contentLength > rule.max) {
      throw new BadRequestException(`contentLength must be between 1 and ${rule.max}`);
    }
    const key = `${rule.prefix}/${creatorId}/${randomUUID()}.${extension}`;
    return { key, ...(await this.storage.signUpload({ key, contentType: input.contentType, contentLength: input.contentLength, expiresIn: 600 })) };
  }

  async confirm(creatorId: string, key: string) {
    this.assertOwnedKey(creatorId, key);
    return { key, publicUrl: this.storage.publicUrl(key), ...(await this.storage.head(key)) };
  }

  async delete(creatorId: string, key: string) {
    this.assertOwnedKey(creatorId, key);
    await this.storage.delete(key);
    return { key, deleted: true as const };
  }

  async assertOwnedPublicUrls(creatorId: string, input: { photoUrls?: string[]; sketchUrl?: string; videoUrl?: string }) {
    const urls = [...(input.photoUrls ?? []), input.sketchUrl, input.videoUrl].filter((value): value is string => Boolean(value));
    for (const url of urls) {
      const key = this.keyFromPublicUrl(url);
      if (!key) throw new BadRequestException("Media URL must come from the configured upload service");
      this.assertOwnedKey(creatorId, key);
      const object = await this.storage.head(key);
      if (!object.exists) throw new BadRequestException("Uploaded media was not found; confirm the upload first");
    }
  }

  private keyFromPublicUrl(value: string): string | null {
    try {
      const url = new URL(value, "http://local.invalid");
      const queryKey = url.searchParams.get("key");
      if (queryKey) return queryKey;
      const marker = ["/models/", "/sketches/", "/videos/"].find((part) => url.pathname.includes(part));
      return marker ? url.pathname.slice(url.pathname.indexOf(marker) + 1) : null;
    } catch {
      return null;
    }
  }

  assertOwnedKey(creatorId: string, key: string) {
    if (!new RegExp(`^(models|sketches|videos)/${escapeRegExp(creatorId)}/[A-Za-z0-9._-]+$`).test(key)) {
      throw new ForbiddenException("Storage object does not belong to this creator");
    }
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
