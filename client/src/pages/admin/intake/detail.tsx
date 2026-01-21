import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Loader2, ChevronLeft, FileText, Download, Eye, CheckCircle2, 
  User, Calendar, Mail, Phone, MapPin, Clock, FileCheck, AlertTriangle, 
  RefreshCw, Plus, Check, X, XCircle, ClipboardList, MessageSquare, Settings,
  Package, FileArchive
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ChecklistItem {
  id: string;
  intake_id: string;
  item_type: string;
  field_name: string | null;
  description: string;
  is_resolved: boolean;
  resolved_at: string | null;
  created_by_user_id: string | null;
  resolved_by_user_id: string | null;
  created_at: string;
}

interface PacketRequest {
  id: string;
  intake_id: string;
  requested_by_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  packet_url: string | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
  requested_by: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
}

const CHECKLIST_TYPE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  missing_field: { label: "Missing Field", icon: AlertTriangle, color: "text-amber-500" },
  missing_document: { label: "Missing Document", icon: FileText, color: "text-red-500" },
  clarification_needed: { label: "Clarification Needed", icon: MessageSquare, color: "text-blue-500" },
  custom: { label: "Custom", icon: Settings, color: "text-purple-500" },
};

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
  const [checklistFilter, setChecklistFilter] = useState<string>("all");
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemType, setNewItemType] = useState("clarification_needed");
  const [newItemDescription, setNewItemDescription] = useState("");

  const { data: intake, isLoading, refetch: refetchIntake } = useQuery<any>({
    queryKey: ["/api/intakes", id],
    enabled: !!id,
  });

  const { data: checklistItems, refetch: refetchChecklist } = useQuery<ChecklistItem[]>({
    queryKey: ["/api/intakes", id, "checklist"],
    queryFn: async () => {
      const response = await fetch(`/api/intakes/${id}/checklist`);
      if (!response.ok) throw new Error("Failed to fetch checklist");
      return response.json();
    },
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

  const recalculateMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/intakes/${id}/recalculate-checklist`, {});
    },
    onSuccess: () => {
      refetchChecklist();
      toast({ title: "Checklist Updated", description: "Missing items have been recalculated." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to recalculate", variant: "destructive" });
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async ({ item_type, description }: { item_type: string; description: string }) => {
      return apiRequest("POST", `/api/intakes/${id}/checklist`, { item_type, description });
    },
    onSuccess: () => {
      refetchChecklist();
      setShowAddItem(false);
      setNewItemDescription("");
      toast({ title: "Item Added", description: "Checklist item has been added." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add item", variant: "destructive" });
    },
  });

  const resolveItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return apiRequest("PATCH", `/api/checklist/${itemId}/resolve`, {});
    },
    onSuccess: () => {
      refetchChecklist();
      toast({ title: "Item Resolved", description: "Checklist item marked as resolved." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to resolve item", variant: "destructive" });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return apiRequest("DELETE", `/api/checklist/${itemId}`, {});
    },
    onSuccess: () => {
      refetchChecklist();
      toast({ title: "Item Deleted", description: "Checklist item has been removed." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete item", variant: "destructive" });
    },
  });

  const { data: packetRequests, refetch: refetchPackets } = useQuery<PacketRequest[]>({
    queryKey: ["/api/intakes", id, "packet-requests"],
    queryFn: async () => {
      const response = await fetch(`/api/intakes/${id}/packet-requests`);
      if (!response.ok) throw new Error("Failed to fetch packet requests");
      return response.json();
    },
    enabled: !!id,
  });

  const generatePacketMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/intakes/${id}/packet`, {});
    },
    onSuccess: () => {
      refetchPackets();
      toast({ title: "Packet Requested", description: "Generating preparer packet..." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to request packet", variant: "destructive" });
    },
  });

  const latestRequest = packetRequests?.[0];
  const isProcessing = latestRequest?.status === "pending" || latestRequest?.status === "processing";

  useEffect(() => {
    if (!isProcessing) return;
    const interval = setInterval(() => {
      refetchPackets();
    }, 2000);
    return () => clearInterval(interval);
  }, [isProcessing, refetchPackets]);

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
                            ? (() => {
                                const dateStr = taxpayerInfo.taxpayer_dob.toString().split('T')[0];
                                const [year, month, day] = dateStr.split('-');
                                return `${parseInt(month)}/${parseInt(day)}/${year}`;
                              })()
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

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    Checklist
                  </CardTitle>
                  <CardDescription>
                    Track missing information and documents
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => recalculateMutation.mutate()}
                    disabled={recalculateMutation.isPending}
                    data-testid="button-recalculate"
                  >
                    {recalculateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-1" />
                    )}
                    Recalculate
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setShowAddItem(true)}
                    data-testid="button-add-checklist-item"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Label className="text-sm">Filter:</Label>
                <Select value={checklistFilter} onValueChange={setChecklistFilter}>
                  <SelectTrigger className="w-[180px]" data-testid="select-checklist-filter">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Items</SelectItem>
                    <SelectItem value="unresolved">Unresolved Only</SelectItem>
                    <SelectItem value="missing_field">Missing Fields</SelectItem>
                    <SelectItem value="missing_document">Missing Documents</SelectItem>
                    <SelectItem value="clarification_needed">Clarification Needed</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex-1" />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary">
                    {checklistItems?.filter(i => !i.is_resolved).length || 0} unresolved
                  </Badge>
                  <Badge variant="outline">
                    {checklistItems?.filter(i => i.is_resolved).length || 0} resolved
                  </Badge>
                </div>
              </div>

              {showAddItem && (
                <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
                  <h4 className="font-medium text-sm">Add New Checklist Item</h4>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Select value={newItemType} onValueChange={setNewItemType}>
                      <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-new-item-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="clarification_needed">Clarification Needed</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Description..."
                      value={newItemDescription}
                      onChange={(e) => setNewItemDescription(e.target.value)}
                      className="flex-1"
                      data-testid="input-new-item-description"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => addItemMutation.mutate({ item_type: newItemType, description: newItemDescription })}
                        disabled={!newItemDescription.trim() || addItemMutation.isPending}
                        data-testid="button-save-checklist-item"
                      >
                        {addItemMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setShowAddItem(false); setNewItemDescription(""); }}
                        data-testid="button-cancel-add-item"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {checklistItems && checklistItems.length > 0 ? (
                  checklistItems
                    .filter(item => {
                      if (checklistFilter === "all") return true;
                      if (checklistFilter === "unresolved") return !item.is_resolved;
                      return item.item_type === checklistFilter;
                    })
                    .map((item) => {
                      const config = CHECKLIST_TYPE_CONFIG[item.item_type] || { 
                        label: item.item_type, 
                        icon: AlertTriangle, 
                        color: "text-muted-foreground" 
                      };
                      const Icon = config.icon;
                      
                      return (
                        <div 
                          key={item.id} 
                          className={`flex items-center gap-3 p-3 rounded-lg border ${item.is_resolved ? 'bg-muted/30 opacity-60' : 'bg-card'}`}
                          data-testid={`checklist-item-${item.id}`}
                        >
                          <Icon className={`h-4 w-4 flex-shrink-0 ${config.color}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${item.is_resolved ? 'line-through' : ''}`}>
                              {item.description}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className="text-xs">
                                {config.label}
                              </Badge>
                              {item.is_resolved && item.resolved_at && (
                                <span className="text-xs text-muted-foreground">
                                  Resolved {new Date(item.resolved_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {!item.is_resolved && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => resolveItemMutation.mutate(item.id)}
                                disabled={resolveItemMutation.isPending}
                                data-testid={`button-resolve-${item.id}`}
                              >
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                            {(item.item_type === "clarification_needed" || item.item_type === "custom") && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => deleteItemMutation.mutate(item.id)}
                                disabled={deleteItemMutation.isPending}
                                data-testid={`button-delete-${item.id}`}
                              >
                                <X className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No checklist items. Click "Recalculate" to check for missing information.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Preparer Packet
                  </CardTitle>
                  <CardDescription>
                    Generate a summary PDF and ZIP of all documents
                  </CardDescription>
                </div>
                <Button
                  onClick={() => generatePacketMutation.mutate()}
                  disabled={generatePacketMutation.isPending || isProcessing}
                  data-testid="button-generate-packet"
                >
                  {generatePacketMutation.isPending || isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Package className="h-4 w-4 mr-2" />
                  )}
                  {latestRequest ? "Regenerate Packet" : "Generate Packet"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {latestRequest ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-3">
                      {latestRequest.status === "pending" || latestRequest.status === "processing" ? (
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      ) : latestRequest.status === "completed" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )}
                      <div>
                        <p className="font-medium">
                          {latestRequest.status === "pending" && "Queued for processing..."}
                          {latestRequest.status === "processing" && "Generating packet..."}
                          {latestRequest.status === "completed" && "Packet ready for download"}
                          {latestRequest.status === "failed" && "Packet generation failed"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Requested {new Date(latestRequest.created_at).toLocaleString()}
                          {latestRequest.completed_at && 
                            ` • Completed ${new Date(latestRequest.completed_at).toLocaleString()}`
                          }
                        </p>
                        {latestRequest.error_message && (
                          <p className="text-sm text-destructive mt-1">{latestRequest.error_message}</p>
                        )}
                      </div>
                    </div>
                    {latestRequest.status === "completed" && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          data-testid="button-download-summary"
                        >
                          <a href={`/api/packet-requests/${latestRequest.id}/download/Summary.pdf`} download>
                            <FileText className="h-4 w-4 mr-1" />
                            Summary
                          </a>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          data-testid="button-download-zip"
                        >
                          <a href={`/api/packet-requests/${latestRequest.id}/download/Packet.zip`} download>
                            <FileArchive className="h-4 w-4 mr-1" />
                            Full Packet
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>

                  {packetRequests && packetRequests.length > 1 && (
                    <div className="text-sm text-muted-foreground">
                      <p>{packetRequests.length} total packet requests for this intake</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No packets generated yet. Click "Generate Packet" to create one.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
