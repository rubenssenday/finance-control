-- Migration: 20261030_add_expense_description_normalized
-- Enable extensions for unaccent and pg_trgm if not already enabled
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- AlterTable: Add description_normalized to expenses
ALTER TABLE "expenses" ADD COLUMN "description_normalized" VARCHAR(100) NOT NULL DEFAULT '';

-- Backfill existing records using unaccent and lower
UPDATE "expenses" SET "description_normalized" = LOWER(UNACCENT("description")) WHERE "description_normalized" = '';

-- CreateIndex: B-Tree index for account_id and description_normalized
CREATE INDEX "ix_expenses_account_description_normalized" ON "expenses"("account_id", "description_normalized");

-- CreateIndex: GIN trigram index for fast wildcard/substring search
CREATE INDEX "ix_expenses_description_normalized_trgm" ON "expenses" USING gin ("description_normalized" gin_trgm_ops);
