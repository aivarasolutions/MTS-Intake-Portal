import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Loader2, ChevronLeft, FileText, Download, Eye, CheckCircle2, 
  User, Calendar, Mail, Phone, MapPin, Clock, FileCheck
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";

const FILE_CATEGORY_LABELS: Record<string, string> = {
  photo_id_front: "Photo ID (Front)",
  photo_id_back: "Photo ID (Back)",
  spouse_photo_id_front: "Spouse Photo ID (Front)",
  spouse_photo_id_back: "Spouse Photo ID (Back)",
  w2: "W-2",
  "1099_int": "1099-INT",
  "1099_div": "1099-DIV",
  "1099_misc": "1099-MISC",
  "1099_nec": "1099-NEC",
  "1099_r": "1099-R",
  "1098": "1098",
  other: "Other",
};

const FILE_CATEGORY_GROUPS = [
  { key: "identification", label: "Identification", categories: ["photo_id_front", "photo_id_back", "spouse_photo_id_front", "spouse_photo_id_back"] },
  { key: "w2", label: "W-2 Forms", categories: ["w2"] },
  { key: "1099s", label: "1099 Forms", categories: ["1099_int", "1099_div", "1099_misc", "1099_nec", "1099_r"] },
  { key: "1098", label: "1098 Forms", categories: ["1098"] },
  { key: "other", label: "Other Documents", categories: ["other"] },
];

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  submitted: { label: "Submitted", variant: "default" },
  in_review: { label: "In Review", variant: "default" },
  ready_for_drake: { label: "Ready for Drake", variant: "default" },
  filed: { label: "Filed", variant: "default" },
  accepted: { label: "Accepted", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
};

export default function AdminIntakeDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("identification");

  const { data: intake, isLoading } = useQuery<any>({
    queryKey: ["/api/intakes", id],
    enabled: !!id,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ fileId, isReviewed }: { fileId: string; isReviewed: boolean }) => {
      return apiRequest("PATCH", `/api/files/${fileId}/review`, { is_reviewed: isReviewed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intakes", id] });
      toast({ title: "File updated", description: "Review status has been updated." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update review status", variant: "destructive" });
    },
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFilesForCategories = (categories: string[]) => {
    if (!intake?.files) return [];
    return intake.files.filter((f: any) => categories.includes(f.file_category));
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!intake) {
    return (
      <AdminLayout>
        <div className="py-8">
          <div className="max-w-4xl mx-auto px-4">
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Intake not found.</p>
                <Button className="mt-4" onClick={() => navigate("/dashboard/admin")} data-testid="button-back-dashboard">
                  Back to Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const taxpayerInfo = intake.taxpayer_info;
  const statusInfo = STATUS_CONFIG[intake.status] || { label: intake.status, variant: "secondary" as const };

  return (
    <AdminLayout>
      <div className="py-8">
        <div className="max-w-5xl mx-auto px-4 space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard/admin")} data-testid="button-back">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold">
                {taxpayerInfo?.taxpayer_first_name} {taxpayerInfo?.taxpayer_last_name || "Client Intake"}
              </h1>
              <p className="text-muted-foreground">Tax Year {intake.tax_year}</p>
            </div>
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Client Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {taxpayerInfo ? (
                  <>
                    <div className="flex items-start gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">{taxpayerInfo.taxpayer_email || "Not provided"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Phone</p>
                        <p className="text-sm text-muted-foreground">{taxpayerInfo.taxpayer_phone || "Not provided"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Address</p>
                        <p className="text-sm text-muted-foreground">
                          {taxpayerInfo.address_street ? (
                            <>
                              {taxpayerInfo.address_street}
                              {taxpayerInfo.address_apt && `, ${taxpayerInfo.address_apt}`}
                              <br />
                              {taxpayerInfo.address_city}, {taxpayerInfo.address_state} {taxpayerInfo.address_zip}
                            </>
                          ) : "Not provided"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">DOB</p>
                        <p className="text-sm text-muted-foreground">
                          {taxpayerInfo.taxpayer_dob 
                            ? new Date(taxpayerInfo.taxpayer_dob).toLocaleDateString() 
                            : "Not provided"}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No taxpayer info submitted yet.</p>
                )}

                <div className="pt-4 border-t">
                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Created</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(intake.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documents
                </CardTitle>
                <CardDescription>
                  Review and manage client documents. Toggle the reviewed status for each file.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="flex flex-wrap h-auto gap-1 mb-4">
                    {FILE_CATEGORY_GROUPS.map((group) => {
                      const files = getFilesForCategories(group.categories);
                      const reviewedCount = files.filter((f: any) => f.is_reviewed).length;
                      return (
                        <TabsTrigger 
                          key={group.key} 
                          value={group.key} 
                          className="text-xs sm:text-sm"
                          data-testid={`tab-${group.key}`}
                        >
                          {group.label}
                          {files.length > 0 && (
                            <Badge 
                              variant={reviewedCount === files.length ? "default" : "secondary"} 
                              className="ml-1.5 text-xs"
                            >
                              {reviewedCount}/{files.length}
                            </Badge>
                          )}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>

                  {FILE_CATEGORY_GROUPS.map((group) => {
                    const files = getFilesForCategories(group.categories);
                    return (
                      <TabsContent key={group.key} value={group.key}>
                        {files.length > 0 ? (
                          <div className="space-y-3">
                            {files.map((file: any) => (
                              <div 
                                key={file.id} 
                                className="flex items-center justify-between gap-4 p-4 rounded-lg border bg-card"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  {file.is_reviewed ? (
                                    <FileCheck className="h-5 w-5 text-green-600 flex-shrink-0" />
                                  ) : (
                                    <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium truncate">{file.original_filename}</p>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <span>{FILE_CATEGORY_LABELS[file.file_category] || file.file_category}</span>
                                      <span>•</span>
                                      <span>{formatFileSize(file.file_size)}</span>
                                      <span>•</span>
                                      <span>{new Date(file.created_at).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      id={`review-${file.id}`}
                                      checked={file.is_reviewed}
                                      onCheckedChange={(checked) => 
                                        reviewMutation.mutate({ fileId: file.id, isReviewed: checked })
                                      }
                                      disabled={reviewMutation.isPending}
                                      data-testid={`switch-review-${file.id}`}
                                    />
                                    <Label htmlFor={`review-${file.id}`} className="text-sm">
                                      Reviewed
                                    </Label>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                    data-testid={`button-download-${file.id}`}
                                  >
                                    <a href={`/api/files/${file.id}/download`} download>
                                      <Download className="h-4 w-4 mr-1" />
                                      Download
                                    </a>
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-8 text-center text-muted-foreground">
                            <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                            <p>No {group.label.toLowerCase()} uploaded yet.</p>
                          </div>
                        )}
                      </TabsContent>
                    );
                  })}
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-semibold">{intake.files?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Total Files</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-semibold">
                    {intake.files?.filter((f: any) => f.is_reviewed).length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Reviewed</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-semibold">{intake.dependents?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Dependents</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-semibold">{intake.estimated_payments?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Est. Payments</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
