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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const PrivacyTab = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const [privacy, setPrivacy] = useState({
    profileVisibility: "public",
    activityStatus: true,
    readReceipts: true,
    dataSharing: false
  });

  const savePrivacySettings = () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Privacy settings saved",
        description: "Your privacy preferences have been updated."
      });
    }, 1000);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Privacy Settings</CardTitle>
          <CardDescription>
            Control how your information is used and shared.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Profile Visibility</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Who can see your profile</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose who can view your profile information.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={privacy.profileVisibility === "public" ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setPrivacy({ ...privacy, profileVisibility: "public" })}
                  >
                    Public
                  </Badge>
                  <Badge 
                    variant={privacy.profileVisibility === "team" ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setPrivacy({ ...privacy, profileVisibility: "team" })}
                  >
                    Team Only
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="activity-status">Activity status</Label>
                  <p className="text-sm text-muted-foreground">
                    Show when you&apos;re active in the app.
                  </p>
                </div>
                <Switch
                  id="activity-status"
                  checked={privacy.activityStatus}
                  onCheckedChange={(checked) => setPrivacy({ ...privacy, activityStatus: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="read-receipts">Read receipts</Label>
                  <p className="text-sm text-muted-foreground">
                    Let others know when you&apos;ve read their messages.
                  </p>
                </div>
                <Switch
                  id="read-receipts"
                  checked={privacy.readReceipts}
                  onCheckedChange={(checked) => setPrivacy({ ...privacy, readReceipts: checked })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Data Usage</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="data-sharing">Data sharing with third parties</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow us to share anonymized usage data with our partners.
                  </p>
                </div>
                <Switch
                  id="data-sharing"
                  checked={privacy.dataSharing}
                  onCheckedChange={(checked) => setPrivacy({ ...privacy, dataSharing: checked })}
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Download My Data</Button>
          <Button 
            onClick={savePrivacySettings}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PrivacyTab; 