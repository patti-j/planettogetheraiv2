import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function ClearStorage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear cookies
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    console.log("All storage cleared!");
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
        <h1 className="text-2xl font-bold mb-4">Storage Cleared</h1>
        <p className="text-gray-600 mb-6">
          All browser storage has been cleared including:
        </p>
        <ul className="text-left mb-6 space-y-2">
          <li>✓ LocalStorage</li>
          <li>✓ SessionStorage</li>
          <li>✓ Cookies</li>
          <li>✓ Authentication tokens</li>
        </ul>
        <Button 
          onClick={() => setLocation("/")}
          className="w-full"
        >
          Go to Homepage
        </Button>
      </div>
    </div>
  );
}