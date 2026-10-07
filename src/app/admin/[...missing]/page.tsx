import { notFound } from "next/navigation";

/** Unknown admin paths render the admin 404 with a real 404 status. */
export default function AdminMissing() {
  notFound();
}
