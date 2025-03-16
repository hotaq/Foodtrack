'use client';

import Link from "next/link";
import { 
  MotionDiv, 
  MotionSection, 
  MotionButton, 
  fadeIn, 
  slideUp, 
  staggerContainer, 
  scaleIn 
} from "@/components/ui/motion";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-4xl font-bold text-primary mb-6">Meal Tracker</h1>
        <p className="text-xl mb-8">
          Track your meals and maintain healthy eating habits
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/login"
            className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90 transition"
          >
            Sign In
          </a>
          <a
            href="/register"
            className="px-6 py-3 bg-secondary text-white rounded-md hover:bg-secondary/90 transition"
          >
            Register
          </a>
        </div>
      </div>
    </div>
  );
}
