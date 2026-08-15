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

<!-- BEGIN:appwrite-rules -->

# Appwrite, Environment & Infrastructure

- **Research & Context:** When working with Appwrite, ALWAYS use the provided Appwrite MCP tools (e.g. `appwrite-api`, `appwrite-docs`) and the `appwrite-cli` / `appwrite-typescript` skills for context and documentation. Do not guess Appwrite APIs or CLI commands.
- **Project Environments:** Each project (`webapp` and `website`) maintains its own `.env` and `.env.example` file located directly in its project directory with its respective URLs, keys, and settings.
- **Database IDs:** Each project defines `NEXT_PUBLIC_APPWRITE_DATABASE_ID` in its own `.env` (e.g., `webapp` for the webapp and `website` for the landing page).
- **Development & Production Ports:** In development, the website runs on port 3000 (`next dev --port 3000`) and the webapp on port 3001 (`next dev --port 3001`). In production, both start with standard `next start` (defaulting to port 3000).
- **CLI Config (`appwrite.json`):** The `appwrite.json` at the project root only contains the public `projectId` and `endpoint` for the CLI. Do not hardcode sensitive variables in it.
- **Database Schema (Infrastructure as Code):** The entire database schema (tables, collections, attributes, indexes) is stored directly in `appwrite.json`. 
  - To initialize or update the databases on Appwrite, simply run: `npx appwrite-cli push tables` from the root directory.
  - Do NOT use custom JS initialization scripts.
- **Appwrite Functions:**
  - Functions are located in `appwrite/functions/<functionName>/`.
  - When deploying Appwrite Functions, use the `--with-variables` flag to push variables to the cloud environment:
    `npx appwrite-cli push functions --all --with-variables`

<!-- END:appwrite-rules -->
