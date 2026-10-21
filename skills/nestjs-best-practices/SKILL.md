---
name: nestjs-best-practices
description: Official architectural best practices for NestJS, covering feature-driven modules, dependency injection, validation pipes, exception filters, Prisma ORM, and production security.
---

# NestJS Best Practices & Production Guidelines

Architectural standards and best practices for developing scalable, secure, enterprise-ready NestJS backends.

---

## 1. Modular, Feature-Driven Architecture

### Domain-Driven Slices
- Organize code by business feature/domain (e.g., `modules/auth`, `modules/accounts`, `modules/expenses`), NOT by technical type (do not group all controllers in one folder and all services in another).
- Moving or deleting a feature should require moving or deleting only its self-contained feature directory.

### Typical Feature Module Structure
```
src/modules/<feature>/
├── dto/                  # Data Transfer Objects with validation decorators
│   ├── create-<feature>.dto.ts
│   └── update-<feature>.dto.ts
├── <feature>.controller.ts   # HTTP routes and request mapping
├── <feature>.service.ts      # Core business logic and database orchestration
├── <feature>.module.ts       # Module definition with controllers and providers
└── <feature>.service.spec.ts # Isolated unit tests with mocked dependencies
```

---

## 2. Dependency Injection & Module Boundaries

### Explicit Provider Exports
- Services in NestJS are encapsulated and private to their defining module by default.
- To share a service with other modules, explicitly add it to the `exports` array of its `Module` and import that module where needed.
- Avoid marking modules as `@Global()` unless they are truly transversal infrastructure (e.g., `PrismaModule`, `ConfigModule`).

### Circular Dependency Avoidance
- Circular dependencies between modules (`Module A <-> Module B`) indicate poor domain modeling. Extract shared models or services into a neutral submodule rather than relying on `forwardRef()`.

---

## 3. Request Validation & Exception Handling

### Global ValidationPipe Configuration
Always register a global `ValidationPipe` in `main.ts` with strict security options:
```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,            // Strip unexpected properties not declared in DTO
    forbidNonWhitelisted: true, // Reject requests containing unknown payload fields
    transform: true,            // Automatically cast primitive types and instantiate DTO classes
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
);
```

### Strict DTO Decoration
- Use `class-validator` and `class-transformer` on every request DTO.
- Every expected field must have explicit validation decorators (`@IsString()`, `@IsEmail()`, `@IsNumber()`, `@IsOptional()`).

### Centralized Exception Filters
- Implement a global `HttpExceptionFilter` extending `BaseExceptionFilter` to format all application errors into a predictable JSON structure (`{ status, error, message, timestamp, path }`).
- Never leak raw SQL errors, stack traces, or internal database metadata to client responses in production.

---

## 4. Database Layer & Prisma ORM Best Practices

### Service-Encapsulated Queries
- Keep all database interactions strictly inside NestJS services. Controllers must only handle HTTP routing, request parsing, and status codes.
- Inject `PrismaService` via constructor dependency injection.

### Transaction Management
- Whenever an operation mutates multiple tables (e.g., creating an account and assigning an initial admin membership), wrap the operations inside `prisma.$transaction([...])` or interactive transactions `prisma.$transaction(async (tx) => { ... })` to guarantee atomicity.

### Multi-Tenancy Guard Pattern
- Protect multi-tenant resources with an `AccountContextGuard` that verifies the requesting user's active membership in `account_memberships` and injects the tenant context into `req.accountContext`.
- Ensure all repository queries include `account_id` in their `where` clause to prevent cross-tenant data leaks.

---

## 5. Security & Production Hardening

### Security Middleware
In `main.ts`, apply essential production security middleware:
1. **Helmet:** `app.use(helmet())` to set secure HTTP headers.
2. **CORS:** Configure explicit whitelist origins; never allow wildcard `*` with credentials in production.
3. **Cookie Parser:** Use `cookie-parser` for secure `HttpOnly`, `SameSite=Lax` session cookie parsing.
4. **Rate Limiting:** Protect public and auth routes with `@nestjs/throttler` to mitigate brute-force attacks.

### Safe Password Storage
- Hash passwords using **Argon2id** (`@node-rs/argon2` or `argon2`) with OWASP-recommended parameters ($m \ge 19\,\text{MiB}$, $t \ge 2$, $p=1$).
- Never store plaintext passwords or weak hashes (MD5, SHA-256).
