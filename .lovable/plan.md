

# Omfattande plan: 6 stora förbättringar av Promotely

---

## Steg 1: Onboarding Tutorial (intro-guide)

**Vad**: Fullskärmsmodal efter kontoskapande med steg-för-steg-guide genom plattformen.

### DB-migration
```sql
ALTER TABLE ai_profiles ADD COLUMN tutorial_seen boolean DEFAULT false;
```

### Ny fil: `src/components/OnboardingTutorial.tsx`
- Fullskärmsoverlay (`fixed inset-0 z-[100]`) med glasmorfism-bakgrund
- **Startskärm**: Två knappar -- "Visa mig runt 🚀" och "Hoppa till företagsinformation →"
- **5 steg** (om användaren väljer tutorial):
  1. **Dashboard** -- Översikt av dina siffror, tillväxtgraf och snabblänkar
  2. **Statistik** -- Se detaljerad data från kopplade sociala medier
  3. **AI-assistent** -- Chatta med AI, använd verktyg, skapa marknadsföringsplaner
  4. **Kalender** -- Planera och schemalägg innehåll
  5. **Konto & Inställningar** -- Koppla sociala medier, hantera profil
- Varje steg: ikon, rubrik, kort beskrivning (2-3 meningar), "Nästa"-knapp
- Sista steget: CTA "Fyll i företagsinformation" → navigerar till `/onboarding`
- Progressbar längst upp (steg 1/5, 2/5 etc.)
- Sparar `tutorial_seen = true` i `ai_profiles` vid avslut/skip

### Ändring: `src/components/layouts/DashboardLayout.tsx`
- Importera `OnboardingTutorial` och kolla `ai_profiles.tutorial_seen`
- Om `tutorial_seen === false` → visa `<OnboardingTutorial />`

---

## Steg 2: Kreditmätare i profil-dropdown

**Vad**: Progress-bar med kreditstatus, förnyelsedatum och "Köp krediter"-knapp i profil-dropdown.

### Ändring: `src/components/DashboardNavbar.tsx`
- Importera `useUserCredits`, `Progress` (from `@/components/ui/progress`)
- Anropa `const { credits } = useUserCredits()` i komponentens topp
- I **båda** profil-dropdown-menyerna (vertikal ~rad 264, horisontell ~rad 460), efter email-raden och `DropdownMenuSeparator`, lägg till:

```text
┌──────────────────────────┐
│ user@email.se            │
├──────────────────────────┤
│ Krediter    25 / 50      │
│ [████████░░░░░░░░░░░░░]  │  ← Progress bar (50% fylld)
│ Förnyas 2026-04-05  [Köp]│
├──────────────────────────┤
│ ⚙ Inställningar          │
│ 🏠 Till startsidan       │
├──────────────────────────┤
│ 🚪 Logga ut              │
└──────────────────────────┘
```

- Progress value: `(credits.credits_left / credits.max_credits) * 100`
- Förnyelsedatum: `new Date(credits.renewal_date).toLocaleDateString('sv-SE')`
- "Köp krediter"-knappen navigerar till `/buy-credits`

---

## Steg 3: Modellväljare (3 nivåer) + dynamisk kreditberäkning

**Vad**: Alla användare kan välja mellan tre modellnivåer. Kreditkostnad beräknas dynamiskt baserat på komplexitet, vald modell och användarens plan.

### 3 Nivåer

| Nivå | UI-label | Modell (Lovable AI Gateway) | Kreditfaktor |
|------|----------|----------------------------|-------------|
| Snabb | ⚡ Snabb | `google/gemini-2.5-flash-lite` | 0.5x |
| Standard | ✨ Standard | `google/gemini-3-flash-preview` | 1x |
| Premium | 🧠 Premium | `google/gemini-2.5-pro` | 2x |

### Frontend-ändringar

**`src/components/ai/AIChatContent.tsx`**:
- Ny state: `const [modelTier, setModelTier] = useState<'fast'|'standard'|'premium'>('standard')`
- 3-stegs segmented control ovanför inputfältet (styled som TabsList med 3 knappar)
- Visa estimerad kostnad: "~{n} krediter" baserat på tier-faktor
- Skicka `meta.model_tier` i request body till edge function

**`src/components/ai/AIToolPageLayout.tsx`**:
- Samma modellväljare som i chatten, placerad i headern bredvid CreditsDisplay
- Prop: `onModelTierChange` som skickas vidare till child-components

**`src/hooks/useAIToolRequest.ts`**:
- Acceptera `modelTier` som parameter och skicka i `meta.model_tier`

### Backend-ändringar: `supabase/functions/ai-assistant/index.ts`

**Migrera från OpenAI till Lovable AI Gateway**:
- Byt alla `fetch('https://api.openai.com/v1/chat/completions')` → `fetch('https://ai.gateway.lovable.dev/v1/chat/completions')`
- Byt `Authorization: Bearer ${openaiApiKey}` → `Authorization: Bearer ${Deno.env.get('LOVABLE_API_KEY')}`
- Läs `meta.model_tier` ('fast', 'standard', 'premium') från request body
- Mappa till Lovable AI-modeller per tabellen ovan
- Uppdatera `estimateCreditCost` med dynamisk beräkning:

```typescript
const baseCost = estimateBaseCost(action, message); // 1-3 baserat på komplexitet
const tierMultiplier = { fast: 0.5, standard: 1, premium: 2 }[modelTier];
const finalCost = Math.max(1, Math.ceil(baseCost * tierMultiplier));
```

- Behåll lönsamhetslogik: Starter-användare (50kr/mån, 50 krediter) = ~1kr/kredit, Growth (100kr, 100 krediter) = ~1kr/kredit → alltid profitable med Lovable AI Gateway-priser

