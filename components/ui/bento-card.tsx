import * as React from "react"
import { cn } from "@/lib/utils"

interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  animation?: "zoom" | "slide" | "none"
  children: React.ReactNode
}

export function BentoCard({
  className,
  animation = "none",
  children,
  ...props
}: BentoCardProps) {
  const animationClasses = {
    zoom: "transition-transform duration-300 hover:scale-[1.02]",
    slide: "transition-transform duration-300 hover:translate-y-[-5px]",
    none: ""
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow duration-300", 
        animationClasses[animation],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  children: React.ReactNode
}

export function BentoGrid({
  className,
  children,
  ...props
}: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
} 