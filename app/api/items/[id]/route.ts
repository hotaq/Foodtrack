import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Ensure user is authenticated and has admin role
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to update items" },
        { status: 401 }
      );
    }
    
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });
    
    if (user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }
    
    // Get the item ID from the URL
    const itemId = params.id;
    
    // Get URL to determine operation type
    const { searchParams } = new URL(request.url);
    const operation = searchParams.get("operation");
    
    // Parse the request body
    const requestData = await request.json();
    
    // Handle different operations
    if (operation === "toggle-status") {
      // Toggle status operation
      const { isActive } = requestData;
      
      if (isActive === undefined) {
        return NextResponse.json(
          { error: "isActive status is required" },
          { status: 400 }
        );
      }
      
      const updatedItem = await prisma.item.update({
        where: { id: itemId },
        data: { isActive }
      });
      
      return NextResponse.json({
        message: `Item is now ${isActive ? "active" : "inactive"}`,
        item: updatedItem
      });
      
    } else {
      // Default to full update operation
      const {
        name,
        description,
        imageUrl,
        price,
        type,
        effect,
        duration,
        cooldown,
        isActive
      } = requestData;
      
      // Validate required fields
      if (!name || !description || !price || !type) {
        return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 }
        );
      }
      
      // Update the item
      const updatedItem = await prisma.item.update({
        where: { id: itemId },
        data: {
          name,
          description,
          imageUrl,
          price,
          type,
          effect,
          duration,
          cooldown,
          isActive
        }
      });
      
      return NextResponse.json({
        message: "Item updated successfully",
        item: updatedItem
      });
    }
    
  } catch (error) {
    console.error("Error updating item:", error);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }
} 