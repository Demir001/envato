"use client";

import * as React from 'react';
// --- DÜZELTME BAŞLANGIÇ ---
// Hata: import *PopoverPrimitive from... (hatalı)
import * as PopoverPrimitive from '@radix-ui/react-popover'; // (doğru)
// --- DÜZELTME SONU ---

import { cn } from '@/lib/utils';

/**
 * Popover (Açılır Pencere) Bileşenleri
 *
 * Bu dosya, Radix UI Popover Primitive'lerini kullanarak
 * stilize edilmiş, küçük açılır pencereler (popover) oluşturur.
 * 'Dialog'dan (modal) farklı olarak 'Popover'lar:
 * 1. Genellikle bir tetikleyiciye (trigger) bağlı olarak açılır (örn. bir düğme).
 * 2. Arka planı karartmaz (non-modal).
 * 3. Tetikleyicinin yanına (üst, alt, sağ, sol) hizalanır.
 *
 * Genellikle 'Date Picker' (Tarih Seçici) veya 'Color Picker'
 * (Renk Seçici) gibi küçük araçlar için kullanılır.
 */

// Ana Konteyner
const Popover = PopoverPrimitive.Root;

// Popover'ı Tetikleyen (Açan) Bileşen
const PopoverTrigger = PopoverPrimitive.Trigger;

// --- Popover İçeriği (Content) ---
// Açılan pencerenin içeriğini tutan kutu.
const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = 'center', sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align} // Hizalama (center, start, end)
      sideOffset={sideOffset} // Tetikleyiciden uzaklık (px)
      className={cn(
        'z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95', // 'zoom-in-9t5' hatası düzeltildi
        'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
        'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        className,
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

// Tüm bileşenleri dışa aktar
export { Popover, PopoverTrigger, PopoverContent };