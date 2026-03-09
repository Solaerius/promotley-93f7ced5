# TikTok Sandbox Integration - Detaljerad Guide

## 📋 Översikt

Den här guiden hjälper dig att integrera TikTok i sandbox-läge så att ni kan testa funktionaliteten och sedan ansöka om produktionsåtkomst.

---

## 🚀 Steg 1: Skapa TikTok Developer Account

1. **Gå till TikTok for Developers**
   - Besök: https://developers.tiktok.com/
   - Klicka på "Register" eller "Login"

2. **Registrera ditt konto**
   - Använd företagets e-postadress
   - Verifiera din e-post
   - Fyll i företagsinformation

3. **Välj kontotyp**
   - Välj "Business" eller "Developer" account type

---

## 🔧 Steg 2: Skapa en App

1. **Navigera till My Apps**
   - Logga in på https://developers.tiktok.com/
   - Klicka på "Manage apps" i menyn

2. **Skapa ny app**
   - Klicka på "Create an app" eller "Connect an app"
   - Fyll i appinformation:
     - **App name**: Promotely
     - **Company/Individual name**: Ert företagsnamn
     - **Category**: Marketing/Social Media
     - **Description**: En AI-driven marknadsföringsplattform för unga företagare

3. **Välj produkter (Products)**
   - ✅ Login Kit (för OAuth)
   - ✅ Video Kit (för att hämta videor och statistik)
   - Eventuellt andra produkter ni behöver

4. **Konfigurera scopes**
   Under "Login Kit" eller "Permissions", välj följande scopes:
   - ✅ `user.info.basic` - För att hämta användarinfo
   - ✅ `video.list` - För att lista användares videor
   - ✅ `video.insights` (om tillgängligt) - För statistik

---

## 🔐 Steg 3: Konfigurera OAuth Redirect URLs

1. **Hitta OAuth-inställningar**
   - I din app, gå till "Login Kit" eller "Settings"
   - Leta efter "Redirect URI" eller "Callback URL"

2. **Lägg till Redirect URLs**
   
   För **Lovable preview** (under utveckling):
   ```
   https://YOUR_PROJECT_REF.supabase.co/functions/v1/oauth-callback
   ```

   För **produktion** (när ni deployar):
   ```
   https://[er-domän]/api/oauth-callback
   ```
   ELLER
   ```
   https://YOUR_PROJECT_REF.supabase.co/functions/v1/oauth-callback
   ```

3. **Spara inställningarna**

---

## 🔑 Steg 4: Hämta API-nycklar

1. **Hitta API-nycklar**
   - I din app, gå till "Basic Information" eller "Credentials"
   - Du bör se:
     - **Client Key** (kallas också App ID)
     - **Client Secret**

2. **Kopiera nycklarna**
   - **Client Key**: Detta är din publika nyckel
   - **Client Secret**: Detta är din privata nyckel (håll hemlig!)

3. **Lägg till nycklar i Lovable**
   - Ni har redan lagt till dessa som secrets i Lovable Cloud:
     - `TIKTOK_CLIENT_KEY`
     - `TIKTOK_CLIENT_SECRET`
   - Om ni behöver uppdatera dem, meddela mig så hjälper jag till

---

## 👥 Steg 5: Lägg till Sandbox Test-användare

**VIKTIGT**: I sandbox-läge kan ENDAST förgodkända test-användare connecta sina konton.

1. **Hitta Sandbox-inställningar**
   - I din app, leta efter "Sandbox" eller "Test users"
   - Alternativt under "Login Kit" → "Test users"

2. **Lägg till test-användare**
   
   **Alternativ A: Bjud in via TikTok-användarnamn**
   - Klicka på "Add test user" eller "Invite user"
   - Ange TikTok-användarnamnet för den person som ska testa
   - Skicka inbjudan
   - Användaren måste acceptera inbjudan i sin TikTok-app eller via e-post

   **Alternativ B: Bjud in via e-post**
   - Vissa developer portaler tillåter e-postinbjudningar
   - Användaren får ett mejl och måste acceptera

3. **Verifiera test-användare**
   - Efter att användaren accepterat, bör de dyka upp i listan över "Approved test users"
   - Endast dessa användare kan connecta sina konton i sandbox-läge

