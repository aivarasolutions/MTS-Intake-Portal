import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function Home() {
  const session = await getSession();
  
  if (session) {
    if (session.user.role === "client") {
      redirect("/dashboard/client");
    } else {
      redirect("/dashboard/admin");
    }
  }
  
  redirect("/login");
}
