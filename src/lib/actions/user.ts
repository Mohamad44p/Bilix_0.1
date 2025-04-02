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

    const email = clerkUser.emailAddresses[0]?.emailAddress || "";
    
    // Check if any user with this email already exists
    const existingUserWithEmail = await db.user.findUnique({
      where: { email }
    });
    
    if (existingUserWithEmail && existingUserWithEmail.clerkId !== clerkUser.id) {
      // A user with this email exists but has a different clerkId
      // This can happen if a user signs up with the same email using a different auth method
      console.warn(`User with email ${email} already exists with different clerkId`);
      
      // Update the existing user's clerkId to match the current auth
      return await db.user.update({
        where: { id: existingUserWithEmail.id },
        data: {
          clerkId: clerkUser.id,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          profileImageUrl: clerkUser.imageUrl,
        }
      });
    }

    // If no conflict, proceed with normal upsert
    const user = await db.user.upsert({
      where: { clerkId: clerkUser.id },
      update: {
        email,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        profileImageUrl: clerkUser.imageUrl,
      },
      create: {
        clerkId: clerkUser.id,
        email,
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