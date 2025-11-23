"use client";

import { CartProvider } from '@/context/cart-context';
import type { ReactNode } from 'react';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <FirebaseClientProvider>
      <CartProvider>
        {children}
      </CartProvider>
    </FirebaseClientProvider>
  );
}
