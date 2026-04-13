// Demo data for a fake UF company called "Nordic Hoodies UF"

export const demoCompany = {
  foretagsnamn: 'Nordic Hoodies UF',
  branch: 'Streetwear & kläder',
  malgrupp: 'Unga vuxna 16-25 som gillar streetwear och skandinavisk design',
  produkt_beskrivning: 'Handtryckta hoodies och kepsar med nordisk design – minimalistisk stil med lokala motiv',
  stad: 'Malmö',
  prisniva: 'Medel (349-599 kr)',
  malsattning: 'Bli det mest kända UF-klädmärket i Skåne',
  tonalitet: 'Cool, autentisk och skandinavisk',
  nyckelord: ['hoodies', 'streetwear', 'UF-företag', 'skandinavisk design', 'kepsar'],
  kanaler: ['instagram', 'tiktok'],
};

export const demoStats = {
  followers: 3412,
  likes: 22840,
  comments: 1587,
  reach: 52300,
  impressions: 98700,
  views: 41200,
  engagement: 5.2,
  credits_left: 38,
  plan: 'growth' as const,
};

export const demoSocialStats = [
  {
    platform: 'instagram',
    followers: 2245,
    likes: 15200,
    comments: 1043,
    reach: 32800,
    impressions: 62400,
    shares: 534,
    profile_views: 4100,
  },
  {
    platform: 'tiktok',
    followers: 1167,
    likes: 7640,
    comments: 544,
    reach: 19500,
    impressions: 36300,
    views: 41200,
    shares: 378,
  },
];

export const demoChartData = [
  { week: 'V1', followers: 2300, engagement: 3.6 },
  { week: 'V2', followers: 2580, engagement: 4.1 },
  { week: 'V3', followers: 2790, engagement: 4.5 },
  { week: 'V4', followers: 3010, engagement: 4.8 },
  { week: 'V5', followers: 3240, engagement: 5.0 },
  { week: 'V6', followers: 3412, engagement: 5.2 },
];

export const demoCalendarPosts = [
  { id: '1', title: 'Ny hoodie-drop', platform: 'instagram', date: new Date().toISOString().split('T')[0], description: 'Visa nya vinterkollektion' },
  { id: '2', title: 'Behind the print-video', platform: 'tiktok', date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], description: 'Filma screentrycks-processen' },
  { id: '3', title: 'Kundstyle-repost', platform: 'instagram', date: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0], description: 'Dela kundens outfit-bild' },
];

export const demoSalesRadar = {
  sammanfattning: 'Nordic Hoodies har stark tillväxt på Instagram med 5.2% engagemang. Fokusera på samarbete med lokala skatebutiker i Malmö och utnyttja den pågående trenden "Scandi Streetwear" på TikTok.',
  leads: [
    {
      typ: 'kund',
      titel: 'Bryggeriet Skatepark Malmö',
      beskrivning: 'Populärt skatepark med butik som säljer streetwear. Perfekt matchning för era hoodies.',
      action: 'Kontakta ägaren och erbjud ett provparti med exklusivt Bryggeriet-tryck',
      prioritet: 'hög',
      potential: '300+ sålda per månad',
    },
    {
      typ: 'samarbete',
      titel: 'StreetVibes UF (Influencer)',
      beskrivning: 'UF-influencer med 12k följare som recenserar streetwear. Baserad i Lund.',
      action: 'Skicka DM med samarbetsförslag och gratishoodies',
      prioritet: 'hög',
      potential: '3000+ nya exponeringar',
    },
    {
      typ: 'event',
      titel: 'UF-mässan Syd',
      beskrivning: 'Regional UF-mässa i mars med 600+ besökare. Boka monter tidigt.',
      action: 'Anmäl dig på ungforetagsamhet.se senast 15 mars',
      prioritet: 'medel',
      potential: '250+ direkta kundmöten',
    },
    {
      typ: 'kanal',
      titel: 'Malmö Streetwear Community',
      beskrivning: 'Aktiv Facebook-grupp med 8k medlemmar intresserade av streetwear och lokal design.',
      action: 'Gå med och dela behind-the-scenes content om era tryck',
      prioritet: 'medel',
      potential: '400+ nya följare',
    },
  ],
  trends: [
    {
      typ: 'hashtag',
      titel: '#ScandiStreet',
      beskrivning: 'Trenden växer 280% denna månad på TikTok. Perfekt timing för Nordic Hoodies.',
      tips: 'Skapa en 15-sekunders "outfit of the day" video med era hoodies',
      plattform: 'tiktok',
      aktualitet: 'nu',
    },
    {
      typ: 'format',
      titel: 'Behind-the-scenes Reels',
      beskrivning: 'Instagram prioriterar autentiskt innehåll. BTS-videos från screentryck får 2x mer räckvidd.',
      tips: 'Filma tryckprocessen med lugn lofi-musik och text-overlay',
      plattform: 'instagram',
      aktualitet: 'denna_vecka',
    },
    {
      typ: 'ämne',
      titel: 'Lokal produktion',
      beskrivning: 'Konsumenter värderar lokalt producerade kläder allt högre. Visa er Malmö-koppling.',
      tips: 'Gör ett inlägg om att era hoodies trycks lokalt i Malmö',
      plattform: 'alla',
      aktualitet: 'denna_månad',
    },
    {
      typ: 'säsong',
      titel: 'Vår-kollektion hype',
      beskrivning: 'Februari-mars har högst intresse för nya vårplagg. Perfekt för en limited drop.',
      tips: 'Kör kampanj "Spring Drop" med countdown och rabattkod NORDIC10',
      plattform: 'alla',
      aktualitet: 'nu',
    },
  ],
};

