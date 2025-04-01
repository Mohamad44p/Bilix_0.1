"use client";

import { useState, useEffect } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, LogOut, Loader2 } from "lucide-react";
import Image from "next/image";

// Define a custom interface for session data
interface SessionInfo {
  id: string;
  current: boolean;
  browser: string;
  os: string;
  lastActiveAt: string;
}

// Define Factor type
interface Factor {
  id: string;
  getImageUrl?: () => string;
  secret?: string;
  attemptVerification: (params: { code: string }) => Promise<unknown>;
}

// Define session data from API
interface SessionData {
  id: string;
  current?: boolean;
  browser?: string;
  os?: string;
  lastActiveAt: string;
}

// Define clerk error type
interface ClerkError extends Error {
  status?: number;
}

// Custom type for Clerk User with needed methods
interface ClerkUser {
  id: string;
  getTwoFactorAuth: () => Promise<{ activeMethods?: Factor[] }>;
  createTOTP: () => Promise<Factor>;
  updatePassword: (params: { currentPassword: string; newPassword: string }) => Promise<void>;
  getSessions: () => Promise<{ sessions: SessionData[] }>;
  revokeSession: (params: { sessionId: string }) => Promise<void>;
}

interface SecurityTabProps {
  user: ClerkUser | null | undefined;
  isLoaded: boolean;
}

