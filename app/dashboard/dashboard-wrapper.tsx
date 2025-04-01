'use client';

import { EdgeStoreProvider } from '@/lib/edgestore';
import DashboardClient from './dashboard-client';

interface DashboardWrapperProps {
  user: any;
  streak: any;
  todaysMeals: any;
}

export default function DashboardWrapper({ 
  user, 
  streak, 
  todaysMeals 
}: DashboardWrapperProps) {
  return (
    <EdgeStoreProvider>
      <DashboardClient
        user={user}
        streak={streak}
        todaysMeals={todaysMeals}
      />
    </EdgeStoreProvider>
  );
} 