

# Plan: Fix registrering, lösenordsvalidering och verifieringsmejl

## Problem

1. **HIBP blockerar signup** — Supabase returnerar 422 för "vanliga" lösenord, så kontot skapas aldrig och `send-verification` anropas aldrig
2. **Bekräfta lösenord** — tom `confirmPassword` + tomt lösenord passerar validering (bara mismatch kollas, inte att fälten är ifyllda)
3. **Verifieringsmejl skickas aldrig** — eftersom signup failar på grund av HIBP når koden aldrig `send-verification`-anropet
4. **Fel from-adress** — `MAIL_FROM` är `support@promotley.se` men domänen som är verifierad i Resend är troligen `noreply.promotley.se`

## Ändringar

### 1. Stäng av HIBP
- Använda `configure_auth`-verktyget för att sätta `min_password_length` men stänga av HIBP-kontroll

### 2. Validering i Auth.tsx (`handleSubmit`)
- Lägg till explicit kontroll att `email`, `password` och `confirmPassword` inte är tomma vid signup
- Behåll befintlig mismatch-kontroll
- Ta bort HIBP-relaterade felmeddelanden (rad 247-248 area)

### 3. Fixa `send-verification` from-adress
- Uppdatera `MAIL_FROM` i edge function till `noreply@promotley.se` (eller den verifierade Resend-domänen)
- Alternativt: uppdatera secrets `MAIL_FROM` och `MAIL_REPLY_TO` till korrekt adress
- Deploya `send-verification` funktionen

### 4. Fixa `auth-email-hook` from-adress
- `auth-email-hook` använder `noreply@promotley.se` (variabeln `FROM_DOMAIN = "promotley.se"`) — kontrollera att detta matchar Resend-verifierad domän
- Deploya om nödvändigt

### 5. Testa end-to-end
- Testa att signup fungerar utan HIBP-block
- Verifiera att `send-verification` anropas och loggar
- Kontrollera att mejl kommer fram

## Tekniska detaljer

**Auth.tsx validation:**
```tsx
if (!isLogin) {
  if (!password || !confirmPassword) {
    setErrors({ confirmPassword: "Alla fält måste fyllas i" });
    return;
  }
  if (password !== confirmPassword) {
    setErrors({ confirmPassword: "Lösenorden matchar inte" });
    return;
  }
}
```

**send-verification fix:**
Ändra default `MAIL_FROM` till `Promotley <noreply@promotley.se>` och deploya.

