<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

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
