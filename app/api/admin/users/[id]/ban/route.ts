import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is an admin
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const { reason } = await request.json();
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

    // Prevent admins from being banned
    if (user.role === 'ADMIN') {
      return new NextResponse("Cannot ban an admin user", { status: 403 });
    }

    // Update the user's status to banned
    const updatedUser = await db.user.update({
      where: {
        id: userId,
      },
      data: {
        isBanned: true,
        status: "BANNED",
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('[BAN_USER_ERROR]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 