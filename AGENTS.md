<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
- **Proxy Convention (Next.js 16+):** The `middleware.ts` file convention is deprecated and renamed to `proxy.ts`. Always use `proxy.ts` (exporting `export const proxy = ...` and default export) instead of `middleware.ts`.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:shadcn-agent-rules -->

# shadcn

While interacting with shadcn make sure to use the shadcn mcp for more context.

<!-- END:shadcn-agent-rules -->

<!-- BEGIN:i18n-rules -->

# Internationalization (i18n)

All UI texts, labels, and URLs must be handled consistently and exclusively using `next-intl` (i.e. `t("key")`).
- DO NOT hardcode any language strings directly in JSX (e.g. `<div>Speichern</div>`).
- DO NOT use logical fallbacks with hardcoded text (e.g. `{t("key") || "Fallback"}`).
- DO NOT use ternary conditions based on locale for URLs or texts (e.g. `locale === "de" ? "/de/agb" : "/en/terms"`). Define these as translation keys in `i18n.ts` instead.

<!-- END:i18n-rules -->

<!-- BEGIN:anti-ai-slop-rules -->

# Anti-AI Slop & Clean Code Quality

Keep the codebase clean, professional, minimal, and human-written. Strictly follow these quality constraints:

1. **Zero Emojis:**
   - DO NOT use emojis anywhere in the codebase: no emojis in source code, JSX, comments, documentation, markdown headers, or commit messages.
   - Use Phosphor Icons (`@phosphor-icons/react`) for UI iconography.

2. **No Decorative Comment Dividers:**
   - DO NOT use decorative AI-style horizontal comment lines (e.g. `// ─── Categories ───` or `// ==================`).
   - Use clean, standard, idiomatic comments (e.g. `// Categories`, `// Menu Items`).

3. **No AI Debug Logging:**
   - DO NOT introduce temporary or weird `console.log` statements (e.g. `console.log("Here we do...", ...)`, `console.log("DEBUG: ...")`).
   - Use only standardized `console.error` and `console.warn` for genuine, unhandled server-side exceptions or browser API fallback events.

4. **No Boilerplate Bloat or Over-Engineering:**
   - Write concise, idiomatic, high-performance TypeScript. Avoid unnecessary abstractions, wrapper-layers, or redundant types.

<!-- END:anti-ai-slop-rules -->

<!-- BEGIN:architecture-security-rules -->

# System Architecture & Security (Defense-in-Depth)

Follow this unified, multi-layered architecture for all features and changes:

1. **Strict Layering & Entry Points:**
   - **Client Components** must NEVER call mutating Convex functions directly. All mutations MUST run through Next.js Server Actions (`webapp/actions/`).
   - **Server Actions** are the authoritative boundary: validate input types, verify authorization, sanitize errors, and call Convex via `convexServer`.
   - **Convex Functions** enforce defense-in-depth: validate string lengths, bounds, and business invariants directly in mutation handlers.

2. **Tenant Isolation & Authorization (Anti-IDOR):**
   - Every Server Action that modifies or accesses organization data MUST call `await requireOwner(organizationId)`. Never trust client-supplied `organizationId` without checking `org.ownerId === user._id`.
   - Operations on terminal endpoints (kitchen display, 86-availability) must be authorized with `requireKitchenOrOwner` or `requireStaffOrOwner`.
   - Dashboard layouts must strictly verify ownership (`if (org.ownerId !== user._id && org.ownerId !== user.$id) redirect("/sign-in")`).

3. **Zero Data Leakage (Guest Boundary & DOM Hygiene):**
   - When passing data to public guest pages (`to-go`, `to-stay`), NEVER expose sensitive merchant or platform accounting data (`stripeAccountId`, `taxId`, `ownerId`, `zakkigFee`, `stripeFee`, `netAmount`). Always sanitize or zero out before serializing into RSC payloads or query responses.

4. **Server-Side Price & Integrity Enforcement:**
   - NEVER trust client-supplied prices, item names, or order totals.
   - `createPaymentIntent` must query the database, check that each item exists, is available (`available !== false`), satisfies minimum price, and recalculates `calculatedTotal === args.total` to the exact cent.

5. **Convex Public API Surface Minimization:**
   - Functions not called directly by the browser MUST be declared as `internalMutation`, `internalQuery`, or `internalAction` (e.g. file deletion, database seeds, webhook order processing).
   - Sensitive user mutations (`createAccountDeletionToken`, `createEmailChangeToken`) must require and verify a valid server-issued `sessionToken`.
   - Never leave unauthenticated or debug queries (like `listAll`) open on Convex.

6. **Standardized Lifecycles & Timeouts (TTL):**
   - **Auth, OTPs & Security Links:** Strictly 30 minutes (`30 * 60 * 1000` ms).
   - **Brute-Force Lockout:** OTP codes must track failed attempts and permanently delete the code after 5 failures.
   - **Unverified Accounts:** Delete unverified registrations automatically after 30 minutes via the Convex scheduler.
   - **Kitchen Board Auto-Archive:** 15 minutes for completed orders.
   - **Guest Takeaway Tracker:** 10 minutes active countdown once ready for pickup.

7. **Terminal Session Persistence:**
   - Terminal pairing tokens from URLs (`?token=...`) must be persisted via secure, HttpOnly, SameSite=lax cookies (`order_session_[orgId]`, `availability_session_[orgId]`). Never store pairing tokens in unencrypted client `localStorage`.

<!-- END:architecture-security-rules -->

<!-- BEGIN:ui-feedback-conventions -->

# UI Feedback, Form Errors & Toast Conventions

1. **Toast Notifications:**
   - Must ALWAYS render at the top center (`position="top-center"`), regardless of viewport (desktop or mobile).
   - Icons are reserved exclusively for toasts (positioned on the left of the pill). The text in the container to the right of the icon is centered.
   - DO NOT fire a toast if an inline error message is already visible on the screen or form (avoid duplicate user feedback).

2. **Form Errors & Inline Notices:**
   - Must ALWAYS be left-aligned (`text-left`, `w-full`).
   - Must ALWAYS use the standard error color token `text-destructive` with `text-sm font-medium` (or `text-sm font-semibold`).
   - DO NOT use icons next to inline form error or warning text.
   - DO NOT use heavy, blocky background alert boxes for simple form validation errors or attempts counters.

<!-- END:ui-feedback-conventions -->
