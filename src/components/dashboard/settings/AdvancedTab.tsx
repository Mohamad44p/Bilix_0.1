"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@/lib/types";
import { deleteUser } from "@/lib/services/user-service";

interface AdvancedTabProps {
  user: User | null | undefined;
}

const AdvancedTab = ({ user }: AdvancedTabProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleExportData = () => {
    setIsLoading(true);
    
    // Simulate API call for data export
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Data export initiated",
        description: "Your data will be emailed to you shortly."
      });
    }, 1500);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );
    
    if (confirmed) {
      setIsDeletingAccount(true);
      try {
        await deleteUser(user.id);
        router.push('/');
      } catch (error: unknown) {
        console.error("Error deleting account:", error);
        toast({
          title: "Error",
          description: (error as Error).message || "Could not delete account. Please try again.",
          variant: "destructive"
        });
        setIsDeletingAccount(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Advanced Settings</CardTitle>
          <CardDescription>
            Manage advanced application settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Data Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="data-export">Export All Data</Label>
                  <p className="text-sm text-muted-foreground">
                    Download a copy of all your account data and invoices.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleExportData}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Export
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="account-delete">Delete Account</Label>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all associated data.
                  </p>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount || !user}
                >
                  {isDeletingAccount ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Delete Account"
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Developer Options</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>API Access</Label>
                  <p className="text-sm text-muted-foreground">
                    Manage your API keys and access.
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Manage Keys
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedTab; 