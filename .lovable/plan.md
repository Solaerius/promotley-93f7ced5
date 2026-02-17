
# Fullstandig implementeringsplan -- 7 steg

## Steg 1: Djupare skuggor + synliga outlines i ljust lage

**Problem:** Skuggorna ar fortfarande for svaga, sarskilt i ljust lage. Outline-variabeln `--outline-subtle` ar for ljus (`hsl(344 20% 70%)`) och syns knappt.

**Losning:**
- Oka alla shadow-variabler med 30% i bade ljust och morkt lage
- Andra `--outline-subtle` i ljust lage fran `hsl(344 20% 70%)` till en varm beige/brun nyans: `hsl(30 25% 72%)` -- synlig men harmonisk
- Inputfalt far en kraftigare outline an vanliga kort: `--outline-input` med varmare och morkare farg `hsl(30 30% 62%)`
- I morkt lage justeras utlinjen till `hsl(30 15% 30%)` for inputfalt och `hsl(344 20% 28%)` for kort

**Filer:**
- `src/index.css`: Uppdatera shadow-variablar (+30%), lagg till `--outline-input` och `--outline-input-focus`, justera `--outline-subtle`
- `src/components/ui/input.tsx`: Byt fran `--outline-subtle` till `--outline-input`
- `src/components/ui/textarea.tsx`: Samma byte till `--outline-input`

---

## Steg 2: Kompaktare layout (35-45% minskning)

**Problem:** Sidor som Statistik, AI-Analys, Kalender och Konto kraver mycket scroll; element ar overdriven stora.

**Losning:** Minska paddings, font-storlekar, hoger pa charts, gap-varden och card-innehall med ca 35-45%.

**Filer och andringar:**

### `src/pages/Analytics.tsx`
- Header: `text-4xl` -> `text-2xl`, `space-y-8` -> `space-y-4`
- Stats grid: `gap-6` -> `gap-3`, Card padding `p-6` -> `p-3`
- Icon: `w-12 h-12` -> `w-8 h-8`, `w-6 h-6` -> `w-4 h-4`
- Stat value: `text-3xl` -> `text-xl`
- Chart height: `height={300}` -> `height={200}`
- Grid gap: `gap-6` -> `gap-4`

### `src/components/analytics/AnalyticsContent.tsx`
- Stats grid: `gap-4` -> `gap-3`, Card padding `p-4 md:p-6` -> `p-3`
- Icon: `w-10 h-10` -> `w-8 h-8`
- Stat value: `text-2xl md:text-3xl` -> `text-lg md:text-xl`
- Chart height: `height={300}` -> `height={200}`
- Placeholder icon: `w-12 h-12` -> `w-8 h-8`
- `space-y-6` -> `space-y-4`

### `src/pages/AIChat.tsx`
- Header: `text-2xl md:text-3xl` -> `text-xl md:text-2xl`, `mb-6` -> `mb-3`
- Quick commands grid: `gap-3 mb-6` -> `gap-2 mb-3`, knapp-padding `p-4` -> `p-3`
- Icon: `w-10 h-10` -> `w-8 h-8`

### `src/components/ai/AIAnalysisContent.tsx` (om den finns)
- Samma komprimeringsmonstret: minska paddings, gaps, font-storlekar

### `src/pages/Calendar.tsx`
- Header: `text-4xl` -> `text-2xl`, `space-y-8` -> `space-y-4`
- Kalenderrutor: `min-h-[120px]` -> `min-h-[80px]`
- Gap i kalendergriden: `gap-2` -> `gap-1`
- CardHeader/CardContent padding via klasser

### `src/pages/AccountPage.tsx`
- Header: `mb-8` -> `mb-4`, `text-2xl md:text-3xl` -> `text-xl md:text-2xl`
- TabsList: `mb-8` -> `mb-4`

---

## Steg 3: Promotionslankssystem i Admin

**Problem:** Det finns inget satt att skapa promotionslankar som ger gratiskrediter.

