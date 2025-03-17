import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is an admin
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const userId = params.id;

    // Check if user exists
    const user = await db.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Unban the user
    const updatedUser = await db.user.update({
      where: {
        id: userId,
      },
      data: {
        isBanned: false,
        status: "ACTIVE",
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[UNBAN_USER_ERROR]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 