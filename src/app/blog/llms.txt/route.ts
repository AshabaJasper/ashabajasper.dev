import { buildLlmsTxt, textResponse } from "@/lib/llms";

export const runtime = "nodejs";

export async function GET() {
  return textResponse(await buildLlmsTxt());
}
