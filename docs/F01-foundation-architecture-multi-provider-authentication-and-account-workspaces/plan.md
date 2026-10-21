# Implementation Plan: Foundation Architecture, Multi-Provider Authentication, and Account Workspaces

**Prerequisites:**
- Node.js runtime (v20+ LTS) and npm package manager
- PostgreSQL database instance (v15+) with connection credentials
- Google Cloud Console OAuth 2.0 Client ID and Secret configured with authorized redirect URI
- Environment variables configured for database URL, JWT secret keys, and OAuth credentials

---

### Stage 1: Repository Scaffolding and Database Foundation

**1. Workspace Directory and Monorepo Structure** - Initialize the decoupled project layout containing separate root directories for the NestJS backend and Next.js frontend. Configure baseline TypeScript compiler options, environment variable templates, and root development orchestration scripts. Reference Section 2 of the spec for directory layout.

**2. PostgreSQL and Prisma ORM Setup** - Initialize Prisma in the backend project and define the data model for users, accounts, memberships, invitations, and refresh tokens. Generate and apply the baseline SQL migration to the PostgreSQL database, establishing foreign keys, constraints, and performance indexes. Reference Section 6 of the spec for schema definitions.

**3. Prisma Client and Database Service** - Implement the centralized Prisma service module in the backend to manage database connections and client lifecycle events. Ensure robust connection pooling and graceful shutdown handling when the application terminates. Reference Section 4.1 of the spec for component responsibilities.

---

### Stage 2: Core Authentication and Session Infrastructure

**4. Argon2id Password Hashing Engine** - Implement the password management service executing cryptographically secure password hashing and verification. Configure memory and iteration parameters according to OWASP guidelines to prevent parallelized hardware attacks. Reference Section 1.3 and Section 3 of the spec for parameter specifications.

**5. JWT and Cookie Session Management** - Configure Passport JWT authentication strategies and secure cookie extractors to issue and validate short-lived access tokens and database-tracked refresh tokens. Implement token pair generation, refresh token rotation, and reuse detection logic. Reference Section 4.1 and Section 5 of the spec for session mechanics.

**6. Google OAuth 2.0 Integration** - Set up the Google OAuth 2.0 authentication strategy in the backend using OpenID Connect. Implement the authorization redirect trigger and callback endpoint to extract verified user identities and synchronize profile information. Reference Section 5.3 of the spec for callback specifications.

**7. Authentication API Module** - Implement the authentication controller and service managing email registration, password login, session renewal, and logout endpoints. Ensure the registration workflow automatically provisions a default personal account workspace and assigns the user as Administrator. Reference Section 5.1 and Section 5.2 of the spec for contract details.

---

### Stage 3: Multi-Tenant Workspace and Access Control

**8. Account Context Guard and Tenant Middleware** - Create the backend guard and execution context decorator to extract the active account identifier from request headers and cookies. Validate that the requesting user maintains an active membership in the target account before allowing the request to proceed. Reference Section 4.1 of the spec for guard architecture.

**9. Role-Based Authorization Guard** - Implement the RBAC authorization guard in the backend to enforce permission boundaries between Administrators and Members. Ensure administrative endpoints restrict access and reject unauthorized member actions. Reference Section 4.1 of the spec for RBAC logic.

**10. Account and Member Management Services** - Build the account controller and service managing workspace listing, active account switching, member invitations, role updates, and access revocations. Implement validation rules preventing the removal or demotion of an account's sole administrator and enabling auto-claim of pending invitations upon registration. Reference Section 5.4 through Section 5.7 of the spec for endpoint contracts.

---

### Stage 4: Frontend Layout, Authentication, and Account Switching

**11. Next.js Application Shell and Tailwind CSS Setup** - Initialize the Next.js 14 App Router project configured with TypeScript and Tailwind CSS v4. Create the core visual theme tokens, typography, and responsive application layout shell. Reference Section 4.2 of the spec for layout requirements.

**12. Authentication Pages and Edge Route Middleware** - Build the responsive login and registration interfaces featuring form validation indicators and the Google OAuth trigger. Configure Next.js edge middleware to inspect authentication session cookies, redirecting unauthenticated visitors to login and protecting internal application routes. Reference Section 4.2 of the spec for route behavior.

**13. Centralized API Client and Authentication Context** - Implement the frontend HTTP client wrapper with automatic credential inclusion, active tenant header forwarding, and automatic token refresh retries upon receiving 401 responses. Establish the React authentication context to distribute user session state and active account details throughout client components. Reference Section 4.2 of the spec for client architecture.

**14. Application Header and Account Switcher Component** - Create the persistent top navigation header featuring brand identification, user profile controls, and the interactive account switcher dropdown. Connect the switcher to the backend switch endpoint, enabling instantaneous transitions between personal and shared workspaces with automatic dashboard re-renders. Reference Section 4.2 of the spec for component details.

**15. Member Management Interface** - Develop the workspace collaboration view at `/settings/members` displaying the active account's roster and role badges. Implement the member invitation modal and role management controls visible exclusively to account administrators. Reference Section 4.2 of the spec for interface requirements.
