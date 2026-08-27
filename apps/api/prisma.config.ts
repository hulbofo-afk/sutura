import "dotenv/config";
import { existsSync } from "node:fs";
import { defineConfig } from "prisma/config";

const seedCommand = existsSync("dist/seed.js") ? "node dist/seed.js" : "tsx prisma/seed.ts";
const databaseUrl = process.env["DATABASE_URL"] ?? "postgresql://sutura:sutura@localhost:55432/sutura";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: seedCommand
  },
  datasource: {
    url: databaseUrl
  }
});
