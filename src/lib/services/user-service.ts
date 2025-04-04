import { toast } from "sonner";
import { Organization } from '@/lib/types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface UserProfile {
  id: string;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  role: string;
  organization?: {
    id: string;
    name: string;
  };
  stats?: {
    totalInvoices: number;
    pendingAmount: number;
    overdueCount: number;
  };
}

// Fetch user profile data from the API
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const response = await fetch("/api/user/profile", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

// Get financial summary for the user
export async function getUserFinancialSummary() {
  try {
    const response = await fetch("/api/user/financial-summary", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching financial summary:", error);
    toast.error("Failed to fetch financial summary. Please try again.");
    return null;
  }
}

// Update user preferences
export async function updateUserPreferences(preferences: Record<string, unknown>) {
  try {
    const response = await fetch("/api/user/preferences", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preferences),
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    toast.success("Preferences updated successfully");
    return await response.json();
  } catch (error) {
    console.error("Error updating preferences:", error);
    toast.error("Failed to update preferences. Please try again.");
    return null;
  }
}

// Delete user account
export async function deleteUser(userId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/user/${userId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    toast.success("Account deleted successfully");
    return true;
  } catch (error) {
    console.error("Error deleting account:", error);
    toast.error("Failed to delete account. Please try again.");
    throw error;
  }
}

export async function createOrUpdateOrganization(userId: string, organizationData: Partial<Organization>): Promise<Organization> {
  try {
    // First check if the user already has an organization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organizations: true }
    });

    // Ensure data is correctly typed for Prisma
    const prismaData = {
      name: organizationData.name || 'My Organization',
      industry: organizationData.industry || null,
      size: organizationData.size || null,
      invoiceVolume: organizationData.invoiceVolume || null,
      logoUrl: organizationData.logoUrl || null
    };

    if (user?.organizations[0]) {
      // Update existing organization
      const updatedOrg = await prisma.organization.update({
        where: { id: user.organizations[0].id },
        data: prismaData
      });
      
      return updatedOrg as Organization;
    } else {
      // Create new organization
      const organization = await prisma.organization.create({
        data: {
          ...prismaData,
          members: {
            connect: { id: userId }
          }
        }
      });
      
      return organization as Organization;
    }
  } catch (error) {
    console.error('Error creating/updating organization:', error);
    throw new Error('Failed to create or update organization');
  }
} 