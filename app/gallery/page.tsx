import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import MealGallery, { MealImage } from "@/components/meal-gallery";
import { AlertTriangle } from "lucide-react";

interface Favorite {
  mealId: string;
}

export default async function GalleryPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  // Get all meals with user information
  const meals = await db.meal.findMany({
    orderBy: {
      date: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          role: true,
        }
      }
    },
    take: 100, // Limit to 100 most recent meals
  });

  // Get user favorites
  const favorites = await db.favorite.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      mealId: true,
    },
  });

  const favoriteIds = favorites.map((fav: Favorite) => fav.mealId);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-primary/20 py-6 backdrop-blur-sm bg-background/80 sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold glow-text text-primary">Meal Gallery</h1>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="vintage-button bg-primary text-sm py-2 px-4">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="glass-card p-4 rounded-lg mb-8 flex items-start gap-3">
          <AlertTriangle className="text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-amber-500">Privacy Notice</h3>
            <p className="text-sm text-muted-foreground">
              This gallery shows meals from all users. Your name will be displayed alongside your meal images.
              For maximum privacy, avoid uploading sensitive content.
            </p>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold mb-8 vintage-text text-center">Community Meal Gallery</h2>
        
        <MealGallery 
          meals={meals as MealImage[]} 
          currentUserId={session.user.id} 
          favoriteIds={favoriteIds}
          userRole={session.user.role}
        />
      </main>
    </div>
  );
} 