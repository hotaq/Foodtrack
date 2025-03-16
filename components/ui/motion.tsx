'use client';

import { motion, MotionProps } from 'framer-motion';
import { ReactNode, ButtonHTMLAttributes } from 'react';

// Animation variants
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.5 }
  }
};

export const slideUp = {
  hidden: { y: 50, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { 
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  }
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const scaleIn = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: { 
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  }
};

interface MotionComponentProps extends MotionProps {
  children: ReactNode;
  className?: string;
}

interface MotionButtonProps extends MotionComponentProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof MotionProps> {
  onClick?: () => void;
}

export const MotionDiv = (props: MotionComponentProps) => {
  const { children, className = "", ...motionProps } = props;
  return (
    <motion.div className={className} {...motionProps}>
      {children}
    </motion.div>
  );
};

export const MotionSection = (props: MotionComponentProps) => {
  const { children, className = "", ...motionProps } = props;
  return (
    <motion.section className={className} {...motionProps}>
      {children}
    </motion.section>
  );
};

export const MotionButton = (props: MotionButtonProps) => {
  const { children, className = "", onClick, ...motionProps } = props;
  return (
    <motion.button 
      className={className} 
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      {...motionProps}
    >
      {children}
    </motion.button>
  );
};

export const MotionImage = (props: MotionComponentProps) => {
  const { children, className = "", ...motionProps } = props;
  return (
    <motion.div 
      className={className}
      whileHover={{ scale: 1.05 }}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}; 