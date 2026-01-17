import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Users,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  MoreHorizontal,
  Loader2,
  Eye,
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
import { useAuth } from "@/contexts/auth-context";
import { AdminLayout } from "@/components/layouts/admin-layout";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  submitted: { label: "Submitted", variant: "default" },
  in_review: { label: "In Review", variant: "default" },
  ready_for_drake: { label: "Ready for Drake", variant: "default" },
  filed: { label: "Filed", variant: "default" },
  accepted: { label: "Accepted", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const currentYear = new Date().getFullYear();
  const taxYear = currentYear - 1;

  const { data: intakes, isLoading } = useQuery<any[]>({
    queryKey: ["/api/intakes"],
  });

  if (!user) return null;

  const submittedCount = intakes?.filter((i) => i.status === "submitted").length || 0;
  const inReviewCount = intakes?.filter((i) => i.status === "in_review").length || 0;
  const completedCount = intakes?.filter((i) => ["filed", "accepted"].includes(i.status)).length || 0;
  const totalCount = intakes?.length || 0;

  return (
    <AdminLayout>
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
                Total Intakes
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tabular-nums">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All tax intakes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Submitted
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tabular-nums">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : submittedCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                In Review
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tabular-nums">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : inReviewCount}
              </div>
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
              <div className="text-2xl font-semibold tabular-nums">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : completedCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Filed or accepted</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">Recent Intakes</CardTitle>
                  <CardDescription>Latest client tax intakes</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : intakes && intakes.length > 0 ? (
                <div className="space-y-4">
                  {intakes.slice(0, 5).map((intake: any) => {
                    const firstName = intake.taxpayer_info?.taxpayer_first_name || "Client";
                    const lastName = intake.taxpayer_info?.taxpayer_last_name || "";
                    const email = intake.taxpayer_info?.taxpayer_email || intake.user?.email || "";
                    const fileCount = intake.files?.length || 0;
                    
                    return (
                      <div
                        key={intake.id}
                        className="flex items-center justify-between gap-4 p-4 rounded-lg bg-muted/50 hover-elevate cursor-pointer"
                        onClick={() => navigate(`/admin/intake/${intake.id}`)}
                        data-testid={`intake-row-${intake.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {getInitials(firstName, lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {firstName} {lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">{email || `Tax Year ${intake.tax_year}`}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right hidden sm:block">
                            <Badge variant={statusConfig[intake.status]?.variant || "secondary"}>
                              {statusConfig[intake.status]?.label || intake.status}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {fileCount} documents
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/intake/${intake.id}`);
                            }}
                            data-testid={`button-view-intake-${intake.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No intakes yet.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Quick Stats</CardTitle>
              <CardDescription>Intake status breakdown</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">Draft</span>
                <Badge variant="secondary">
                  {intakes?.filter((i) => i.status === "draft").length || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">Submitted</span>
                <Badge variant="default">
                  {submittedCount}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">In Review</span>
                <Badge variant="default">
                  {inReviewCount}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">Ready for Drake</span>
                <Badge variant="default">
                  {intakes?.filter((i) => i.status === "ready_for_drake").length || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">Completed</span>
                <Badge variant="default">
                  {completedCount}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
