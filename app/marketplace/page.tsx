import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Marketplace from "@/app/components/Marketplace";

export const metadata: Metadata = {
  title: "Marketplace | Foodtrack",
  description: "Shop for items and boosts with your points",
};

export default async function MarketplacePage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/sign-in");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Marketplace />
    </div>
  );
} 