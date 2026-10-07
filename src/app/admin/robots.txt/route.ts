/** The admin is never crawled. Not access control: the sign-in is. */
export const dynamic = "force-static";

export function GET() {
  return new Response("User-agent: *\nDisallow: /\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex, nofollow" },
  });
}
