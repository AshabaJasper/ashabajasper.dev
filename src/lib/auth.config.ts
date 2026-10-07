import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config (no Prisma, no bcrypt) shared by the middleware.
 * The providers live in auth.ts.
 *
 * Sessions exist only on admin.<root>: cookies carry no domain attribute, so
 * the portfolio and blog hosts never receive one.
 */
const DAY_MS = 24 * 60 * 60 * 1000;
const REMEMBERED_SESSION_MS = 30 * DAY_MS;
const SHORT_SESSION_MS = 1 * DAY_MS;
/** A PIN sign-in is quick to repeat, so it lasts a week. */
const PIN_SESSION_MS = 7 * DAY_MS;

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    // The cookie covers the longest case; the jwt callback enforces the shorter ones.
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    // Host routing and the admin gate live in src/middleware.ts, which does not
    // use the Auth.js wrapper. Kept permissive so Auth.js never redirects on its own.
    authorized() {
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const { rememberMe, viaPin } = user as { rememberMe?: boolean; viaPin?: boolean };
        token.sessionExpiry =
          Date.now() + (viaPin ? PIN_SESSION_MS : rememberMe ? REMEMBERED_SESSION_MS : SHORT_SESSION_MS);
      } else if (typeof token.sessionExpiry === "number" && Date.now() > token.sessionExpiry) {
        return null;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
