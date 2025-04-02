import React, { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedGradientProps {
  colors: string[];
  speed?: number;
  blur?: "light" | "medium" | "heavy";
}

const randomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export function AnimatedGradient({
  colors,
  speed = 5,
  blur = "light",
}: AnimatedGradientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gradients, setGradients] = useState<React.ReactNode[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setGradients(colors.map((color, index) => {
      return (
        <svg
          key={index}
          className="absolute animate-background-gradient"
          style={
            {
              top: `${Math.random() * 50}%`,
              left: `${Math.random() * 50}%`,
              "--background-gradient-speed": `${1 / speed}s`,
              "--tx-1": Math.random() - 0.5,
              "--ty-1": Math.random() - 0.5,
              "--tx-2": Math.random() - 0.5,
              "--ty-2": Math.random() - 0.5,
              "--tx-3": Math.random() - 0.5,
              "--ty-3": Math.random() - 0.5,
              "--tx-4": Math.random() - 0.5,
              "--ty-4": Math.random() - 0.5,
            } as React.CSSProperties
          }
          width={500 * randomInt(0.5, 1.5)}
          height={500 * randomInt(0.5, 1.5)}
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="50"
            fill={color}
            className="opacity-30 dark:opacity-[0.15]"
          />
        </svg>
      );
    }));
  }, [colors, speed]);

  const blurClass =
    blur === "light"
      ? "blur-2xl"
      : blur === "medium"
      ? "blur-3xl"
      : "blur-[100px]";

  // Render placeholder during SSR to prevent hydration errors
  if (!isClient) {
    return (
      <div ref={containerRef} className="absolute inset-0 overflow-hidden">
        <div className={cn(`absolute inset-0`, blurClass)}></div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <div className={cn(`absolute inset-0`, blurClass)}>
        {gradients}
      </div>
    </div>
  );
} 