4. **Viktigt att veta**
   - Test-användare måste ha ett aktivt TikTok-konto
   - De måste vara 18+ år gamla
   - De måste acceptera sandbox-inbjudan innan de kan connecta

---

## 🧪 Steg 6: Testa Integrationen

### A. Förbered test-kontot

1. **Se till att test-användaren är godkänd**
   - Logga in på TikTok Developer Portal
   - Verifiera att användaren finns under "Test users"

2. **Test-användaren loggar in på TikTok**
   - Öppna TikTok-appen eller webb
   - Logga in med test-kontot

### B. Testa OAuth-flödet

1. **Gå till Promotely Dashboard**
   - Öppna er Lovable preview eller deployed site
   - Logga in med ert Promotely-konto

2. **Försök connecta TikTok**
   - Gå till "Settings" eller där ni har "Connect TikTok"-knappen
   - Klicka på "Connect TikTok"

3. **Vad som bör hända:**
   - Ni omdirigeras till TikTok:s auktoriseringssida
   - Logga in med test-användarens TikTok-konto (om inte redan inloggad)
   - TikTok frågar om ni vill ge Promotely access till data
   - Acceptera permissions
   - Ni omdirigeras tillbaka till Promotely
   - TikTok-kontot bör nu vara connectat!

### C. Verifiera i databasen

1. **Kolla Lovable Cloud Dashboard**
   - Öppna backend (klicka "View Backend")
   - Gå till "Table Editor" → `connections`
   - Du bör se en ny rad med:
     - `provider`: "tiktok"
     - `username`: TikTok-användarnamnet
     - `user_id`: Din Promotely user ID

2. **Kolla tokens-tabellen**
   - Gå till `tokens`-tabellen
   - Du bör se en rad med krypterad `access_token` för TikTok

---

## 🐛 Felsökning (Troubleshooting)

### Problem: "User not authorized" eller "Invalid user"

**Orsak**: Användaren är inte godkänd som test-användare i sandbox

**Lösning**:
1. Gå till TikTok Developer Portal
2. Verifiera att användaren finns i "Test users" listan
3. Om inte, lägg till användaren och be dem acceptera inbjudan
4. Vänta några minuter och försök igen

---

### Problem: "Invalid redirect_uri"

**Orsak**: Redirect URL:en är inte konfigurerad korrekt

**Lösning**:
1. Gå till TikTok Developer Portal → din app → Login Kit settings
2. Lägg till EXAKT denna URL:
   ```
   https://YOUR_PROJECT_REF.supabase.co/functions/v1/oauth-callback
   ```
3. Spara och vänta några minuter innan ni testar igen

---

### Problem: "Invalid client_key or client_secret"

**Orsak**: API-nycklarna är felaktiga eller inte konfigurerade

**Lösning**:
1. Verifiera nycklarna i TikTok Developer Portal
2. Uppdatera secrets i Lovable Cloud:
   - Meddela mig så hjälper jag till att uppdatera
   - Eller gå till backend → Settings → Secrets

---

### Problem: "State token mismatch" eller "Invalid state"

**Orsak**: CSRF-skyddet detekterade ett problem

**Lösning**:
1. Detta kan hända om sessionen har gått ut
2. Gå tillbaka till Promotely och försök connecta igen
3. Om problemet kvarstår, rensa cache och cookies

---

## 📊 Steg 7: Testa att Hämta Data

När TikTok är connectat, kan ni testa att faktiskt hämta data:

1. **Se användarinfo**
   - Kontrollera att användarnamnet visas i UI
   - Verifiera att profilen är kopplad

2. **Hämta videor** (om ni implementerat detta)
   - Försök lista användarens TikTok-videor
   - Kolla att API-anropen fungerar

3. **Kolla logs**
   - Öppna Lovable backend → Functions → Logs
   - Leta efter `oauth-callback` funktionen
   - Verifiera att det inte finns några errors

---

## 🚀 Steg 8: Ansök om Produktionsåtkomst

När ni har testat och verifierat att allt fungerar i sandbox:

1. **Gå till TikTok Developer Portal**
   - Navigera till er app
   - Leta efter "Submit for review" eller "Request production access"

