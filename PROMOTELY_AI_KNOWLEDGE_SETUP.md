# 📚 Promotely AI Knowledge Setup Guide

## Steg-för-steg-instruktion för att ladda in AI:ns kunskapsbas

### 🎯 Översikt

Promotely AI använder en kunskapsbas (RAG - Retrieval-Augmented Generation) för att ge korrekt UF-specifik vägledning. Denna guide visar hur du laddar in dokument och regler i systemet.

---

## 📋 Steg 1: Förbered dina dokument

### Dokumentkategorier som behövs:

1. **uf_rules** - UF:s officiella regler och riktlinjer
2. **competition_criteria** - Tävlingskriterier för UF-nästet och Årets Affärsplan
3. **annual_report** - Mall och krav för årsredovisning
4. **business_plan** - Mall och krav för affärsplan
5. **pitch_requirements** - Krav och tips för pitch-presentationer
6. **sales_events** - Regler och idéer för säljtillfällen
7. **budget_templates** - Budgetmallar och ekonomiska riktlinjer

### Filformat som stöds:
- PDF
- TXT
- Markdown (.md)
- DOCX

---

## 🗄️ Steg 2: Ladda upp filer till Storage Bucket

### Via Lovable Cloud UI:

1. Öppna projektet i Lovable
2. Gå till **Cloud** → **Storage**
3. Hitta bucketen: `promotley_knowledgebase`
4. Ladda upp dina dokument genom att dra och släppa eller klicka "Upload"

### Mappstruktur (rekommenderad):
```
promotley_knowledgebase/
├── uf_rules/
│   ├── uf_regler_2024.pdf
│   └── obligatoriska_moment.pdf
├── competition/
│   ├── uf_nastet_kriterier.pdf
│   └── arets_affarsplan.pdf
├── templates/
│   ├── arsredovisning_mall.pdf
│   ├── affarsplan_mall.docx
│   └── budget_exempel.xlsx
└── guides/
    ├── pitch_guide.pdf
    └── saljtillfallen_tips.pdf
```

---

## 📊 Steg 3: Registrera dokument i ai_knowledge-tabellen

### Manuellt via Supabase:

1. Öppna **Lovable Cloud** → **Database** → **Tables**
2. Välj tabellen `ai_knowledge`
3. Klicka **Insert** → **Insert row**
4. Fyll i:
   - `title`: Dokumentets titel (t.ex. "UF Regler 2024")
   - `content`: Sammanfattning eller fullständig text
   - `category`: Kategori (t.ex. "uf_rules")

### Exempel på insert:

```sql
INSERT INTO public.ai_knowledge (title, content, category)
VALUES (
  'UF Regler 2024 - Fullständig Guide',
  'TÄVLINGSKRITERIER - UF-NÄSTET:
  
  - Affärsidé och Marknadsföring (25%)
  - Ekonomi och Resultat (25%)
  - Genomförande och Aktivitet (25%)
  - Entreprenöriellt lärande (25%)
  
  FEM OBLIGATORISKA MOMENT:
  1. Starta företaget korrekt (minst 3 delägare)
  2. Hålla årsstämma (senast april)
  3. Skriva affärsplan
  4. Genomföra minst 5 säljtillfällen (minst 1 fysiskt)
  5. Upprätta årsredovisning
  
  EKONOMIREGLER:
  - Max 2000 kr startkapital
  - Alla kostnader dokumenteras
  - Prissättning täcker alla kostnader',
  'uf_rules'
);
```

---

## 🤖 Steg 4: Automatisk AI-hämtning i edge functions

AI:n kommer automatiskt att:

1. **Hämta relevant kunskap** baserat på användarens fråga
2. **Filtrera** på kategori (t.ex. `uf_rules`, `competition_criteria`)
3. **Inkludera** i systemprompt före varje AI-anrop

### Exempel på hur AI:n hämtar kunskap:

```typescript
// I edge function (generate-ai-analysis/index.ts)

// Hämta relevanta UF-regler
const { data: ufRules } = await supabase
  .from('ai_knowledge')
  .select('content')
  .eq('category', 'uf_rules');

// Bygg system prompt med reglerna
const systemPrompt = `
Du är Promotely UF Assistant. 

FÖLJ ALLTID DESSA UF-REGLER:
${ufRules.map(rule => rule.content).join('\n\n')}

Ge konkreta, actionable råd anpassade för UF-företag.
`;
```

---

## 🔄 Steg 5: Uppdatera befintligt innehåll

### För att uppdatera regler:

```sql
UPDATE public.ai_knowledge
SET 
  content = 'Nytt innehåll här...',
  updated_at = NOW()
WHERE category = 'uf_rules' AND title = 'UF Regler 2024';
```

