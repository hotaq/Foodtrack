import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut, 
  PieChart, 
  ShoppingBag, 
  Trophy,
  Home
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated and has admin role
  if (!session || !session.user || session.user.role !== "ADMIN") {
    redirect("/login?error=You must be an admin to access this page");
  }

  const navItems = [
    {
      title: "Dashboard",
      href: "/admin",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: "Users",
      href: "/admin/users",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Quests",
      href: "/admin/quests",
      icon: <Trophy className="h-5 w-5" />,
    },
    {
      title: "Items",
      href: "/admin/items",
      icon: <ShoppingBag className="h-5 w-5" />,
    },
    {
      title: "Analytics",
      href: "/admin/analytics",
      icon: <PieChart className="h-5 w-5" />,
    },
    {
      title: "Settings",
      href: "/admin/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col fixed inset-y-0">
        <div className="flex flex-col flex-grow border-r border-primary/20 bg-card/50 backdrop-blur-sm pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4 mb-8">
            <h1 className="text-2xl font-bold vintage-text text-primary">Meal Tracker</h1>
          </div>
          <div className="mt-5 flex-1 flex flex-col px-2 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center px-4 py-3 text-sm font-medium rounded-md",
                  "hover:bg-primary/10 hover:text-primary transition-colors",
                  "focus:outline-none focus-visible:ring focus-visible:ring-primary focus-visible:ring-opacity-50"
                )}
              >
                {item.icon}
                <span className="ml-3">{item.title}</span>
              </Link>
            ))}
          </div>
          <div className="px-4 mt-6 mb-8">
            <Link
              href="/dashboard"
              className={cn(
                "group flex items-center px-4 py-3 text-sm font-medium rounded-md",
                "hover:bg-primary/10 hover:text-primary transition-colors",
                "focus:outline-none focus-visible:ring focus-visible:ring-primary focus-visible:ring-opacity-50"
              )}
            >
              <Home className="h-5 w-5" />
              <span className="ml-3">User Dashboard</span>
            </Link>
            <Link
              href="/api/auth/signout"
              className={cn(
                "group flex items-center px-4 py-3 text-sm font-medium rounded-md",
                "hover:bg-destructive/10 hover:text-destructive transition-colors",
                "focus:outline-none focus-visible:ring focus-visible:ring-destructive focus-visible:ring-opacity-50"
              )}
            >
              <LogOut className="h-5 w-5" />
              <span className="ml-3">Sign Out</span>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-10 flex items-center justify-between h-16 bg-card/80 backdrop-blur-md border-b border-primary/20 px-4">
        <h1 className="text-xl font-bold vintage-text text-primary">Meal Tracker</h1>
        {/* Mobile menu button would go here */}
      </div>
      
      {/* Main content */}
      <div className="flex flex-col flex-1 md:pl-64">
        <main className="flex-1 overflow-y-auto pt-6 md:pt-8 pb-10 px-4 md:px-8 mt-16 md:mt-0">
          {children}
        </main>
      </div>
    </div>
  );
} 