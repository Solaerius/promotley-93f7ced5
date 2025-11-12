import { z } from "zod";

export const authSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Ogiltig e-postadress" })
    .max(255, { message: "E-postadressen får vara max 255 tecken" }),
  password: z
    .string()
    .min(8, { message: "Lösenordet måste vara minst 8 tecken" })
    .max(72, { message: "Lösenordet får vara max 72 tecken" })
    .regex(/[a-z]/, { message: "Lösenordet måste innehålla minst en liten bokstav" })
    .regex(/[A-Z]/, { message: "Lösenordet måste innehålla minst en stor bokstav" })
    .regex(/[0-9]/, { message: "Lösenordet måste innehålla minst en siffra" }),
  companyName: z
    .string()
    .trim()
    .max(100, { message: "Företagsnamnet får vara max 100 tecken" })
    .optional(),
});

export const suggestionSchema = z.object({
  platform: z.enum(["instagram", "tiktok", "facebook"], {
    errorMap: () => ({ message: "Välj en giltig plattform" }),
  }),
  brand: z
    .string()
    .trim()
    .min(1, { message: "Varumärke krävs" })
    .max(100, { message: "Varumärket får vara max 100 tecken" }),
  keywords: z
    .string()
    .trim()
    .max(500, { message: "Nyckelord får vara max 500 tecken" })
    .optional(),
});

export const onboardingSchema = z.object({
  industry: z
    .string()
    .trim()
    .min(1, { message: "Bransch krävs" })
    .max(100, { message: "Bransch får vara max 100 tecken" }),
  keywords: z
    .string()
    .trim()
    .max(500, { message: "Nyckelord får vara max 500 tecken" }),
});

export type AuthFormData = z.infer<typeof authSchema>;
export type SuggestionFormData = z.infer<typeof suggestionSchema>;
export type OnboardingFormData = z.infer<typeof onboardingSchema>;
