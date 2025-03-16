import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import MealGallery, { MealImage } from "@/components/meal-gallery";
import { Heart } from "lucide-react";

interface FavoriteMealId {
  mealId: string;
}

export default async function FavoritesPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  // Get all meals from the database
  const allMeals = await db.meal.findMany({
    include: {
      user: true
    },
    orderBy: {
      date: "desc",
    },
  });

  // Get all favorites for the current user
  const userFavorites = await db.$queryRaw`
    SELECT "mealId" FROM "Favorite" WHERE "userId" = ${session.user.id}
  ` as FavoriteMealId[];

  // Extract meal IDs from favorites
  const favoriteMealIds = new Set(userFavorites.map(fav => fav.mealId));

  // Filter meals to only include favorites
  const favoriteMeals: MealImage[] = allMeals
    .filter(meal => favoriteMealIds.has(meal.id))
    .map(meal => ({
      id: meal.id,
      type: meal.type,
      imageUrl: meal.imageUrl,
      date: meal.date,
      // Only include isFood and foodName if they exist on the meal object
      ...(('isFood' in meal) ? { isFood: meal.isFood as boolean } : {}),
      ...(('foodName' in meal) ? { foodName: meal.foodName as string | null } : {}),
      user: {
        id: meal.user.id,
        name: meal.user.name || "",
        image: meal.user.image || "",
      },
    }));

  // Get all favorite IDs for the current user
  const favoriteIds: string[] = Array.from(favoriteMealIds);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-primary/20 py-6 backdrop-blur-sm bg-background/80 sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold glow-text text-primary">My Favorites</h1>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="vintage-button bg-primary text-sm py-2 px-4">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {favoriteMeals.length === 0 ? (
          <div className="tech-card p-8 text-center">
            <Heart className="mx-auto mb-4 text-primary/50" size={48} />
            <h2 className="text-xl font-bold mb-2 vintage-text">No Favorites Yet</h2>
            <p className="text-muted-foreground mb-6">
              You haven't added any meals to your favorites yet. Click the heart icon on any meal to add it to your favorites.
            </p>
            <Link href="/gallery" className="vintage-button bg-primary py-2 px-4 inline-block">
              Browse Gallery
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-8 vintage-text text-center">Your Favorite Meals</h2>
            
            <MealGallery 
              meals={favoriteMeals} 
              currentUserId={session.user.id} 
              favoriteIds={favoriteIds} 
            />
          </>
        )}
      </main>
    </div>
  );
} 