import { RegisterForm } from "@/components/auth/register-form";
import { AuthLayout } from "@/components/auth/auth-layout";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function RegisterPage() {
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
      title="Create your account"
      description="Get started with MTS 1040 to securely manage your tax documents"
    >
      <RegisterForm />
    </AuthLayout>
  );
}
