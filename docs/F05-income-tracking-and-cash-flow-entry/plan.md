# Implementation Plan: F05. Income Tracking and Cash Flow Entry

**Prerequisites:**
- Node.js 20+ and npm package manager
- Docker and Docker Compose running `financial_postgres`, `financial_backend`, and `financial_frontend`
- Active database with F01 (Foundation) and F02 (Categories) migrations applied
- Category model populated with default categories, including `"Income/Salary"` of type `INCOME`

---

### Phase 1: Database Schema & Migration

**1. Prisma Schema Models and Enums** - Extend the Prisma schema with the `IncomeStatus` enum, the `Income` model, and the `IncomeRecurrenceRule` model. Establish relations and cascading rules on the `Account` and `Category` entities per the data model in the spec.

**2. Database Migration Generation** - Generate and deploy the PostgreSQL migration script in Prisma to provision the `incomes` and `income_recurrence_rules` tables with their corresponding indexes and foreign key constraints.

**3. Prisma Client Generation** - Rebuild the Prisma Client to expose typed database delegates and model interfaces to the backend services.

---

### Phase 2: Backend Recurrence Engine & REST Services

**4. Income Data Transfer Objects** - Implement input validation DTOs for income creation and partial updates. Enforce character length constraints, monetary amount limits, receipt date boundaries, and category type prerequisites.

**5. Income Recurrence Engine Service** - Build the recurrence service responsible for creating recurring income rules and materializing 12 rolling forward monthly instances into the database. Enforce deterministic end-of-month calendar clamping for short months.

**6. Income Core Service** - Create the primary service layer handling income creation, single retrieval, month and year date filtering on receipt dates, status toggling, and granular single versus future series deletions.

**7. Incomes REST Controller** - Implement the REST controller exposing endpoints under `/api/v1/incomes`. Guard all routes with authentication and account context guards, binding query parameters and request bodies to service methods.

**8. Incomes Module Registration** - Create the NestJS feature module bundling the controller, services, and repository dependencies. Register the module in the root application module and export the service for downstream financial dashboard aggregation.

**9. Backend Unit Test Suite** - Implement comprehensive Jest unit tests covering single income creation, category validation errors, receipt date boundaries, recurrence materialization, calendar clamping, and deletion scoping.

---

### Phase 3: Frontend User Interface & Components

**10. Income Modal Component** - Build the modal component for creating and editing income entries styled with emerald accents. Include amount input, receipt date picker, category dropdown filtered strictly to income categories, settlement status toggle, and recurrence checkbox.

**11. Income Ledger Page** - Create the responsive ledger page at `/incomes` with calendar month navigation, top-level financial KPI cards, search and status filters, interactive table with one-click status reconciliation, and granular series deletion modal.

**12. Navigation Header and Dashboard Integration** - Update the main application header to include a direct navigation link for Incomes alongside Expenses and Cards. Update the dashboard home page to link the F05 module card directly to the new ledger view.

---

### Phase 4: Integration, Build Verification & Deployment

**13. Fullstack Build Validation** - Run the production build checks on both the NestJS backend and Next.js frontend to verify type soundness and static route generation.

**14. Automated Test Suite Execution** - Execute all backend test suites to confirm that all existing and new unit tests pass with zero regressions.

**15. Docker Container Deployment** - Rebuild and restart the containerized application stack to verify seamless multi-tenant operation in the local runtime environment.
