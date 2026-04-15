

# Plan: Dual-themed (light/dark) e-postmallar via Lovable Email

## Sammanfattning
Alla 6 autentiseringsmejl (signup, recovery, magic-link, invite, email-change, reauthentication) ska finnas i **two variants** -- light mode och dark mode -- som matchar landningssidans exakta utseende i respektive tema. Vilket mejl som skickas beror pa vilket tema anvandaren hade aktiverat vid tillfallet.

## Hur temaval propageras

### Signup (registrering)
Nar anvandaren registrerar sig, laggs deras aktiva tema (`document.documentElement.classList.contains('dark') ? 'dark' : 'light'`) in i `user_metadata.theme_preference` via `supabase.auth.signUp({ options: { data: { theme_preference: 'dark' } } })`.

### Ovriga mejl (recovery, magic-link, email-change, reauthentication)
Nar anvandaren begarer losenordsaterstellning, magic link, eller e-postbyte, uppdateras `user_metadata.theme_preference` fore begaran via `supabase.auth.updateUser({ data: { theme_preference } })`. Manga av dessa formularen ar synliga pa sidan med temat, sa vi laser temat fran DOM:en.

### Fallback
Om `theme_preference` saknas i metadata → default till `light`.

## Designfargerna (fran screenshots och index.css)

### Light mode
- **Body-bakgrund:** `#F9FAFB` (ljus gra, nestan vit)
- **Kort-bakgrund:** `#FFFFFF`
- **Rubrikfarg:** `#1E293B` (mork slate)
- **Brodtext:** `#64748B` (slate-gray)
- **Knappar:** gradient `#EE593D → #952A5E`
- **Lankar:** `#952A5E`
- **Border:** `#E2E8F0`
- **Navbar-bakgrund:** vit med subtil shadow

### Dark mode
- **Body-bakgrund:** `#120A0E` (mork wine, `hsl(347 40% 5%)`)
- **Kort-bakgrund:** `#1A1014` (wine-dark, `hsl(347 35% 8%)`)
- **Rubrikfarg:** `#F5F5F5` (off-white)
- **Brodtext:** `#8B9AB8` (muted blue-gray)
- **Knappar:** samma gradient `#EE593D → #952A5E`
- **Lankar:** `#D94F8C` (ljusare magenta, `hsl(326 60% 55%)`)
- **Border:** `#2A1A22` (`hsl(347 30% 18%)`)
- **Hero-bakgrund:** mork rosa-rod gradient tonad

## Steg

### 1. Aktivera Lovable Email
Slå on det inbyggda e-postsystemet igen (stängdes av tidigare).

### 2. Scaffolda auth-email-templates
Anvand det inbyggda verktyget for att skapa korrekt infrastruktur for `auth-email-hook`.

### 3. Overskriva alla 6 mallar med dual-theme-stod
Varje mall far en `theme` prop (`'light' | 'dark'`). Baserat pa denna renderas ratt fargschema. En gemensam `getStyles(theme)` funktion returnerar ratt CSS-objekt.

Mallarna matchar landningssidans estetik:
- Poppins typsnitt
- Gradient-knappar (behalles i bada teman)
- Rundade horn (20px kort, 16px knappar)
- Ratt bakgrunds- och textfarger per tema
- Subtil shadow pa kortet
- Logga i headern
- Footer med Integritetspolicy + Villkor + support-mejl

### 4. Uppdatera auth-email-hook
Hook:en laser `user.user_metadata.theme_preference` och skickar det som prop till varje mall. Fallback till `'light'` om saknas.

### 5. Uppdatera useAuth.tsx — skicka tema vid signup
Lagg till `theme_preference` i `data`-objektet vid `signUp`:
```tsx
data: {
  company_name: companyName,
  theme_preference: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
}
```

### 6. Uppdatera Auth.tsx — skicka tema vid recovery/magic-link
Fore `supabase.auth.resetPasswordForEmail()` (om anvandaren ar inloggad) eller som metadata i begaran, uppdatera theme_preference.

For password reset (anvandaren ar ej inloggad), kan vi inte uppdatera metadata. Dà anvands senast sparad `theme_preference` fran signup, eller fallback light.

### 7. Ta bort send-verification
- Radera `supabase/functions/send-verification/` mappen
- Ta bort den deployade funktionen
- Ta bort `supabase.functions.invoke("send-verification")` fran `Auth.tsx`

### 8. Deploya auth-email-hook
Deploya den uppdaterade funktionen for att aktivera de nya mallarna.

## Filer som skapas/andras
- `supabase/functions/auth-email-hook/index.ts` — omskriven (via scaffold + anpassning)
- `supabase/functions/_shared/email-templates/*.tsx` — alla 6 filer, dual-theme
- `src/hooks/useAuth.tsx` — lagg till `theme_preference` i signup metadata
- `src/pages/Auth.tsx` — ta bort send-verification invoke

## Filer som raderas
- `supabase/functions/send-verification/index.ts`

