'use client';

import { EdgeStoreProvider as Provider } from '@/lib/edgestore';
import { ReactNode, useEffect, useState } from 'react';

interface EdgeStoreProviderProps {
  children: ReactNode;
}

export function EdgeStoreProvider({ children }: EdgeStoreProviderProps) {
  const [mounted, setMounted] = useState(false);

  // This ensures the provider is only mounted on the client side
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <Provider>
      {children}
    </Provider>
  );
} 