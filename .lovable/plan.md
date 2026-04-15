# Plan: Nytt verifieringsflöde efter registrering

## Sammanfattning

Ändra flödet efter registrering så att:

1. **Efter signup** → användaren skickas till `/verify-email` som visar "Verifiera din mejl" med ett snurrande hjul (spinner) — indikerar att vi väntar
2. **Verifieringslänken i mejlet** → tar användaren till `/auth/callback` som verifierar mejlen och sedan visar en enkel sida med knappen "Gå till inloggningen" (ingen auto-redirect)
3. **Originalfliken** (`/verify-email`) → pollar automatiskt och uppdateras till "Verifierad!" när mejlen bekräftats

## Vad som ändras

### 1. `src/pages/VerifyEmail.tsx` — Lägg till spinner

- Lägg till en synlig spinner (animate-spin) bredvid eller under "Verifiera din e-post"-texten för att visuellt indikera att sidan väntar
- Behåll den befintliga polling-logiken (var 3:e sekund) som redan finns — den uppdaterar automatiskt till "Verifierad!" när mejlen bekräftas
- När `verified` blir true → visa nuvarande success-vy (grön bock + "Omdirigeras...")

### 2. `src/pages/AuthCallback.tsx` — Visa "Gå till inloggningen" istället för auto-redirect

- Vid email-verifiering (icke-OAuth, icke-recovery): istället för att auto-navigera till dashboard/onboarding efter 2 sekunder, visa en statisk success-sida med:
  - Grön bock-ikon
  - Text: "E-post verifierad!"  
  - En knapp: "Gå till inloggningen" som navigerar till `/auth`
- Behåll all befintlig logik för OAuth, recovery, invite-codes och promo-codes — de påverkas inte
- Ta bort `setTimeout` + auto-navigate för den icke-OAuth email-verifierings-pathen  
  
Lägg även till en eller gå tillbaka till orignala sidan text på den sidan för att hänvisa användaren att de har flera olika sätt att fortsätta med registreringen.

### 3. `src/pages/Auth.tsx` — Ingen ändring behövs

Signup-flödet navigerar redan till `/verify-email` med email i state (rad 231). Inget behöver ändras här.

## Tekniska detaljer

**VerifyEmail.tsx** — Lägg till spinner-element i den icke-verifierade vyn:

```tsx
// Under Mail-ikonen, lägg till:
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mt-4" />
<p className="text-sm text-muted-foreground">Väntar på verifiering...</p>
```

**AuthCallback.tsx** — Ändra success-pathen (rad 152-162):

- Sätt `setStatus("success")` men ta bort `setTimeout(() => navigate(...))`  
- Lägg till en "Gå till inloggningen"-knapp i success-vyns `CardContent`
- Knappen kör `navigate("/auth")`