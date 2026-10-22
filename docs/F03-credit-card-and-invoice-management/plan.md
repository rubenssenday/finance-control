# Implementation Plan: F03. Credit Card and Invoice Management

## Prerequisites
- Completed and running F01 Foundation Architecture (PostgreSQL, Prisma ORM, JWT Cookie Auth, `AccountContextGuard`, and `apiClient`).
- Active Docker Compose development environment or native Node.js 20 runtime.
- Verification of test suites and database connection before applying new migrations.

---

## Phase 1: Database Schema & Migration

### Step 1: Prisma Schema Updates
Define the `CardBrand` enum (`VISA`, `MASTERCARD`, `ELO`, `AMEX`, `HIPERCARD`) and `InvoiceStatus` enum (`OPEN`, `CLOSED`, `PAID`) in `backend/prisma/schema.prisma`. Add the `CreditCard` and `Invoice` models with mandatory `account_id` foreign keys, cascade deletion, compound uniqueness constraints (`[accountId, nickname]` and `[cardId, billingYear, billingMonth]`), and relationships on the `Account` model.

### Step 2: DDL Migration Execution and Prisma Client Generation
Generate the PostgreSQL DDL migration file under `backend/prisma/migrations/20261023_add_cards_and_invoices/migration.sql` with all primary keys, indexes, foreign keys, and defaults. Execute `npx prisma generate` to update the strongly-typed Prisma Client for backend services.

---

## Phase 2: Backend Core Services & Billing Cycle Logic

### Step 3: Billing Cycle Utility
Implement pure functional calendar utilities in `backend/src/modules/cards/utils/billing-cycle.util.ts`. Create deterministic functions to handle calendar month-end day clamping (adjusting days 29–31 for February and 30-day months), leap year calculations, relative due date calendar month offsets, and transaction date cycle mapping.

### Step 4: Invoice Cycle Service
Implement `InvoicesService` in `backend/src/modules/cards/invoices.service.ts` to manage invoice lifecycle operations. Implement on-demand rolling invoice provisioning (`ensureCycleInvoices`), aggregate total balances, and compute dynamic `OVERDUE` states when unpaid invoices exceed their payment due date.

### Step 5: Cards Service, DTOs & Validation
Create `CreateCardDto` and `UpdateCardDto` in `backend/src/modules/cards/dto/` utilizing `class-validator` for nickname constraints, brand enums, credit limit boundaries (R$ 100 to R$ 1,000,000), and day validation (1 to 31 with `closingDay != dueDay`). Implement `CardsService` in `backend/src/modules/cards/cards.service.ts` enforcing account-level nickname uniqueness, available credit limit calculations, card archiving, and deletion guards (`CARD003`).

### Step 6: REST Controller & Module Registration
Implement `CardsController` in `backend/src/modules/cards/cards.controller.ts` providing endpoints for listing cards, creating cards, updating/archiving cards, deleting cards, and querying monthly statement invoices. Bundle services, controller, and Prisma dependencies into `CardsModule` and register it in `backend/src/app.module.ts`.

### Step 7: Backend Unit Test Suite
Write unit test specifications in `backend/test/cards/billing-cycle.util.spec.ts`, `cards.service.spec.ts`, and `invoices.service.spec.ts`. Validate clamping rules, due date shifts, error codes (`CARD001` through `CARD005`), multi-tenant data isolation, and deletion guards with mocked Prisma contexts.

---

## Phase 3: Frontend User Interface & Visual Components

### Step 8: Brand Themes & Visual Credit Card Component
Create visual theme configurations in `frontend/src/components/cards/constants/brand-themes.ts` defining brand gradients, logos, and color schemes for Visa, Mastercard, Elo, Amex, and Hipercard. Build `CreditCardVisual.tsx` in `frontend/src/components/cards/` to render card containers with chips, masked numbers, credit limit progress bars, and closing/due dates.

### Step 9: Statement Invoice Accordion & Badges
Implement `InvoiceStatusBadge.tsx` supporting color-coded visual states (`OPEN`, `CLOSED`, `PAID`, `OVERDUE`). Build `InvoiceList.tsx` to display previous settled statements, the current open cycle, and future projected cycles with totals, countdowns, and expandable views.

### Step 10: Card Creation & Edit Modal
Build `CardModal.tsx` in `frontend/src/components/cards/` providing an accessible modal dialog with inputs for nickname, brand selector, credit limit with currency formatting, closing day, and due day. Implement client-side validation preventing identical closing and due days and display instant validation errors.

### Step 11: Cards Management Page & Header Navigation
Create the management view in `frontend/src/app/(dashboard)/cards/page.tsx` integrating card carousels/grids, filter toggles (active vs archived cards), empty states, and modal handling. Update `frontend/src/components/layout/AppHeader.tsx` to include the `Cards` navigation link with a credit card icon.

---

## Phase 4: End-to-End Validation & Documentation

### Step 12: Production Build & Multi-Tenant Verification
Execute `npm run build` on both `backend/` and `frontend/` to guarantee clean TypeScript compilation and static page generation. Verify that cards and invoice records in one account workspace are completely inaccessible and isolated from secondary account workspaces.
