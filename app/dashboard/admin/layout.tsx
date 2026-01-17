import { requireRole } from "@/lib/auth";
import { AdminSidebar } from "@/components/dashboard/admin/admin-sidebar";
import { AdminHeader } from "@/components/dashboard/admin/admin-header";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole(["preparer", "admin"]);

  return (
    <div className="min-h-screen flex bg-background">
      <AdminSidebar user={session.user} />
      <div className="flex-1 flex flex-col">
        <AdminHeader user={session.user} />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
