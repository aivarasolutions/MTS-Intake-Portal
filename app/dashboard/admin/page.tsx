import { requireRole } from "@/lib/auth";
import { AdminDashboardContent } from "@/components/dashboard/admin/admin-dashboard-content";

export default async function AdminDashboardPage() {
  const session = await requireRole(["preparer", "admin"]);

  return <AdminDashboardContent user={session.user} />;
}
