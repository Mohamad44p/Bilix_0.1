import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import db from "@/db/db";

// GET all vendors
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

    const vendors = await db.vendor.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(vendors);
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendors" },
      { status: 500 }
    );
  }
}

// POST create a new vendor
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

    const { name, email, phone, website, address, notes, logoUrl } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const existingVendor = await db.vendor.findFirst({
      where: { name, userId: databaseUserId },
    });

    if (existingVendor) {
      return NextResponse.json(
        { error: "Vendor with this name already exists" },
        { status: 400 }
      );
    }

    console.log("Creating vendor for database userId:", databaseUserId);

    const vendor = await db.vendor.create({
      data: {
        name,
        email,
        phone,
        website,
        address,
        notes,
        logoUrl,
        userId: databaseUserId,
      },
    });

    return NextResponse.json(vendor, { status: 201 });
  } catch (error) {
    console.error("Error creating vendor:", error);
    return NextResponse.json(
      { error: "Failed to create vendor" },
      { status: 500 }
    );
  }
} 