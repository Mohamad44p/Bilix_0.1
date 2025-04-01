"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Loader2 } from "lucide-react";

interface UserResource {
  firstName: string | null;
  lastName: string | null;
  primaryEmailAddress?: {
    emailAddress: string;
  };
  imageUrl?: string;
  update: (data: { firstName: string; lastName: string }) => Promise<void>;
}

interface ProfileTabProps {
  user: UserResource | null | undefined;
  isLoaded: boolean;
}

const ProfileTab = ({ user, isLoaded }: ProfileTabProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // User profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    imageUrl: ""
  });

  // Load user data once available
  useEffect(() => {
    if (isLoaded && user) {
      setProfileForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.primaryEmailAddress?.emailAddress || "",
        imageUrl: user.imageUrl || ""
      });
    }
  }, [isLoaded, user]);

  // User initials for avatar fallback
  const getUserInitials = () => {
    if (!profileForm.firstName && !profileForm.lastName) return "U";
    
    if (profileForm.firstName && profileForm.lastName) {
      return `${profileForm.firstName.charAt(0)}${profileForm.lastName.charAt(0)}`;
    } else if (profileForm.firstName) {
      return profileForm.firstName.charAt(0);
    } else {
      return "U";
    }
  };

  // Handle profile form changes
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Save profile changes
  const saveProfileChanges = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      await user.update({
        firstName: profileForm.firstName,
        lastName: profileForm.lastName
      });
      
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully."
      });
    } catch (error: unknown) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: (error as Error).message || "There was an error updating your profile.",
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
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your profile information and profile picture.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profileForm.imageUrl} alt="Avatar" />
              <AvatarFallback className="text-xl">{getUserInitials()}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    if (user) {
                      // Redirect to Clerk's profile page for image upload
                      window.location.href = 'https://accounts.clerk.dev/user/profile';
                    }
                  }}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                JPG, GIF or PNG. Max size of 2MB.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input 
                id="firstName" 
                name="firstName"
                placeholder="John" 
                value={profileForm.firstName}
                onChange={handleProfileChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input 
                id="lastName" 
                name="lastName"
                placeholder="Doe" 
                value={profileForm.lastName}
                onChange={handleProfileChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                name="email"
                placeholder="john.doe@example.com" 
                value={profileForm.email}
                disabled
                className="opacity-60"
              />
              <p className="text-xs text-muted-foreground">
                To change your email, please visit your account settings in Clerk.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="ml-auto"
            onClick={saveProfileChanges}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ProfileTab; 