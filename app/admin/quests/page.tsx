import { Metadata } from "next";
import AdminQuestPage from "@/app/admin/quests/admin-quests";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Admin Quest Management",
  description: "Manage quests and their settings",
};

export default async function QuestsPage() {
  // Check admin access
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }
  
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  
  if (!user || user.role !== "ADMIN") {
    redirect("/");
  }
  
  try {
    // Activate quests that have reached their start date
    const now = new Date();
    const inactiveQuestsToActivate = await db.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Quest" 
      WHERE "isActive" = false 
      AND "startDate" IS NOT NULL 
      AND "startDate" <= ${now}::timestamp
    `;
    
    if (inactiveQuestsToActivate.length > 0) {
      console.log(`Activating ${inactiveQuestsToActivate.length} quests based on startDate`);
      
      for (const quest of inactiveQuestsToActivate) {
        await db.quest.update({
          where: { id: quest.id },
          data: { 
            isActive: true,
            updatedAt: new Date()
          }
        });
        console.log(`Activated quest ${quest.id} based on startDate`);
      }
    }
    
    // Fetch all quests with counts
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
    
    // Convert dates to strings to match QuestType interface
    const safeQuests = quests.map(quest => {
      // Use type assertion to handle startDate and endDate properties
      const questWithDates = quest as unknown as {
        startDate?: Date | null;
        endDate?: Date | null;
      } & typeof quest;
      
      return {
        ...quest,
        createdAt: quest.createdAt.toISOString(),
        updatedAt: quest.updatedAt.toISOString(),
        startDate: questWithDates.startDate?.toISOString() || null,
        endDate: questWithDates.endDate?.toISOString() || null,
        _count: quest._count || { userQuests: 0 }
      };
    });
    
    // Get quest statistics for the interface
    const activeQuestsCount = safeQuests.filter(q => q.isActive).length;
    const totalUserQuestsCount = safeQuests.length;
    const completedQuestsCount = safeQuests.reduce((sum, q) => sum + q._count.userQuests, 0);
    
    return (
      <AdminQuestPage 
        quests={safeQuests}
        activeQuestsCount={activeQuestsCount}
        totalUserQuestsCount={totalUserQuestsCount}
        completedQuestsCount={completedQuestsCount}
      />
    );
  } catch (error) {
    console.error("Error loading quests:", error);
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-destructive/10 p-4 rounded-md">
          <h1 className="text-xl font-bold text-destructive">Error</h1>
          <p>Failed to load quests. Please try again later.</p>
        </div>
      </div>
    );
  }
} 