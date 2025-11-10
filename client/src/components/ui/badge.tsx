import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

// --- DÜZELTME BAŞLANGIÇ ---
// 'badgeVariants' (Adım 93) doğru tanımlanmış,
// ancak 'Badge' bileşeninin kendisi (BadgeProps)
// 'variant' prop'unu düzgün almıyordu.
const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        success:
          'border-transparent bg-green-500/20 text-green-700 dark:text-green-400',
        warning:
          'border-transparent bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
        danger:
           'border-transparent bg-destructive/20 text-destructive',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

// 'BadgeProps' arayüzü 'VariantProps<typeof badgeVariants>'
// (yani 'variant' prop'u) içermeli.
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

// 'Badge' fonksiyonu 'variant' prop'unu almalı.
function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
// --- DÜZELTME SONU ---

export { Badge, badgeVariants };