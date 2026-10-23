# Implementation Plan: F06. Expense Settlement and Invoice Payment

**Prerequisites:**
- Node.js 20+ and npm package manager
- Docker and Docker Compose running PostgreSQL, backend, and frontend containers
- Active database with migrations for F01 (Foundation), F02 (Categories), F03 (Cards/Invoices), and F04 (Expenses) applied
- Authenticated session with active account context

---

### Phase 1: Database Schema & Migration

**1. Expense Settlement Data Model** - Extend the Prisma schema for the expense entity to support financial settlement timestamps and query optimization for downstream ledger reconciliation. Reference the spec for data model details.

**2. Database Migration Generation** - Generate and deploy the PostgreSQL migration script in Prisma to alter the expenses table and create the corresponding index for settlement operations. Reference the spec for migration details.

**3. Prisma Client Regeneration** - Rebuild the Prisma Client to expose the updated entity types and query capabilities across backend services. Reference the spec for component details.

---

### Phase 2: Backend Settlement Engine & REST APIs

**4. Dynamic Expense Status Calculation Utility** - Implement a pure calculation utility to dynamically evaluate payment and overdue statuses and compute elapsed days past due date. Reference the spec for status determination rules.

**5. Expense Settlement Data Transfer Objects** - Implement input validation DTOs for settling individual cash expenses, supporting status overrides, settlement timestamps, and optimistic concurrency tokens. Reference the spec for validation schemas.

**6. Expense Settlement Core Service** - Enhance the expense service to execute granular cash settlement, block direct manipulation of credit card transactions, and enforce optimistic concurrency checks. Reference the spec for business logic rules.

**7. Expense Settlement REST Controller Endpoint** - Expose the cash settlement route on the expenses controller protected by authentication and account context guards. Reference the spec for API contracts.

**8. Invoice Settlement Data Transfer Objects** - Implement input validation DTOs for paying and reopening credit card monthly invoices, including confirmation flags and concurrency tokens. Reference the spec for payload definitions.

**9. Invoice Settlement and Rollback Service** - Enhance the invoice service to atomically settle credit card invoices and cascade settlement to all linked purchases, and to provide transactional reopening with rollback. Reference the spec for state machine details.

**10. Invoice Settlement REST Controller Endpoints** - Expose invoice payment and reopening routes on the credit cards controller guarded by authentication and tenant isolation. Reference the spec for API endpoints.

---

### Phase 3: Frontend User Interface & Interactive Workflows

**11. Interactive Cash Expense Status Toggle Component** - Build a reusable status badge component with micro-animations supporting one-click settlement toggling, pending and paid visual states, and pulsing overdue warnings. Reference the spec for UX flows.

**12. Credit Card Invoice Payment Modal** - Create a confirmation dialog component displaying card invoice summaries and allowing users to select payment dates and confirm consolidated payments. Reference the spec for interaction design.

**13. Invoice Reopening Warning Modal** - Implement a warning modal displaying the count of included purchases and requiring explicit confirmation before reverting an invoice and its transactions. Reference the spec for error handling dialogs.

**14. Expense Ledger and Card View Integration** - Integrate the settlement components into the expenses table and credit card management views, connecting live API actions and conflict error toasts. Reference the spec for component integration.
