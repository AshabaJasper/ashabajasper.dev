import { describe, expect, it } from "vitest";
import { excerpt, mailtoHref, quoteForReply, replySubject } from "@/lib/contact/reply";
import { summarizeMeta } from "@/lib/contact/audit-meta";
import { formatListDate } from "@/lib/contact/format";

const message = {
  name: "Ada",
  email: "ada+test@example.com",
  subject: "Project idea",
  body: "Line one\n\nLine two",
  createdAt: new Date("2026-10-07T09:00:00Z"),
};

describe("reply helpers", () => {
  it("prefixes Re: once", () => {
    expect(replySubject("Project idea")).toBe("Re: Project idea");
    expect(replySubject("RE: Project idea")).toBe("RE: Project idea");
    expect(replySubject(null)).toBe("Re: your message");
    expect(replySubject("a\r\nb")).toBe("Re: a b");
  });

  it("quotes every line", () => {
    expect(quoteForReply(message)).toBe("On 7 October 2026, Ada wrote:\n> Line one\n>\n> Line two");
  });

  it("builds a mailto link with %20 spaces and the quote", () => {
    const href = mailtoHref(message);
    expect(href.startsWith("mailto:ada%2Btest@example.com?subject=Re%3A%20Project%20idea&body=")).toBe(true);
    expect(href).not.toContain("+");
    expect(decodeURIComponent(href.split("body=")[1])).toContain("> Line two");
  });

  it("keeps mailto links short for long messages", () => {
    const href = mailtoHref({ ...message, body: "word ".repeat(3000) });
    expect(href.length).toBeLessThan(4000);
  });

  it("cuts excerpts on a word", () => {
    expect(excerpt("short text")).toBe("short text");
    const long = excerpt("alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi omicron pi rho", 40);
    expect(long.endsWith("...")).toBe(true);
    expect(long.length).toBeLessThanOrEqual(43);
  });
});

describe("audit meta summary", () => {
  it("never shows keys that could hold a secret or personal data", () => {
    const text = summarizeMeta({ post: "hello", passwordHash: "x", pin: "2580", token: "t", email: "a@b.c", body: "msg", to: "SPAM" });
    expect(text).toBe("post: hello, to: SPAM");
  });

  it("is empty for missing or odd meta", () => {
    expect(summarizeMeta(null)).toBe("");
    expect(summarizeMeta([1, 2])).toBe("");
    expect(summarizeMeta("x")).toBe("");
  });
});

describe("list dates", () => {
  const now = new Date("2026-10-07T12:00:00Z");
  it("shows the time today, the day this year and the year before that", () => {
    expect(formatListDate(new Date("2026-10-07T08:05:00Z"), now)).toBe("11:05");
    expect(formatListDate(new Date("2026-03-02T08:05:00Z"), now)).toBe("2 Mar");
    expect(formatListDate(new Date("2025-03-02T08:05:00Z"), now)).toBe("2 Mar 2025");
  });
});
