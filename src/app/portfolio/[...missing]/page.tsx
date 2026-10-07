import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NOT_FOUND_METADATA } from "@/components/portfolio/not-found-metadata";

/** The 404 title, description and noindex; see not-found-metadata.ts for why it is repeated here. */
export const metadata: Metadata = NOT_FOUND_METADATA;

/** Any unknown portfolio path renders the branded 404 with a real 404 status. */
export default function MissingPage() {
  notFound();
}
