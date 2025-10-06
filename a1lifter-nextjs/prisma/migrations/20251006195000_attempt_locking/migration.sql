-- Attempt locking & status migration

-- Create new enum for attempt status
CREATE TYPE "AttemptStatus" AS ENUM ('QUEUED', 'IN_PROGRESS', 'COMPLETED');

-- Add new columns to attempts table
ALTER TABLE "attempts"
  ADD COLUMN "status" "AttemptStatus" NOT NULL DEFAULT 'QUEUED',
  ADD COLUMN "locked_by" TEXT,
  ADD COLUMN "locked_at" TIMESTAMPTZ,
  ADD COLUMN "judged_at" TIMESTAMPTZ,
  ADD COLUMN "judged_by" TEXT;

-- Backfill status for existing attempts
UPDATE "attempts"
SET "status" = CASE
  WHEN "result" = 'PENDING' THEN 'QUEUED'
  ELSE 'COMPLETED'
END;

-- Create indexes to support locking queries
CREATE INDEX "attempts_status_idx" ON "attempts" ("status");
CREATE INDEX "attempts_locked_by_idx" ON "attempts" ("locked_by");
CREATE INDEX "attempts_judged_by_idx" ON "attempts" ("judged_by");

-- Add foreign keys to track locking/judging users
ALTER TABLE "attempts"
  ADD CONSTRAINT "attempts_locked_by_fkey"
    FOREIGN KEY ("locked_by") REFERENCES "users"("id") ON DELETE SET NULL,
  ADD CONSTRAINT "attempts_judged_by_fkey"
    FOREIGN KEY ("judged_by") REFERENCES "users"("id") ON DELETE SET NULL;
