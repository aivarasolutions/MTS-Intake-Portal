import { requireRole } from "@/lib/auth";
import { ClientDashboardContent } from "@/components/dashboard/client/client-dashboard-content";

export default async function ClientDashboardPage() {
  const session = await requireRole(["client"]);

  return <ClientDashboardContent user={session.user} />;
}
