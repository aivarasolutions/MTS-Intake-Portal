import { FileText, Upload, ClipboardCheck, Calculator, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { ClientLayout } from "@/components/layouts/client-layout";

export default function ClientDashboard() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const taxYear = currentYear - 1;
  const intakeProgress = 25;

  if (!user) return null;

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
                  <p className="text-sm text-muted-foreground">Complete your intake form to get started</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-48">
                    <Progress value={intakeProgress} className="h-2" />
                    <p className="text-sm text-muted-foreground mt-1 text-right">{intakeProgress}% complete</p>
                  </div>
                  <Button data-testid="button-continue-intake">
                    Continue
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
                <Button variant="outline" className="w-full" data-testid="button-upload-documents">
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
                <Button variant="outline" className="w-full" data-testid="button-review-info">
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
                <Badge variant="warning" className="mb-2">
                  In Progress
                </Badge>
                <p className="text-sm text-muted-foreground">Awaiting document upload</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Documents</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold tabular-nums">0</div>
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
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background">
                      <AlertCircle className="h-4 w-4 text-primary" />
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
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-muted bg-background">
                      <Upload className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 w-px bg-border mt-2" />
                  </div>
                  <div className="pb-6">
                    <p className="font-medium text-muted-foreground">Upload Documents</p>
                    <p className="text-sm text-muted-foreground">Submit your W-2s, 1099s, and other forms</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-muted bg-background">
                      <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 w-px bg-border mt-2" />
                  </div>
                  <div className="pb-6">
                    <p className="font-medium text-muted-foreground">Review & Sign</p>
                    <p className="text-sm text-muted-foreground">Review your return and provide e-signature</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-muted bg-background">
                      <Calculator className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Filed & Complete</p>
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
