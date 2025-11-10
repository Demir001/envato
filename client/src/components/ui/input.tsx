import * as React from 'react';

import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

/**
 * Input Bileşeni
 *
 * Standart HTML '<input>' elemanını, projenin Tailwind CSS
 * değişkenleri (colors, border, ring) ile stillendirilmiş halidir.
 * 'globals.css' içindeki '--input', '--ring' gibi
 * CSS değişkenlerini kullanır.
 *
 * 'react-hook-form' ile 'FormField' içinde kullanılmak üzere tasarlanmıştır.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        // 'cn' fonksiyonu ile:
        // 1. Temel 'Input' stillerini uygula.
        // 2. Dışarıdan gelen 'className'i ekle.
        // 3. Tailwind çakışmalarını (conflict) çöz (twMerge).
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
          'ring-offset-background',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };