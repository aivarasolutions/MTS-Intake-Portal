import { useState } from "react";
import { Users, Eye, Search, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { getInitials } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
    case "draft": return "Draft";
    case "submitted": return "Submitted";
    case "in_review": return "In Review";
    case "ready_for_drake": return "Ready for Drake";
    case "filed": return "Filed";
    case "accepted": return "Accepted";
    case "rejected": return "Rejected";
    default: return status;
  }
}

export default function AdminClients() {
  const { toast } = useToast();
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);

  const { data: clients, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/clients"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (clientId: string) => {
      return apiRequest("DELETE", `/api/admin/clients/${clientId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Client Deleted", description: "The client account has been permanently deleted." });
      setDeletingClientId(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete client", 
        variant: "destructive" 
      });
      setDeletingClientId(null);
    },
  });

  const handleConfirmDelete = (clientId: string) => {
    setDeletingClientId(clientId);
    deleteMutation.mutate(clientId);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-clients-title">Clients</h1>
          <p className="text-muted-foreground">Manage all client accounts and their tax intakes</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search clients..."
              className="pl-9"
              data-testid="input-search-clients"
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
                <Users className="h-5 w-5" />
                All Clients
              </CardTitle>
              <CardDescription>{clients?.length || 0} registered clients</CardDescription>
            </CardHeader>
            <CardContent>
              {clients && clients.length > 0 ? (
                <div className="divide-y">
                  {clients.map((client: any) => (
                    <div key={client.id} className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(client.first_name, client.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium" data-testid={`text-client-name-${client.id}`}>
                            {client.first_name} {client.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">{client.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {client.intakes && client.intakes.length > 0 && (
                          <div className="text-right">
                            <Badge variant={getStatusBadgeVariant(client.intakes[0].status)}>
                              {getStatusLabel(client.intakes[0].status)}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              Tax Year {client.intakes[0].tax_year}
                            </p>
                          </div>
                        )}
                        {client.intakes && client.intakes[0] && (
                          <Link href={`/admin/intake/${client.intakes[0].id}`}>
                            <Button variant="ghost" size="icon" data-testid={`button-view-client-${client.id}`}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              data-testid={`button-delete-client-${client.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Client Account</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to permanently delete the account for{" "}
                                <strong>{client.first_name} {client.last_name}</strong> ({client.email})?
                                <br /><br />
                                This will delete all their data including tax intakes, uploaded documents, and messages. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleConfirmDelete(client.id)}
                                disabled={deletingClientId === client.id}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                data-testid="button-confirm-delete"
                              >
                                {deletingClientId === client.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                  </>
                                ) : (
                                  "Delete Client"
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No clients registered yet
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
