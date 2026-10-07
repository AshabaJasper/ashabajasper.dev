import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 200;
export const PASSWORD_MAX_BYTES = 72;

/** A new password: long enough to resist guessing, short enough for bcrypt's 72-byte input. */
export const newPasswordField = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH, `Use at most ${PASSWORD_MAX_LENGTH} characters`)
  .refine((value) => new TextEncoder().encode(value).length <= PASSWORD_MAX_BYTES, {
    message: `Use a shorter password, at most ${PASSWORD_MAX_BYTES} UTF-8 bytes`,
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password").max(PASSWORD_MAX_LENGTH),
    newPassword: newPasswordField,
    confirmPassword: z.string().max(PASSWORD_MAX_LENGTH),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({ code: "custom", message: "The passwords do not match", path: ["confirmPassword"] });
    }
    if (data.newPassword && data.newPassword === data.currentPassword) {
      ctx.addIssue({ code: "custom", message: "Choose a password you are not using now", path: ["newPassword"] });
    }
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const signOutOthersSchema = z.object({});
