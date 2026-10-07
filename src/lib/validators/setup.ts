import { z } from "zod";
import { PASSWORD_MAX_LENGTH, newPasswordField } from "./settings";

/** A guessable SETUP_TOKEN defeats the whole guard, so a shorter one switches setup off. */
export const SETUP_TOKEN_MIN_LENGTH = 16;

/** First run: create the single owner. Guarded by SETUP_TOKEN. */
export const setupSchema = z
  .object({
    token: z.string().min(1, "Paste the setup token from the server environment").max(500),
    name: z.string().trim().min(1, "Add your name").max(80, "Keep the name under 80 characters"),
    email: z
      .string()
      .trim()
      .min(1, "Add the email you will sign in with")
      .max(254, "That email address is too long")
      .email("Enter a valid email address"),
    password: newPasswordField,
    confirmPassword: z.string().max(PASSWORD_MAX_LENGTH),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({ code: "custom", message: "The passwords do not match", path: ["confirmPassword"] });
    }
  });

export type SetupInput = z.infer<typeof setupSchema>;
