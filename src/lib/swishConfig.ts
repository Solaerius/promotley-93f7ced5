// Swish configuration for Promotely
export const SWISH_CONFIG = {
  // Swish phone number (format: 123XXXXXXX without country code prefix)
  phoneNumber: "0721511376", // TODO: Replace with actual Swish number

  // Payee alias format for QR code (format: +46XXXXXXXXX or 123XXXXXXX)
  payeeAlias: "+46721511376", // TODO: Replace with actual Swish number

  // Company name for messages
  companyName: "Promotely UF",
};

// Plan configurations (subscriptions)
export const SWISH_PLANS = {
  starter: {
    name: "UF Starter",
    price: 29,
    credits: 50,
    model: "gpt-4o-mini",
    features: [
      "AI-modell: Standard",
      "50 AI-krediter per månad",
      "Enkel strategi (2 poster/vecka)",
      "3 branschtips per månad",
      "Grundläggande UF-vägledning",
    ],
  },
  growth: {
    name: "UF Growth",
    price: 49,
    credits: 100,
    model: "gpt-4.1-mini",
    features: [
      "AI-modell: Standard",
      "100 AI-krediter per månad",
      "Personlig innehållskalender",
      "5 content-idéer per vecka",
      "Enkel prestandaanalys",
    ],
  },
  pro: {
    name: "UF Pro",
    price: 99,
    credits: 300,
    model: "gpt-5.1",
    features: [
      "AI-modell: Premium",
      "300 AI-krediter per månad",
      "Komplett strategi + kalender",
      "Creative Mode (fri AI-generering)",
      "Konkurrentanalys inkluderad",
      "Premium rapporter & insikter",
    ],
  },
} as const;

// Credit top-up packages (one-time purchases)
export const CREDIT_PACKAGES = {
  mini: {
    name: "Mini",
    credits: 10,
    price: 9,
  },
  small: {
    name: "Liten",
    credits: 25,
    price: 19,
  },
  medium: {
    name: "Medium",
    credits: 50,
    price: 35,
  },
  large: {
    name: "Stor",
    credits: 100,
    price: 59,
  },
} as const;

export type SwishPlanType = keyof typeof SWISH_PLANS;
export type CreditPackageType = keyof typeof CREDIT_PACKAGES;

// Static QR code images mapping
export const SWISH_QR_IMAGES: Record<string, string> = {
  starter: "/swish/starter.png",
  growth: "/swish/growth.png",
  pro: "/swish/pro.png",
  mini: "/swish/credits-mini.png",
  small: "/swish/credits-small.png",
  medium: "/swish/credits-medium.png",
  large: "/swish/credits-large.png",
};

// Generate order ID
export function generateOrderId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "PM-";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate Swish message
export function generateSwishMessage(planName: string, orderId: string): string {
  return `${SWISH_CONFIG.companyName} – ${planName} – ${orderId}`;
}

// Generate Swish QR code data (Swedish Swish format)
// Format: C{payee};{amount};{message};1
export function generateSwishQRData(amount: number, message: string): string {
  // Swish QR code format for payments
  // Uses the mobile BankID Swish format
  const payee = SWISH_CONFIG.payeeAlias;
  const encodedMessage = encodeURIComponent(message);

  // Standard Swish QR format
  return `C${payee};${amount};${encodedMessage};1`;
}
