"use client";

import { useEffect, useRef } from 'react';

// List of events that reset the inactivity timer
const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'
];

/**
 * A custom hook to detect user inactivity and trigger a callback.
 * @param onTimeout The function to call when the user is inactive.
 *-
 * @param timeout The inactivity duration in milliseconds.
 * @param enabled A boolean to enable or disable the hook.
 */
export function useInactivityTimeout(onTimeout: () => void, timeout: number, enabled: boolean) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(onTimeout, timeout);
  };

  useEffect(() => {
    if (!enabled) {
      // If the hook is disabled (e.g., user is logged out), clear any existing timers.
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return;
    }

    // Set the initial timer
    resetTimer();

    // Add event listeners to reset the timer on user activity
    ACTIVITY_EVENTS.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Cleanup function to remove event listeners and clear the timer
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      ACTIVITY_EVENTS.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [onTimeout, timeout, enabled]); // Rerun effect if these change
}
