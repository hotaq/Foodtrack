"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const registered = searchParams.get("registered");
  const reset = searchParams.get("reset");
  
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  useEffect(() => {
    if (registered === "true") {
      setSuccess("Account created successfully! Please sign in.");
    }
    
    if (reset === "success") {
      setSuccess("Your password has been reset successfully! Please sign in with your new password.");
    }
  }, [registered, reset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      console.log("Attempting to sign in with:", { emailOrUsername, password: "***" });
      
      const result = await signIn("credentials", {
        emailOrUsername,
        password,
        redirect: false,
      });

      console.log("Sign in result:", result);

      if (result?.error) {
        console.error("Sign in error:", result.error);
        setError(`Authentication failed: ${result.error}`);
        setIsLoading(false);
        return;
      }

      if (!result?.ok) {
        setError("Authentication failed. Please check your credentials.");
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (error) {
      console.error("Sign in exception:", error);
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    setSocialLoading(provider);
    try {
      await signIn(provider, { callbackUrl });
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error);
      setSocialLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold vintage-text text-primary">Meal Tracker</h1>
          <h2 className="mt-6 text-2xl font-bold vintage-text">Sign in to your account</h2>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="vintage-border p-6 bg-card rounded-sm">
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive text-destructive rounded">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 bg-primary/10 border border-primary text-primary rounded">
                {success}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="emailOrUsername" className="block text-sm font-medium vintage-text">
                  Email or Username
                </label>
                <input
                  id="emailOrUsername"
                  name="emailOrUsername"
                  type="text"
                  autoComplete="username"
                  required
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-background border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium vintage-text">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-background border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm">
                <Link href="/forgot-password" className="text-primary hover:text-secondary">
                  Forgot your password?
                </Link>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full vintage-button disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1.5 bg-primary text-white"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </div>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card text-gray-400">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  disabled={!!socialLoading}
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-600 rounded-sm bg-background hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  {socialLoading === 'google' ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                    </svg>
                  )}
                  <span className="ml-2">Google</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSocialLogin('facebook')}
                  disabled={!!socialLoading}
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-600 rounded-sm bg-background hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  {socialLoading === 'facebook' ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span className="ml-2">Facebook</span>
                </button>
              </div>
            </div>
          </div>
        </form>
        
        <div className="text-center mt-4">
          <p className="text-sm text-gray-300">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary hover:text-secondary">
              Sign up
            </Link>
          </p>
        </div>
        
        <div className="mt-6 text-center">
          <Link href="/" className="text-primary hover:text-secondary text-sm">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
} 