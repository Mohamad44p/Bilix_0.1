"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { useUser } from "@clerk/nextjs";

// Import tab components
import ProfileTab from "@/components/dashboard/settings/ProfileTab";
import CompanyTab from "@/components/dashboard/settings/CompanyTab";
import NotificationsTab from "@/components/dashboard/settings/NotificationsTab";
import PrivacyTab from "@/components/dashboard/settings/PrivacyTab";
import SecurityTab from "@/components/dashboard/settings/SecurityTab";
import BillingTab from "@/components/dashboard/settings/BillingTab";
import AdvancedTab from "@/components/dashboard/settings/AdvancedTab";

// Adapter functions to convert Clerk user to component-specific types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adaptToProfileTabUser = (user: any) => {
  if (!user) return user;
  return {
    ...user,
    primaryEmailAddress: user.primaryEmailAddress ? {
      emailAddress: user.primaryEmailAddress.emailAddress
    } : undefined
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adaptToSecurityTabUser = (user: any) => {
  if (!user) return user;
  return user as Parameters<typeof SecurityTab>[0]["user"];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adaptToAdvancedTabUser = (user: any) => {
  if (!user) return user;
  return {
    id: user.id,
    clerkId: user.id,
    email: user.primaryEmailAddress?.emailAddress || "",
    firstName: user.firstName,
    lastName: user.lastName,
    profileImageUrl: user.imageUrl,
    createdAt: new Date(),
    updatedAt: new Date(),
    role: "USER" as const
  };
};

const Settings = () => {
  const { user, isLoaded } = useUser();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-7 lg:grid-cols-7">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="company">Company</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileTab user={adaptToProfileTabUser(user)} isLoaded={isLoaded} />
          </TabsContent>

          <TabsContent value="company">
            <CompanyTab />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationsTab />
          </TabsContent>

          <TabsContent value="privacy">
            <PrivacyTab />
          </TabsContent>

          <TabsContent value="security">
            <SecurityTab user={adaptToSecurityTabUser(user)} isLoaded={isLoaded} />
          </TabsContent>

          <TabsContent value="billing">
            <BillingTab />
          </TabsContent>

          <TabsContent value="advanced">
            <AdvancedTab user={adaptToAdvancedTabUser(user)} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;