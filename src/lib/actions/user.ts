"use server";

import { currentUser } from "@clerk/nextjs/server";
import db from "@/db/db";

/**
 * Function to create or update a user in the database
 * This will be called when a user signs in or updates their profile
 */
export async function syncUserWithDatabase() {
  try {
    // Get the current user from Clerk
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      throw new Error("User not authenticated");
    }

    // Find or create user in our database
    const user = await db.user.upsert({
      where: { clerkId: clerkUser.id },
      update: {
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        profileImageUrl: clerkUser.imageUrl,
      },
      create: {
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        profileImageUrl: clerkUser.imageUrl,
        role: "USER", // Default role
      },
    });

    return user;
  } catch (error) {
    console.error("Error syncing user with database:", error);
    throw error;
  }
}

/**
 * Function to get the current user from the database
 */
export async function getCurrentDbUser() {
  try {
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return null;
    }

    const user = await db.user.findUnique({
      where: { clerkId: clerkUser.id },
      include: {
        organizations: true,
      },
    });

    return user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

/**
 * Create a new organization for the current user
 */
export async function createOrganization(name: string) {
  try {
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      throw new Error("User not authenticated");
    }

    const user = await db.user.findUnique({
      where: { clerkId: clerkUser.id },
    });

    if (!user) {
      throw new Error("User not found in database");
    }

    const organization = await db.organization.create({
      data: {
        name,
        members: {
          connect: {
            id: user.id,
          },
        },
      },
    });

    return organization;
  } catch (error) {
    console.error("Error creating organization:", error);
    throw error;
  }
} 