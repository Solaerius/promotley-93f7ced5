

# Plan: Launch-Ready Sprint — Phase 1 + Phase 2

## Uppdaterade prisplaner

| | **Free** | **Starter** | **Growth** | **Max** |
|---|---|---|---|---|
| **Pris** | 0 kr | 49 kr/mån | 159 kr/mån | 299 kr/mån |
| **Krediter/mån** | 30 (max 5/dag) | 250 | 950 | 2000 |
| AI-chatt | Ja | Ja | Ja | Ja |
| AI Content-idéer | Basic | Ja | Avancerade | Premium |
| Caption Generator | 3/mån | Ja | Ja | Ja |
| Hashtag-förslag | Ja | Ja | Ja | Ja |
| UF-tips | Ja | Ja | Ja | Ja |
| Veckoplanering | Nej | Ja | Ja | Ja |
| Marknadsplaner | Nej | 1/mån | 5/mån | Obegränsat |
| Säljradar | Nej | Nej | 10/mån | Obegränsat |
| AI-analys av stats | Nej | Basic | Djup | Premium |
| Schemaläggning (manuell) | 3/mån | 10/mån | Obegränsat | Obegränsat |
| Kalender + content planner | Ja | Ja | Ja | Ja |
| TikTok-koppling (read-only) | Ja | Ja | Ja | Ja |
| Instagram/Facebook-koppling | Ja | Ja | Ja | Ja |
| **Video-upload + auto-publish** | Kommer snart | Kommer snart | Kommer snart | Kommer snart |
| **AI video-analys** | Kommer snart | Kommer snart | Kommer snart | Kommer snart |
| **Sound-bibliotek från TikTok** | Kommer snart | Kommer snart | Kommer snart | Kommer snart |
| Organisationer (team) | 1 | 1 | 3 | Obegränsat |
| Support | Community | E-post | E-post prio | Live chat |

Pricing-sidan visar "Kommer snart"-rader utan ikon, i en dämpad textfärg, utan klickbara element.

---

## PHASE 1 — Launch idag (3-5 dagars arbete)

Allt nedan kan implementeras direkt utan att vänta på externa godkännanden. När det är klart kan du publicera.

### 1.1 Säkerhet & buggfixar (BLOCKERANDE)
- Fixa `cleanup-oauth-states` cron (analysera logs, återställ schema)
- Alla AI-funktioner läser från `organization_profiles` + `ai_profiles` (inte bara user-nivå)
- Verifiera email-leverans via Resend
- End-to-end-test av onboarding → dashboard → AI-chat → checkout
- HIBP **avstängd** per ditt beslut
- Postgres extension i `public` flyttas till `extensions`-schemat

### 1.2 Smart AI Router
- Ny `_shared/ai-models-catalog.ts` med modell-data (priser, styrkor, best_for, ranking)
- Router-modell `gemini-2.5-flash-lite` får katalogen + request-info → väljer optimal modell via tool-calling
- Alla AI edge functions (`ai-assistant`, `generate-suggestion`, `generate-ai-analysis`, `sales-radar`) använder routern
- Routing loggas i ny tabell `ai_routing_log`
- Anthropic Claude integreras (Säljradar + djupanalys när routern väljer det)

### 1.3 AI Skills-system
- `_shared/ai-skills/`: marketing-fundamentals, caption-writing, hashtag-strategy, swedish-tone, data-explanation, tiktok-trends, instagram-best-practices
- Router väljer 2-4 skills per request → injiceras i system prompt
- Alla prompts skrivs om för att vara mer specifika och UF-anpassade

### 1.4 Förbättrade Content-idéer (utan overwhelm)
- Output: titel + hook-tip + max-längd + 2-3 hook-förslag (collapsable cards)
- "Kommer snart"-sektion längst ner: trender, sound-rekommendationer, viral-länkar (visas dämpat, ej klickbart)
- Strikt svensk, enkelt språk

### 1.5 Dynamiska krediter + historik
- Ny `creditPricing.ts`: `cost_usd × usd_to_sek_rate × 1.18 / 0.10 = credits`
- USD→SEK kurs cachas dagligen via `exchangerate.host` i ny `app_settings`-tabell
- Ny tabell `credit_transactions` (user_id, function, credits, model, created_at)
- Ny sida `/account/credits` med historik (datum, funktion, krediter — admin ser även USD-kostnad)

### 1.6 Nya prisplaner aktiveras
- `planConfig.ts` skrivs om: free/starter/growth/max med nya krediter
- `stripe-webhook` uppdateras med nya plan-IDs
- Pricing-sidan får "Kommer snart"-rader (dämpad färg, ej klickbara)
- Top-up via Stripe (samma flöde som abonnemang) + Swish behålls parallellt

