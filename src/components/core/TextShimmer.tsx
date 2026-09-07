import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export interface TextShimmerProps {
  children: string;
  as?: React.ElementType;
  className?: string;
  duration?: number;
  spread?: number;
}

export function TextShimmer({
  children,
  as: Component = 'p',
  className,
  duration = 2,
  spread = 2,
}: TextShimmerProps) {
  const MotionComponent = motion.create(Component as any);

  const dynamicSpread = useMemo(() => {
    return children.length * spread;
  }, [children, spread]);

  return (
    <MotionComponent
      className={cn(
        'inline-block bg-clip-text text-transparent',
        'bg-[linear-gradient(110deg,var(--base-color),45%,var(--base-gradient-color),55%,var(--base-color))]',
        'bg-[length:250%_100%]',
        className
      )}
      initial={{ backgroundPosition: '100% 0' }}
      animate={{ backgroundPosition: '-100% 0' }}
      transition={{
        repeat: Infinity,
        duration,
        ease: 'linear',
      }}
      style={{
        '--base-color': 'var(--base-color, #a1a1aa)', // Default colors if not provided via className
        '--base-gradient-color': 'var(--base-gradient-color, #ffffff)',
      } as React.CSSProperties}
    >
      {children}
    </MotionComponent>
  );
}