export const demoAIAnalysis = {
  summary: 'Nordic Hoodies UF har en stark grund med 5.2% engagemang på Instagram, vilket är långt över genomsnittet för UF-företag (1-2%). TikTok-närvaron växer snabbt men behöver mer konsekvent postning.',
  strengths: [
    'Högt engagemang (5.2%) visar lojal och engagerad målgrupp',
    'Stark visuell identitet med skandinavisk design',
    'Unik produktnisch – lokalt tryckta hoodies med nordiska motiv',
  ],
  improvements: [
    'Posta 4-5 gånger/vecka på TikTok istället för 2',
    'Använd Instagram Stories dagligen för att visa behind-the-scenes',
    'Skapa en content-kalender för att planera 2 veckor framåt',
  ],
  nextSteps: [
    'Starta ett samarbete med en lokal streetwear-influencer',
    'Lansera en "Design din egen hoodie"-challenge på TikTok',
    'Optimera Instagram-bio med tydlig CTA och länk till webshop',
  ],
};

export const demoChatMessages = [
  {
    role: 'assistant' as const,
    message: 'Hej! Jag är din AI-marknadsföringsassistent. Jag kan hjälpa dig med strategier, innehållsidéer och analyser för Nordic Hoodies UF. Vad vill du veta?',
  },
];

export const DEMO_LIMIT_MESSAGE = 'Detta är en demo – skapa ett konto för att låsa upp alla funktioner.';

export const demoTikTokVideos = [
  { id: "demo-1", title: "Ny kollektion: Arctic Hoodie Drop 🧊", views: 18400, likes: 1820, shares: 243, comments: 87, created_at: new Date(Date.now() - 86400000 * 2).toISOString(), duration: 22 },
  { id: "demo-2", title: "Bakom kulisserna – screentryck i Malmö", views: 31200, likes: 3340, shares: 512, comments: 194, created_at: new Date(Date.now() - 86400000 * 5).toISOString(), duration: 38 },
  { id: "demo-3", title: "Kundreaction på Nordic Hoodie #streetwear", views: 9700, likes: 760, shares: 98, comments: 55, created_at: new Date(Date.now() - 86400000 * 8).toISOString(), duration: 15 },
  { id: "demo-4", title: "Outfit of the day ft. Midnight Hoodie", views: 44100, likes: 5210, shares: 780, comments: 312, created_at: new Date(Date.now() - 86400000 * 11).toISOString(), duration: 18 },
  { id: "demo-5", title: "Skandinavisk design – vad betyder det för oss?", views: 12800, likes: 1030, shares: 145, comments: 76, created_at: new Date(Date.now() - 86400000 * 14).toISOString(), duration: 45 },
  { id: "demo-6", title: "Limited keps – 50 exemplar kvar!", views: 27600, likes: 2950, shares: 430, comments: 228, created_at: new Date(Date.now() - 86400000 * 18).toISOString(), duration: 12 },
  { id: "demo-7", title: "#ScandiStreet challenge – delta nu", views: 61000, likes: 7820, shares: 1240, comments: 510, created_at: new Date(Date.now() - 86400000 * 22).toISOString(), duration: 28 },
  { id: "demo-8", title: "Vinterkollektion lansering – swipe up", views: 8300, likes: 590, shares: 67, comments: 41, created_at: new Date(Date.now() - 86400000 * 26).toISOString(), duration: 20 },
];

