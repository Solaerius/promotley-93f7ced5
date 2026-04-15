

# Plan: Synka engelska lokalisering + ta bort hardkodad svenska + ny README

## Sammanfattning
Projektet har ~300+ hardkodade svenska strängar spridda över ~24 källfiler (hooks, pages, components) som inte går genom i18n-systemet. Dessa måste extraheras till `en.json`/`sv.json` och ersättas med `t()`-anrop. README ska skrivas om helt.

## 1. Extrahera hardkodad svenska till locale-filer

Följande filer har hardkodade svenska strängar som ska flyttas till båda locale-filerna:

**Hooks (6 filer):**
- `useCalendar.ts` — "Ogiltig kanal", "Ogiltig händelsetyp", "Ogiltigt datum"
- `useSalesRadarWatches.ts` — "Otillräckliga krediter", "Bevakning tillagd/borttagen"
- `useSalesRadar.ts` — "Otillräckliga krediter"
- `useAIAnalysis.ts` — "Genererar analys...", "Otillräckliga krediter"
- `useConversations.ts`, `useMarketingPlan.ts` — eventuella strängar

**Pages (12+ filer):**
- `Auth.tsx` — "Fel vid inloggning", "Något gick fel"
- `CheckoutRedirect.tsx` — "Ogiltig betalningslänk", "Något gick fel vid betalningen"
- `AdminChat.tsx` — "Kunde inte skicka meddelande", "Chatt avslutad", "Skriv ditt svar..."
- `AdminBanManagement.tsx` — "Kunde inte ladda/bannlysa"
- `AdminEmailBroadcast.tsx` — "Ogiltig e-postadress", "Du måste vara inloggad", "Skriv ditt mejlinnehåll"
- `AdminSwishOrders.tsx` — "Du har inte behörighet", "Kunde inte hämta/godkänna"
- `AdminNotificationSettings.tsx` — "Fel", "Kunde inte spara"
- `AdminPromotions.tsx` — "Skapad", "Borttagen", "Kopierad!"
- `AdminUserManagement.tsx` — diverse admin-strängar
- `Calendar.tsx` — "Marknadsföringsplan" (konversationsnamn + AI-prompt)
- Övriga admin-sidor

**Components (6+ filer):**
- `BackToTop.tsx` — aria-label "Tillbaka till toppen"
- `Footer.tsx` — 'hej@promotley.se' (OK som-is men toast uses t())
- Övriga med enstaka strängar

## 2. Lägg till nya nycklar i båda locale-filerna

Varje hardkodad sträng blir en ny nyckel under lämplig sektion (t.ex. `admin.*`, `errors.*`, `calendar.*`). Båda `sv.json` och `en.json` uppdateras samtidigt.

Uppskattning: ~80-100 nya nycklar.

## 3. Skriv om README.md

Helt ny README utan omnämnande av Lovable eller Claude. Innehåll:
- Vad Promotley UF är och gör
- Hur plattformen fungerar (koppling → AI-analys → strategi)
- Teknisk stack (React, TypeScript, Tailwind, Vite)
- Lokal utveckling (clone, install, dev)
- Projektstruktur (kort)
- Licens/kontakt

## 4. Spara regel i projektminne

Ny memory-fil: `mem://localization/no-hardcoded-strings` med regeln att ALLA användarvänliga strängar måste gå genom `t()` och finnas i båda locale-filerna.

## Ordning
1. Skapa memory-regeln (så den alltid gäller framöver)
2. Uppdatera `en.json` och `sv.json` med nya nycklar
3. Refaktorera alla ~24 filer att använda `t()` istället för hardkodade strängar
4. Skriv om `README.md`

## Tekniska detaljer

Filer som ändras:
- `src/locales/en.json` — ~80-100 nya nycklar
- `src/locales/sv.json` — ~80-100 nya nycklar
- ~24 källfiler i `src/` — byta hardkodade strängar till `t()`
- `README.md` — helt ny
- `mem://localization/no-hardcoded-strings` — ny regel
- `mem://index.md` — uppdaterad med referens

