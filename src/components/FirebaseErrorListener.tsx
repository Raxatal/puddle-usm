"use client";

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

export default function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      const errorContext = error.toContextObject();

      // Throw an uncaught exception to trigger the Next.js overlay in development
      if (process.env.NODE_ENV === 'development') {
        const overlayError = new Error(
          `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:\n${JSON.stringify(errorContext, null, 2)}`
        );
        overlayError.name = "FirestorePermissionError";
        // This makes the error pop up in the Next.js overlay
        setTimeout(() => {
          throw overlayError;
        }, 0);
      } else {
        // In production, just show a toast
         toast({
            variant: "destructive",
            title: "Permission Denied",
            description: "You do not have permission to perform this action.",
         });
      }
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null; // This component does not render anything
}
