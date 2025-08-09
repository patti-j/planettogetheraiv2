import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function TrainingDirectLink() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // Redirect to training page
    setLocation('/training');
  }, [setLocation]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting to Training...</h1>
        <p className="text-gray-600">If you're not redirected, <a href="/training" className="text-blue-500 underline">click here</a></p>
      </div>
    </div>
  );
}