# Promotley UF

**AI-driven marknadsföring för UF-företag och startups**

Promotley är en plattform som hjälper unga entreprenörer att växa på sociala medier genom att koppla sina konton (TikTok, Instagram, Facebook) och få AI-genererade strategier, innehållsförslag och analyser baserade på riktiga data.

## Funktioner

- **AI-chatt & verktyg** — Caption-generator, hashtag-förslag, kampanjstrategi, veckoplanering och UF-tips, allt drivet av AI
- **Social media-integration** — Koppla TikTok, Instagram och Facebook för att hämta statistik och engagemangsdata
- **Innehållskalender** — Planera och schemalägg inlägg visuellt, eller låt AI:n fylla kalendern åt dig
- **AI-analys** — Få djupgående analyser av dina sociala medier med konkreta rekommendationer
- **Säljradar** — Hitta leads, trender och affärsmöjligheter anpassade för ditt företag
- **Organisationer** — Samarbeta i team med rollbaserad åtkomst och delade krediter
- **Flerspråkigt** — Fullt stöd för svenska och engelska

## Teknisk stack

- **Frontend:** React 18, TypeScript 5, Vite 5, Tailwind CSS v3
- **UI-komponenter:** shadcn/ui
- **Internationalisering:** i18next med react-i18next
- **Backend:** Edge Functions, PostgreSQL med Row Level Security
- **Autentisering:** E-post/lösenord, Google OAuth, Apple Sign-In
- **Betalningar:** Stripe (prenumerationer), Swish (manuell godkännande)

## Lokal utveckling

```sh
# Klona repositoryt
git clone <YOUR_GIT_URL>

# Gå till projektmappen
cd promotley

# Installera beroenden
npm install

# Starta utvecklingsservern
npm run dev
```

## Projektstruktur

```
src/
├── components/     # Återanvändbara UI-komponenter
├── hooks/          # Custom React hooks
├── lib/            # Hjälpfunktioner och konfiguration
├── locales/        # Språkfiler (sv.json, en.json)
├── pages/          # Sidkomponenter (routing)
└── integrations/   # Backend-klient och typer

supabase/
├── functions/      # Edge Functions (API-endpoints)
└── migrations/     # Databasmigreringar
```

## Kontakt

- **Allmänt:** uf@promotley.se
- **Support:** support@promotley.se
- **Webb:** [promotley.lovable.app](https://promotley.lovable.app)

© 2025 Promotley UF. Alla rättigheter förbehållna.
