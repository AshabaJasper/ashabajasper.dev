import { authSecret } from "@/lib/env";
import { issueFormToken } from "@/lib/forms/form-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** A signed issue time for the public forms. See docs/API.md. */
export async function GET() {
  return Response.json(
    { token: issueFormToken(authSecret(), Date.now()) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
