import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import db from "@/db/db";

// GET all categories
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const categories = await db.category.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST create a new category
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user from database using clerkId
    const dbUser = await db.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    // Determine the database user ID
    let databaseUserId: string;

    // If user doesn't exist in the database, create it
    if (!dbUser) {
      const clerkUser = await currentUser();
      if (!clerkUser) {
        return NextResponse.json({ error: "User authentication failed" }, { status: 401 });
      }

      // Create the user in our database
      const newUser = await db.user.create({
        data: {
          clerkId: clerkUserId,
          email: clerkUser.emailAddresses[0]?.emailAddress || "",
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          profileImageUrl: clerkUser.imageUrl,
          role: "USER",
        },
      });
      
      console.log("Created new user in database with ID:", newUser.id);
      databaseUserId = newUser.id;
    } else {
      databaseUserId = dbUser.id;
      console.log("Found existing user in database with ID:", databaseUserId);
    }

    const { name, description, color, icon } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const existingCategory = await db.category.findFirst({
      where: { name, userId: databaseUserId },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "Category with this name already exists" },
        { status: 400 }
      );
    }

    console.log("Creating category for database userId:", databaseUserId);
    
    const category = await db.category.create({
      data: {
        name,
        description,
        color,
        icon,
        userId: databaseUserId,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
} 