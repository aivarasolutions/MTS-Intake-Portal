import { useState } from "react";
import { FolderOpen, FileText, Download, Search, ChevronDown, ChevronRight, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ClientGroup {
  clientName: string;
  intakeId: string;
  taxYear: number;
  files: any[];
}

export default function AdminDocuments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());

  const { data: intakes, isLoading } = useQuery<any[]>({
    queryKey: ["/api/intakes"],
  });

  const clientGroups: ClientGroup[] = (intakes || [])
    .filter((intake: any) => intake.files && intake.files.length > 0)
    .map((intake: any) => ({
      clientName: intake.taxpayer_info
        ? `${intake.taxpayer_info.taxpayer_first_name || ""} ${intake.taxpayer_info.taxpayer_last_name || ""}`.trim()
        : "Unknown Client",
      intakeId: intake.id,
      taxYear: intake.tax_year,
      files: intake.files || [],
    }));

  const filteredGroups = clientGroups.filter((group) =>
    group.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.files.some((file: any) =>
      file.file_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.original_filename?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const totalFiles = clientGroups.reduce((sum, group) => sum + group.files.length, 0);

  const toggleClient = (intakeId: string) => {
    setExpandedClients((prev) => {
      const next = new Set(prev);
      if (next.has(intakeId)) {
        next.delete(intakeId);
      } else {
        next.add(intakeId);
      }
      return next;
    });
  };

  const handleDownloadAll = (intakeId: string) => {
    window.open(`/api/intakes/${intakeId}/download-all-files`, "_blank");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-documents-title">Documents</h1>
          <p className="text-muted-foreground">View and manage all uploaded client documents</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search clients or documents..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-documents"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                All Documents
              </CardTitle>
              <CardDescription>
                {totalFiles} documents from {clientGroups.length} clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredGroups.length > 0 ? (
                <div className="space-y-2">
                  {filteredGroups.map((group) => (
                    <Collapsible
                      key={group.intakeId}
                      open={expandedClients.has(group.intakeId)}
                      onOpenChange={() => toggleClient(group.intakeId)}
                    >
                      <div className="border rounded-lg">
                        <CollapsibleTrigger asChild>
                          <div
                            className="flex items-center justify-between p-4 cursor-pointer hover-elevate"
                            data-testid={`folder-client-${group.intakeId}`}
                          >
                            <div className="flex items-center gap-3">
                              {expandedClients.has(group.intakeId) ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium" data-testid={`text-client-name-${group.intakeId}`}>
                                  {group.clientName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Tax Year {group.taxYear} • {group.files.length} files
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadAll(group.intakeId);
                              }}
                              data-testid={`button-download-all-${group.intakeId}`}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download All
                            </Button>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="border-t divide-y">
                            {group.files.map((file: any) => (
                              <div
                                key={file.id}
                                className="flex items-center justify-between py-3 px-4 pl-14"
                              >
                                <div className="flex items-center gap-3">
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-sm font-medium" data-testid={`text-file-name-${file.id}`}>
                                      {file.original_filename || file.file_name}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" size="sm">
                                    {file.file_category?.replace(/_/g, " ") || "Other"}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    data-testid={`button-download-file-${file.id}`}
                                    onClick={() => window.open(`/api/files/${file.id}`, "_blank")}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "No documents match your search" : "No documents uploaded yet"}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
