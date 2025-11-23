"use client";

import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useFirebase } from '../provider';

/**
 * Hook to get the current authenticated user.
 *
 * This hook listens for changes in the authentication state and returns the
 * current user object. It returns `null` if the user is not authenticated.
 *
 * @returns {User | null} The current user object or `null`.
 */
export function useUser() {
  const { auth } = useFirebase();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, [auth]);

  return user;
}
