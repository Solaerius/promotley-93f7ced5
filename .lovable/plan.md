

# Plan: Verifieringsflöde direkt på registreringssidan

## Vad användaren vill

Efter att man klickar "Skapa konto" ska **samma sida** (`/auth`) byta ut formuläret mot en enkel verifieringsvy — ingen navigering till `/verify-email`. Flödet:

1. Användaren fyller i mejl + lösenord → klickar "Skapa konto"
2. Formuläret försvinner, ersätts av: **"Kolla din mejl och verifiera"** + snurrande spinner
3. Sidan pollar automatiskt. När mejlen verifieras → spinnern blir en **grön checkmark**
4. En **"Fortsätt med registreringen"**-knapp animeras fram (eller går från grå till färg)
5. Knappen tar användaren vidare till onboarding/dashboard

På **AuthCallback-sidan** (dit verifieringslänken leder):
- Visa "E-post verifierad!" med grön bock
- Knapp: "Fortsätt med registreringen" → navigerar till `/onboarding`
- Text: "Du kan också gå tillbaka till den ursprungliga fliken — den uppdateras automatiskt"

## Vad som ändras

### 1. `src/pages/Auth.tsx`
- Lägg till nytt state: `verificationPending` (boolean) + `emailVerified` (boolean)
- Efter lyckad signup → sätt `verificationPending = true` istället för `navigate("/verify-email")`
- Behåll `signOut()` + skicka verifieringsmejl som idag
- **Rendera villkorligt**: om `verificationPending` är true, visa verifieringsvyn istället för formuläret (inom samma layout med vänsterpanel kvar)
- Verifieringsvyn:
  - Spinner (`animate-spin`) som byts till `CheckCircle2` (grön) när `emailVerified` = true
  - Text: "Kolla din mejl och verifiera ditt konto"
  - Polling var 3:e sekund: försök `signInWithPassword` med sparad mejl+lösenord, kolla `email_confirmed_at`
  - När verifierad: visa "Fortsätt med registreringen"-knapp med fade-in animation
- Lägg till "Tillbaka"-knapp för att gå tillbaka till formuläret

### 2. `src/pages/AuthCallback.tsx`
- Ändra success-knapptext från "Gå till inloggningen" till "Fortsätt med registreringen"
- Navigera till `/onboarding` istället för `/auth` (eller kolla profil som redan görs för OAuth)
- Behåll text om att gå tillbaka till ursprungliga fliken

### 3. Ta bort onödig navigering till `/verify-email`
- Rad 215 i Auth.tsx: ta bort `navigate("/verify-email", ...)` — ersätts av lokalt state

## Tekniska detaljer

**Polling-strategi i Auth.tsx:**
Eftersom användaren är utloggad efter signup kan vi inte använda `getSession()`. Istället pollar vi med `signInWithPassword(email, password)` — om det lyckas OCH `email_confirmed_at` finns → verifierad. Vi sparar lösenordet tillfälligt i state (aldrig i storage).

```text
┌─────────────┐     signup OK      ┌──────────────────┐
│  Formulär   │ ──────────────►    │  Verifieringsvy  │
│  (mejl+lös) │                    │  spinner + poll   │
└─────────────┘                    └────────┬─────────┘
                                            │ verified
                                            ▼
                                   ┌──────────────────┐
                                   │  Grön checkmark  │
                                   │  + "Fortsätt"    │
                                   └──────────────────┘
```

**Animations:**
- Spinner → checkmark: CSS transition med scale
- Knapp: `opacity-0 → opacity-100` + `translate-y` transition

