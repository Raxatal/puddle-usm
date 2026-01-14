"use client";

import { useAuth } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { useInactivityTimeout } from "@/hooks/use-inactivity-timeout";
import { signOut } from "firebase/auth";

export function SessionTimeout() {
  const { user, auth } = useAuth();
  const { toast } = useToast();

  const handleTimeout = () => {
    if (!auth) return;
    
    signOut(auth).then(() => {
      toast({
        title: "Session Expired",
        description: "You have been logged out due to inactivity.",
        variant: "destructive",
      });
    });
  };

  // Set timeout duration. For testing, you can set this to a lower value.
  const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

  useInactivityTimeout(handleTimeout, TIMEOUT_MS, !!user);

  // This component doesn't render anything visible in the UI
  return null;
}
