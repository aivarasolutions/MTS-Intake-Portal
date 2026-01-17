import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  FileText,
  LayoutDashboard,
  Users,
  FolderOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { cn, getInitials } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { UserMenu } from "@/components/shared/user-menu";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Clients",
    href: "/dashboard/admin/clients",
    icon: Users,
  },
  {
    title: "Documents",
    href: "/dashboard/admin/documents",
    icon: FolderOpen,
  },
  {
    title: "Settings",
    href: "/dashboard/admin/settings",
    icon: Settings,
  },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user } = useAuth();
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  return (
    <div className="min-h-screen flex bg-background">
      <aside
        className={cn(
          "flex flex-col border-r bg-sidebar transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          <Link href="/dashboard/admin" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shrink-0">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <span className="font-semibold text-sidebar-foreground">MTS 1040</span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setCollapsed(!collapsed)}
            data-testid="button-toggle-sidebar"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || 
              (item.href !== "/dashboard/admin" && location.startsWith(item.href));
            
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3",
                    collapsed && "justify-center px-2",
                    isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                  )}
                  data-testid={`nav-${item.title.toLowerCase()}`}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </Button>
              </Link>
            );
          })}
        </nav>

        <Separator className="bg-sidebar-border" />

        <div className="p-4">
          <div className={cn(
            "flex items-center gap-3",
            collapsed && "justify-center"
          )}>
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {getInitials(user.first_name, user.last_name)}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.first_name} {user.last_name}
                </p>
                <Badge variant="secondary" className="text-xs capitalize">
                  {user.role}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background px-6">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search clients..."
                className="pl-9"
                data-testid="input-search"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              data-testid="button-notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
            </Button>
            <UserMenu />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
