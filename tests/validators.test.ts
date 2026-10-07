import { describe, expect, it } from "vitest";
import { contactSchema } from "@/lib/validators/contact";
import { commentSchema, moderateCommentSchema, ownerReplySchema } from "@/lib/validators/comments";
import { setPinSchema } from "@/lib/validators/pin";
import { changePasswordSchema } from "@/lib/validators/settings";
import { setupSchema } from "@/lib/validators/setup";
import { messageStatusSchema, sendReplySchema } from "@/lib/validators/inbox";

const contact = {
  name: "Ada",
  email: "ada@example.com",
  subject: "",
  message: "Hello there, a real message.",
  website: "",
  token: "1.abc",
};

const comment = {
  postSlug: "pin-on-a-trusted-device",
  name: "Ada",
  email: "",
  body: "Nice post",
  website: "",
  token: "1.abc",
};

function errorsOf(result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) {
  return result.success ? [] : result.error!.issues.map((i) => String(i.path[0]));
}

describe("contact schema (docs/API.md)", () => {
  it("accepts a valid body with an empty subject", () => {
    expect(contactSchema.safeParse(contact).success).toBe(true);
  });

  it("enforces the documented bounds", () => {
    expect(errorsOf(contactSchema.safeParse({ ...contact, name: "" }))).toEqual(["name"]);
    expect(errorsOf(contactSchema.safeParse({ ...contact, name: "x".repeat(81) }))).toEqual(["name"]);
    expect(contactSchema.safeParse({ ...contact, name: "x".repeat(80) }).success).toBe(true);
    expect(errorsOf(contactSchema.safeParse({ ...contact, email: "nope" }))).toContain("email");
    expect(errorsOf(contactSchema.safeParse({ ...contact, email: "" }))).toContain("email");
    expect(errorsOf(contactSchema.safeParse({ ...contact, subject: "x".repeat(121) }))).toEqual(["subject"]);
    expect(errorsOf(contactSchema.safeParse({ ...contact, message: "too short" }))).toEqual(["message"]);
    expect(errorsOf(contactSchema.safeParse({ ...contact, message: "x".repeat(4001) }))).toEqual(["message"]);
    expect(contactSchema.safeParse({ ...contact, message: "x".repeat(4000) }).success).toBe(true);
  });

  it("requires every key, including the honeypot and token", () => {
    const noHoneypot: Partial<typeof contact> = { ...contact };
    delete noHoneypot.website;
    const noToken: Partial<typeof contact> = { ...contact };
    delete noToken.token;
    expect(errorsOf(contactSchema.safeParse(noHoneypot))).toEqual(["website"]);
    expect(errorsOf(contactSchema.safeParse(noToken))).toEqual(["token"]);
  });

  it("lets the route reject a filled honeypot consistently", () => {
    expect(contactSchema.safeParse({ ...contact, website: "http://spam.example" }).success).toBe(true);
  });

  it("trims text", () => {
    const parsed = contactSchema.parse({ ...contact, name: "  Ada  ", email: " ada@example.com " });
    expect(parsed.name).toBe("Ada");
    expect(parsed.email).toBe("ada@example.com");
  });
});

