import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import db from "@/db/db";

// GET a single vendor by ID
export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user from database using clerkId
    const dbUser = await db.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = params;

    const vendor = await db.vendor.findUnique({
      where: { id, userId: dbUser.id },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    return NextResponse.json(vendor);
  } catch (error) {
    console.error("Error fetching vendor:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendor" },
      { status: 500 }
    );
  }
}

// PUT/PATCH update a vendor
export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user from database using clerkId
    const dbUser = await db.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = params;
    const { name, email, phone, website, address, notes, logoUrl } = await req.json();

    // Check if this vendor exists and belongs to the user
    const existingVendor = await db.vendor.findUnique({
      where: { id, userId: dbUser.id },
    });

    if (!existingVendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    // If name is being changed, check for duplicates
    if (name && name !== existingVendor.name) {
      const duplicateName = await db.vendor.findFirst({
        where: { name, userId: dbUser.id, id: { not: id } },
      });

      if (duplicateName) {
        return NextResponse.json(
          { error: "Vendor with this name already exists" },
          { status: 400 }
        );
      }
    }

    const updatedVendor = await db.vendor.update({
      where: { id },
      data: {
        name: name ?? existingVendor.name,
        email: email !== undefined ? email : existingVendor.email,
        phone: phone !== undefined ? phone : existingVendor.phone,
        website: website !== undefined ? website : existingVendor.website,
        address: address !== undefined ? address : existingVendor.address,
        notes: notes !== undefined ? notes : existingVendor.notes,
        logoUrl: logoUrl !== undefined ? logoUrl : existingVendor.logoUrl,
      },
    });

    return NextResponse.json(updatedVendor);
  } catch (error) {
    console.error("Error updating vendor:", error);
    return NextResponse.json(
      { error: "Failed to update vendor" },
      { status: 500 }
    );
  }
}

// DELETE a vendor
export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user from database using clerkId
    const dbUser = await db.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = params;

    // Check if this vendor exists and belongs to the user
    const existingVendor = await db.vendor.findUnique({
      where: { id, userId: dbUser.id },
    });

    if (!existingVendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    // Delete the vendor
    await db.vendor.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Vendor deleted successfully" });
  } catch (error) {
    console.error("Error deleting vendor:", error);
    return NextResponse.json(
      { error: "Failed to delete vendor" },
      { status: 500 }
    );
  }
} 