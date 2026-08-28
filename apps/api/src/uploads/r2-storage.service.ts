import { DeleteObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SignedUpload, SignUploadInput, StorageService, StoredObject } from "./storage.service";

@Injectable()
export class R2StorageService extends StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBase: string;

  constructor(config: ConfigService) {
    super();
    const accountId = config.get<string>("R2_ACCOUNT_ID") ?? "";
    this.bucket = config.get<string>("R2_BUCKET") ?? "";
    this.publicBase = (config.get<string>("R2_PUBLIC_BASE_URL") ?? "").replace(/\/$/, "");
    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.get<string>("R2_ACCESS_KEY_ID") ?? "",
        secretAccessKey: config.get<string>("R2_SECRET_ACCESS_KEY") ?? ""
      }
    });
  }

  async signUpload(input: SignUploadInput): Promise<SignedUpload> {
    const command = new PutObjectCommand({ Bucket: this.bucket, Key: input.key, ContentType: input.contentType, ContentLength: input.contentLength });
    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: input.expiresIn });
    return {
      uploadUrl,
      publicUrl: this.publicUrl(input.key),
      method: "PUT",
      headers: { "Content-Type": input.contentType, "Content-Length": String(input.contentLength) },
      expiresAt: new Date(Date.now() + input.expiresIn * 1000).toISOString()
    };
  }

  async head(key: string): Promise<StoredObject> {
    try {
      const object = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return { exists: true, size: object.ContentLength, contentType: object.ContentType };
    } catch (error) {
      const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
      if (status === 404) return { exists: false };
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  publicUrl(key: string): string {
    return `${this.publicBase}/${key.split("/").map(encodeURIComponent).join("/")}`;
  }
}