describe("comment schema (docs/API.md)", () => {
  it("accepts an empty email or a valid one", () => {
    expect(commentSchema.safeParse(comment).success).toBe(true);
    expect(commentSchema.safeParse({ ...comment, email: "ada@example.com" }).success).toBe(true);
    expect(errorsOf(commentSchema.safeParse({ ...comment, email: "nope" }))).toEqual(["email"]);
    expect(errorsOf(commentSchema.safeParse({ ...comment, email: `${"a".repeat(250)}@x.io` }))).toContain("email");
  });

  it("enforces the body and name bounds", () => {
    expect(errorsOf(commentSchema.safeParse({ ...comment, body: "x" }))).toEqual(["body"]);
    expect(commentSchema.safeParse({ ...comment, body: "ok" }).success).toBe(true);
    expect(errorsOf(commentSchema.safeParse({ ...comment, body: "x".repeat(2001) }))).toEqual(["body"]);
    expect(errorsOf(commentSchema.safeParse({ ...comment, name: "" }))).toEqual(["name"]);
  });

  it("refuses slugs that are not kebab-case", () => {
    expect(errorsOf(commentSchema.safeParse({ ...comment, postSlug: "../etc/passwd" }))).toEqual(["postSlug"]);
    expect(errorsOf(commentSchema.safeParse({ ...comment, postSlug: "" }))).toEqual(["postSlug"]);
  });

  it("covers the admin moderation inputs", () => {
    expect(moderateCommentSchema.safeParse({ id: "c1", op: "approve" }).success).toBe(true);
    expect(moderateCommentSchema.safeParse({ id: "c1", op: "delete" }).success).toBe(false);
    expect(ownerReplySchema.safeParse({ parentId: "c1", body: " " }).success).toBe(false);
  });
});

describe("admin schemas", () => {
  const setup = {
    token: "t",
    name: "Owner",
    email: "owner@example.com",
    password: "a-long-test-passphrase",
    confirmPassword: "a-long-test-passphrase",
  };

  it("setup needs a 12 character password that matches its confirmation", () => {
    expect(setupSchema.safeParse(setup).success).toBe(true);
    expect(errorsOf(setupSchema.safeParse({ ...setup, password: "short", confirmPassword: "short" }))).toEqual(["password"]);
    expect(errorsOf(setupSchema.safeParse({ ...setup, confirmPassword: "different-value!" }))).toEqual(["confirmPassword"]);
    expect(errorsOf(setupSchema.safeParse({ ...setup, token: "" }))).toEqual(["token"]);
  });

  it("change password refuses a short or reused password", () => {
    const base = { currentPassword: "old-passphrase-1", newPassword: "new-passphrase-22", confirmPassword: "new-passphrase-22" };
    expect(changePasswordSchema.safeParse(base).success).toBe(true);
    expect(errorsOf(changePasswordSchema.safeParse({ ...base, newPassword: "short", confirmPassword: "short" }))).toEqual(["newPassword"]);
    expect(
      errorsOf(changePasswordSchema.safeParse({ ...base, newPassword: base.currentPassword, confirmPassword: base.currentPassword })),
    ).toEqual(["newPassword"]);
  });

  it("rejects passwords bcrypt would truncate, including multibyte text", () => {
    for (const password of ["x".repeat(73), "\u{1f512}".repeat(19)]) {
      expect(setupSchema.safeParse({ ...setup, password, confirmPassword: password }).success).toBe(false);
      expect(changePasswordSchema.safeParse({ currentPassword: "old-passphrase-1", newPassword: password, confirmPassword: password }).success).toBe(false);
    }
    for (const password of ["x".repeat(72), "\u{1f512}".repeat(18)]) {
      expect(setupSchema.safeParse({ ...setup, password, confirmPassword: password }).success).toBe(true);
    }
  });

  it("PIN rules come from src/lib/auth/pin.ts", () => {
    expect(setPinSchema.safeParse({ currentPassword: "x", pin: "2580", confirmPin: "2580" }).success).toBe(true);
    expect(errorsOf(setPinSchema.safeParse({ currentPassword: "x", pin: "1234", confirmPin: "1234" }))).toEqual(["pin"]);
    expect(errorsOf(setPinSchema.safeParse({ currentPassword: "x", pin: "2580", confirmPin: "2581" }))).toEqual(["confirmPin"]);
  });

  it("inbox inputs", () => {
    expect(messageStatusSchema.safeParse({ id: "m1", op: "archive" }).success).toBe(true);
    expect(messageStatusSchema.safeParse({ id: "m1", op: "delete" }).success).toBe(false);
    expect(sendReplySchema.safeParse({ id: "m1", body: "  " }).success).toBe(false);
  });
});
