

# 3.4 Säljradar -- KLAR

## Sammanfattning
Ny funktion "Säljradar" som kombinerar AI-genererade leads med trendbevakning. Tillgänglig som 4:e flik på AI-sidan.

## Implementerat
1. DB: `sales_radar_results` tabell med RLS
2. Edge function: `sales-radar` med OpenAI + förberedd Perplexity-hook
3. Hook: `useSalesRadar` för data-hantering
4. Komponent: `SalesRadarContent` med leads, trender, historik
5. AIPage: 4 tabs (Chat, Verktyg, Analys, Säljradar)

## Perplexity-integration
Backenden har kommenterad kod redo för Perplexity API. När API-nyckeln konfigureras kan realtidstrender aktiveras.

# 3.5 Demosida -- KLAR

## Sammanfattning
Publik demosida på `/demo` som visar en fullt interaktiv mock-dashboard för ett fejkat UF-företag (GreenBite UF).

## Implementerat
1. `src/data/demoData.ts` - Fake data: företagsprofil, sociala stats, chart-data, kalender, säljradar-resultat, AI-analys, chattmeddelanden
2. `src/pages/Demo.tsx` - Interaktiv demosida med 5 flikar (Dashboard, Statistik, AI & Verktyg, Säljradar, Kalender)
3. Rutt `/demo` tillagd i App.tsx (publik, inget auth krävs)

## Funktioner
- Första klick visar sparad data, efterföljande klick visar "demo-begränsning" med CTA
- AI-chatt visar meddelande om att konto krävs
- Kalender och verktyg låsta med CTA
- Sticky demo-banner med "Skapa konto"-knapp
- Bottom CTA-sektion
