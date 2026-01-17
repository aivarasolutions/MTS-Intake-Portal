"use client";

import {
  Users,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  MoreHorizontal,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";

interface AdminDashboardContentProps {
  user: SessionUser;
}

const mockClients = [
  {
    id: "1",
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.j@email.com",
    status: "pending_review",
    documentsCount: 5,
    lastActivity: "2 hours ago",
  },
  {
    id: "2",
    firstName: "Michael",
    lastName: "Chen",
    email: "m.chen@email.com",
    status: "in_progress",
    documentsCount: 3,
    lastActivity: "1 day ago",
  },
  {
    id: "3",
    firstName: "Emily",
    lastName: "Rodriguez",
    email: "e.rodriguez@email.com",
    status: "awaiting_client",
    documentsCount: 2,
    lastActivity: "3 days ago",
  },
  {
    id: "4",
    firstName: "David",
    lastName: "Thompson",
    email: "d.thompson@email.com",
    status: "completed",
    documentsCount: 8,
    lastActivity: "1 week ago",
  },
];

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" }> = {
  pending_review: { label: "Pending Review", variant: "warning" },
  in_progress: { label: "In Progress", variant: "info" },
  awaiting_client: { label: "Awaiting Client", variant: "secondary" },
  completed: { label: "Completed", variant: "success" },
};

export function AdminDashboardContent({ user }: AdminDashboardContentProps) {
  const currentYear = new Date().getFullYear();
  const taxYear = currentYear - 1;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Tax Year {taxYear} | Overview of all client cases
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Clients
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums">24</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3 text-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400">+3</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Review
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums">8</div>
            <p className="text-xs text-muted-foreground mt-1">Requires your attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums">12</div>
            <p className="text-xs text-muted-foreground mt-1">Active cases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums">4</div>
            <p className="text-xs text-muted-foreground mt-1">This tax season</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl">Recent Clients</CardTitle>
                <CardDescription>Latest activity from your clients</CardDescription>
              </div>
              <Button variant="outline" size="sm" data-testid="button-view-all-clients">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between gap-4 p-4 rounded-lg bg-muted/50 hover-elevate"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {getInitials(client.firstName, client.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {client.firstName} {client.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{client.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <Badge variant={statusConfig[client.status]?.variant || "secondary"}>
                        {statusConfig[client.status]?.label || client.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {client.documentsCount} documents
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          data-testid={`button-client-menu-${client.id}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>View Documents</DropdownMenuItem>
                        <DropdownMenuItem>Send Message</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Alerts</CardTitle>
            <CardDescription>Items requiring attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/20">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">3 clients awaiting response</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Pending for more than 48 hours
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-900/20">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">5 new documents uploaded</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Ready for review
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-900/20">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">2 returns ready to file</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Awaiting final approval
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
