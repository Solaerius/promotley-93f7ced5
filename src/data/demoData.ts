// Demo data for a fake UF company called "GreenBite UF"

export const demoCompany = {
  foretagsnamn: 'GreenBite UF',
  branch: 'Hälsosamma snacks',
  malgrupp: 'Unga vuxna 16-25 som vill äta hälsosamt',
  produkt_beskrivning: 'Handgjorda proteinbollar med naturliga ingredienser',
  stad: 'Göteborg',
  prisniva: 'Medel (49-89 kr)',
  malsattning: 'Bli ledande UF-snacksmärke i Västsverige',
  tonalitet: 'Energisk och hälsosam',
  nyckelord: ['proteinbollar', 'hälsosnacks', 'UF-företag', 'ekologiskt'],
  kanaler: ['instagram', 'tiktok'],
};

export const demoStats = {
  followers: 2847,
  likes: 18420,
  comments: 1243,
  reach: 45200,
  impressions: 89300,
  views: 34500,
  engagement: 4.8,
  credits_left: 38,
  plan: 'growth' as const,
};

export const demoSocialStats = [
  {
    platform: 'instagram',
    followers: 1892,
    likes: 12300,
    comments: 843,
    reach: 28500,
    impressions: 56200,
    shares: 421,
    profile_views: 3200,
  },
  {
    platform: 'tiktok',
    followers: 955,
    likes: 6120,
    comments: 400,
    reach: 16700,
    impressions: 33100,
    views: 34500,
    shares: 289,
  },
];

export const demoChartData = [
  { week: 'V1', followers: 1950, engagement: 3.2 },
  { week: 'V2', followers: 2100, engagement: 3.8 },
  { week: 'V3', followers: 2340, engagement: 4.1 },
  { week: 'V4', followers: 2520, engagement: 4.5 },
  { week: 'V5', followers: 2690, engagement: 4.6 },
  { week: 'V6', followers: 2847, engagement: 4.8 },
];

export const demoCalendarPosts = [
  { id: '1', title: 'Ny smak-lansering 🍫', platform: 'instagram', date: new Date().toISOString().split('T')[0], description: 'Visa nya chokladsmaken' },
  { id: '2', title: 'Bakom kulisserna-video', platform: 'tiktok', date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], description: 'Filma tillverkningen' },
  { id: '3', title: 'Kundrecension-repost', platform: 'instagram', date: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0], description: 'Dela kundens story' },
];

export const demoSalesRadar = {
  sammanfattning: 'GreenBite har stark tillväxt på Instagram med 4.8% engagemang. Fokusera på att nå gymkedjan Nordic Wellness för B2B-samarbete och utnyttja den pågående hälsotrenden "Protein Snacking" på TikTok.',
  leads: [
    {
      typ: 'kund',
      titel: 'Nordic Wellness Göteborg',
      beskrivning: 'Gymkedja med 15 anläggningar i Göteborg. Säljer snacks i receptionen - perfekt matchning.',
      action: 'Kontakta regionchef via LinkedIn och erbjud provpaket',
      prioritet: 'hög',
      potential: '500+ sålda per månad',
    },
    {
      typ: 'samarbete',
      titel: 'FitFika UF (Influencer)',
      beskrivning: 'UF-influencer med 8k följare som testar hälsosnacks. Baserad i Göteborg.',
      action: 'Skicka DM med samarbetsförslag och gratisprodukter',
      prioritet: 'hög',
      potential: '2000+ nya exponeringar',
    },
    {
      typ: 'event',
      titel: 'UF-mässan Väst',
      beskrivning: 'Regional UF-mässa i mars med 500+ besökare. Boka monter tidigt.',
      action: 'Anmäl dig på ungforetagsamhet.se senast 15 mars',
      prioritet: 'medel',
      potential: '200+ direkta kundmöten',
    },
    {
      typ: 'kanal',
      titel: 'Gymshark Community Sverige',
      beskrivning: 'Aktiv Facebook-grupp med 12k medlemmar intresserade av fitness och kost.',
      action: 'Gå med och dela värdeskapande inlägg om proteinsnacks',
      prioritet: 'medel',
      potential: '500+ nya följare',
    },
  ],
  trends: [
    {
      typ: 'hashtag',
      titel: '#ProteinSnacking',
      beskrivning: 'Trenden växer 340% denna månad på TikTok. Perfekt timing för GreenBite.',
      tips: 'Skapa en 15-sekunders "What I eat in a day" video med era bollar',
      plattform: 'tiktok',
      aktualitet: 'nu',
    },
    {
      typ: 'format',
      titel: 'Behind-the-scenes Reels',
      beskrivning: 'Instagram prioriterar autentiskt innehåll. BTS-videos får 2x mer räckvidd.',
      tips: 'Filma tillverkningsprocessen med lugn musik och text-overlay',
      plattform: 'instagram',
      aktualitet: 'denna_vecka',
    },
    {
      typ: 'ämne',
      titel: 'Hållbara förpackningar',
      beskrivning: 'Konsumenter efterfrågar miljövänliga förpackningar. Visa era val.',
      tips: 'Gör ett inlägg om er förpackningsresa och materialval',
      plattform: 'alla',
      aktualitet: 'denna_månad',
    },
    {
      typ: 'säsong',
      titel: 'Nyårslöften-effekten',
      beskrivning: 'Januari-februari har högst sökvolym för hälsosnacks. Utnyttja momentum.',
      tips: 'Kör kampanj "Starta året rätt" med rabattkod NYSTART',
      plattform: 'alla',
      aktualitet: 'nu',
    },
  ],
};

export const demoAIAnalysis = {
  summary: 'GreenBite UF har en stark grund med 4.8% engagemang på Instagram, vilket är långt över genomsnittet för UF-företag (1-2%). TikTok-närvaron växer snabbt men behöver mer konsekvent postning.',
  strengths: [
    'Högt engagemang (4.8%) visar lojal målgrupp',
    'Stark visuell identitet på Instagram',
    'Unik produktnisch med låg konkurrens lokalt',
  ],
  improvements: [
    'Posta 4-5 gånger/vecka på TikTok istället för 2',
    'Använd Instagram Stories dagligen för att öka räckvidden',
    'Skapa en content-kalender för att planera 2 veckor framåt',
  ],
  nextSteps: [
    'Starta ett samarbete med en lokal fitness-influencer',
    'Lansera en "Smaktest-challenge" på TikTok',
    'Optimera Instagram-bio med tydlig CTA och länk till beställning',
  ],
};

export const demoChatMessages = [
  {
    role: 'assistant' as const,
    message: 'Hej! 👋 Jag är din AI-marknadsföringsassistent. Jag kan hjälpa dig med strategier, innehållsidéer och analyser för GreenBite UF. Vad vill du veta?',
  },
];

export const DEMO_LIMIT_MESSAGE = 'Detta är en demo – skapa ett konto för att låsa upp alla funktioner! 🚀';
