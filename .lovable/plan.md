

# Kampanjkod-integration -- alla platser

## Sammanfattning
Kampanjkoder integreras pa fyra nya platser utover den befintliga `/promo/:code`-sidan, sa att anvandare kan losa in koder var de an befinner sig i plattformen.

---

## 1. Vid registrering (Auth-sidan)

- Lagg till ett valfritt falt "Har du en kampanjkod?" langst ner i registreringsformulaet (visas ej vid inloggning)
- Koden sparas i `user_metadata` under registreringen (precis som invite-koden redan gor)
- Efter e-postverifiering och forsta inloggning, i `AuthCallback.tsx`, kollar systemet om det finns en kampanjkod i metadata och anropar `redeem-promotion` automatiskt
- Vid lyckad inlosen visas en toast: "Du fick X gratiskrediter!"
- Om koden ar ogiltig visas inget felmeddelande (tyst misslyckande -- anvandaren har redan kommit in)

## 2. Kontosidan (Plan och Krediter)

- Lagg till en "Los in kampanjkod"-knapp under CreditsDisplay i `AccountContent.tsx`
- Klick expanderar ett inline-falt med Input + knapp
- Anropar `redeem-promotion` edge function och visar toast med resultat
- Vid lyckad inlosen upppdateras kreditvisningen via `refetchCredits()`

## 3. Dashboard (valkomstbanner)

- Visa en liten banner/kort pa dashboarden BARA for anvandare med `free_trial`-plan och farre an 5 krediter
- Texten: "Har du en kampanjkod? Los in den har for gratiskrediter"
- Klick oppnar en liten dialog med kodfalt
- Nar koden ar inlost forsvinner bannern

## 4. Prissidan

- Lagg till ett "Har du en kampanjkod?"-falt nedanfor planerna, ovanfor FAQ
- Inloggade anvandare kan ange koden direkt
- Ej inloggade anvandare redirectas till `/auth?redirect=/pricing&promo=KODEN` sa att koden kan losas in efter registrering

---

## Teknisk plan

### Ny delad komponent: `PromoCodeInput.tsx`
En aterbar komponent som hanterar all kampanjkods-logik:
- Input-falt + knapp
- Anropar `supabase.functions.invoke("redeem-promotion", { body: { code } })`
- Visar laddningstillstand, framgang (med konfetti-ikon) och felmeddelanden
- `onSuccess`-callback for att utlosa `refetchCredits()` eller navigation
- Prop `variant`: `inline` (expanderbar) eller `card` (fristande kort)

### Andringar per fil

| Fil | Andring |
|-----|---------|
| `src/components/PromoCodeInput.tsx` | **NY** -- delad komponent |
| `src/pages/Auth.tsx` | Lagg till valfritt kampanjkodsfalt i registreringsformulaeret, spara i user_metadata |
| `src/pages/AuthCallback.tsx` | Kolla metadata for kampanjkod efter forsta inloggning, los in automatiskt |
| `src/components/account/AccountContent.tsx` | Lagg till PromoCodeInput under Plan och Krediter-sektionen |
| `src/pages/Dashboard.tsx` | Visa villkorad kampanjkods-banner for free_trial-anvandare |
| `src/pages/Pricing.tsx` | Lagg till PromoCodeInput-kort under planerna |

### Ingen databasandring kravs
Den befintliga `redeem_promotion` RPC-funktionen och `promotion_links`/`promotion_redemptions`-tabellerna hanterar redan all logik.

