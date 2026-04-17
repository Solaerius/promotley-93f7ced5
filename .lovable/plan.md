` tags (read-only mode — cannot execute the phased changes). I'll deliver the audit findings AND the proposed fix plan in one approval-ready document.

<lov-plan>

# Plan: Fixa onboarding-persistens + ta bort dubbel "skapa organisation"-prompt

## Phase 1 — Audit av v2 onboarding-flödet (resultat)

Det finns **tre konkurrerande "skapa organisation"-flöden** i kodbasen. Det är därför företagsdata inte landar där dashboarden tittar.

### De tre flödena

| Flöde | Fil | Vad det gör | Skriver till `organization_profiles`? |
|---|---|---|---|
| **A. Nytt v2-flöde (4 steg, mode-väljare)** | `src/pages/Onboarding.tsx` (route `/onboarding`) | Skapar org via `createOrganization()` + skriver fält till `ai_profiles` (per-user) | **Nej** |
| **B. Gammalt flöde (tabbar)** | `src/pages/OrganizationOnboarding.tsx` (route `/organization/onboarding`) | Skapar bara org-namn, inget annat | **Nej** |
| **C. CreateOrganization (4 steg, separat)** | `src/pages/CreateOrganization.tsx` (route `/organization/new`) | Skapar org + skriver till `organization_profiles` | **Ja** — men med 3 kolumner som inte finns: `linkedin_handle`, `x_handle`, `newsletter_opt_in` (hela insert kraschar) |

### Roten till problemet

`DashboardLayout.tsx` (rad 39–43) tvångs-redirectar till **flöde B** (`/organization/onboarding`) så fort `useOrganization` rapporterar `needsOnboarding = true` — det baseras enbart på `organization_members`-radens existens.

Det betyder:
- Användare som går igenom det fina nya **flöde A** (`/onboarding`) skapar visserligen en org, men `ai_profiles`-fälten är per-user, inte per-org. Dashboarden bryr sig inte om dem.
- Om något felar i `createOrganization` → tom org-medlemskapsrad saknas → dashboard skickar tillbaka till **flöde B** → "Skapa organisation"-prompten dyker upp igen.
- Inget av flödena (utom det trasiga C) skriver något till `organization_profiles`, så företagets profilkolumner är alltid tomma.

### Fält-för-fält-tabell (v2-registrering = `Onboarding.tsx`)

| Fält | Skriver till nu | Finns kolumn på `organizations` / `organization_profiles`? |
|---|---|---|
| `full_name` | `auth.user_metadata.full_name` | n/a (användarmetadata) |
| `foretagsnamn` | `organizations.name` (via RPC) + `ai_profiles.foretagsnamn` | ✅ `organizations.name` |
| `branch` | `ai_profiles.branch` | ✅ `organization_profiles.industry` (men skrivs ej dit) |
| `stad` | `ai_profiles.stad` | ✅ `organization_profiles.city` (skrivs ej dit) |
| `postnummer` | `ai_profiles.postnummer` | ❌ (saknas på org_profiles) |
| `land` | `ai_profiles.land` | ❌ (saknas på org_profiles) |
| `malgrupp` | `ai_profiles.malgrupp` | ✅ `organization_profiles.target_audience` (skrivs ej dit) |
| `produkt_beskrivning` | `ai_profiles.produkt_beskrivning` | ✅ `organization_profiles.unique_properties` (skrivs ej dit) |
| `malsattning` | `ai_profiles.malsattning` | ✅ `organization_profiles.goals` (skrivs ej dit) |
| `prisniva` | `ai_profiles.prisniva` | ❌ (saknas) |
| `nyckelord` | `ai_profiles.nyckelord` | ❌ (saknas) |
| `tonalitet` | `ai_profiles.tonalitet` | ✅ `organization_profiles.tone` (skrivs ej dit) |
| `allman_info` | `ai_profiles.allman_info` | ❌ (saknas) |
| `acceptedTerms` | ingenstans | n/a |
| `newsletter` | ingenstans (signup-värdet skrivs till `users.email_newsletter` via `useAuth.signUp`, men onboarding-värdet ignoreras) | ✅ `users.email_newsletter` |

## Phase 2 — v1 vs v2 diff (resultat)

| Aspekt | v1 (`OrganizationOnboarding.tsx` + `CreateOrganization.tsx`) | v2 (`Onboarding.tsx`) |
|---|---|---|
| Skapar org | Ja (via samma RPC) | Ja |
| Skriver `organization_profiles` | C gör det (men trasigt — 3 felaktiga kolumner) | Nej |
| Skriver `ai_profiles` per användare | Nej | Ja (alla fält) |
| Dashboard-redirect-mål | `/organization/onboarding` (B) | borde vara `/onboarding` (A) men är fortfarande B |
| Mode-väljare (skapa/gå med) | Tabbar | Stegbaserad |
| Postnummer-validering | Nej | Ja (5 siffror) |
| Termsacceptans | Ja | Ja |

**Sammanfattning av luckor:** v2 har snyggare UX men persisterar bara till per-user-tabellen. v1 (C) försöker persistera till org-profilen men kraschar pga schemafel. Inget flöde skriver till båda ställena.

## Phase 3 — Föreslagen fix

### Steg 1 — Gör `Onboarding.tsx` (flöde A) till sanningskällan
I `handleSubmit`:
1. Skapa org (befintligt anrop).
2. **Lägg till** `upsert` mot `organization_profiles` med dessa mappningar:
   - `industry` ← `branch`
   - `city` ← `stad`
   - `target_audience` ← `malgrupp`
   - `unique_properties` ← `produkt_beskrivning`
   - `goals` ← `malsattning`
   - `tone` ← `tonalitet`
3. Behåll befintlig `ai_profiles` upsert (AI-systemet läser därifrån — får inte tas bort utan godkännande).
4. Använd `upsert` med `onConflict: "organization_id"` för att undvika dubbletter.

### Steg 2 — Fixa redirecten i `DashboardLayout.tsx`
Ändra `navigate("/organization/onboarding")` → `navigate("/onboarding")` så att flöde A blir det enda förstagångsflödet.

### Steg 3 — Reparera `CreateOrganization.tsx` (flöde C)
Den är fortfarande länkad från `/organization/new` (används av OAuth-landningssidan). Ta bort de tre kolumnerna som inte finns i `organization_profiles`: `linkedin_handle`, `x_handle`, `newsletter_opt_in`. Behåll resten. Markera v1-filerna med en kommentar — radera ingenting utan godkännande.

### Steg 4 — Persistera fält som saknar org-kolumn
Fyra fält har inget hem på `organization_profiles`: `postnummer`, `land`, `prisniva`, `nyckelord`, `allman_info`. Två val:
- **A** (rekommenderat): Lägg till kolumnerna `postal_code`, `country`, `price_level`, `keywords text[]`, `general_info` på `organization_profiles` via migration. Allt företagsdata bor då på org-nivån.
- **B**: Behåll dem bara i `ai_profiles` (per-user). Snabbare men inkonsekvent.

→ Behöver ditt godkännande på A vs B innan migration körs.

## Phase 4 — Supabase RLS-granskning

`organization_profiles` RLS:
- INSERT/UPDATE kräver roll `founder` eller `admin`. ✅ OK — användaren som precis skapade org blir founder via `create_organization_with_founder` RPC.
- **Risk:** insert sker direkt efter org-skapande. RLS-checken måste se medlemskapet. Detta fungerar idag eftersom RPC är `SECURITY DEFINER` och commit:ar synkront. Inga ändringar behövs.

Inga edge functions eller triggers rörande org-skapande behöver ändras.

## Phase 5 — Statistik / nya features
Ingen påverkan på dashboard-statistik i denna fix. Om det finns mock-data i nya widgets adresseras det separat efter att persistens-buggen är löst.

## Phase 6 — UX/flow-fixar (bundlade)

1. Förstagångsanvändare (oavsett email/Google) → `/onboarding` (flöde A).
2. Återkommande användare → `/dashboard` direkt.
3. "Lägg till ny organisation" från `OrganizationSelector` → `/organization/new` (flöde C, reparerat).
4. OAuth-landningsskärmen som idag pekar till `/organization/onboarding` (flöde B) → uppdatera till `/onboarding`.
5. v1-filerna `OrganizationOnboarding.tsx` och `OAuthLandingScreen.tsx` markeras "deprecated — kept for reference per user request" men radeas inte.

## Filer som ändras

- `src/pages/Onboarding.tsx` — lägg till `organization_profiles` upsert i `handleSubmit`
- `src/components/layouts/DashboardLayout.tsx` — redirect till `/onboarding`
- `src/pages/CreateOrganization.tsx` — ta bort tre obefintliga kolumner från insert
- `src/components/OAuthLandingScreen.tsx` — uppdatera "join"-länken till `/onboarding`
- (Valfritt, kräver godkännande) Ny migration för 5 nya kolumner på `organization_profiles`

## ❓ Frågor som behöver svar innan implementation

1. **Nya kolumner på `organization_profiles`?** A) Lägg till `postal_code`, `country`, `price_level`, `keywords`, `general_info` (rekommenderat — full org-persistens). B) Behåll bara i `ai_profiles`.
2. **Ska v1-filerna (`OrganizationOnboarding.tsx`, gamla flödet) raderas eller bara markeras deprecated?** Default per dina regler: bara markera.
3. **Ska `ai_profiles`-skrivningen behållas parallellt?** Rekommendation: ja, eftersom AI-systemet läser därifrån. Vi dubbel-skriver tills migration till org-only är planerad.

## 🔧 EXTERNAL STEPS REQUIRED
Inga externa steg behövs — allt sker via kod + (valfri) databasmigration som körs via approval-flödet i nästa fas.

