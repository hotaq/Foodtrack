'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Helper to check if user is admin
async function checkAdminAccess() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return false;
  }
  return true;
}

// GET /api/admin/items/[id] - Get a specific item
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin access
    if (!(await checkAdminAccess())) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }
    
    const id = params.id;
    
    // Get the item
    const item = await prisma.item.findUnique({
      where: { id },
    });
    
    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(item);
  } catch (error) {
    console.error('[ADMIN_ITEM_GET]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/items/[id] - Update a specific item
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin access
    if (!(await checkAdminAccess())) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }
    
    const id = params.id;
    const body = await req.json();
    
    // Validate required fields
    if (!body.name || !body.description || body.price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Update the item
    const updatedItem = await prisma.item.update({
      where: { id },
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
      },
    });
    
    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('[ADMIN_ITEM_PUT]', error);
    
    // Check if this is a "not found" Prisma error
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/items/[id] - Partially update an item (e.g., toggle active status)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin access
    if (!(await checkAdminAccess())) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }
    
    const id = params.id;
    const body = await req.json();
    
    // Update only the provided fields
    const updatedItem = await prisma.item.update({
      where: { id },
      data: body,
    });
    
    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('[ADMIN_ITEM_PATCH]', error);
    // Check if this is a "not found" Prisma error
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/items/[id] - Delete a specific item
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin access
    if (!(await checkAdminAccess())) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }
    
    const id = params.id;
    
    // Check if the item exists
    const existingItem = await prisma.item.findUnique({
      where: { id },
    });
    
    if (!existingItem) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }
    
    // Delete the item
    await prisma.item.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ADMIN_ITEM_DELETE]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 