

# Dev Auto-Login for Browser Testing

## Problem
When Lovable's browser automation tests protected dashboard pages, it gets stuck at the login screen. The preview iframe session must be authenticated first.

## Solution
Create a **development-only auto-login route** (`/dev/auto-login`) that:
1. Only renders in non-production builds (checks `window.location.hostname` for preview/localhost)
2. Automatically signs in using a dedicated test account via real authentication
3. Redirects to `/dashboard` after successful login
4. Is completely excluded from production builds

This lets browser automation navigate to `/dev/auto-login` before testing any protected page.

## Implementation

### 1. Create `src/pages/DevAutoLogin.tsx`
- Check if running on preview/localhost domain — if not, redirect to `/`
- Call `supabase.auth.signInWithPassword()` with test credentials from environment or hardcoded dev account
- Show a loading spinner during auth, then redirect to `/dashboard`
- Display clear "DEV ONLY" warning banner

### 2. Create test account edge function `supabase/functions/dev-setup/index.ts`
- Creates a test user account if it doesn't exist (e.g. `test@promotely.dev`)
- Only works when called from preview/localhost origins
- Returns the test credentials

### 3. Add route to `src/App.tsx`
- Add `/dev/auto-login` route with the DevAutoLogin component
- No `ProtectedRoute` wrapper (it IS the login mechanism)
- Only rendered in development mode via `import.meta.env.DEV` check

### 4. Usage in browser testing
```text
1. navigate_to_sandbox → /dev/auto-login
2. Wait for auto-redirect to /dashboard
3. Proceed with testing any protected page
```

## Security
- Route only exists when `import.meta.env.DEV` is true (Vite strips it from production builds)
- Additional hostname check as fallback
- Test account has minimal permissions (no admin)
- No hardcoded production credentials

## Files Changed
| File | Change |
|------|--------|
| `src/pages/DevAutoLogin.tsx` | New — auto-login component |
| `src/App.tsx` | Add dev route |
| `supabase/functions/dev-setup/index.ts` | New — test account provisioning |

