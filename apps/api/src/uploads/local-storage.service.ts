import { ForbiddenException, Injectable, PayloadTooLargeException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createReadStream, promises as fs } from "node:fs";
import * as path from "node:path";
import type { Response } from "express";
import { SignUploadInput, SignedUpload, StorageService, StoredObject } from "./storage.service";

@Injectable()
export class LocalStorageService extends StorageService {
  private readonly uploadsDir = path.resolve(process.cwd(), "uploads");
  private readonly secret: string;
  private readonly apiBase: string;

  constructor(config: ConfigService) {
    super();
    this.secret = config.get<string>("LOCAL_UPLOAD_SECRET") ?? config.get<string>("JWT_SECRET") ?? "local-upload-dev-secret";
    this.apiBase = (config.get<string>("API_PUBLIC_URL") ?? "http://localhost:4000/api").replace(/\/$/, "");
  }

  getUploadsDir() {
    return this.uploadsDir;
  }

  async signUpload(input: SignUploadInput): Promise<SignedUpload> {
    const expiresAtMs = Date.now() + input.expiresIn * 1000;
    const token = this.token(input.key, input.contentType, input.contentLength, expiresAtMs);
    const query = new URLSearchParams({ key: input.key, contentType: input.contentType, contentLength: String(input.contentLength), expiresAt: String(expiresAtMs), token });
    return {
      uploadUrl: `${this.apiBase}/uploads-local/upload?${query}`,
      publicUrl: this.publicUrl(input.key),
      method: "PUT",
      headers: { "Content-Type": input.contentType, "Content-Length": String(input.contentLength) },
      expiresAt: new Date(expiresAtMs).toISOString()
    };
  }

  verifyToken(token: string, key: string, contentType: string, contentLength: number, expiresAt?: number): boolean {
    if (!token || !Number.isFinite(contentLength)) return false;
    const expiry = expiresAt ?? this.expiryFromToken(token);
    if (!expiry || expiry < Date.now()) return false;
    const expected = this.token(key, contentType, contentLength, expiry);
    const a = Buffer.from(token);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  }

  async save(key: string, body: Buffer, expectedLength: number): Promise<void> {
    if (body.length !== expectedLength) throw new PayloadTooLargeException("Uploaded byte length does not match signed contentLength");
    const target = this.safePath(key);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, body, { flag: "wx" }).catch(async (error: NodeJS.ErrnoException) => {
      if (error.code !== "EEXIST") throw error;
      await fs.writeFile(target, body);
    });
  }

  async stream(key: string, response: Response): Promise<void> {
    const target = this.safePath(key);
    await fs.access(target);
    await new Promise<void>((resolve, reject) => {
      const stream = createReadStream(target);
      stream.on("error", reject);
      stream.on("end", resolve);
      stream.pipe(response);
    });
  }

  async head(key: string): Promise<StoredObject> {
    try {
      const stat = await fs.stat(this.safePath(key));
      return { exists: stat.isFile(), size: stat.size };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return { exists: false };
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    await fs.unlink(this.safePath(key)).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    });
  }

  publicUrl(key: string): string {
    return `${this.apiBase}/uploads-local/get?key=${encodeURIComponent(key)}`;
  }

  private token(key: string, contentType: string, contentLength: number, expiresAt: number): string {
    const signature = createHmac("sha256", this.secret).update(`${key}\n${contentType}\n${contentLength}\n${expiresAt}`).digest("base64url");
    return `${expiresAt}.${signature}`;
  }

  private expiryFromToken(token: string): number {
    return Number(token.split(".", 1)[0]);
  }

  private safePath(key: string): string {
    if (!/^(models|sketches|videos)\/[A-Za-z0-9_-]+\/[A-Za-z0-9._-]+$/.test(key)) {
      throw new ForbiddenException("Invalid storage key");
    }
    const target = path.resolve(this.uploadsDir, key);
    if (!target.startsWith(`${this.uploadsDir}${path.sep}`)) throw new ForbiddenException("Invalid storage key");
    return target;
  }
}