### För att lägga till ny kategori:

```sql
INSERT INTO public.ai_knowledge (title, content, category)
VALUES (
  'Pinterest Marketing Guide',
  'Tips och strategier för Pinterest-marknadsföring...',
  'platform_guides'
);
```

---

## ✅ Steg 6: Verifiera att allt fungerar

### Test 1: Kontrollera att dokument finns

```sql
SELECT title, category, updated_at
FROM public.ai_knowledge
ORDER BY category, title;
```

### Test 2: Testa AI-generering

1. Gå till `/ai-dashboard` i Promotley
2. Klicka **"Generera ny analys"**
3. Kontrollera att AI:ns svar inkluderar UF-specifika regler och råd

### Test 3: Kontrollera storage bucket

1. Gå till **Cloud** → **Storage** → `promotley_knowledgebase`
2. Verifiera att alla filer finns och är åtkomliga

---

## 🚨 Vanliga problem och lösningar

### Problem: "Kunde inte hämta UF-regler"
**Lösning:** Kontrollera att:
- Tabellen `ai_knowledge` har innehåll
- RLS-policies tillåter läsning för autentiserade användare
- Kategorin stämmer (t.ex. `uf_rules`, inte `uf-rules`)

### Problem: "AI ger generisk information, inte UF-specifik"
**Lösning:**
- Kontrollera att edge function faktiskt hämtar från `ai_knowledge`
- Verifiera att `content`-kolumnen har detaljerad text (inte bara titlar)
- Se till att systemprompt inkluderar hämtad kunskap

### Problem: "Storage-filer kan inte läsas"
**Lösning:**
- Kontrollera bucket-policies
- Verifiera att bucket-namnet är `promotley_knowledgebase` (exakt)
- Se till att användaren är autentiserad

---

## 📝 Nästa steg

1. ✅ Ladda upp alla UF-dokument till storage
2. ✅ Registrera dokument i `ai_knowledge`-tabellen
3. ✅ Testa AI-generering med en testanvändare
4. ✅ Uppdatera innehåll när UF:s regler ändras (årligen)

---

## 🎓 Exempel på komplett kunskap

### UF Regler (category: `uf_rules`)

```
TÄVLINGSKRITERIER - UF-NÄSTET

1. Affärsidé och Marknadsföring (25%)
   - Tydlig affärsidé
   - Väl definierad målgrupp
   - Konkret marknadsföringsstrategi

2. Ekonomi och Resultat (25%)
   - Realistisk budget
   - God ekonomisk planering
   - Lönsamt eller potential till lönsamhet

3. Genomförande och Aktivitet (25%)
   - Aktiv försäljning
   - Minst 5 säljtillfällen
   - Regelbunden aktivitet

4. Entreprenöriellt lärande (25%)
   - Reflektion och utveckling
   - Hantering av motgångar

FEM OBLIGATORISKA MOMENT:
1. Starta företaget korrekt (minst 3 delägare, styrelse)
2. Hålla årsstämma (senast april)
3. Skriva affärsplan
4. Genomföra minst 5 säljtillfällen (minst 1 fysiskt)
5. Upprätta årsredovisning

EKONOMIREGLER:
- Max 2000 kr startkapital
- Alla kostnader dokumenteras
- Budget: intäkter, kostnader, resultat, kassaflöde
- Prissättning täcker alla kostnader

SÄLJTILLFÄLLEN:
- Minst 5 under året
- Minst 1 fysiskt
- Dokumentera: datum, plats, intäkter, foto, lärdomar
- Godkända: skolmarknad, pop-up, event, webshop-kampanj

MARKNADSFÖRING:
- Tillåtet: sociala medier, hemsida, fysisk marknadsföring
- Ej tillåtet: vilseledande marknadsföring, kopiera varumärken
```

---

## 💡 Tips för bästa resultat

1. **Var specifik**: Ju mer detaljerat innehåll, desto bättre AI-svar
2. **Uppdatera regelbundet**: UF:s regler ändras - håll kunskapsbasen uppdaterad
3. **Kategorisera rätt**: Använd konsekventa kategorier
4. **Testa ofta**: Kör test-analyser för att verifiera kvalitet
5. **Dokumentera ändringar**: Skriv kommentarer när du uppdaterar regler

---

## 📞 Support

Om du behöver hjälp med att ladda in kunskap:
- Kontakta Promotely support
- Kolla dokumentation på [docs.lovable.dev](https://docs.lovable.dev)
- Fråga i Discord-communityn

---

**Senast uppdaterad:** 2024-01-27
**Version:** 1.0
