import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  role: string;
}

interface CreateItemRequest {
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  type: string;
  effect: string | null;
  duration: number | null;
  cooldown: number | null;
  isActive: boolean;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and has admin role
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const user = session.user as User;
    
    if (user.role !== "ADMIN") {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    
    // Parse the request body
    const body = await request.json() as CreateItemRequest;
    
    // Validate required fields
    if (!body.name || !body.description || !body.imageUrl || !body.price || !body.type) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }
    
    // Create the item
    const item = await (db as any).item.create({
      data: {
        name: body.name,
        description: body.description,
        imageUrl: body.imageUrl,
        price: body.price,
        type: body.type,
        effect: body.effect,
        duration: body.duration,
        cooldown: body.cooldown,
        isActive: body.isActive,
        createdBy: user.id
      }
    });
    
    return NextResponse.json({ message: "Item created successfully", item });
    
  } catch (error) {
    console.error("Error creating item:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
} 