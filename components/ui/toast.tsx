"use client"

import * as React from "react"

// Since we're missing the actual Radix UI components, let's create simple replacements
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="toast-provider">{children}</div>
}

export const Toast: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ 
  children, 
  className = "", 
  ...props 
}) => {
  return (
    <div 
      className={`fixed bottom-4 right-4 z-50 rounded-md border bg-background p-4 shadow-md ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export const ToastTitle: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ 
  children, 
  className = "", 
  ...props 
}) => {
  return (
    <div className={`font-medium text-foreground ${className}`} {...props}>
      {children}
    </div>
  )
}

export const ToastDescription: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ 
  children, 
  className = "", 
  ...props 
}) => {
  return (
    <div className={`text-sm text-muted-foreground ${className}`} {...props}>
      {children}
    </div>
  )
}

export const ToastClose: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ 
  className = "", 
  ...props 
}) => {
  return (
    <button 
      className={`absolute top-2 right-2 rounded-md p-1 text-foreground/50 hover:text-foreground ${className}`}
      {...props}
    >
      ✕
    </button>
  )
}

export const ToastViewport: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ 
  className = "", 
  ...props 
}) => {
  return (
    <div 
      className={`fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px] ${className}`}
      {...props}
    />
  )
}

// Export types
export type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>
export type ToastActionElement = React.ReactElement 