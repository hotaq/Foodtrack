"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      setSuccess(true);
    } catch (error: any) {
      setError(error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold vintage-text text-primary">Meal Tracker</h1>
          <h2 className="mt-6 text-2xl font-bold vintage-text">Reset your password</h2>
        </div>

        {success ? (
          <div className="vintage-border p-6 bg-card rounded-sm">
            <div className="p-4 bg-primary/10 border border-primary rounded mb-4">
              <p className="text-primary">
                If an account exists with that email, we've sent password reset instructions.
              </p>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Please check your email inbox and spam folder. The reset link will expire in 1 hour.
            </p>
            <div className="mt-6">
              <Link
                href="/login"
                className="w-full vintage-button bg-primary text-white block text-center py-2"
              >
                Back to login
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
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium vintage-text">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                  {isLoading ? "Sending..." : "Send reset link"}
                </button>
              </div>

              <div className="mt-4 text-center">
                <Link href="/login" className="text-primary hover:text-secondary text-sm">
                  Back to login
                </Link>
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