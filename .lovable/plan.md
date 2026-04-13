

# Fix: Interna problem + rensa filer (ingen visuell ändring)

## Förtydligande om liquid-glass

`liquid-glass` och `liquid-glass-light` **saknar CSS-definition** just nu — det betyder att 180+ element renderas *utan* sin avsedda stil. Att lägga till definitionen **återställer** v2:s utseende, det ändrar det inte. Utan den ser elementen "nakna" ut. Jag lägger till exakt den stil som v2 förväntar sig.

## Vad som görs

### CSS-definitioner som saknas (återställer v2-utseende)
- `.liquid-glass` / `.liquid-glass-light` — glasmorfism (backdrop-blur, semi-transparent bg, border) som v2-koden förväntar sig
- `.dashboard-heading-dark` / `.dashboard-subheading-dark` — textfärg-klasser som 6+ sidor använder
- `--gradient-hero` — CSS-variabel som 6 sidor refererar till

### Fixa AI Chat (intern bugg)
- `AIChat.tsx` anropar `useAIAssistant(null)` → meddelanden kan aldrig skickas
- Integrerar `useConversations` så att en konversation skapas automatiskt

### Ta bort oanvända filer
**Sidor utan routes:**
- `src/pages/AIDashboard.tsx`
- `src/pages/BillingSuccess.tsx`
- `src/pages/BuyCredits.tsx`
- `src/pages/Checkout.tsx`
- `src/App.css` (inte importerad)

**Föråldrade docs från v1:**
- `CHATGPT_SECURITY_REVIEW_PROMPT.md`
- `CHAT_ADMIN_GUIDE.md`
- `EXTERNAL_SETUP_REQUIRED.md`
- `PRE_LAUNCH_CHECKLIST.md`
- `PROMOTELY_AI_KNOWLEDGE_SETUP.md`
- `TIKTOK_SANDBOX_SETUP.md`

### Fixa Framer Motion varningar
- Tar bort färganimering på `backgroundColor`/`borderColor` som använder `hsl(var(--xxx))` — behåller transform/opacity-animeringar

## Sammanfattning
- **Utseende**: Ingen ändring — bara lägger till saknade definitioner så v2:s design renderas korrekt
- **Funktionalitet**: AI Chat fixas
- **Rensning**: 11 oanvända filer tas bort

