"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  LayoutDashboard,
  Users,
  FolderOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn, getInitials } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";
import { useState } from "react";

interface AdminSidebarProps {
  user: SessionUser;
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

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
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
          const isActive = pathname === item.href || 
            (item.href !== "/dashboard/admin" && pathname.startsWith(item.href));
          
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
  );
}
