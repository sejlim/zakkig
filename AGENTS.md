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
- **Centralized Environment:** We use a **single centralized `.env` file** at the root of the project. Any API keys or credentials needed for authentication (e.g. `APPWRITE_API_KEY`) are exclusively stored here.
- **Environment Loading:** The `webapp` and `website` projects use `dotenv-cli` in their `package.json` scripts to automatically load the root `.env` file (e.g. `dotenv -e ../.env -- next dev`). There are no symlinks and no nested `.env.example` files.
- **Database IDs:** Database IDs are explicitly separated. Use `NEXT_PUBLIC_APPWRITE_DATABASE_ID_WEBAPP` and `NEXT_PUBLIC_APPWRITE_DATABASE_ID_WEBSITE`.
- **CLI Config (`appwrite.json`):** The `appwrite.json` at the project root only contains the public `projectId` and `endpoint` for the CLI. Do not hardcode sensitive variables in it.
- **Database Schema (Infrastructure as Code):** The entire database schema (tables, collections, attributes, indexes) is stored directly in `appwrite.json`. 
  - To initialize or update the databases on Appwrite, simply run: `npx appwrite-cli push tables` from the root directory.
  - Do NOT use custom JS initialization scripts.
- **Appwrite Functions:**
  - Functions are located in `appwrite/functions/<functionName>/`.
  - When deploying Appwrite Functions, **always** use the `--with-variables` flag to securely push the `.env` variables from the root directory to the cloud environment:
    `npx appwrite-cli push functions --all --with-variables`

<!-- END:appwrite-rules -->
