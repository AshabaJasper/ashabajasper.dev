import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    securityStamp?: string;
  }
  interface Session {
    user: { id: string; securityStamp?: string } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    sessionExpiry?: number;
    securityStamp?: string;
  }
}
