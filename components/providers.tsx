'use client';

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { EdgeStoreProvider } from "./providers/edge-store-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <EdgeStoreProvider>
        {children}
        <Toaster position="bottom-right" />
      </EdgeStoreProvider>
    </SessionProvider>
  );
} 