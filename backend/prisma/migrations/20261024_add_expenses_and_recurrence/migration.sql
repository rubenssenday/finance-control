-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CREDIT_CARD', 'DEBIT_CARD', 'BOLETO', 'PIX');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID');

-- CreateEnum
CREATE TYPE "RecurrenceFrequency" AS ENUM ('MONTHLY');

-- CreateTable
CREATE TABLE "recurrence_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "account_id" UUID NOT NULL,
    "description" VARCHAR(100) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "frequency" "RecurrenceFrequency" NOT NULL DEFAULT 'MONTHLY',
    "day_of_month" INTEGER NOT NULL,
    "start_date" TIMESTAMPTZ NOT NULL,
    "end_date" TIMESTAMPTZ,
    "payment_method" "PaymentMethod" NOT NULL,
    "category_id" UUID NOT NULL,
    "card_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_recurrence_rules" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "account_id" UUID NOT NULL,
    "description" VARCHAR(100) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "transaction_date" TIMESTAMPTZ NOT NULL,
    "due_date" TIMESTAMPTZ NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "category_id" UUID NOT NULL,
    "card_id" UUID,
    "invoice_id" UUID,
    "installment_group_id" UUID,
    "installment_number" INTEGER,
    "installment_total" INTEGER,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrence_rule_id" UUID,
    "notes" VARCHAR(255),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_expenses" PRIMARY KEY ("id")
);

-- Foreign Keys
ALTER TABLE "recurrence_rules" ADD CONSTRAINT "fk_recurrence_account" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recurrence_rules" ADD CONSTRAINT "fk_recurrence_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "recurrence_rules" ADD CONSTRAINT "fk_recurrence_card" FOREIGN KEY ("card_id") REFERENCES "credit_cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "expenses" ADD CONSTRAINT "fk_expenses_account" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "fk_expenses_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "fk_expenses_card" FOREIGN KEY ("card_id") REFERENCES "credit_cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "fk_expenses_invoice" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "fk_expenses_recurrence" FOREIGN KEY ("recurrence_rule_id") REFERENCES "recurrence_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "ix_recurrence_rules_account_id" ON "recurrence_rules"("account_id");
CREATE INDEX "ix_expenses_account_date" ON "expenses"("account_id", "transaction_date");
CREATE INDEX "ix_expenses_account_method" ON "expenses"("account_id", "payment_method");
CREATE INDEX "ix_expenses_account_status" ON "expenses"("account_id", "payment_status");
CREATE INDEX "ix_expenses_invoice_id" ON "expenses"("invoice_id");
CREATE INDEX "ix_expenses_installment_group" ON "expenses"("installment_group_id");
CREATE INDEX "ix_expenses_recurrence_rule" ON "expenses"("recurrence_rule_id");
