import React from 'react';
import { useLocation } from 'wouter';

// This page is deprecated - using production schedule as main landing
// Redirecting to production schedule
export default function DesktopHome() {
  const [, setLocation] = useLocation();
  
  // Immediately redirect to production schedule
  React.useEffect(() => {
    setLocation('/production-schedule');
  }, [setLocation]);
  
  return null;
}