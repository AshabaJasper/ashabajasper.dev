/**
 * Development check of the public form APIs against a running dev server and
 * the dev database. Never run it against production.
 *
 *   ROOT_DOMAIN=localhost:3103 npx next dev --turbopack -p 3103   (in another terminal)
 *   npx tsx scripts/verify-forms.ts
 *
 * It fetches a form token, waits past the 3 second minimum, posts one contact
 * message and one comment with the right Origin and Host, checks the rows in
 * the database, and deletes every row it created, whatever happens.
 */
import { request } from "node:http";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";

try {
  process.loadEnvFile?.(".env");
} catch {
  // No .env file: rely on the environment.
}

const PORT = Number(process.env.VERIFY_PORT ?? "3103");
const ROOT = `localhost:${PORT}`;

function refuseUnlessLocal() {
  const url = process.env.DATABASE_URL ?? "";
  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    // fall through
  }
  if (!["localhost", "127.0.0.1", "::1", "[::1]"].includes(host)) {
    console.error("Refusing to run: DATABASE_URL does not point at localhost.");
    process.exit(2);
  }
}

interface HttpResult {
  status: number;
  body: string;
}

function call(method: "GET" | "POST", hostHeader: string, pathname: string, body?: unknown, origin?: string): Promise<HttpResult> {
  const payload = body === undefined ? undefined : JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = request(
      {
        host: "127.0.0.1",
        port: PORT,
        method,
        path: pathname,
        headers: {
          Host: hostHeader,
          // TEST-NET-3 address: a sender fingerprint that is never a real visitor.
          "X-Forwarded-For": "203.0.113.250",
          "User-Agent": "verify-forms script",
          ...(origin ? { Origin: origin } : {}),
          ...(payload ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } : {}),
        },
        timeout: 60_000,
      },
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve({ status: res.statusCode ?? 0, body: data }));
      },
    );
    req.on("timeout", () => req.destroy(new Error("request timed out")));
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function publishedSlug(): string {
  const dir = path.join(process.cwd(), "content", "posts");
  for (const name of readdirSync(dir).filter((n) => n.endsWith(".mdx")).sort()) {
    const source = readFileSync(path.join(dir, name), "utf8");
    const frontmatter = source.split(/^---\s*$/m)[1] ?? "";
    if (!/^draft:\s*true\s*$/m.test(frontmatter)) return name.slice(0, -4);
  }
  throw new Error("No published post in content/posts");
}

function check(condition: unknown, label: string) {
  if (!condition) throw new Error(`FAILED: ${label}`);
  console.log(`ok   ${label}`);
}

async function main() {
  refuseUnlessLocal();
  const prisma = new PrismaClient();
  const marker = `verify-forms ${randomBytes(4).toString("hex")}`;
  const portfolio = { host: ROOT, origin: `http://${ROOT}` };
  const blog = { host: `blog.${ROOT}`, origin: `http://blog.${ROOT}` };
  const slug = publishedSlug();

  try {
    const [contactToken, commentToken] = await Promise.all([
      call("GET", portfolio.host, "/api/form-token"),
      call("GET", blog.host, "/api/form-token"),
    ]);
    check(contactToken.status === 200 && commentToken.status === 200, "GET /api/form-token answers 200 on both hosts");
    const tokenA = (JSON.parse(contactToken.body) as { token: string }).token;
    const tokenB = (JSON.parse(commentToken.body) as { token: string }).token;

    const early = await call(
      "POST",
      portfolio.host,
      "/api/contact",
      { name: marker, email: "verify@example.com", subject: "early", message: "Sent too soon to count.", website: "", token: tokenA },
      portfolio.origin,
    );
    check(early.status === 400 && JSON.parse(early.body).ok === false, "an early submission is rejected without a success receipt");

    const wrongOrigin = await call(
      "POST",
      portfolio.host,
      "/api/contact",
      { name: marker, email: "verify@example.com", subject: "", message: "Wrong origin here.", website: "", token: tokenA },
      "http://evil.example",
    );
    check(wrongOrigin.status === 403, "a foreign Origin answers 403");

    console.log("     waiting 3.5 s for the token to age");
    await new Promise((r) => setTimeout(r, 3500));

    const contact = await call(
      "POST",
      portfolio.host,
      "/api/contact",
      {
        name: marker,
        email: "verify@example.com",
        subject: "Form check",
        message: "This message was sent by scripts/verify-forms.ts and is deleted at once.",
        website: "",
        token: tokenA,
      },
      portfolio.origin,
    );
    check(contact.status === 200 && JSON.parse(contact.body).ok === true, "POST /api/contact answers 200 { ok: true }");

    const comment = await call(
      "POST",
      blog.host,
      "/api/comments",
      { postSlug: slug, name: marker, email: "", body: "A check from scripts/verify-forms.ts.", website: "", token: tokenB },
      blog.origin,
    );
    check(comment.status === 200 && JSON.parse(comment.body).ok === true, `POST /api/comments on "${slug}" answers 200 { ok: true }`);

    const messages = await prisma.contactMessage.findMany({ where: { name: marker } });
    check(messages.length === 1, "exactly one contact message stored (the early one was rejected)");
    check(messages[0].status === "NEW" && /^[0-9a-f]{32}$/.test(messages[0].ipHash ?? ""), "it is NEW with a 32-character IP hash");
    check(!JSON.stringify(messages[0]).includes("203.0.113.250"), "the raw IP is not stored");

    const comments = await prisma.comment.findMany({ where: { authorName: marker } });
    check(comments.length === 1 && comments[0].status === "PENDING", "one comment stored, PENDING");
    check(comments[0].postSlug === slug && comments[0].authorEmail === null, "with the slug and no email");
  } finally {
    const removed = await Promise.all([
      prisma.contactMessage.deleteMany({ where: { name: marker } }),
      prisma.comment.deleteMany({ where: { authorName: marker } }),
    ]);
    console.log(`     cleaned up: ${removed[0].count} message(s), ${removed[1].count} comment(s)`);
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