### Ny fil: `src/lib/modelTiers.ts`
- Exportera tier-konfiguration (labels, ikoner, beskrivningar) som återanvänds i chat och verktyg

---

## Steg 4: Kunskapsbas + företagsprofil i ALLA AI-anrop

**Vad**: Säkerställ att kunskapsbas och profil injiceras i alla AI-funktioner, inte bara standardchat.

### Problem idag
- `toolSystemPrompt` (verktygsanrop) injicerar bara `profileInfo` men INTE `knowledgeContext`
- Andra edge functions (`generate-suggestion`, `generate-ai-analysis`, `calendar`, `sales-radar`) hämtar inte kunskapsbas

### Ändring: `supabase/functions/ai-assistant/index.ts`
- Rad ~640: När `toolSystemPrompt` används, injicera även `knowledgeContext`:
```typescript
content: toolSystemPrompt
  ? `${toolSystemPrompt}\n\n${profileInfo}\n\n${knowledgeContext}\n\nSvara ALLTID på svenska.`
  : // ... existing full prompt
```

### Ändring: Övriga edge functions
- `generate-suggestion/index.ts`, `generate-ai-analysis/index.ts`, `calendar/index.ts`, `sales-radar/index.ts`:
  - Hämta `ai_profiles` och `ai_knowledge` för användaren
  - Inkludera i systemprompt

---

## Steg 5: TikTok tillväxtgraf -- fixa felaktig data

**Vad**: TikTok Display API v2 ger INTE historiska följarantal. Nuvarande graf visar fabricerad/interpolerad data.

### Analys
- TikTok API endpoints: `/v2/user/info/` (nuläge), `/v2/video/list/`, `/v2/video/query/`
- Ingen endpoint ger historisk follower-data
- Research API har det men kräver separat ansökan

### Lösning: Starta egen historiksamling

**Ändring: `supabase/functions/fetch-tiktok-data/index.ts`**
- Efter lyckat datahämtning (rad ~498), spara en metrics-datapunkt:
```typescript
await supabase.from('metrics').upsert({
  user_id: user.id,
  connection_id: tokenData.id, // from connections lookup
  provider: 'tiktok',
  metric_type: 'followers',
  value: userData.follower_count,
  captured_at: new Date().toISOString(),
}, { onConflict: 'user_id,connection_id,metric_type,period' });
```
- Problem: `metrics` saknar en upsert-unik constraint för dagliga snapshots
- **DB-migration**: Lägg till `period` default `'daily'` och ett unikt index:
```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_metrics_daily_snapshot 
ON metrics (user_id, connection_id, metric_type, (captured_at::date));
```
- Alternativt: Bara INSERT (inte upsert) med en daglig check

**Ändring: `src/pages/Dashboard.tsx`**
- Ta bort `generateExampleData` och interpolerad data
- Om `weeklyMetrics.length < 2`: Visa meddelande "Följardata samlas in automatiskt. Grafen fylls på med tiden."
- Om metrics finns: Visa riktiga datapunkter
- Filtrera bort data före `connections[x].connected_at`

---

## Steg 6: Statistiksidan -- historik, engagemang, plattformsväljare

### 6a: Plattformsväljare högst upp

**Ändring: `src/components/analytics/AnalyticsContent.tsx`**
- Flytta `Tabs`/`TabsList` (Instagram/TikTok-väljare) från botten (inuti "Plattformsöversikt"-kortet) till **toppen** av hela komponenten
- Visa bara kopplade plattformar dynamiskt
- Hela sidan filtreras baserat på vald plattform

### 6b: Historik-graf med riktiga data

- Hämta data från `metrics`-tabellen (followers-datapunkter)
- Visa linjediagram med datum på x-axeln, följarantal på y-axeln
- Om inga datapunkter: "Historikdata börjar samlas in automatiskt"

### 6c: Engagemangsöversikt med riktiga data

- Beräkna engagemang från `tiktokData.videos` (redan hämtad):
  - Genomsnittlig engagement rate per video
  - Totala likes/kommentarer/delningar
  - Visa som stapeldiagram eller kort med senaste videornas stats
- För Instagram: Visa tillgänglig data från `metaData`

---

## Implementeringsordning (steg för steg)

Varje steg implementeras och verifieras individuellt:

1. **Steg 2** -- Kreditmätare i dropdown (enklast, ingen DB-ändring)
2. **Steg 1** -- Tutorial (kräver DB-migration + ny komponent)
3. **Steg 3** -- Modellväljare + gateway-migrering (frontend + backend)
4. **Steg 4** -- Kunskapsbas i alla anrop (backend-fix)
5. **Steg 5** -- TikTok historiksamling + graf-fix (backend + frontend)
6. **Steg 6** -- Statistiksidan (frontend)

---

## Sammanfattning av filer

| Steg | Nya filer | Ändrade filer | DB-migration |
|------|-----------|---------------|-------------|
| 1 | `OnboardingTutorial.tsx` | `DashboardLayout.tsx` | `tutorial_seen` kolumn |
| 2 | -- | `DashboardNavbar.tsx` | -- |
| 3 | `modelTiers.ts` | `AIChatContent.tsx`, `AIToolPageLayout.tsx`, `useAIToolRequest.ts`, `ai-assistant/index.ts` | -- |
| 4 | -- | `ai-assistant/index.ts`, `generate-suggestion/index.ts`, `calendar/index.ts`, `sales-radar/index.ts` | -- |
| 5 | -- | `fetch-tiktok-data/index.ts`, `Dashboard.tsx` | Unikt index på metrics |
| 6 | -- | `AnalyticsContent.tsx` | -- |

