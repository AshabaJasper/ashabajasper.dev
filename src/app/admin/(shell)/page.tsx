import { redirect } from "next/navigation";

/** The admin opens on the inbox. */
export default function AdminHome() {
  redirect("/inbox");
}
