import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Every environment variable is wired through the whole deploy path:
 * .env.example, the Coolify compose file (runtime passthrough, or a build arg
 * for NEXT_PUBLIC_ values), the README table and DEPLOYMENT.md. And the
 * runtime image carries the files the server reads with fs.
 */

const ROOT = process.cwd();
const read = (name: string) => readFileSync(join(ROOT, name), "utf8");

function envNames(source: string): string[] {
  return source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => /^([A-Z][A-Z0-9_]*)=/.exec(line)?.[1])
    .filter((name): name is string => Boolean(name));
}

/** The block of lines indented under `key:` that starts at `from`. */
function block(source: string, key: string, from = 0): string {
  const lines = source.slice(from).split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `${key}:`);
  if (start === -1) return "";
  const indent = lines[start].search(/\S/);
  const body: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (line.trim() && line.search(/\S/) <= indent) break;
    body.push(line);
  }
  return body.join("\n");
}

const example = read(".env.example");
const compose = read("docker-compose.coolify.yml");
const readme = read("README.md");
const deployment = read("DEPLOYMENT.md");
const dockerfile = read("Dockerfile");

const names = envNames(example);
const appStart = compose.search(/^ {2}app:\s*$/m);
const app = block(compose, "app", appStart);
const appEnvironment = block(app, "environment");
const buildArgs = block(block(app, "build"), "args");
const db = block(compose, "db", compose.search(/^ {2}db:\s*$/m));

const has = (text: string, name: string) => new RegExp(`(^|[^A-Z0-9_])${name}([^A-Z0-9_]|$)`).test(text);

describe("environment variables", () => {
  it(".env.example declares the expected core set", () => {
    expect(names.length).toBeGreaterThan(15);
    for (const name of ["DATABASE_URL", "AUTH_SECRET", "AUTH_URL", "ROOT_DOMAIN", "POSTGRES_PASSWORD"]) {
      expect(names).toContain(name);
    }
  });

  it("finds the app service blocks in the compose file", () => {
    expect(appStart).toBeGreaterThan(-1);
    expect(appEnvironment).toContain("DATABASE_URL");
    expect(buildArgs).toContain("NEXT_PUBLIC_UMAMI_WEBSITE_ID");
  });

  it.each(names)("%s reaches docker-compose.coolify.yml", (name) => {
    if (name.startsWith("NEXT_PUBLIC_")) {
      expect(has(buildArgs, name), `${name} must be a build arg of the app service`).toBe(true);
    } else if (name.startsWith("POSTGRES_")) {
      expect(has(db, name), `${name} must be set on the db service`).toBe(true);
    } else {
      expect(has(appEnvironment, name), `${name} must be in the app environment`).toBe(true);
    }
  });

  it.each(names)("%s is documented in README.md", (name) => {
    expect(has(readme, name)).toBe(true);
  });

  it.each(names)("%s is documented in DEPLOYMENT.md", (name) => {
    expect(has(deployment, name)).toBe(true);
  });

  it("passes NEXT_PUBLIC_ build args into the builder stage", () => {
    for (const name of names.filter((n) => n.startsWith("NEXT_PUBLIC_"))) {
      expect(dockerfile).toMatch(new RegExp(`^ARG ${name}`, "m"));
      expect(dockerfile).toMatch(new RegExp(`^ENV ${name}=\\$${name}`, "m"));
    }
  });

  it("never sets a real secret in the compose file", () => {
    for (const name of ["AUTH_SECRET", "POSTGRES_PASSWORD", "SETUP_TOKEN", "SMTP_PASS", "TELEGRAM_BOT_TOKEN"]) {
      const line = compose.split(/\r?\n/).find((l) => l.trim().startsWith(`${name}:`));
      expect(line, `${name} is passed through`).toBeDefined();
      expect(line).toMatch(/\$\{/);
    }
  });
});

describe("Dockerfile runner", () => {
  const runner = dockerfile.slice(dockerfile.search(/^FROM \S+ AS runner\s*$/m));

  it("has a runner stage that starts the standalone server as a non-root user", () => {
    expect(runner.startsWith("FROM")).toBe(true);
    expect(runner).toMatch(/^USER nextjs$/m);
    expect(runner).toMatch(/adduser --system --uid 1001 nextjs/);
    expect(runner).toMatch(/^CMD \["node", "server\.js"\]$/m);
  });

  it("copies content/ and assets/fonts/ into the runtime image", () => {
    expect(runner).toMatch(/^COPY --from=builder \/app\/content \.\/content$/m);
    expect(runner).toMatch(/^COPY --from=builder \/app\/assets\/fonts \.\/assets\/fonts$/m);
  });

  it("builds with the production root domain", () => {
    expect(dockerfile).toMatch(/^ENV ROOT_DOMAIN="ashabajasper\.dev"$/m);
  });
});

describe("backup script", () => {
  const script = read("deploy/coolify/backup.sh");

  it("uses LF line endings and fails fast", () => {
    expect(script.includes("\r")).toBe(false);
    expect(script.startsWith("#!/bin/sh\n")).toBe(true);
    expect(script).toMatch(/^set -eu$/m);
  });

  it("finds this app's db container by uuid and keeps 14 days", () => {
    expect(script).toContain("ashabajasper-dev-app.uuid");
    expect(script).toContain("pg_dump");
    expect(script).toMatch(/KEEP_DAYS=14/);
    expect(script).toMatch(/MIN_BYTES=10240/);
  });
});
