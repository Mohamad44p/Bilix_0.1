"use client";

import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const NotificationsTab = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const [notifications, setNotifications] = useState({
    email: true,
    marketing: false,
    social: true,
    security: true,
    browser: false,
  });

  const saveNotificationPreferences = () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Notification preferences saved",
        description: "Your notification settings have been updated."
      });
    }, 1000);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Choose how you want to be notified.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Email Notifications</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Invoice reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive emails when invoices are due soon.
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={notifications.email}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="marketing-notifications">Marketing emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive emails about new features and offers.
                  </p>
                </div>
                <Switch
                  id="marketing-notifications"
                  checked={notifications.marketing}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, marketing: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="social-notifications">Team activity</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive emails when team members take actions.
                  </p>
                </div>
                <Switch
                  id="social-notifications"
                  checked={notifications.social}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, social: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="security-notifications">Security alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive emails for important security alerts.
                  </p>
                </div>
                <Switch
                  id="security-notifications"
                  checked={notifications.security}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, security: checked })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Browser Notifications</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="browser-notifications">Show browser notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Show desktop notifications when you&apos;re using the app.
                  </p>
                </div>
                <Switch
                  id="browser-notifications"
                  checked={notifications.browser}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, browser: checked })}
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="ml-auto"
            onClick={saveNotificationPreferences}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Preferences
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default NotificationsTab; 