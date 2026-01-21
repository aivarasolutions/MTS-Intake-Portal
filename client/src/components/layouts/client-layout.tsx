import { useState } from "react";
import { Link, useLocation } from "wouter";
import { FileText, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/shared/user-menu";
import { useAuth } from "@/contexts/auth-context";
import { useQuery } from "@tanstack/react-query";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, navigate] = useLocation();

  const { data: intakes } = useQuery<any[]>({
    queryKey: ["/api/intakes"],
    enabled: !!user,
  });

  const currentYear = new Date().getFullYear();
  const taxYear = currentYear - 1;
  const currentIntake = intakes?.find((i) => i.tax_year === taxYear) || intakes?.[0];

  const handleDocumentsClick = () => {
    if (currentIntake) {
      navigate(`/intake/${currentIntake.id}?step=8`);
    } else {
      navigate("/dashboard/client");
    }
  };

  const handleTaxIntakeClick = () => {
    if (currentIntake) {
      navigate(`/intake/${currentIntake.id}`);
    } else {
      navigate("/dashboard/client");
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/client" className="flex items-center gap-2">
                <img 
                  src="/logo.jpg" 
                  alt="MTS 1040" 
                  className="h-10 w-auto"
                  data-testid="img-logo"
                />
              </Link>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              <Link href="/dashboard/client">
                <Button variant="ghost" size="sm" data-testid="link-dashboard">
                  Dashboard
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="sm" 
                data-testid="link-documents"
                onClick={handleDocumentsClick}
              >
                Documents
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                data-testid="link-intake"
                onClick={handleTaxIntakeClick}
              >
                Tax Intake
              </Button>
            </nav>

            <div className="flex items-center gap-2">
              <UserMenu />
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-testid="button-mobile-menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <nav className="flex flex-col gap-2">
                <Link href="/dashboard/client" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start" data-testid="mobile-link-dashboard">
                    Dashboard
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start" 
                  data-testid="mobile-link-documents"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleDocumentsClick();
                  }}
                >
                  Documents
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start" 
                  data-testid="mobile-link-intake"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleTaxIntakeClick();
                  }}
                >
                  Tax Intake
                </Button>
              </nav>
            </div>
          )}
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
