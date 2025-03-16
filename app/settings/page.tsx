import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import ProfileSettings from "./profile-settings";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect("/login");
  }
  
  // Fetch the complete user data
  const user = await db.user.findUnique({
    where: {
      id: session.user.id,
    },
  });
  
  if (!user) {
    redirect("/login");
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 vintage-text text-primary">User Settings</h1>
      <ProfileSettings user={user} />
    </div>
  );
} 