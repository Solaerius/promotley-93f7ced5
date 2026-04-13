

# Plan: Replace App with V2 -- Single Continuous Phase

## Summary

Extract the v2 ZIP, audit its contents, replace the entire frontend, merge database schemas, adapt all Supabase client imports, install dependencies, and verify the build -- all in one continuous execution.

## What stays untouched (auto-managed by Lovable Cloud)
- `.env` -- auto-generated, never edit
- `src/integrations/supabase/client.ts` -- auto-generated, never edit
- `src/integrations/supabase/types.ts` -- auto-generated, never edit
- All 69 existing database migrations
- All 15 configured secrets (RESEND_API_KEY, TIKTOK keys, META keys, OPENAI_API_KEY, etc.)

## Single-phase execution order

1. **Extract ZIP** to `/tmp/promotley-v2/` and list full file tree
2. **Audit v2 structure**: identify Supabase client path, table names, edge functions, dependencies, env var references
3. **Compare v2 schema vs current schema**: identify new tables needed, column changes, new functions/triggers
4. **Create database migrations** for any new tables or schema changes v2 requires (using migration tool)
5. **Delete all current `src/` files** except `src/integrations/supabase/client.ts` and `src/integrations/supabase/types.ts`
6. **Copy all v2 `src/` files** into place
7. **Rewrite every Supabase import** in v2 code from whatever path v2 uses to `import { supabase } from "@/integrations/supabase/client"`
8. **Remove any hardcoded v2 Supabase URL/key references** (`fjasyvhooplekorfubxa.supabase.co`) -- these must come from the auto-managed `.env`
9. **Replace root config files** with v2 versions: `package.json`, `vite.config.ts`, `tailwind.config.ts`, `index.html`, `tsconfig*.json`, `components.json`, `postcss.config.js`
10. **Replace `public/`** folder with v2 assets
11. **Merge edge functions**: add new v2 functions to `supabase/functions/`, update existing ones if v2 has newer versions, keep current functions v2 doesn't touch
12. **Install dependencies** (`bun install`)
13. **Build and fix errors** -- resolve any TypeScript/import issues from the client swap
14. **Verify app loads** without runtime errors

## Risk mitigation
- All history is preserved in Lovable's revert system
- Database data is untouched -- only schema additions
- Secrets persist automatically
- If v2 needs new secrets not in the current 15, I will use `add_secret` to request them

## What I need to proceed
Nothing -- once approved I will extract the ZIP and execute everything continuously.

