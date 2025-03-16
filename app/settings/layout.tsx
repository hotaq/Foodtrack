import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Settings | Meal Tracker",
  description: "Manage your profile settings",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-primary py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center text-primary hover:text-primary/80 transition-colors">
              <ChevronLeft size={20} />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </header>
      
      <main>
        {children}
      </main>
    </div>
  );
} 