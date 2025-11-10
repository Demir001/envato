"use client";

import * as React from 'react';
// --- DÜZELTME BAŞLANGIÇ ---
// Hata: import *TabsPrimitive from... (hatalı)
import * as TabsPrimitive from '@radix-ui/react-tabs'; // (doğru)
// --- DÜZELTME SONU ---

import { cn } from '@/lib/utils';

/**
 * Tabs (Sekmeler) Bileşenleri
 *
 * Bu dosya, Radix UI Tabs Primitive'lerini kullanarak
 * 'Ayarlar' (Settings) sayfası gibi, içeriği farklı
 * sekmeler (örn. "Klinik Detayları", "Çalışma Saatleri")
 * altında gruplandırmak için kullanılan, erişilebilir (accessible)
 * ve stilize edilmiş sekme bileşenleri oluşturur.
 */

// Ana Konteyner
const Tabs = TabsPrimitive.Root;

// --- Sekme Listesi (TabsList) ---
// Sekme tetikleyicilerini (Trigger) yatay olarak saran çubuk.
const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

// --- Sekme Tetikleyicisi (TabsTrigger) ---
// Sekme başlığı (örn. "Klinik Detayları")
const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium',
      'ring-offset-background transition-all',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      // Aktif (data-state=active) sekme stili
      'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

// --- Sekme İçeriği (TabsContent) ---
// Seçili sekmeye (TabsTrigger) karşılık gelen içerik alanı.
const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-6', // Sekme listesi ile içerik arasına boşluk koy
      'ring-offset-background',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

// Tüm bileşenleri dışa aktar
export { Tabs, TabsList, TabsTrigger, TabsContent };