import { Settings, Bell, Shield, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { ClientLayout } from "@/components/layouts/client-layout";
import { useAuth } from "@/contexts/auth-context";

export default function ClientSettings() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <ClientLayout>
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-settings-title">Settings</h1>
          <p className="text-muted-foreground">Manage your notification preferences and privacy settings</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Choose how you want to be notified about your tax intake</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive updates about your intake status via email</p>
              </div>
              <Switch defaultChecked data-testid="switch-email-notifications" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Document Request Alerts</Label>
                <p className="text-sm text-muted-foreground">Get notified when your preparer requests additional documents</p>
              </div>
              <Switch defaultChecked data-testid="switch-document-alerts" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Status Updates</Label>
                <p className="text-sm text-muted-foreground">Receive notifications when your intake status changes</p>
              </div>
              <Switch defaultChecked data-testid="switch-status-updates" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Marketing Communications</Label>
                <p className="text-sm text-muted-foreground">Receive tips and updates about tax preparation</p>
              </div>
              <Switch data-testid="switch-marketing" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy
            </CardTitle>
            <CardDescription>Control your data and privacy preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
              </div>
              <Button variant="outline" size="sm" data-testid="button-enable-2fa">Enable</Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Session Timeout</Label>
                <p className="text-sm text-muted-foreground">Automatically sign out after 30 minutes of inactivity</p>
              </div>
              <Switch defaultChecked data-testid="switch-session-timeout" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>Irreversible account actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Delete Account</Label>
                <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data</p>
              </div>
              <Button variant="destructive" size="sm" data-testid="button-delete-account">Delete Account</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  );
}
