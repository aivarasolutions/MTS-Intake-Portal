import { requireRole } from "@/lib/auth";
import { ClientHeader } from "@/components/dashboard/client/client-header";

export default async function ClientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole(["client"]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ClientHeader user={session.user} />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
