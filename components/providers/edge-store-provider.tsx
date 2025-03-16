'use client';

import { useEdgeStore, EdgeStoreProvider as Provider } from '@/lib/edgestore';
import { ReactNode } from 'react';

interface EdgeStoreProviderProps {
  children: ReactNode;
}

export function EdgeStoreProvider({ children }: EdgeStoreProviderProps) {
  return (
    <Provider>
      {children}
    </Provider>
  );
} 