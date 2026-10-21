---
name: nextjs-best-practices
description: Official best practices for Next.js 14+ App Router, Server Components, client boundaries, data fetching, streaming, and performance optimization.
---

# Next.js Best Practices & Production Guidelines

Guidelines and patterns for developing production-grade applications with Next.js 14+ (App Router).

---

## 1. Component Architecture & Server/Client Boundaries

### Server Components (RSC) by Default
- Treat all components inside `app/` as **React Server Components** by default.
- Do NOT add `'use client'` at the page level. Keep the client boundary pushed as far down the component tree as possible to leaf components (e.g., interactive buttons, forms, dropdowns).
- Server Components reduce client bundle size, keep secrets and database access secure on the server, and improve First Contentful Paint (FCP).

### When to use `'use client'`
Only mark a component with `'use client'` when it requires:
1. React state (`useState`, `useReducer`) or lifecycle effects (`useEffect`, `useLayoutEffect`).
2. Browser-only APIs (DOM access, `window`, `localStorage`, `navigator`).
3. Custom React hooks dependent on state/context.
4. Native event listeners (`onClick`, `onChange`, `onSubmit`).

### Passing Server Components into Client Components
- Pass Server Components as `children` or props to Client Components to avoid forcing the entire subtree to be rendered on the client:
```tsx
// Good: Server content rendered on server and passed through client wrapper
<ClientModal>
  <ServerProfileDetails userId={user.id} />
</ClientModal>
```

---

## 2. Project Layout & Routing Conventions

### Colocation & Route Groups
- Use **Route Groups** (folders with parentheses like `(auth)`, `(dashboard)`) to organize routes by layout or operational domain without altering the public URL paths.
- Colocate route-specific components, hooks, and helpers in private subdirectories (e.g., `_components`) right beside the `page.tsx` file that consumes them.

### App Router Special Files
Leverage Next.js special files instead of manual state wrappers:
- `layout.tsx`: Persistent UI layout across route transitions (preserves state, does not re-render).
- `loading.tsx`: Automatically wraps page content in React `<Suspense>`, providing instant skeleton/loading feedback during navigations.
- `error.tsx`: Must be a Client Component (`'use client'`). Automatically wraps children in a React Error Boundary with `reset()` capabilities.
- `not-found.tsx`: Renders when `notFound()` is invoked or an unknown URL is requested.

---

## 3. Data Fetching, Mutations & Caching

### Parallelized Requests
- Never introduce sequential request waterfalls for independent data queries. Fetch independent data concurrently:
```tsx
const [user, accounts] = await Promise.all([
  getUserProfile(),
  getUserAccounts(),
]);
```

### Server Actions for Mutations
- Encapsulate data mutations (create, update, delete) inside Server Actions (`'use server'`).
- Always validate input arguments inside Server Actions using schemas (e.g., `zod`).
- After completing a mutation, trigger cache revalidation using `revalidatePath()` or `revalidateTag()` to ensure updated data renders immediately.

---

## 4. Performance & Core Web Vitals

### Font & Image Optimization
- Always use `next/font/google` or `next/font/local` to self-host fonts at build time with zero external network requests and zero Cumulative Layout Shift (CLS).
- Always use `next/image` with explicit `width`/`height` or `fill` with `sizes` to automatically serve modern formats (AVIF/WebP) and prevent layout shifts.

### Streaming with Suspense
- Deconstruct heavy pages into modular widgets wrapped in `<Suspense fallback={<Skeleton />}>` so that fast header/layout sections stream instantly while slower async queries resolve.

---

## 5. Security & Environment Variables

- **Strict Environment Isolation:** Prefix only variables that MUST be publicly accessible to the browser with `NEXT_PUBLIC_`. Keep API keys, backend secrets, and encryption keys strictly un-prefixed.
- **Edge Route Protection:** Use `middleware.ts` to inspect authentication cookies/headers and redirect unauthenticated requests before running server component renders.