2. **Förbered dokumentation**
   - **Demo-video**: Spela in en video som visar hur er app använder TikTok-data
   - **Skärmdumpar**: Ta screenshots av OAuth-flödet och hur ni visar TikTok-data
   - **Use case-beskrivning**: Förklara varför ni behöver TikTok-integration:
     - "Vi hjälper unga företagare analysera sin TikTok-performance"
     - "Vi genererar AI-baserade content-förslag baserat på TikTok-statistik"
     - "Vi hjälper användare förstå vilka videor som presterar bäst"

3. **Fyll i ansökan**
   - **App name**: Promotely
   - **Website**: Er webbadress
   - **Use case**: Marketing analytics och content recommendations
   - **Data usage**: Förklara hur ni använder och lagrar data (se GDPR-sektion nedan)
   - **Privacy policy URL**: https://[er-domän]/privacy
   - **Terms of service URL**: https://[er-domän]/terms

4. **GDPR och Data Protection**
   - Förklara att ni:
     - Krypterar tokens (vilket ni gör!)
     - Har RLS policies (vilket ni har!)
     - Följer GDPR
     - Tillåter användare att disconnecta och radera data
     - Endast lagrar nödvändig data

5. **Skicka in ansökan**
   - Granska all information
   - Skicka in för review
   - Vänta på svar (kan ta 3-7 dagar)

6. **Vad händer efter godkännande?**
   - Er app flyttas från sandbox till production
   - ALLA TikTok-användare kan nu connecta (inte bara test-användare)
   - Inga kodändringar behövs!

---

## ✅ Checklista för Sandbox Setup

Innan ni testar, se till att ni har:

- [ ] Skapat TikTok Developer account
- [ ] Skapat en app i developer portal
- [ ] Lagt till `user.info.basic` och `video.list` scopes
- [ ] Konfigurerat redirect URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/oauth-callback`
- [ ] Kopierat Client Key och Client Secret
- [ ] Verifierat att secrets är konfigurerade i Lovable Cloud (`TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`)
- [ ] Lagt till minst en test-användare i sandbox
- [ ] Test-användaren har accepterat sandbox-inbjudan
- [ ] Testat OAuth-flödet med test-användaren
- [ ] Verifierat att connection sparas i databasen
- [ ] Kollat logs för att se att allt fungerar

---

## 📞 Support och Hjälp

### TikTok Developer Support
- **Developer Portal**: https://developers.tiktok.com/
- **Documentation**: https://developers.tiktok.com/doc/
- **Support**: Via developer portal eller community forum

### Om något inte fungerar
- Kolla först edge function logs i Lovable backend
- Verifiera redirect URLs och API-nycklar
- Se till att test-användaren är godkänd i sandbox
- Kontakta TikTok support om problem med developer account

---

## 🎯 Nästa Steg Efter Setup

1. **Testa alla funktioner i sandbox**
   - OAuth-flow
   - Hämta användarinfo
   - Lista videor
   - Hämta statistik (om implementerat)

2. **Dokumentera för produktionsansökan**
   - Spela in demo-video
   - Ta skärmdumpar
   - Förbered use case-beskrivning

3. **Granska privacy och security**
   - Verifiera att tokens är krypterade
   - Testa disconnection-funktionen
   - Kontrollera GDPR-compliance

4. **Skicka in produktionsansökan**
   - Följ steg 8 ovan
   - Vänta på godkännande
   - När godkänt, starta marknadsföring! 🚀

---

## 📝 Viktiga API-endpoints (för referens)

Nuvarande implementation använder:

- **Init OAuth**: `supabase/functions/init-tiktok-oauth/index.ts`
  - Genererar state token
  - Returnerar TikTok auth URL
  
- **OAuth Callback**: `supabase/functions/oauth-callback/index.ts`
  - Hanterar callback från TikTok
  - Byter code mot access token
  - Sparar krypterad token i databasen

- **TikTok Authorization URL**: `https://www.tiktok.com/v2/auth/authorize/`
- **TikTok Token Exchange**: `https://open.tiktokapis.com/v2/oauth/token/`
- **TikTok User Info**: `https://open.tiktokapis.com/v2/user/info/`

---

## 🎉 Lycka till!

Följ stegen ovan noggrant och ni bör ha en fungerande TikTok sandbox-integration.
När allt fungerar och ni har fått produktionsgodkännande kommer alla era användare kunna connecta sina TikTok-konton! 🎊
