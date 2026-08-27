import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["test/**/*.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // The e2e suites intentionally share the seeded local database.
    fileParallelism: false,
    maxWorkers: 1
  }
});
