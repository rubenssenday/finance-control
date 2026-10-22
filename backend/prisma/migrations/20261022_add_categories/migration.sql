-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('EXPENSE', 'INCOME');

-- CreateTable categories
CREATE TABLE "categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "account_id" UUID NOT NULL,
    "name" VARCHAR(40) NOT NULL,
    "type" "CategoryType" NOT NULL DEFAULT 'EXPENSE',
    "color" VARCHAR(7) NOT NULL,
    "icon" VARCHAR(50) NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "fk_categories_account" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE
);

-- CreateIndexes
CREATE UNIQUE INDEX "uq_categories_account_name" ON "categories"("account_id", "name");
CREATE INDEX "ix_categories_account_type" ON "categories"("account_id", "type");
