import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import AdminItems from "./admin-items";

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

  // Get all items data already handled inside the client component
  // Just render the AdminItems component
  return <AdminItems />;
} 