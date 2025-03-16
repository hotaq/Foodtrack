import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Meal Analytics | Meal Tracker",
  description: "View detailed analytics of your meal tracking progress",
};

export default function AnalyticsLayout({
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