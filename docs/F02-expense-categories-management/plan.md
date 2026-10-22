# Implementation Plan: F02. Expense Categories Management

**Prerequisites:**
- Node.js 20 LTS, TypeScript 5.x, npm workspaces
- PostgreSQL 16 instance with `financial_db`
- NestJS 10 backend framework with `@nestjs/passport`, `@nestjs/jwt`, `class-validator`, `class-transformer`
- Prisma ORM 5.22.0 client and CLI
- Next.js 14 (App Router) frontend with React 18, Tailwind CSS v4, and `lucide-react`
- Working multi-tenant foundation (F01) providing authentication cookies and `AccountContextGuard`
- Environment variables: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `PORT`, `FRONTEND_URL`

---

### Phase 1: Database Schema and Seeding

**1. Category Migration and Relational Schema** - Define the database migration creating the categories table with multi-tenant account references, composite uniqueness, and indexing. Refer to the spec for schema attributes and cascade constraints.

**2. Prisma Client Generation** - Update the Prisma schema to establish the category entity and bidirectional relationship with accounts, then regenerate the client library. Refer to the spec for enum definitions and relational mappings.

**3. System Category Seeding Service** - Implement the programmatic seeding routine responsible for inserting the initial system default categories into a newly created account. Refer to the spec for default names, colors, icons, and classification types.

---

### Phase 2: Backend Service and REST API

**4. Validation DTOs and Icon Catalog** - Create the input data transfer objects and validation schemas enforcing name length limits, hexadecimal color formatting, and the curated icon allowlist. Refer to the spec for specific validation rules and error codes.

**5. Categories Service Business Logic** - Build the core service handling category retrieval, creation quota enforcement, updates, and deletion integrity checks. Refer to the spec for the 50-category limit rule and transaction dependency validation.

**6. Categories Controller and Endpoint Exposure** - Implement the REST controller binding HTTP routes for listing, creating, updating, and deleting categories within the authenticated account context. Refer to the spec for endpoint contracts, response structures, and HTTP status codes.

**7. Account Lifecycle Integration** - Connect the category seeding logic to the account registration and workspace provisioning workflows so every new workspace begins with default categories. Refer to the spec for the account creation hook.

---

### Phase 3: Frontend User Interface

**8. Categories Management View and Header Navigation** - Construct the category settings page layout with tabbed category filtering and integrate direct navigation from the application header. Refer to the spec for route paths and filter state behavior.

**9. Category Card Presentation** - Build the responsive card component to render category icons, color badges, usage statistics, and administrative action triggers. Refer to the spec for visual styling and deletion lockout states.

**10. Icon Grid and Color Palette Selectors** - Implement interactive selector components enabling users to pick from the curated lifestyle icons and color swatches or enter custom hex codes. Refer to the spec for the curated icon catalog and color picker requirements.

**11. Category Creation and Editing Modal** - Build the overlay modal form coordinating user input, live visual previews, error feedback, and API mutation calls. Refer to the spec for form validation and submission behavior.

---

### Phase 4: Verification and Quality Assurance

**12. Service and Controller Unit Testing** - Implement automated unit test suites covering business rules, quota constraints, invalid inputs, and duplicate name rejections. Refer to the spec for test matrix specifications and assertions.

**13. Multi-Tenant Isolation and Integration Testing** - Conduct integration tests verifying that categories remain strictly isolated between accounts and that deletion guards function as expected. Refer to the spec for cross-tenant assertions and error code verification.

**14. End-to-End User Experience Validation** - Perform full browser testing validating category creation, editing, responsive rendering, and tab filtering across desktop and mobile screen sizes. Refer to the spec for acceptance criteria verification.
