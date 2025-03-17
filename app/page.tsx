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
import { useState } from "react";
import { AnimatePresence } from "framer-motion";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-primary py-6">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <MotionDiv
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl font-bold vintage-text text-primary">Meal Check</h1>
            </MotionDiv>
            
            {/* Mobile menu button */}
            <button 
              className="md:hidden text-white p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              )}
            </button>
            
            {/* Desktop navigation */}
            <MotionDiv
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="hidden md:flex space-x-4"
            >
              <Link href="/login">
                <MotionButton className="vintage-button px-2 py-1.5">
                  Login
                </MotionButton>
              </Link>
              <Link href="/register">
                <MotionButton className="vintage-button bg-secondary px-2 py-1 text-gray-900">
                  Register
                </MotionButton>
              </Link>
            </MotionDiv>
          </div>
          
          {/* Mobile menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <MotionDiv
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="md:hidden mt-4 flex flex-col space-y-3 pb-3"
              >
                <Link href="/login" className="w-full">
                  <MotionButton className="vintage-button px-2 py-1.5 w-full">
                    Login
                  </MotionButton>
                </Link>
                <Link href="/register" className="w-full">
                  <MotionButton className="vintage-button bg-secondary px-2 py-1 text-gray-900 w-full">
                    Register
                  </MotionButton>
                </Link>
              </MotionDiv>
            )}
          </AnimatePresence>
        </div>
      </header>
      
      <main className="flex-1">
        <MotionSection 
          className="py-20"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <MotionDiv variants={slideUp}>
                <h2 className="text-4xl md:text-5xl font-bold mb-6 vintage-text">
                  Track Your <span className="text-primary">Daily Meals</span>
                </h2>
                <p className="text-lg mb-8 text-gray-300">
                  Submit photos of your meals at specific times to ensure you're eating all three meals each day. Build your streak and stay consistent with your eating habits.
                </p>
                <Link href="/register">
                  <MotionButton className="vintage-button inline-block px-2 py-1.5 bg-primary text-white">
                    Get Started
                  </MotionButton>
                </Link>
              </MotionDiv>
              <MotionDiv 
                variants={scaleIn}
                className="relative h-[400px] vintage-border p-2"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20"></div>
                <div className="relative h-full w-full overflow-hidden flex items-center justify-center bg-card">
                  <div className="text-center p-8">
                    <div className="text-4xl font-bold text-primary mb-4">Meal Check</div>
                    <p className="text-gray-300">Track your breakfast, lunch, and dinner</p>
                  </div>
                </div>
              </MotionDiv>
            </div>
          </div>
        </MotionSection>
        
        <MotionSection 
          className="py-16 bg-muted"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <div className="container mx-auto px-4">
            <MotionDiv variants={fadeIn}>
              <h2 className="text-3xl font-bold mb-12 text-center vintage-text">
                How It <span className="text-primary">Works</span>
              </h2>
            </MotionDiv>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <MotionDiv variants={scaleIn} className="bg-card p-6 rounded-lg">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mb-4">1</div>
                <h3 className="text-xl font-bold mb-2 vintage-text px-2 py-1.6">Register</h3>
                <p className="text-gray-300">Create your account and set up your profile to get started.</p>
              </MotionDiv>
              <MotionDiv variants={scaleIn} className="bg-card p-6 rounded-lg">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mb-4">2</div>
                <h3 className="text-xl font-bold mb-2 vintage-text">Submit Photos</h3>
                <p className="text-gray-300">Take photos of your breakfast, lunch, and dinner each day.</p>
              </MotionDiv>
              <MotionDiv variants={scaleIn} className="bg-card p-6 rounded-lg">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mb-4">3</div>
                <h3 className="text-xl font-bold mb-2 vintage-text">Build Streaks</h3>
                <p className="text-gray-300">Maintain your streak by consistently submitting all three meals daily.</p>
              </MotionDiv>
            </div>
          </div>
        </MotionSection>
        
        <MotionSection 
          className="py-20"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <div className="container mx-auto px-4 text-center">
            <MotionDiv variants={slideUp}>
              <h2 className="text-3xl font-bold mb-6 vintage-text">
                Ready to <span className="text-primary">Start?</span>
              </h2>
              <p className="text-lg mb-8 text-gray-300 max-w-2xl mx-auto">
                Join our community of users who are committed to maintaining healthy eating habits through consistent meal tracking.
              </p>
              <Link href="/register">
                <MotionButton className="vintage-button inline-block px-2 py-1.5 bg-primary text-white">
                  Create Account
                </MotionButton>
              </Link>
            </MotionDiv>
          </div>
        </MotionSection>
      </main>
      
      <footer className="border-t border-primary py-8">
        <div className="container mx-auto px-4">
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col md:flex-row justify-between items-center"
          >
            <p className="text-gray-300 mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} Meal Tracker. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link href="/terms" className="text-gray-300 hover:text-primary">
                Terms
              </Link>
              <Link href="/privacy" className="text-gray-300 hover:text-primary">
                Privacy
              </Link>
              <Link href="/contact" className="text-gray-300 hover:text-primary">
                Contact
              </Link>
            </div>
          </MotionDiv>
        </div>
      </footer>
    </div>
  );
}
