import { z } from "zod";

/**
 * POST /api/contact, exactly as docs/API.md describes it. The honeypot and the
 * token are only shape-checked here: a filled honeypot or a bad token is
 * answered with 200 and nothing stored, never with a 400 that teaches a bot.
 */
export const contactSchema = z.object({
  name: z.string().trim().min(1, "Tell me your name").max(80, "Keep your name under 80 characters"),
  email: z
    .string()
    .trim()
    .min(1, "Add an email address so I can reply")
    .max(254, "That email address is too long")
    .email("Enter a valid email address"),
  subject: z.string().trim().max(120, "Keep the subject under 120 characters"),
  message: z
    .string()
    .trim()
    .min(10, "Write at least 10 characters")
    .max(4000, "Keep the message under 4,000 characters"),
  website: z.string().max(2000),
  token: z.string().max(200),
});

export type ContactInput = z.infer<typeof contactSchema>;
