// AI Skills-system: små, fokuserade prompt-fragment som routern injicerar
// i system-prompten baserat på request-typen.

export interface AISkill {
  key: string;
  name: string;
  description: string; // För router-modellen att förstå när den ska användas
  prompt: string;      // Det som injiceras i system-prompten
}

export const AI_SKILLS: Record<string, AISkill> = {
  'marketing-fundamentals': {
    key: 'marketing-fundamentals',
    name: 'Marknadsföringens grunder',
    description: 'Grundläggande marknadsföringsprinciper för UF-företag och små startups.',
    prompt: `MARKNADSFÖRINGSPRINCIPER (UF-anpassade):
- Tydlig målgrupp före allt: definiera EN huvudpersona innan du föreslår innehåll.
- AIDA: Attention, Interest, Desire, Action — använd i varje förslag.
- Sociala bevis (testimonials, antal kunder) bygger förtroende snabbare än features.
- Konsekvens > perfektion: hellre 3 inlägg/vecka i 6 månader än 10 inlägg en vecka och inget mer.
- Mät det som spelar roll: räckvidd, engagemang, konvertering — inte bara följare.`,
  },

  'caption-writing': {
    key: 'caption-writing',
    name: 'Caption-skrivning',
    description: 'Skriva engagerande captions för svenska sociala medier.',
    prompt: `CAPTION-REGLER:
- Hook i första raden (max 8 ord). Ställ en fråga eller chocka med en siffra.
- Mellandelen: berätta historien eller leverera värdet i 2-4 korta meningar.
- Slut med tydlig CTA (kommentera, dela, klicka i bio).
- Skriv ren text utan markdown. Använd radbrytningar för läsbarhet.
- Anpassa längden: Instagram 80-150 ord, TikTok 50-100 ord, Facebook 100-200 ord.
- Svenska, naturligt språk — undvik direkta översättningar från engelska.`,
  },

  'hashtag-strategy': {
    key: 'hashtag-strategy',
    name: 'Hashtag-strategi',
    description: 'Välja hashtags som ger räckvidd för UF-företag på svenska marknaden.',
    prompt: `HASHTAG-STRATEGI:
- Mix: 2 stora (>1M inlägg) + 4 medel (100k-1M) + 4 nisch (<100k).
- Inkludera alltid: #ungforetagsamhet #uf2025 #svenskstartup när relevant.
- Lokala taggar för geografiskt fokus: #stockholm, #goteborg, #malmo.
- Branschspecifika: testa varianter och rotera per inlägg.
- Aldrig fler än 10 på Instagram, max 5 på TikTok.`,
  },

  'swedish-tone': {
    key: 'swedish-tone',
    name: 'Svensk ton',
    description: 'Naturlig svensk ton för unga företagare.',
    prompt: `SVENSK TON:
- Skriv som en svensk i 20-årsåldern skulle prata med en vän — inte formellt.
- Undvik anglicismer ("growth hacking" → "tillväxtknep").
- "Du" istället för "ni" eller "Ni".
- Inga emojis (om inte uttryckligen efterfrågat).
- Korta meningar, aktiv form. Aldrig "det kan tänkas att..." — säg det rakt.`,
  },

  'data-explanation': {
    key: 'data-explanation',
    name: 'Förklara data',
    description: 'Förklara statistik och analytics på enkel svenska.',
    prompt: `DATA-FÖRKLARING:
- Förklara varje siffra med ett vardagsexempel: "5% engagemang = 5 av 100 personer reagerar".
- Jämför alltid mot något konkret (förra veckan, branschsnitt).
- Undvik fackspråk: säg "räckvidd" inte "reach", "klick" inte "CTR".
- Avsluta med EN tydlig handling: "Nästa steg: posta vid 18:00 på torsdagar".`,
  },

  'tiktok-trends': {
    key: 'tiktok-trends',
    name: 'TikTok-trender',
    description: 'TikTok-specifika best practices och trendiga format.',
    prompt: `TIKTOK BEST PRACTICES:
- Optimal längd: 21-34 sekunder för max watch-time.
- Hook inom första 3 sekunderna — annars swipar tittaren bort.
- Vertikalt format 9:16, undvik vattenstämplar från andra appar.
- Använd populära ljud (kolla Discover-fliken). Originalt ljud + populärt ljud = bästa mix.
- Postningstider för Sverige: 17-19 vardagar, 11-14 helger.`,
  },

  'instagram-best-practices': {
    key: 'instagram-best-practices',
    name: 'Instagram best practices',
    description: 'Instagram-specifika tips för Reels, Stories och feed.',
    prompt: `INSTAGRAM BEST PRACTICES:
- Reels > statiska inlägg för räckvidd 2025.
- Carousel-inlägg (5-10 bilder) ger högsta engagemanget på feed.
- Stories: använd polls och questions för 3x mer engagemang.
- Bästa postningstider Sverige: 11-13 och 19-21.
- Caption första raden = hook (rest är dolt bakom "...mer").`,
  },
};

/**
 * Bygger en lista över skills som routern kan välja mellan.
 */
export function buildSkillsCatalog(): string {
  return Object.values(AI_SKILLS)
    .map(s => `- ${s.key}: ${s.description}`)
    .join('\n');
}

/**
 * Hämtar prompts för valda skills och bygger en kombinerad sektion.
 */
export function buildSkillsPrompt(skillKeys: string[]): string {
  const selected = skillKeys
    .map(k => AI_SKILLS[k])
    .filter(Boolean);
  if (selected.length === 0) return '';
  return selected.map(s => s.prompt).join('\n\n');
}
