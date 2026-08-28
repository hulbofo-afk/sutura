export interface SignUploadInput {
  key: string;
  contentType: string;
  contentLength: number;
  expiresIn: number;
}

export interface SignedUpload {
  uploadUrl: string;
  publicUrl: string;
  method: "PUT";
  headers: Record<string, string>;
  expiresAt: string;
}

export interface StoredObject {
  exists: boolean;
  size?: number;
  contentType?: string;
}

export abstract class StorageService {
  abstract signUpload(input: SignUploadInput): Promise<SignedUpload>;
  abstract head(key: string): Promise<StoredObject>;
  abstract delete(key: string): Promise<void>;
  abstract publicUrl(key: string): string;
}
