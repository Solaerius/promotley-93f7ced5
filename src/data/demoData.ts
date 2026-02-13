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
  { id: '1', title: 'Ny hoodie-drop 🔥', platform: 'instagram', date: new Date().toISOString().split('T')[0], description: 'Visa nya vinterkollektion' },
  { id: '2', title: 'Behind the print-video', platform: 'tiktok', date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], description: 'Filma screentrycks-processen' },
  { id: '3', title: 'Kundstyle-repost 🧊', platform: 'instagram', date: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0], description: 'Dela kundens outfit-bild' },
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
    message: 'Hej! 👋 Jag är din AI-marknadsföringsassistent. Jag kan hjälpa dig med strategier, innehållsidéer och analyser för Nordic Hoodies UF. Vad vill du veta?',
  },
];

export const DEMO_LIMIT_MESSAGE = 'Detta är en demo – skapa ett konto för att låsa upp alla funktioner! 🚀';