**Losning:** Ny admin-sida + ny databastabell + ny edge function.

### Databasschema
Ny tabell `promotion_links`:

```text
id             UUID (PK, default gen_random_uuid())
code           TEXT UNIQUE NOT NULL
credits_amount INTEGER NOT NULL (antal krediter per anvandare)
max_uses       INTEGER (NULL = obegransat)
current_uses   INTEGER DEFAULT 0
expires_at     TIMESTAMPTZ (NULL = aldrig)
created_by     UUID REFERENCES auth.users(id)
is_active      BOOLEAN DEFAULT true
created_at     TIMESTAMPTZ DEFAULT now()
```

Ny tabell `promotion_redemptions`:

```text
id              UUID (PK)
promotion_id    UUID REFERENCES promotion_links(id)
user_id         UUID REFERENCES auth.users(id)
redeemed_at     TIMESTAMPTZ DEFAULT now()
UNIQUE(promotion_id, user_id)  -- varje anvandare kan bara anvanda en promo en gang
```

RLS-policyer:
- `promotion_links`: SELECT/INSERT/UPDATE/DELETE only for admins
- `promotion_redemptions`: SELECT for admins, INSERT for authenticated users (med validering i edge function)

### Edge function: `redeem-promotion`
- Validerar kod, kontrollerar `is_active`, `max_uses`, `expires_at`
- Kontrollerar att anvandaren inte redan anvant koden
- Adderar krediter till anvandarens `credits_left`
- Okar `current_uses`
- Returnerar antal krediter som gavs

### Frontend
- Ny sida `src/pages/AdminPromotions.tsx` med CRUD-formulat for promotionslankar
- Tabell som visar alla lankar med status (aktiv/inaktiv, anvandningar/max, utgangs­datum)
- Knapp for att kopiera fullstandig lank: `promotley.lovable.app/promo/KOD`
- Ny route i `App.tsx`: `/admin/promotions`
- Ny publik sida `src/pages/RedeemPromotion.tsx` som tar emot koden och anropar edge function
- Ny route: `/promo/:code`
- Lagg till lank i AdminDashboard snabbatkomst

---

## Steg 4: Forbattrad anslut-till-foretag-lank

**Problem:** Det ar otydligt hur agaren delar sin foretagslank. Systemet stodjer redan bade lank och kod via `invite_code` pa `organizations`.

**Losning:** Forbattra synligheten i OrganizationContent och OrganizationSettings:
- Lagg till en framtradande "Dela med teamet"-sektion med storr knappar for "Kopiera lank" och "Kopiera kod"
- Visa lanken tydligare: `promotley.lovable.app/join/INVITE_CODE`
- Lagg till en delningsknapp som oppnar systemets share-dialog (Web Share API)

**Filer:**
- `src/components/account/OrganizationContent.tsx`: Utoka invite-sektionen med battre UI
- `src/pages/OrganizationSettings.tsx`: Samma forbattringar

---

## Steg 5: E-postpreferens-checkboxar vid registrering

**Problem:** Anvandare kan inte valja om de vill ta emot mejl.

**Losning:**
- Tva checkboxar vid registrering, bada ikryssade fran start:
  1. "Jag vill ta emot nyhetsbrev och tips fran Promotley"
  2. "Jag vill ta emot erbjudanden och kampanjer fran Promotley"
- Spara preferenserna i `users`-tabellen (tva nya kolumner: `email_newsletter` BOOLEAN DEFAULT true, `email_offers` BOOLEAN DEFAULT true)
- Lagg till en avprenumerationslank i slutet av alla mejl som skickas via Resend -- texten "Vill du sluta ta emot mejl fran oss?" med lank till en avprenumerationssida

### Databasandring
ALTER TABLE users ADD COLUMN email_newsletter BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN email_offers BOOLEAN DEFAULT true;

