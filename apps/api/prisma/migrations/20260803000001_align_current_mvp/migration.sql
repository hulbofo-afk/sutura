-- Align the legacy VPS schema with the current API contract.
-- The legacy emailVerifyToken column is intentionally retained; existing
-- installations may still contain pending verification data in it.
ALTER TABLE "User"
  ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "emailVerifyTokenHash" TEXT;

CREATE UNIQUE INDEX "User_emailVerifyTokenHash_key" ON "User"("emailVerifyTokenHash");

ALTER TABLE "PublicResponse" ADD COLUMN "idempotencyKey" TEXT;
CREATE UNIQUE INDEX "PublicResponse_testId_idempotencyKey_key"
  ON "PublicResponse"("testId", "idempotencyKey");

ALTER TABLE "Question"
  ADD CONSTRAINT "Question_modelId_fkey"
  FOREIGN KEY ("modelId") REFERENCES "FashionModel"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
