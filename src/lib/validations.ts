import { z } from "zod";

export const authSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "validation.email_invalid" })
    .max(255, { message: "validation.email_too_long" }),
  password: z
    .string()
    .min(8, { message: "validation.password_too_short" })
    .max(72, { message: "validation.password_too_long" })
    .regex(/[a-z]/, { message: "validation.password_no_lowercase" })
    .regex(/[A-Z]/, { message: "validation.password_no_uppercase" })
    .regex(/[0-9]/, { message: "validation.password_no_digit" }),
  companyName: z
    .string()
    .trim()
    .max(100, { message: "validation.company_too_long" })
    .optional(),
});

export const suggestionSchema = z.object({
  platform: z.enum(["instagram", "tiktok", "facebook"], {
    errorMap: () => ({ message: "validation.platform_invalid" }),
  }),
  brand: z
    .string()
    .trim()
    .min(1, { message: "validation.brand_required" })
    .max(100, { message: "validation.brand_too_long" }),
  keywords: z
    .string()
    .trim()
    .max(500, { message: "validation.keywords_too_long" })
    .optional(),
});

export const onboardingSchema = z.object({
  industry: z
    .string()
    .trim()
    .min(1, { message: "validation.industry_required" })
    .max(100, { message: "validation.industry_too_long" }),
  keywords: z
    .string()
    .trim()
    .max(500, { message: "validation.keywords_too_long" }),
});

export type AuthFormData = z.infer<typeof authSchema>;
export type SuggestionFormData = z.infer<typeof suggestionSchema>;
export type OnboardingFormData = z.infer<typeof onboardingSchema>;
