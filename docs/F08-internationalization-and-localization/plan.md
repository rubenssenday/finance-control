# Implementation Plan: F08. Internationalization and Localization Architecture (i18n / pt-BR)

## Prerequisites

- Foundation architecture, multi-tenant workspace context, and authentication active (F01).
- Category management system implemented (F02).
- Credit cards and monthly rolling invoices engine active (F03).
- Expense entry, installment allocation, and recurrence materialization operational (F04).
- Income tracking and cash flow deposits operational (F05).
- Settlement engine, overdue calculation, and invoice payment modals functional (F06).
- Monthly expense grouping and analytics dashboard operational (F07).

---

## Phase 1: Translation Dictionaries & Centralized Native Formatters

### 1. Translation Dictionaries Setup
Create the modular translation catalogs in `frontend/src/locales/pt-BR.json` and `frontend/src/locales/en-US.json`, cataloging all application text including dashboard headers, modal labels, error messages, and currency/date formatting tokens.

### 2. Pure Internationalization Formatting Module
Implement the native formatting functions in `frontend/src/lib/i18n/formatters.ts` leveraging ECMAScript `Intl.NumberFormat` and `Intl.DateTimeFormat` for BRL currency, Brazilian little-endian dates, 24-hour timestamps, and decimal string parsing as detailed in the spec.

### 3. Formatter Unit Test Suite
Implement unit test coverage in `frontend/src/lib/i18n/__tests__/formatters.spec.ts` verifying currency rounding, cent-level accuracy, and locale date variations.

---

## Phase 2: Frontend Reactive I18n Context, Header Switcher & API Client

### 4. React I18n Context & Provider
Create the `I18nContext`, `I18nProvider`, and `useTranslation` hook in `frontend/src/lib/i18n/i18n-context.tsx`, managing reactive locale state, multi-tier fallback resolution, and persistent cookies and local storage.

### 5. Application Root Shell Integration
Update `frontend/src/app/layout.tsx` to wrap the component tree with `I18nProvider`, dynamically configuring the root document language attribute.

### 6. Header Locale Switcher Component
Create the interactive `LocaleSwitcher` dropdown and embed it into `frontend/src/components/layout/AppHeader.tsx`, providing visual flag and language selection with instant UI re-rendering.

### 7. Localized API Client Interceptor
Update `frontend/src/lib/api-client.ts` to automatically inject the active locale into the `Accept-Language` HTTP header for all backend requests.

---

## Phase 3: Backend Localized Error Catalog & API Boundary Middleware

### 8. Backend Translation Catalog & Types
Define the backend locale message catalog in `backend/src/common/i18n/messages/pt-BR.ts` and `en-US.ts` mapping standard machine-readable error codes to localized user-friendly descriptions.

### 9. Backend I18n Resolution Service
Implement `I18nService` in `backend/src/common/i18n/i18n.service.ts` to parse incoming `Accept-Language` headers, match the requested locale, and interpolate dynamic message parameters.

### 10. Centralized Exception Filter & CORS Update
Modify `HttpExceptionFilter` and `main.ts` in the NestJS backend to translate error responses at the API boundary while preserving original error codes and allowing `Accept-Language` headers in CORS requests.

---

## Phase 4: Component-Wide UI Migration & Export Localization

### 11. Dashboard & Navigation Strings Localization
Refactor `MonthSelector`, `FinancialSummaryBar`, `CreditCardBrandGroup`, and `DirectExpensesGroup` in the dashboard module to replace hardcoded strings with dictionary translation keys and centralized formatters.

### 12. Financial Modals & Forms Localization
Update expense entry, income creation, credit card configuration, and category management modals to utilize localized labels, placeholders, payment method badges, and formatted inputs.

### 13. Settlement Modals & Statement Export Localization
Localize invoice settlement confirmations, cash status badges, and statement export utilities in `export-utils.ts` to generate BRL-compliant CSV headers and print layouts.
