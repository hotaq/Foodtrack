"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ClearSessionPage() {
  const [cleared, setCleared] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const clearSession = async () => {
      try {
        // Call the API route to clear cookies
        const response = await fetch("/api/auth/clear-session");
        if (response.ok) {
          setCleared(true);
        } else {
          setError("Failed to clear session");
        }
      } catch (err) {
        setError("An error occurred");
        console.error(err);
      }
    };

    clearSession();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="bg-card p-8 rounded-lg vintage-border max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4 vintage-text text-primary text-center">
          Session Cleanup
        </h1>
        
        {cleared ? (
          <div className="text-center">
            <p className="mb-4">Your session has been cleared successfully!</p>
            <p className="mb-6">You can now try logging in again.</p>
            <div className="flex justify-center">
              <Link 
                href="/login" 
                className="vintage-button bg-primary text-white py-2 px-4"
              >
                Go to Login
              </Link>
            </div>
          </div>
        ) : error ? (
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <p className="mb-6">Please try again or clear your browser cookies manually.</p>
            <div className="flex justify-center">
              <Link 
                href="/" 
                className="vintage-button bg-primary text-white py-2 px-4"
              >
                Go to Home
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p>Clearing your session...</p>
          </div>
        )}
      </div>
    </div>
  );
} 