import { notFound } from "next/navigation";

/** Any blog path that matches nothing renders the blog's own 404 inside the blog layout. */
export default function MissingBlogPage() {
  notFound();
}
