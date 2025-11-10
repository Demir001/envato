"use client";

import * as React from 'react';
// --- DÜZELTME BAŞLANGIÇ ---
// Hata: import *CheckboxPrimitive from... (hatalı)
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'; // (doğru)
// --- DÜZELTME SONU ---
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Checkbox (Onay Kutusu) Bileşeni
 *
 * Bu dosya, Radix UI Checkbox Primitive'lerini kullanarak
 * stilize edilmiş, erişilebilir (accessible) bir onay kutusu
 * (checkbox) oluşturur.
 */
const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    // 'cn' fonksiyonu ile:
    // 1. Temel 'Checkbox' stillerini uygula.
    // 2. Dışarıdan gelen 'className'i ekle.
    className={cn(
      'peer h-4 w-4 shrink-0 rounded-sm border border-primary', // Kutu
      'ring-offset-background',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', // Focus
      'disabled:cursor-not-allowed disabled:opacity-50', // Pasif (Disabled)
      'data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground', // Seçili (Checked)
      className,
    )}
    {...props}
  >
    {/* Seçildi (Checked) İkonu */}
    <CheckboxPrimitive.Indicator
      className={cn('flex items-center justify-center text-current')}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };