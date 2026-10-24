# Implementation Plan: F07. Monthly Expense Grouping and Analytics Dashboard

## Prerequisites

- Foundation architecture, multi-tenant workspace context, and authentication active (F01).
- Category management system implemented (F02).
- Credit cards and monthly rolling invoices engine active (F03).
- Expense entry, installment allocation, and recurrence materialization operational (F04).
- Income tracking and cash flow deposits operational (F05).
- Settlement engine, overdue calculation, and invoice payment modals functional (F06).

---

## Phase 1: Backend Aggregation Engine & REST Analytics API

### 1. Dashboard Module Setup
Create the `dashboard` module and controller within the NestJS backend structure, register it in the application root module, and enforce authenticated workspace context guards across all analytics endpoints.

### 2. Request Validation DTO & Query Boundaries
Implement query parameter validation for calendar year and month ranges, ensuring that requests outside the supported historical or projection boundaries are safely rejected with descriptive errors.

### 3. Consolidated Analytics Aggregation Service
Implement the analytical aggregation engine in `DashboardService` that executes concurrent database queries across incomes, credit card invoices, and direct cash expenses, computing the 5 top-level KPI metrics, brand groupings, direct method groupings, and category percentage distributions as detailed in the specification.

### 4. Unit & Integration Test Suites
Add automated unit tests verifying the mathematical precision of the 5 financial summary metrics, brand grouping consolidation, method segregation, and category distribution percentages, along with integration test coverage for the REST endpoint.

---

## Phase 2: Frontend Dashboard Header, Month Navigation & Financial Summary Bar

### 5. Month Timeline Selector Component
Build the interactive `MonthSelector` component displaying the horizontal 12-month forward/backward timeline, active month highlight, chevron navigators, and quick "Hoje" jump button, with smooth transition animations.

### 6. Executive Financial Summary Bar Component
Build the `FinancialSummaryBar` component rendering the 5 executive metric cards (Total Income, Total Expenses, Total Paid, Total Pending, and Net Balance) with dynamic surplus/deficit color schemes and trend badges.

### 7. Dashboard State & Data Fetching Layer
Configure the primary dashboard data fetching hook and state management in `frontend/src/app/(dashboard)/page.tsx`, coordinating month changes, loading skeletons, error recovery banners, and optimistic state updates.

---

## Phase 3: Block 1 Credit Cards (Brand Hierarchy) & Block 2 Direct Expenses

### 8. Credit Card Brand Grouping Accordion Block
Implement the `CreditCardBrandGroup` component rendering the multi-tier hierarchy (Network Brand $\rightarrow$ Specific Cards $\rightarrow$ Monthly Invoices $\rightarrow$ Itemized Purchases) with brand badges, card summary chips, invoice status tags, and expandable transaction tables.

### 9. Invoice Settlement Integration on Dashboard
Integrate the F06 `InvoicePaymentModal` and `InvoiceReopenModal` within the card accordion block, allowing users to settle or reopen invoices directly from the dashboard view with immediate recalculation of the summary metrics.

### 10. Direct Expenses Segregated Block
Implement the `DirectExpensesGroup` component rendering the 3 distinct panels for Boletos, Pix, and Débito em Conta, displaying item counts, subtotal liabilities, paid amounts, and pending amounts.

### 11. Interactive Cash Expense Status Toggle Integration
Embed the F06 `CashExpenseStatusToggle` component inside the direct expense tables, allowing 1-click status toggling (`PAID` vs `PENDING`) with real-time propagation to the dashboard's paid/pending KPI cards.

---

## Phase 4: Category Donut Chart, Statement Export & Root Page Elevation

### 12. Native SVG Category Distribution Donut Chart
Implement the `CategoryDonutChart` component using pure React and responsive SVG vector paths to render the proportional category expense breakdown with interactive segment hover states, center labels, and category color legend chips.

### 13. Client-Side RFC-4180 CSV Statement Generator
Implement the CSV generation utility in `export-utils.ts` that compiles all monthly incomes, credit card items, and direct expenses into a formatted UTF-8 BOM CSV file with Brazilian currency formatting for seamless Excel import.

### 14. Print & PDF Statement Layout
Implement the print-ready statement layout and trigger in `MonthlyExportModal` using clean `@media print` CSS rules to produce formatted, executive A4 PDF reports directly from the browser's print engine.

### 15. Root Page Replacement & UI Polish
Elevate `/` (`frontend/src/app/(dashboard)/page.tsx`) to become the complete financial dashboard cockpit, replacing the initial splash layout with responsive desktop and mobile views, sticky month navigation, and polished micro-interactions.
