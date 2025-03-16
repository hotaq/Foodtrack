import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Favorites | Meal Tracker",
  description: "View your favorite meals",
};

export default function FavoritesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
} 