### Frontend
- `src/pages/Auth.tsx`: Tva nya Checkbox-komponenter under terms-checkboxen, bada defaultade till `true`
- Uppdatera `handleSubmit` for att skicka preferenserna vid signup
- `src/hooks/useAuth.tsx`: Uppdatera `signUp` for att spara preferenser till `users`-tabellen
- Ny sida `src/pages/Unsubscribe.tsx`: Visar bekraftelse och avprenumererar
- Ny route: `/unsubscribe`
- Uppdatera mejlmallar i edge functions (send-verification, send-onboarding-complete, etc.) med avprenumerationslank

---

## Steg 6: Korrekta Apple- och TikTok-loggor

**Problem:** Apple-knappen anvander Lucide's `Apple`-ikon och TikTok anvander `Music2`/`Music` -- inte de riktiga loggorna.

**Losning:** Skapa SVG-komponenter med de officiella loggorna.

**Filer:**
- Ny fil `src/components/icons/TikTokIcon.tsx`: SVG av TikToks officiella logga
- Ny fil `src/components/icons/AppleIcon.tsx`: SVG av Apples officiella logga
- Uppdatera `src/pages/Auth.tsx`: Ersatt Lucide `Apple` med `AppleIcon`
- Uppdatera `src/components/ConnectionManager.tsx`: Ersatt `Music` med `TikTokIcon`
- Uppdatera `src/pages/Analytics.tsx`: Ersatt `Music2` med `TikTokIcon`
- Uppdatera `src/components/analytics/AnalyticsContent.tsx`: Ersatt `Music2` med `TikTokIcon`
- Uppdatera `src/components/TikTokProfileSection.tsx`: Om den anvander `Music2`
- Uppdatera `src/pages/Calendar.tsx`: Om TikTok-ikon anvands

---

## Steg 7: Sociala plattformar "Kommer snart"

**Problem:** Bara TikTok och Instagram visas i ConnectionManager; LinkedIn, Twitter/X, Facebook och YouTube saknas.

**Losning:** Lagg till fyra nya plattformsrader i `ConnectionManager.tsx` med statusen "Kommer snart" istallet for "Anslut konto".

Varje rad har:
- Korrekt logga (SVG-komponent for LinkedIn, Twitter/X, Facebook, YouTube)
- Plattformsnamn
- Texten "Koppla ditt konto for personliga insikter"
- En inaktiverad knapp med texten "Kommer snart" och `disabled`-attribut
- Ta bort den befintliga "Fler plattformar kommer snart..."-dashed-rutan

**Filer:**
- Nya ikonfiler: `src/components/icons/LinkedInIcon.tsx`, `TwitterIcon.tsx`, `FacebookIcon.tsx`, `YouTubeIcon.tsx`
- `src/components/ConnectionManager.tsx`: Lagg till 4 nya plattformsrader, ta bort dashed placeholder

---

## Sammanfattning av alla nya filer

| Fil | Typ |
|-----|-----|
| `src/pages/AdminPromotions.tsx` | Ny sida |
| `src/pages/RedeemPromotion.tsx` | Ny sida |
| `src/pages/Unsubscribe.tsx` | Ny sida |
| `supabase/functions/redeem-promotion/index.ts` | Ny edge function |
| `src/components/icons/TikTokIcon.tsx` | Ny komponent |
| `src/components/icons/AppleIcon.tsx` | Ny komponent |
| `src/components/icons/LinkedInIcon.tsx` | Ny komponent |
| `src/components/icons/TwitterIcon.tsx` | Ny komponent |
| `src/components/icons/FacebookIcon.tsx` | Ny komponent |
| `src/components/icons/YouTubeIcon.tsx` | Ny komponent |

## Sammanfattning av databasandringar

1. Ny tabell `promotion_links` med RLS (admin only)
2. Ny tabell `promotion_redemptions` med RLS + unique constraint
3. ALTER TABLE `users` ADD COLUMN `email_newsletter` + `email_offers`
