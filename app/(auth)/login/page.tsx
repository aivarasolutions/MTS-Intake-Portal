import { LoginForm } from "@/components/auth/login-form";
import { AuthLayout } from "@/components/auth/auth-layout";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await getSession();
  
  if (session) {
    if (session.user.role === "client") {
      redirect("/dashboard/client");
    } else {
      redirect("/dashboard/admin");
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to your MTS 1040 account to manage your tax documents"
    >
      <LoginForm />
    </AuthLayout>
  );
}
