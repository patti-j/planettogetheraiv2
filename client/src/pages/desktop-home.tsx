import React from 'react';
import { useLocation } from 'wouter';

// This page is deprecated - redirecting to dashboard/homepage
// Users should land on the main dashboard after login
export default function DesktopHome() {
  const [, setLocation] = useLocation();
  
  // Immediately redirect to dashboard/homepage
  React.useEffect(() => {
    setLocation('/dashboard');
  }, [setLocation]);
  
  return null;
}