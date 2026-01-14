'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { useUser } from './auth/use-user';

/**
 * Interface for the Firebase context.
 *
 * @property {FirebaseApp} firebaseApp - The Firebase app instance.
 * @property {Auth} auth - The Firebase Auth instance.
 * @property {Firestore} firestore - The Firebase Firestore instance.
 */
export interface FirebaseContextValue {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

const FirebaseContext = createContext<FirebaseContextValue | undefined>(
  undefined
);

/**
 * Provider for the Firebase context.
 *
 * @param {object} props - The properties for the component.
 * @param {ReactNode} props.children - The child components.
 * @param {FirebaseApp} props.firebaseApp - The Firebase app instance.
 * @param {Auth} props.auth - The Firebase Auth instance.
 * @param {Firestore} props.firestore - The Firebase Firestore instance.
 * @returns {JSX.Element} The Firebase provider component.
 */
export function FirebaseProvider({
  children,
  firebaseApp,
  auth,
  firestore,
}: {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}) {
  return (
    <FirebaseContext.Provider value={{ firebaseApp, auth, firestore }}>
      {children}
    </FirebaseContext.Provider>
  );
}

/**
 * Hook for accessing the Firebase context.
 *
 * @returns {FirebaseContextValue} The Firebase context.
 * @throws {Error} If the hook is not used within a FirebaseProvider.
 */
export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}

/**
 * Hook for accessing the Firebase App instance.
 *
 * @returns {FirebaseApp} The Firebase App instance.
 */
export function useFirebaseApp() {
  return useFirebase().firebaseApp;
}

/**
 * Hook for accessing the Firebase Auth instance and the current user.
 *
 * @returns {{auth: Auth, user: any, firebaseApp: FirebaseApp}} The Firebase Auth instance, the current user, and the Firebase App instance.
 */
export function useAuth() {
  const { auth, firebaseApp } = useFirebase();
  const user = useUser();
  return { auth, user, firebaseApp };
}

/**
 * Hook for accessing the Firebase Firestore instance.
 *
 * @returns {Firestore} The Firebase Firestore instance.
 */
export function useFirestore() {
  return useFirebase().firestore;
}

    