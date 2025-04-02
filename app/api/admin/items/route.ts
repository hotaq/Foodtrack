import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// POST: Create a new marketplace item (admin only)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Ensure user is authenticated and is an admin
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });
    
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }
    
    // Parse request body
    const { name, description, imageUrl, price, type, effect, duration, cooldown, isActive } = await req.json();
    
    // Validate required fields
    if (!name || !description || !price || !type) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }
    
    // Create the item
    const item = await (db as any).item.create({
      data: {
        name,
        description,
        imageUrl: imageUrl || "/images/items/default.png",
        price: Number(price),
        type,
        effect: effect || null,
        duration: duration ? Number(duration) : null,
        cooldown: cooldown ? Number(cooldown) : null,
        isActive: Boolean(isActive),
        createdBy: session.user.id
      },
    });
    
    return NextResponse.json({
      message: "Item created successfully",
      item,
    });
  } catch (error) {
    console.error("Error creating item:", error);
    return NextResponse.json({ message: "Failed to create item" }, { status: 500 });
  }
}

// GET: List all items (admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Ensure user is authenticated and is an admin
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const user = await (db as any).user.findUnique({
      where: { id: session.user.id },
    });
    
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }
    
    // Get all items
    const items = await (db as any).item.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            userItems: true,
          },
        },
      },
    });
    
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching items:", error);
    return NextResponse.json({ message: "Failed to fetch items" }, { status: 500 });
  }
}

// PATCH: Update item active status (admin only)
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Ensure user is authenticated and is an admin
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const user = await (db as any).user.findUnique({
      where: { id: session.user.id },
    });
    
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }
    
    // Parse request body
    const { itemId, isActive } = await req.json();
    
    if (!itemId) {
      return NextResponse.json({ message: "Item ID is required" }, { status: 400 });
    }
    
    // Update the item
    const updatedItem = await (db as any).item.update({
      where: { id: itemId },
      data: { 
        isActive: Boolean(isActive),
        updatedAt: new Date(),
      },
    });
    
    return NextResponse.json({
      message: "Item updated successfully",
      item: updatedItem,
    });
  } catch (error) {
    console.error("Error updating item:", error);
    return NextResponse.json({ message: "Failed to update item" }, { status: 500 });
  }
}

// DELETE: Remove an item (admin only)
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Ensure user is authenticated and is an admin
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const user = await (db as any).user.findUnique({
      where: { id: session.user.id },
    });
    
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }
    
    // Get itemId from URL
    const url = new URL(req.url);
    const itemId = url.searchParams.get('id');
    
    if (!itemId) {
      return NextResponse.json({ message: "Item ID is required" }, { status: 400 });
    }
    
    // First delete related user items
    await (db as any).userItem.deleteMany({
      where: { itemId },
    });
    
    // Then delete the item
    await (db as any).item.delete({
      where: { id: itemId },
    });
    
    return NextResponse.json({
      message: "Item deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting item:", error);
    return NextResponse.json({ message: "Failed to delete item" }, { status: 500 });
  }
} 