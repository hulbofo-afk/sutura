import assert from "node:assert/strict";
import test from "node:test";
import { validateMediaMetadata } from "../convex/media.ts";

test("accepts supported photo metadata", () => {
  assert.doesNotThrow(() => validateMediaMetadata({ contentType: "image/webp", size: 1024 }, "photo"));
});

test("rejects unsupported MIME types", () => {
  assert.throws(
    () => validateMediaMetadata({ contentType: "image/svg+xml", size: 1024 }, "photo"),
    /non pris en charge/,
  );
});

test("rejects oversized videos", () => {
  assert.throws(
    () => validateMediaMetadata({ contentType: "video/mp4", size: 100 * 1024 * 1024 + 1 }, "video"),
    /taille maximale/,
  );
});

test("rejects missing storage metadata", () => {
  assert.throws(() => validateMediaMetadata(null, "sketch"), /introuvable/);
});
