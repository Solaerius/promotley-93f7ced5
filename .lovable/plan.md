

# Fix: Discord-länken leder till 404

## Problemet
Discord-notisen skickar admins till `https://promotley.se/admin/swish-orders`, men den faktiska rutten i appen ar `/admin/swish`. Det ger en 404-sida.

## Losning

### 1. Uppdatera Discord-lanken i edge-funktionen
**Fil:** `supabase/functions/notify-swish-order/index.ts`

Andra lanken fran:
```text
https://promotley.se/admin/swish-orders
```
till:
```text
https://promotley.se/admin/swish
```

Det ar den enda andringen som behovs. Verifieringslogiken (godkanna/avvisa ordrar och uppdatera anvandarkonto) fungerar redan korrekt i `AdminSwishOrders.tsx` -- den uppdaterar bade orderstatus och anvandarens plan/krediter vid godkannande.

## Teknisk detalj
- Rad 63 i `notify-swish-order/index.ts`: Byt URL i Discord embed description
- Inga andra filandringar kravs -- all affarslogik for verifiering och aktivering finns redan pa plats

