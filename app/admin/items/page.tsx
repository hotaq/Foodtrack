import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminItemsPage } from "./admin-items";

export const metadata: Metadata = {
  title: "Marketplace Items | Admin",
  description: "Manage marketplace items for FoodTrack",
};

export default async function ItemManagementPage() {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated and has admin role
  if (!session || !session.user || session.user.role !== "ADMIN") {
    redirect("/login?error=You must be an admin to access this page");
  }

  // Get all items
  const items = await (db as any).item.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  // Get total item count
  const itemCount = await (db as any).item.count();

  // Get total user items count
  const userItemsCount = await (db as any).userItem.count();

  return (
    <AdminItemsPage 
      items={items} 
      itemCount={itemCount} 
      userItemsCount={userItemsCount} 
    />
  );
} 