### 1.7 Plan-gating (HÅRD låsning)
- Ny `useFeatureAccess`-hook kollar plan via `users.plan`
- Funktioner som kräver högre plan: knapp är **disabled** + tooltip "Kräver Growth-plan eller högre"
- Klick på låst funktion öppnar uppgraderings-modal (inte bara passiv prompt)
- Free-plan blockeras hårt från video/auto-publish (när det kommer) — knappar disabled, ej klickbara

### 1.8 "Hantera inlägg"-sida (`/posts`)
- Lista över `calendar_posts` (filter: status, plattform, datum)
- Edit-modal: titel, content, datum, plattform, status
- "Förbättra med AI"-knapp som anropar router
- "Publicera nu"-knapp = **disabled**, label "Kommer snart"
- UI matchar dashboard + landing page (samma GlassCard, färger, typografi, ingen ikon)

### 1.9 Admin Feature Flags
- Ny tabell `feature_flags` (per global + per-user override)
- Ny `/admin/feature-flags`-sida (text-baserad, ingen ikon)
- Hook `useFeatureFlag('video_upload')` används av Phase 2-features
- Låsta features visas som "Kommer snart" + disabled för icke-admins

### 1.10 Sentry error monitoring
- Aktiveras via Student Pack
- Fångar fel i produktion innan användare rapporterar
- Secret: `SENTRY_DSN`

### 1.11 i18n
- Alla nya strängar i `sv.json` + `en.json`
- "Kommer snart" / "Coming soon" som översättningsbar nyckel

---

## PHASE 2 — Efter Phase 1 (väntar på externa godkännanden)

Implementeras efter launch, parallellt med approval-väntan. Funktionalitet syns som "Kommer snart" tills den aktiveras.

### 2.1 Video-storage (DigitalOcean Spaces via Student Pack)
- Spaces-bucket via Student Pack credits
- Edge function `do-spaces-upload` med signed URLs
- Auto-cleanup efter publish/30d
- Sandbox-läge: bara admins kan testa

### 2.2 Video-upload UI
- Klient-side validering (TikTok-format mp4/mov/mpeg/3gp/avi/webm, max 10 min, 287MB web / 4GB API)
- Tydliga felmeddelanden på svenska
- Progress bar + thumbnails
- **Synlig bara för admins** tills launch av Phase 2

### 2.3 AI video-analys
- Edge function `analyze-video` med ffmpeg-wasm + gemini-2.5-pro multimodal
- Returnerar ämne, hashtags, caption-förslag, sound-rekommendation
- Lagras i `calendar_posts.ai_analysis`

### 2.4 Meta auto-publish (sandbox → live)
- Edge function `publish-post` mot Meta Graph API
- pg_cron-jobb varje minut för schemalagda inlägg
- Sandbox-token testas av admins
- När Meta App Review godkänns: byt secret + slå på feature flag = live för alla

### 2.5 TikTok Content Posting + sound-bibliotek
- Edge function mot TikTok Content Posting API
- Sound-search + favoriter via `/v2/sound/list/`
- Sandbox tills approval

### 2.6 "Publicera med AI" (slutgiltig)
- Auto-genererar caption + väljer sound + bästa publish-tid
- Schemaläggs (inte direkt-publish) så användaren ser i kalendern först
- Bekräftelse innan första gången

### 2.7 Web-search för Säljradar (Tavily)
- Tavily integration med URL-validering (HTTPS, ingen localhost/private IP, content-type-check)
- Aktiveras gradvis (Growth+ får tillgång)

### 2.8 Senare
- LinkedIn auto-posting
- X (kräver betald API)
- AI-bildgenerering
- Meta Ads / TikTok Ads-hantering

---

## Frågor innan jag börjar Phase 1

1. **Stripe top-up vs Swish**: Behåller vi båda parallellt (Swish är populärt i Sverige), eller bara Stripe från och med nu?

2. **Free-plan gränser**: 30 krediter/mån + 5/dag är ganska stramt. Höja till 50/mån + 10/dag för bättre konvertering, eller hålla det stramt för att pusha till Starter?

3. **Anthropic API-key**: Behövs i Phase 1 för Säljradar-djupanalys + routern att kunna välja Claude. Du registrerar på console.anthropic.com → ger mig nyckeln när jag frågar. Bekräftar du?

4. **EXTERNAL STEPS du behöver göra parallellt med Phase 1 (annars blockeras vissa delar)**:
   - Postgres extension flyttas (Cloud-UI, 1 klick)
   - Skaffa Anthropic API key
   - Aktivera Sentry via Student Pack → ge mig `SENTRY_DSN`
   - **STARTA REDAN NU**: Ansök om Meta App Review + TikTok Content Posting API — tar veckor, så starta processen direkt även om vi inte använder dem i Phase 1

