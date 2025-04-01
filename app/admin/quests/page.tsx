import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import AdminQuestPage from "@/app/admin/quests/admin-quests";

export const metadata: Metadata = {
  title: "Quest Management | Admin",
  description: "Manage quests for users",
};

export default async function QuestManagementPage() {
  // Check if user is authenticated and is an admin
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect("/login");
  }
  
  const user = await (db as any).user.findUnique({
    where: { id: session.user.id },
  });
  
  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard");
  }
  
  // Fetch quests directly from the database instead of using API
  const quests = await (db as any).quest.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          userQuests: true,
        },
      },
    },
  });
  
  // Get quest stats
  const activeQuestsCount = quests.filter((q: any) => q.isActive).length;
  const totalUserQuestsCount = await (db as any).userQuest.count();
  const completedQuestsCount = await (db as any).userQuest.count({
    where: { isCompleted: true },
  });
  
  return (
    <AdminQuestPage 
      quests={quests} 
      activeQuestsCount={activeQuestsCount}
      totalUserQuestsCount={totalUserQuestsCount}
      completedQuestsCount={completedQuestsCount}
    />
  );
} 