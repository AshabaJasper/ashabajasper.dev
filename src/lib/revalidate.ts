import "server-only";
import { revalidatePath } from "next/cache";

/**
 * Refresh a cached blog post after its comments change. The path is the
 * internal one behind the host rewrite (src/app/blog/[slug]), because that is
 * the route Next.js caches.
 */
export function revalidateBlogPost(slug: string): void {
  revalidatePath(`/blog/${slug}`);
}

/** Refresh every admin page (counts in the sidebar, lists, detail pages). */
export function revalidateAdmin(): void {
  revalidatePath("/admin", "layout");
}
