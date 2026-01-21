import { User, Mail, Phone, Calendar, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ClientLayout } from "@/components/layouts/client-layout";
import { useAuth } from "@/contexts/auth-context";
import { getInitials } from "@/lib/utils";

export default function ClientProfile() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <ClientLayout>
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-profile-title">My Profile</h1>
          <p className="text-muted-foreground">View and manage your account information</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {getInitials(user.first_name, user.last_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{user.first_name} {user.last_name}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="capitalize">{user.role}</Badge>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="firstName" 
                    className="pl-9"
                    defaultValue={user.first_name} 
                    data-testid="input-first-name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="lastName" 
                    className="pl-9"
                    defaultValue={user.last_name} 
                    data-testid="input-last-name"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email"
                  className="pl-9"
                  defaultValue={user.email} 
                  disabled
                  data-testid="input-email"
                />
              </div>
              <p className="text-xs text-muted-foreground">Email cannot be changed. Contact support if needed.</p>
            </div>

            <div className="flex justify-end">
              <Button data-testid="button-save-profile">Save Changes</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Security
            </CardTitle>
            <CardDescription>Manage your password and security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input 
                id="currentPassword" 
                type="password" 
                data-testid="input-current-password"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input 
                  id="newPassword" 
                  type="password" 
                  data-testid="input-new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  data-testid="input-confirm-password"
                />
              </div>
            </div>
            <Button variant="outline" data-testid="button-change-password">Change Password</Button>
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  );
}