const SecurityTab = ({ user, isLoaded }: SecurityTabProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { signOut } = useClerk();
  const router = useRouter();
  const { toast } = useToast();

  // Password change modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 2FA modal
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  
  // 2FA setup related states
  const [preparingFactor, setPreparingFactor] = useState<Factor | null>(null);

  // Add better initialization
  // Add a function to check 2FA status
  const check2FAStatus = async () => {
    try {
      if (!user) return false;
      
      console.log("Checking 2FA status...");
      const twoFactorAuth = await user.getTwoFactorAuth();
      console.log("2FA status:", twoFactorAuth);
      
      // Properly check if 2FA is actually enabled
      const activeMethods = twoFactorAuth.activeMethods || [];
      const isEnabled = activeMethods.length > 0;
      setTwoFactorEnabled(isEnabled);
      
      return isEnabled;
    } catch (error) {
      console.error("Error checking 2FA status:", error);
      return false;
    }
  };

  // Update the useEffect to properly initialize
  useEffect(() => {
    if (isLoaded && user) {
      check2FAStatus();
      
      // Also load sessions
      loadSessions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user]);

  // Improve the startTwoFactorSetup to handle existing 2FA
  const startTwoFactorSetup = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // First check if 2FA is already enabled
      const isEnabled = await check2FAStatus();
      
      if (isEnabled) {
        // If already enabled, just show the modal
        setShow2FAModal(true);
      } else {
        // Otherwise create a new TOTP factor
        const factor = await user.createTOTP();
        console.log("New TOTP factor created:", factor);
        setPreparingFactor(factor);
        setShow2FAModal(true);
      }
    } catch (error: unknown) {
      console.error("Error setting up 2FA:", error);
      toast({
        title: "Error",
        description: "Could not set up 2FA. Please check console for details and try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update the handle2FASetup function to actually verify the code
  const handle2FASetup = async () => {
    if (!user || !preparingFactor) return;
    
    // Validate verification code
    if (verificationCode.length !== 6 || !/^\d+$/.test(verificationCode)) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit code",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Try to verify the TOTP code with better error handling
      console.log("Attempting verification with code:", verificationCode);
      
      const result = await preparingFactor.attemptVerification({
        code: verificationCode
      });
      
      console.log("Verification result:", result);
      
      // If we get here, verification was successful
      setTwoFactorEnabled(true);
      setVerificationCode("");
      setShow2FAModal(false);
      setPreparingFactor(null);
      
      toast({
        title: "Success",
        description: "Two-factor authentication enabled successfully"
      });
    } catch (error: unknown) {
      console.error("Error verifying 2FA code:", error);
      // More descriptive error message
      let errorMessage = "Could not verify the code. ";
      
      const clerkError = error as ClerkError;
      if (clerkError.status === 400) {
        errorMessage += "Invalid verification code. Please try again.";
      } else if (clerkError.status === 403) {
        errorMessage += "Permission denied. Please try again or contact support.";
      } else {
        errorMessage += "Please try again.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password change using Clerk's API
  const handlePasswordChange = async () => {
    if (!user) return;
    
    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive"
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      console.log("Attempting to update password...");
      
      // Update password with proper parameters
      await user.updatePassword({
        currentPassword,
        newPassword
      });
      
      console.log("Password updated successfully");
      
      toast({
        title: "Success",
        description: "Password changed successfully"
      });
      
      // Reset form and close modal
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordModal(false);
    } catch (error: unknown) {
      console.error("Error updating password:", error);
      
      // Better error handling with specific messages
      let errorMessage = "Could not update password. ";
      
      const clerkError = error as ClerkError;
      if (clerkError.status === 403 || clerkError.status === 401) {
        errorMessage += "Current password is incorrect.";
      } else if (error instanceof Error && error.message && error.message.includes("password")) {
        errorMessage += error.message;
      } else {
        errorMessage += "Please try again.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sign out using Clerk's API
  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut(() => router.push('/'));
      toast({
        title: "Signed out",
        description: "You've been successfully signed out."
      });
    } catch (error: unknown) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not sign out. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update the state type
  const [sessions, setSessions] = useState<SessionInfo[]>([]);

  // Add function to load sessions
  const loadSessions = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Use the direct API without destructuring to avoid possible issues
      const sessionData = await user.getSessions();
      console.log("Sessions data:", sessionData);
      
      // Check if sessions is actually an array
      if (Array.isArray(sessionData.sessions)) {
        setSessions(sessionData.sessions.map((session: SessionData) => ({
          id: session.id,
          current: session.current || false,
          browser: session.browser || 'Unknown',
          os: session.os || 'Unknown',
          lastActiveAt: session.lastActiveAt
        })));
      } else {
        console.error("Sessions data is not an array:", sessionData);
        setSessions([]);
      }
    } catch (error) {
      console.error("Error loading sessions:", error);
      toast({
        title: "Error",
        description: "Could not load sessions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add function to revoke a session
  const revokeSession = async (sessionId: string) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      await user.revokeSession({ sessionId });
      
      // Reload sessions
      await loadSessions();
      
      toast({
        title: "Success",
        description: "Session revoked successfully"
      });
    } catch (error: unknown) {
      console.error("Error revoking session:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not revoke session. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
          <CardDescription>
            Manage your security preferences and connected devices.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Password Management */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Password Management</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowPasswordModal(true)}
              >
                <Shield className="mr-2 h-4 w-4" />
                Change Password
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Update your password regularly to maintain account security.
            </p>
          </div>

          {/* Two-Factor Authentication */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Two-Factor Authentication</h3>
                {twoFactorEnabled && (
                  <Badge className="mt-1 bg-green-100 text-green-800 hover:bg-green-200 border-green-200">
                    Enabled
                  </Badge>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={startTwoFactorSetup}
              >
                <Shield className="mr-2 h-4 w-4" />
                {twoFactorEnabled ? 'Manage 2FA' : 'Setup 2FA'}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Add an extra layer of security to your account by requiring
              both a password and verification code.
            </p>
          </div>

          {/* Active Sessions */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-3">Active Sessions</h3>
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-start justify-between rounded-md border p-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {session.current ? 'Current Session' : 'Session'} • {session.browser} on {session.os}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last active: {new Date(session.lastActiveAt).toLocaleString()}
                      {session.current && ' (Current)'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {session.current ? (
                      <Badge>Current</Badge>
                    ) : ( 
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => revokeSession(session.id)}
                        disabled={isLoading}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={loadSessions}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Refresh Sessions
              </Button>
            </div>
          </div>

          {/* Account Recovery */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-medium">Account Recovery</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="backup-email">Backup Email Address</Label>
                  <p className="text-sm text-muted-foreground">
                    Add a backup email to recover your account if needed.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    // Since Clerk doesn't have a direct API for backup emails in the client SDK,
                    // we'll redirect to Clerk's account page
                    window.location.href = 'https://accounts.clerk.dev/user/profile';
                  }}
                >
                  Setup Backup Email
                </Button>
              </div>
            </div>
          </div>

          {/* Session Management */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-medium">Session Management</h3>
            <Button 
              variant="destructive" 
              className="text-destructive-foreground"
              onClick={handleSignOut}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Change Password</h2>
              <p className="text-sm text-muted-foreground">
                Update your password to maintain account security.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input 
                  id="current-password" 
                  type="password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input 
                  id="new-password" 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  Password must be at least 8 characters long
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input 
                  id="confirm-password" 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowPasswordModal(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handlePasswordChange}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Setup Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Two-Factor Authentication</h2>
              <p className="text-sm text-muted-foreground">
                {twoFactorEnabled 
                  ? "Manage your two-factor authentication settings." 
                  : "Add an extra layer of security to your account."}
              </p>
            </div>
            
            {preparingFactor ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="border p-4 rounded-md">
                  {preparingFactor?.getImageUrl ? (
                    <Image 
                      src={preparingFactor.getImageUrl()} 
                      alt="2FA QR Code" 
                      width={160}
                      height={160}
                      className="w-40 h-40"
                    />
                  ) : (
                    <div className="w-40 h-40 bg-gray-200 flex items-center justify-center">
                      <Shield className="h-16 w-16 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                
                <div className="text-center">
                  <p className="text-sm">Scan this QR code with your authenticator app</p>
                  {preparingFactor?.secret && (
                    <p className="text-xs mt-2 font-mono bg-muted p-2 rounded select-all">
                      {preparingFactor.secret}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2 w-full">
                  <Label htmlFor="verification-code">Enter verification code</Label>
                  <Input 
                    id="verification-code" 
                    placeholder="000000" 
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                  />
                </div>
              </div>
            ) : twoFactorEnabled ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                  <p className="text-sm">Two-factor authentication is active on your account.</p>
                </div>
                
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={async () => {
                    if (!user) return;
                    
                    const confirmed = window.confirm(
                      "Are you sure you want to disable two-factor authentication? This will reduce the security of your account."
                    );
                    
                    if (confirmed) {
                      try {
                        // This is a placeholder as Clerk doesn't directly support disabling 2FA through client SDK
                        window.location.href = 'https://accounts.clerk.dev/user/security';
                      } catch (error) {
                        console.error("Error disabling 2FA:", error);
                        toast({
                          title: "Error",
                          description: "Could not disable 2FA. Please try again or visit your account settings page.",
                          variant: "destructive"
                        });
                      }
                    }
                  }}
                >
                  Disable 2FA
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center p-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
            
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShow2FAModal(false);
                  setPreparingFactor(null);
                  setVerificationCode("");
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              {preparingFactor && (
                <Button 
                  onClick={handle2FASetup}
                  disabled={isLoading || verificationCode.length !== 6}
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Verify and Enable
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityTab; 