export const demoAIResponses: Record<string, string> = {
  caption: `✨ Caption för @stockholmskaffet:\n\n"Måndag smakar bättre med rätt kaffe ☕ Vi har precis fått in vår nya single origin från Etiopien — blommig, ljus och helt underbar. Kom in och prova, vi bjuder på det första provsmakat hela måndag förmiddag!\n\n#stockholmskaffet #nytkaffe #etiopiskkaffe #specialtykaffe #stockholm #kaffeälskare #mondaymood #lokalkaffe"`,

  hashtags: `🏷️ Rekommenderade hashtags för Stockholms Kaffet:\n\n**Volym (1M+):** #kaffe #coffee #fika #stockholm\n**Medel (100k–1M):** #specialtycoffee #kaffekultur #stockholmcafe #swedishcoffee\n**Nisch (<100k):** #stockholmskaffet #etiopiskkaffe #singleorigincoffee #kafferostning\n\n💡 Tips: Mixa 3–4 volymtaggar med 4–5 nischtaggar för bäst organisk räckvidd på Instagram.`,

  contentIdeas: `💡 5 Content-idéer för Stockholms Kaffet:\n\n1. **"Bakom kulisserna"** — Visa rostningsprocessen i en 30 sek Reel. Autentiskt och delbart.\n2. **"Kaffekunskap"** — Förklara skillnaden mellan washed och natural process. Bygger expertposition.\n3. **"Kundporträtt"** — Intervjua en stamkund om deras morgonrutin. Stärker community-känslan.\n4. **"Produktteaser"** — En 3-delad story-serie inför nästa säsongskaffe. Skapar förväntning.\n5. **"Before/after"** — Visa kaffebönan från farm till kopp i ett enda inlägg. Storytelling som säljer.`,

  weeklyPlan: `📅 Veckoplanen för Stockholms Kaffet (v.12):\n\n**Måndag:** Instagram-Reel — Lansering av ny etiopisk single origin\n**Tisdag:** Story-poll — "Filter eller espresso?" (ökar engagemang)\n**Onsdag:** Inlägg — Bakom kulisserna i rostningen\n**Torsdag:** TikTok — "3 saker du inte visste om kaffe"\n**Fredag:** Story — Helgmeny + påminnelse om öppettider\n**Lördag:** Reel — Kundmoment / café-stämning\n**Söndag:** Citat-inlägg — Veckans kaffetanke\n\n⏰ Bästa publiceringstider: 7–9 och 17–19 för din målgrupp.`,

  campaign: `🎯 Kampanjstrategi: Påsklansering 2025\n\n**Mål:** Öka butiksbesök +20% under påskhelgen\n**Målgrupp:** Stockholmare 25–45 år, kaffeintresserade\n\n**Fas 1 – Teaser (v.13):** "Något nytt är på väg" — mystiska stories, inga detaljer\n**Fas 2 – Lansering (v.14):** Påskkaffe + limited edition påse, Reel + pressmeddelande\n**Fas 3 – Avslutning (v.15):** "Sista chansen" + UGC från kunder, avsluta med tackinlägg\n\n**Kanaler:** Instagram (primär), TikTok (räckvidd), e-post (lojala kunder)\n**Budget:** 80% organiskt, 20% boostat innehåll på Meta\n**KPI:er:** Räckvidd, butiksbesök, UGC-andel`,

  ufTips: `🚀 UF-tips för Stockholms Kaffet:\n\n1. **Mässor:** Anmäl er till UF-mässan i god tid — er monter är ert varumärke inför jury och besökare\n2. **Årsredovisning:** Börja dokumentera försäljning och marknadsföringsinsatser redan nu, inte sista veckan\n3. **Sociala medier:** Visa UF-resan! Följare älskar autentiska "vi bygger ett företag"-berättelser\n4. **Samarbeten:** Ta kontakt med andra UF-företag för cross-promo — inga konkurrenter, bara partners\n5. **Prissättning:** Räkna alltid in din arbetstid i priset. Sälj inte för billigt — det undervärderar hela UF-rörelsen`,
};
