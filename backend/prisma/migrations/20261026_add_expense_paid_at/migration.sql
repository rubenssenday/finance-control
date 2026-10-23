-- Migration: 20261026_add_expense_paid_at
-- AlterTable: Add paid_at to expenses
ALTER TABLE "expenses" ADD COLUMN "paid_at" TIMESTAMPTZ;

-- CreateIndex
CREATE INDEX "ix_expenses_account_paid_at" ON "expenses"("account_id", "paid_at");
