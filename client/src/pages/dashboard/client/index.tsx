import { FileText, Upload, ClipboardCheck, Calculator, Clock, CheckCircle2, AlertCircle, Loader2, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { ClientLayout } from "@/components/layouts/client-layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

function getStatusBadgeVariant(status: string): "default" | "warning" | "success" | "destructive" {
  switch (status) {
    case "draft":
      return "warning";
    case "submitted":
    case "in_review":
      return "default";
    case "ready_for_drake":
    case "filed":
    case "accepted":
      return "success";
    case "rejected":
      return "destructive";
    default:
      return "default";
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "draft":
      return "In Progress";
    case "submitted":
      return "Submitted";
    case "in_review":
      return "In Review";
    case "ready_for_drake":
      return "Ready for Filing";
    case "filed":
      return "Filed";
    case "accepted":
      return "Accepted";
    case "rejected":
      return "Rejected";
    default:
      return status;
  }
}

export default function ClientDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const currentYear = new Date().getFullYear();
  const taxYear = currentYear - 1;

  const { data: intakes, isLoading: intakesLoading } = useQuery<any[]>({
    queryKey: ["/api/intakes"],
  });

  const currentIntake = intakes?.find((i) => i.tax_year === taxYear) || intakes?.[0];

  const createIntakeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/intakes", { tax_year: taxYear });
    },
    onSuccess: async (response) => {
      const data = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/intakes"] });
      navigate(`/intake/${data.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create intake",
        variant: "destructive",
      });
    },
  });

  const handleContinueIntake = () => {
    if (currentIntake) {
      navigate(`/intake/${currentIntake.id}`);
    } else {
      createIntakeMutation.mutate();
    }
  };

  const calculateProgress = (intake: any): number => {
    if (!intake) return 0;
    let progress = 10;
    
    if (intake.taxpayer_info) {
      const tp = intake.taxpayer_info;
      if (tp.taxpayer_first_name && tp.taxpayer_last_name) progress += 15;
      if (tp.address_street && tp.address_city) progress += 15;
    }
    
    if (intake.dependents !== undefined) progress += 10;
    if (intake.childcare_providers !== undefined) progress += 10;
    if (intake.estimated_payments !== undefined) progress += 10;
    
    if (intake.filing_status) progress += 10;
    if (intake.files?.length > 0) progress += 10;
    if (intake.status === "submitted") progress = Math.max(progress, 70);
    if (intake.status === "in_review") progress = Math.max(progress, 80);
    if (intake.status === "filed" || intake.status === "accepted") progress = 100;
    
    return Math.min(progress, 100);
  };

  const intakeProgress = calculateProgress(currentIntake);

  if (!user) return null;

  if (intakesLoading) {
    return (
      <ClientLayout>
        <div className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold">
              Welcome back, {user.first_name}
            </h1>
            <p className="mt-2 text-muted-foreground">
              Tax Year {taxYear} | Let&apos;s get your taxes prepared
            </p>
          </div>

          <Card className="mb-8 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Tax Intake Progress</h2>
                  <p className="text-sm text-muted-foreground">
                    {currentIntake ? "Continue your intake form" : "Start your intake form to get started"}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-48">
                    <Progress value={intakeProgress} className="h-2" />
                    <p className="text-sm text-muted-foreground mt-1 text-right">{intakeProgress}% complete</p>
                  </div>
                  <Button 
                    onClick={handleContinueIntake} 
                    disabled={createIntakeMutation.isPending}
                    data-testid="button-continue-intake"
                  >
                    {createIntakeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {currentIntake ? "Continue" : "Start Intake"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="hover-elevate">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Upload className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">Upload Documents</CardTitle>
                  <CardDescription>W-2s, 1099s, and other tax documents</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Securely upload your tax documents. We accept PDF, JPG, and PNG files up to 10MB each.
                </p>
                <Button variant="outline" className="w-full" data-testid="button-upload-documents" disabled={!currentIntake}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Documents
                </Button>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <ClipboardCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">Review Information</CardTitle>
                  <CardDescription>Verify your personal and financial details</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Review and confirm your information to ensure accurate tax preparation.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => currentIntake && navigate(`/intake/${currentIntake.id}`)}
                  disabled={!currentIntake}
                  data-testid="button-review-info"
                >
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  Review Information
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Badge variant={currentIntake ? getStatusBadgeVariant(currentIntake.status) : "warning"} className="mb-2">
                  {currentIntake ? getStatusLabel(currentIntake.status) : "Not Started"}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  {currentIntake?.status === "draft" ? "Complete your intake form" : 
                   currentIntake?.status === "submitted" ? "Under review by our team" :
                   !currentIntake ? "Start your tax intake" : ""}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Documents</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold tabular-nums">{currentIntake?.files?.length || 0}</div>
                <p className="text-sm text-muted-foreground">Documents uploaded</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Estimated Refund</CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold tabular-nums">--</div>
                <p className="text-sm text-muted-foreground">Complete intake to calculate</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Filing Timeline</CardTitle>
              <CardDescription>Track your tax preparation progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div className="flex-1 w-px bg-border mt-2" />
                  </div>
                  <div className="pb-6">
                    <p className="font-medium">Account Created</p>
                    <p className="text-sm text-muted-foreground">Your account is set up and ready</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      intakeProgress >= 50 
                        ? "bg-primary text-primary-foreground" 
                        : "border-2 border-primary bg-background"
                    }`}>
                      {intakeProgress >= 50 ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 w-px bg-border mt-2" />
                  </div>
                  <div className="pb-6">
                    <p className="font-medium">Complete Intake Form</p>
                    <p className="text-sm text-muted-foreground">Provide your personal and financial information</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      (currentIntake?.files?.length || 0) > 0
                        ? "bg-primary text-primary-foreground"
                        : "border-2 border-muted bg-background"
                    }`}>
                      {(currentIntake?.files?.length || 0) > 0 ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Upload className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 w-px bg-border mt-2" />
                  </div>
                  <div className="pb-6">
                    <p className={`font-medium ${(currentIntake?.files?.length || 0) === 0 ? "text-muted-foreground" : ""}`}>
                      Upload Documents
                    </p>
                    <p className="text-sm text-muted-foreground">Submit your W-2s, 1099s, and other forms</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      currentIntake?.status === "submitted" || currentIntake?.status === "in_review"
                        ? "bg-primary text-primary-foreground"
                        : "border-2 border-muted bg-background"
                    }`}>
                      {currentIntake?.status === "submitted" || currentIntake?.status === "in_review" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 w-px bg-border mt-2" />
                  </div>
                  <div className="pb-6">
                    <p className={`font-medium ${currentIntake?.status !== "submitted" && currentIntake?.status !== "in_review" ? "text-muted-foreground" : ""}`}>
                      Review & Sign
                    </p>
                    <p className="text-sm text-muted-foreground">Review your return and provide e-signature</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex items-center">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      currentIntake?.status === "filed" || currentIntake?.status === "accepted"
                        ? "bg-primary text-primary-foreground"
                        : "border-2 border-muted bg-background"
                    }`}>
                      {currentIntake?.status === "filed" || currentIntake?.status === "accepted" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Calculator className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <div>
                    <p className={`font-medium ${currentIntake?.status !== "filed" && currentIntake?.status !== "accepted" ? "text-muted-foreground" : ""}`}>
                      Filed & Complete
                    </p>
                    <p className="text-sm text-muted-foreground">Your return has been submitted to the IRS</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ClientLayout>
  );
}
