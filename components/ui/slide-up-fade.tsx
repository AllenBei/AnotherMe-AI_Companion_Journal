import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface SlideUpFadeProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
}

export function SlideUpFade({ 
  children, 
  delay = 0, 
  duration = 0.6, 
  distance = 30 
}: SlideUpFadeProps) {
  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        y: distance 
      }}
      animate={{ 
        opacity: 1, 
        y: 0 
      }}
      transition={{
        duration,
        delay,
        ease: "easeOut"
      }}
    >
      {children}
    </motion.div>
  );
} 