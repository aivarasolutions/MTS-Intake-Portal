import { FolderOpen, FileText, Download, Eye, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export default function AdminDocuments() {
  const { data: intakes, isLoading } = useQuery<any[]>({
    queryKey: ["/api/intakes"],
  });

  const allFiles = intakes?.flatMap((intake: any) => 
    (intake.files || []).map((file: any) => ({
      ...file,
      clientName: intake.taxpayer_info 
        ? `${intake.taxpayer_info.taxpayer_first_name || ''} ${intake.taxpayer_info.taxpayer_last_name || ''}`.trim() 
        : 'Unknown Client',
      taxYear: intake.tax_year,
      intakeId: intake.id,
    }))
  ) || [];

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
              placeholder="Search documents..."
              className="pl-9"
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
              <CardDescription>{allFiles.length} documents uploaded</CardDescription>
            </CardHeader>
            <CardContent>
              {allFiles.length > 0 ? (
                <div className="divide-y">
                  {allFiles.map((file: any) => (
                    <div key={file.id} className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium" data-testid={`text-file-name-${file.id}`}>
                            {file.file_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {file.clientName} • Tax Year {file.taxYear}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" size="sm">
                          {file.file_category?.replace(/_/g, ' ') || 'Other'}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          data-testid={`button-download-file-${file.id}`}
                          onClick={() => window.open(`/api/files/${file.id}`, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No documents uploaded yet
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
