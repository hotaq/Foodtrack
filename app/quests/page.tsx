import { Metadata } from "next";
import QuestBoard from "@/app/components/QuestBoard";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Daily Quests | FoodTrack",
  description: "Complete quests to earn rewards",
};

export default function QuestsPage() {
  return (
    <Container>
      <div className="py-10 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Daily Quests 🏆</h1>
          <p className="text-muted-foreground mt-2">
            Complete quests to earn points for the marketplace
          </p>
        </div>
        
        <QuestBoard />
      </div>
    </Container>
  );
} 