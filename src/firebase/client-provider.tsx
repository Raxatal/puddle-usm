"use client";

import { useMemo, type ReactNode } from 'react';
import { initializeFirebase } from '.';
import { FirebaseProvider } from './provider';

/**
 * Provides a Firebase context to the application.
 *
 * This component initializes Firebase on the client-side and provides the
 * Firebase app, Firestore, and Auth instances to its children through the
 * FirebaseProvider. This ensures that Firebase is initialized only once.
 */
export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const { firebaseApp, firestore, auth } = useMemo(
    () => initializeFirebase(),
    []
  );

  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      firestore={firestore}
      auth={auth}
    >
      {children}
    </FirebaseProvider>
  );
}
