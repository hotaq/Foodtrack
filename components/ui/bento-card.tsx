import React from "react";
import { motion } from "framer-motion";
import { AnimatedGradient } from "./animated-gradient";

interface BentoCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  colors: string[];
  delay?: number;
  icon?: React.ReactNode;
}

export function BentoCard({
  title,
  value,
  subtitle,
  colors,
  delay = 0,
  icon,
}: BentoCardProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: delay + 0.3,
      },
    },
  };

  const item = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.5 } },
  };

  return (
    <motion.div
      className="relative overflow-hidden h-full bg-background dark:bg-background/50 rounded-lg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay }}
    >
      <AnimatedGradient colors={colors} speed={0.05} blur="medium" />
      <motion.div
        className="relative z-10 p-5 md:p-6 text-foreground backdrop-blur-sm h-full"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {icon && <motion.div variants={item} className="mb-4">{icon}</motion.div>}
        <motion.h3 
          className="text-sm sm:text-base font-medium text-foreground/80" 
          variants={item}
        >
          {title}
        </motion.h3>
        <motion.p
          className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-2 text-foreground"
          variants={item}
        >
          {value}
        </motion.p>
        {subtitle && (
          <motion.p 
            className="text-sm text-foreground/70" 
            variants={item}
          >
            {subtitle}
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
} 