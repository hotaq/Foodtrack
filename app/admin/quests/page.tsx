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

// Disable the React hydration warnings 
// This is necessary because form elements get additional attributes from browser extensions
export const dynamic = 'force-dynamic';

export default async function QuestManagementPage() {
  // Check if user is authenticated and is an admin
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect("/login");
  }
  
  const user = await db.user.findUnique({
    where: { id: session.user.id },
  });
  
  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard");
  }
  
  try {
    // Fetch quests directly from the database instead of using API
    const quests = await db.quest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            userQuests: true,
          },
        },
      },
    });
    
    // Ensure each quest has _count property
    const safeQuests = quests.map(quest => {
      // Convert Date objects to strings to match QuestType interface
      const formattedQuest = {
        ...quest,
        createdAt: quest.createdAt.toISOString(),
        updatedAt: quest.updatedAt.toISOString(),
        _count: quest._count || { userQuests: 0 }
      };
      
      return formattedQuest;
    });
    
    // Get quest stats
    const activeQuestsCount = safeQuests.filter(q => q.isActive).length;
    const totalUserQuestsCount = await db.userQuest.count();
    const completedQuestsCount = await db.userQuest.count({
      where: { isCompleted: true },
    });
    
    return (
      <AdminQuestPage 
        quests={safeQuests} 
        activeQuestsCount={activeQuestsCount}
        totalUserQuestsCount={totalUserQuestsCount}
        completedQuestsCount={completedQuestsCount}
      />
    );
  } catch (error) {
    console.error("Error fetching quests data:", error);
    // Return minimal data to avoid crashes
    return (
      <AdminQuestPage 
        quests={[]} 
        activeQuestsCount={0}
        totalUserQuestsCount={0}
        completedQuestsCount={0}
      />
    );
  }
} 