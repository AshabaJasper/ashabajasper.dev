import { z } from "zod";
import { pinProblem } from "@/lib/auth/pin";

export const setPinSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your password to confirm it is you").max(200),
    pin: z.string().max(32),
    confirmPin: z.string().max(32),
  })
  .superRefine((data, ctx) => {
    const problem = pinProblem(data.pin);
    if (problem) ctx.addIssue({ code: "custom", message: problem, path: ["pin"] });
    if (data.pin !== data.confirmPin) {
      ctx.addIssue({ code: "custom", message: "The PINs do not match", path: ["confirmPin"] });
    }
  });

export type SetPinInput = z.infer<typeof setPinSchema>;

export const removePinSchema = z.object({});

export const revokeDeviceSchema = z.object({ deviceId: z.string().min(1).max(64) });
