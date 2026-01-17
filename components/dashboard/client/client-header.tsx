"use client";

import Link from "next/link";
import { FileText, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/dashboard/user-menu";
import type { SessionUser } from "@/lib/auth";
import { useState } from "react";

interface ClientHeaderProps {
  user: SessionUser;
}

export function ClientHeader({ user }: ClientHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/client" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <FileText className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-semibold hidden sm:inline-block">MTS 1040</span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            <Link href="/dashboard/client">
              <Button variant="ghost" size="sm" data-testid="link-dashboard">
                Dashboard
              </Button>
            </Link>
            <Link href="/dashboard/client/documents">
              <Button variant="ghost" size="sm" data-testid="link-documents">
                Documents
              </Button>
            </Link>
            <Link href="/dashboard/client/intake">
              <Button variant="ghost" size="sm" data-testid="link-intake">
                Tax Intake
              </Button>
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <UserMenu user={user} />
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
              <Link href="/dashboard/client/documents" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start" data-testid="mobile-link-documents">
                  Documents
                </Button>
              </Link>
              <Link href="/dashboard/client/intake" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start" data-testid="mobile-link-intake">
                  Tax Intake
                </Button>
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
