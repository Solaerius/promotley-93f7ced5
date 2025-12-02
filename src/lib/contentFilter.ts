// Content filter for inappropriate language
// Censors severe offensive words while allowing mild profanity

// Severe words that must be censored (racist, hate speech, illegal content)
const SEVERE_OFFENSIVE_PATTERNS = [
  // Racist slurs and hate speech (Swedish and English)
  /\bn[i1][g9]{2}[ae3]?r?s?\b/gi,
  /\bn[e3][g9][e3]r/gi,
  /\bsvartskalle/gi,
  /\bblatte/gi,
  /\bjävla\s*(invandrare|svart|muslim|jude)/gi,
  /\bhora?\s*(invandrare|svart|muslim|jude)/gi,
  // Death threats and violence
  /\bska\s*(döda|mörda|skjuta|kniva)\s*(dig|er|dem)/gi,
  /\bjag\s*(ska|vill)\s*(döda|mörda)/gi,
  /\bdu\s*ska\s*dö\b/gi,
  // Hate speech patterns
  /\bdöda\s*alla\s*(judar|muslimer|svarta|vita|invandrare)/gi,
  /\butrota/gi,
  // Sexual harassment targeting minors
  /\bcp\b/gi,
  /\bpedofil/gi,
  // Additional severe terms
  /\bsieg\s*heil/gi,
  /\bheil\s*hitler/gi,
  /\bwhite\s*power/gi,
  /\b88\b.*\b14\b|\b14\b.*\b88\b/gi,
];

// Mild profanity that's allowed to pass through
const ALLOWED_MILD_WORDS = [
  'fuck', 'fucking', 'shit', 'damn', 'ass', 'hell',
  'fan', 'jävlar', 'skit', 'helvete', 'förbannat'
];

export const filterMessage = (message: string): { filtered: string; wasCensored: boolean } => {
  let filtered = message;
  let wasCensored = false;

  for (const pattern of SEVERE_OFFENSIVE_PATTERNS) {
    if (pattern.test(filtered)) {
      wasCensored = true;
      filtered = filtered.replace(pattern, (match) => '*'.repeat(match.length));
    }
  }

  return { filtered, wasCensored };
};

export const containsSevereContent = (message: string): boolean => {
  return SEVERE_OFFENSIVE_PATTERNS.some(pattern => pattern.test(message));
};
