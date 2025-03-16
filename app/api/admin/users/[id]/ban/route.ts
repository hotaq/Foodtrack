import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { reason } = await request.json();
    
    // Prevent admins from being banned
    const targetUser = await db.user.findUnique({
      where: { id: params.id },
      select: { role: true }
    });

    if (targetUser?.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Cannot ban an admin user' },
        { status: 400 }
      );
    }

    // Update the user's status to banned
    await db.user.update({
      where: {
        id: params.id,
      },
      data: {
        isBanned: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error banning user:', error);
    return NextResponse.json(
      { error: 'Failed to ban user' },
      { status: 500 }
    );
  }
} 