-- CreateEnum
CREATE TYPE "IncomeStatus" AS ENUM ('RECEIVED', 'PENDING');

-- CreateTable income_recurrence_rules
CREATE TABLE "income_recurrence_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "account_id" UUID NOT NULL,
    "description" VARCHAR(100) NOT NULL,
    "amount" DECIMAL(12, 2) NOT NULL,
    "day_of_month" INTEGER NOT NULL,
    "start_date" TIMESTAMPTZ NOT NULL,
    "end_date" TIMESTAMPTZ,
    "category_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_income_recurrence_rules" PRIMARY KEY ("id")
);

-- CreateTable incomes
CREATE TABLE "incomes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "account_id" UUID NOT NULL,
    "description" VARCHAR(100) NOT NULL,
    "amount" DECIMAL(12, 2) NOT NULL,
    "receipt_date" TIMESTAMPTZ NOT NULL,
    "status" "IncomeStatus" NOT NULL DEFAULT 'PENDING',
    "category_id" UUID NOT NULL,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "income_recurrence_rule_id" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_incomes" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "ix_income_recurrence_rules_account" ON "income_recurrence_rules"("account_id");
CREATE INDEX "ix_incomes_account_id" ON "incomes"("account_id");
CREATE INDEX "ix_incomes_account_receipt_date" ON "incomes"("account_id", "receipt_date");
CREATE INDEX "ix_incomes_category_id" ON "incomes"("category_id");
CREATE INDEX "ix_incomes_status" ON "incomes"("account_id", "status");
CREATE INDEX "ix_incomes_recurrence_rule_id" ON "incomes"("income_recurrence_rule_id");

-- Foreign Keys
ALTER TABLE "income_recurrence_rules" ADD CONSTRAINT "fk_income_recurrence_account" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "income_recurrence_rules" ADD CONSTRAINT "fk_income_recurrence_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "incomes" ADD CONSTRAINT "fk_incomes_account" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "incomes" ADD CONSTRAINT "fk_incomes_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "incomes" ADD CONSTRAINT "fk_incomes_recurrence" FOREIGN KEY ("income_recurrence_rule_id") REFERENCES "income_recurrence_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
