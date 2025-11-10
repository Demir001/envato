import * as React from 'react';

import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

/**
 * Textarea Bileşeni
 *
 * Standart HTML '<textarea>' elemanını, projenin Tailwind CSS
 * değişkenleri (colors, border, ring) ile stillendirilmiş halidir.
 * 'Input' (Adım 87) bileşenine benzer, ancak çok satırlı (multi-line)
 * metin girişi sağlar.
 *
 * 'PatientForm' (Adım 120) içinde 'Adres' ve 'Notlar'
 * alanları için kullanılmıştır.
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        // 'cn' fonksiyonu ile:
        // 1. Temel 'Textarea' stillerini uygula.
        // 2. Dışarıdan gelen 'className'i ekle.
        // 3. Tailwind çakışmalarını (conflict) çöz (twMerge).
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
          'ring-offset-background',
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
Textarea.displayName = 'Textarea';

export { Textarea };