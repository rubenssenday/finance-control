# Implementation Plan: F04. Expense Entry and Recurrence Engine

## Prerequisites
- Completed F01 Foundation Architecture (Auth, Workspaces, Tenant Guards).
- Completed F02 Expense Categories Management (`Category` model with icons and colors).
- Completed F03 Credit Card and Invoice Management (`CreditCard` and `Invoice` models with billing cycle engine).
- Active PostgreSQL database connection and verified backend test suite.

---

## Phase 1: Database Schema & Migration

### Step 1: Prisma Schema Updates
Define `PaymentMethod` (`CREDIT_CARD`, `DEBIT_CARD`, `BOLETO`, `PIX`), `PaymentStatus` (`PENDING`, `PAID`), and `RecurrenceFrequency` (`MONTHLY`) enums in `backend/prisma/schema.prisma`. Add the `Expense` and `RecurrenceRule` models with foreign keys to `Account`, `Category`, `CreditCard`, and `Invoice`, compound indexes for date/method/status filtering, and series tracking fields (`installmentGroupId`, `installmentNumber`, `installmentTotal`).

### Step 2: DDL Migration Execution and Prisma Client Generation
Generate the PostgreSQL DDL migration file under `backend/prisma/migrations/20261024_add_expenses_and_recurrence/migration.sql` with all constraints, cascade rules, and indexes. Execute `npx prisma generate` to refresh the strongly-typed Prisma Client in the workspace.

---

## Phase 2: Mathematical Engine & Utility Layer

### Step 3: Integer-Cent Installment Rounding Utility
Implement pure functional math calculations in `backend/src/modules/expenses/utils/installment-math.util.ts`. Create deterministic functions enforcing the banking-standard formula ($\text{BaseCents} = \lfloor \text{TotalCents} / N \rfloor$ with remainder cents added exclusively to the first installment) guaranteeing 100% cent conservation across 1x to 72x installment series.

### Step 4: CSV Stream Parser & Normalizer
Implement CSV streaming and entity mapping in `backend/src/modules/expenses/utils/csv-parser.util.ts`. Parse uploaded CSV files, normalize dates and Brazilian currency strings, validate row constraints, and match category names and credit card nicknames within the active account.

---

## Phase 3: Backend Core Services & REST API

### Step 5: Recurrence Materialization Service
Implement `RecurrenceService` in `backend/src/modules/expenses/recurrence.service.ts` to manage recurring monthly templates. Handle creation of template records in `recurrence_rules` and automated materialization of child expense records across a rolling 12-month forward projection window.

### Step 6: Expenses Business Logic Service
Implement `ExpensesService` in `backend/src/modules/expenses/expenses.service.ts` to orchestrate cash expense creation, multi-installment generation, and invoice allocation. Integrate with `InvoicesService` (F03) to link card installments to sequential billing statement cycles, update invoice totals, and support single vs future series deletions (`scope: 'SINGLE' | 'FUTURE'`).

### Step 7: Input Validation DTOs
Create `CreateExpenseDto`, `UpdateExpenseDto`, and CSV import DTOs in `backend/src/modules/expenses/dto/`. Enforce description length (3 to 100), monetary limits (R$ 0.01 to R$ 999,999.99), installment ranges (1 to 72), and conditional validation requiring valid credit card IDs when `paymentMethod === 'CREDIT_CARD'`.

### Step 8: REST Controller & Module Integration
Implement `ExpensesController` in `backend/src/modules/expenses/expenses.controller.ts` providing endpoints for listing expenses with filters, expense creation, single/series deletion, CSV preview, and batch confirmation. Bundle controller and services into `ExpensesModule` and register it in `backend/src/app.module.ts`.

### Step 9: Backend Unit Test Suite
Write unit test specifications in `backend/test/expenses/installment-math.util.spec.ts`, `expenses.service.spec.ts`, `recurrence.service.spec.ts`, and `csv-parser.util.spec.ts`. Validate exact cent conservation, invoice allocation rollover, recurrence generation limits, and series deletion scoping with mocked Prisma contexts.

---

## Phase 4: Frontend User Interface & Interactive Modals

### Step 10: Real-Time Installment Preview Table
Build `InstallmentPreviewTable.tsx` in `frontend/src/components/expenses/` to display real-time installment calculations. Render a simulated schedule showing installment numbers, exact cent breakdowns, and the designated statement invoice cycle months for selected credit cards.

### Step 11: Expense Entry & Edition Modal
Build `ExpenseModal.tsx` in `frontend/src/components/expenses/` providing an accessible modal dialog. Integrate payment method tabs (Credit Card, Debit, Pix, Boleto), category pickers with icons and colors (F02), card selectors (F03), installment count pickers, and live validation.

### Step 12: CSV Bulk Batch Import Dialog
Build `CsvImportModal.tsx` in `frontend/src/components/expenses/` featuring drag-and-drop file upload. Display validation preview tables highlighting matched categories, detected cards, and line-by-line syntax errors before executing atomic batch import confirmation.

### Step 13: Expenses Ledger View & Navigation
Create the ledger page in `frontend/src/app/(dashboard)/expenses/page.tsx` with month filtering, method badges, status filters, and action menus. Update `frontend/src/components/layout/AppHeader.tsx` to include the `Expenses` navigation link with a `Receipt` icon.

---

## Phase 5: End-to-End Validation & Verification

### Step 14: Cross-Feature Integration & Production Builds
Execute `npm run build` on both `backend/` and `frontend/` to verify clean compilation. Validate that credit card purchases correctly populate card invoices (F03), category tags display faithfully (F02), and expenses are ready for status settlement (F06) and dashboard analytics (F07).
