import type { GenericMutationCtx } from "convex/server";
import type { DataModel, Id } from "./_generated/dataModel";

export type MediaKind = "photo" | "sketch" | "video";

export const MEDIA_LIMITS: Record<MediaKind, { maxBytes: number; mimeTypes: readonly string[] }> = {
  photo: {
    maxBytes: 10 * 1024 * 1024,
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  sketch: {
    maxBytes: 10 * 1024 * 1024,
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  },
  video: {
    maxBytes: 100 * 1024 * 1024,
    mimeTypes: ["video/mp4", "video/webm", "video/quicktime"],
  },
};

type StoredFileMetadata = { contentType?: string | null; size: number };

export function validateMediaMetadata(
  metadata: StoredFileMetadata | null,
  kind: MediaKind,
) {
  if (!metadata) throw new Error("Le fichier est introuvable ou n'est pas terminé.");

  const limits = MEDIA_LIMITS[kind];
  if (!metadata.contentType || !limits.mimeTypes.includes(metadata.contentType)) {
    throw new Error(`Type de fichier ${kind} non pris en charge.`);
  }
  if (!Number.isFinite(metadata.size) || metadata.size <= 0 || metadata.size > limits.maxBytes) {
    throw new Error(`Le fichier ${kind} dépasse la taille maximale autorisée.`);
  }
}

export async function validateStoredFile(
  ctx: GenericMutationCtx<DataModel>,
  storageId: Id<"_storage">,
  kind: MediaKind,
) {
  const metadata = await ctx.db.system.get("_storage", storageId);
  validateMediaMetadata(metadata, kind);
}
