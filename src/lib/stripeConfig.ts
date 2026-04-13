// Stripe configuration for Promotely
// Replaces swishConfig.ts

// Plan definitions (subscriptions)
export const STRIPE_PLANS = {
  starter: {
    name: "UF Starter",
    price: 29,
    credits: 50,
    features: [
      "AI-modell: 4o Mini",
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
    features: [
      "AI-modell: 4.1 Mini",
      "100 AI-krediter per månad",
      "Personlig innehållskalender",
      "5 content-idéer per vecka",
      "Enkel prestandaanalys",
    ],
  },
  pro: {
    name: "UF Pro",
    price: 99,
    credits: 200,
    features: [
      "AI-modell: 4.1 Mini + 4o Premium",
      "200 AI-krediter per månad",
      "Premium AI för djupanalyser (4o)",
      "Komplett strategi + kalender",
      "Konkurrentanalys inkluderad",
      "Premium rapporter & insikter",
    ],
  },
} as const;

// Credit package definitions (one-time purchases)
export const STRIPE_CREDIT_PACKAGES = {
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

export type PlanKey = keyof typeof STRIPE_PLANS;
export type PackageKey = keyof typeof STRIPE_CREDIT_PACKAGES;

export function getPurchaseType(key: string): "subscription" | "one_time" {
  if (key in STRIPE_PLANS) return "subscription";
  return "one_time";
}
