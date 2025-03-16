"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(true);

  useEffect(() => {
    if (!token) {
      setError("Missing reset token");
      setIsCheckingToken(false);
      return;
    }

    // Verify token validity
    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/verify-reset-token?token=${token}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Invalid or expired token");
          setIsValidToken(false);
        } else {
          setIsValidToken(true);
        }
      } catch (error) {
        setError("Failed to verify token");
        setIsValidToken(false);
      } finally {
        setIsCheckingToken(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login?reset=success");
      }, 3000);
    } catch (error: any) {
      setError(error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold vintage-text text-primary">Meal Tracker</h1>
            <h2 className="mt-6 text-2xl font-bold vintage-text">Verifying reset token...</h2>
          </div>
          <div className="flex justify-center">
            <div className="w-8 h-8 border-t-2 border-primary rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold vintage-text text-primary">Meal Tracker</h1>
            <h2 className="mt-6 text-2xl font-bold vintage-text">Invalid Reset Link</h2>
          </div>
          
          <div className="vintage-border p-6 bg-card rounded-sm">
            <div className="p-4 bg-destructive/10 border border-destructive rounded mb-4">
              <p className="text-destructive">
                {error || "This password reset link is invalid or has expired."}
              </p>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Please request a new password reset link.
            </p>
            <div className="mt-6 space-y-4">
              <Link
                href="/forgot-password"
                className="w-full vintage-button bg-primary text-white block text-center py-2"
              >
                Request new reset link
              </Link>
              <Link
                href="/login"
                className="w-full text-primary hover:text-secondary block text-center"
              >
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold vintage-text text-primary">Meal Tracker</h1>
          <h2 className="mt-6 text-2xl font-bold vintage-text">Set new password</h2>
        </div>

        {success ? (
          <div className="vintage-border p-6 bg-card rounded-sm">
            <div className="p-4 bg-primary/10 border border-primary rounded mb-4">
              <p className="text-primary">
                Your password has been successfully reset!
              </p>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              You will be redirected to the login page in a few seconds...
            </p>
            <div className="mt-6">
              <Link
                href="/login"
                className="w-full vintage-button bg-primary text-white block text-center py-2"
              >
                Go to login
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="vintage-border p-6 bg-card rounded-sm">
              {error && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive text-destructive rounded">
                  {error}
                </div>
              )}

              <p className="text-sm text-muted-foreground mb-4">
                Please enter your new password below.
              </p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium vintage-text">
                    New Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-background border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Must be at least 8 characters
                  </p>
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium vintage-text">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-background border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full vintage-button disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1.5 bg-primary text-white"
                >
                  {isLoading ? "Resetting password..." : "Reset password"}
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link href="/" className="text-primary hover:text-secondary text-sm">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
} 