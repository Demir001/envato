"use client";

import * as React from 'react';
// --- DÜZELTME BAŞLANGIÇ ---
// Hata: import *SheetPrimitive from... (hatalı)
import * as SheetPrimitive from '@radix-ui/react-dialog'; // (doğru)
// --- DÜZELTME SONU ---
// 'cva' (class-variance-authority) import et
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Sheet (Çekmece) Bileşenleri
 *
 * Bu dosya, Radix UI Dialog Primitive'lerini kullanarak
 * ekranın kenarından (sağ, sol, üst, alt) kayarak açılan
 * bir panel (Sheet/Drawer) oluşturur.
 *
 * 'MobileSidebar' (Mobil Menü) için sol taraftan açılan
 * ('side="left"') varyantı kullanılacaktır.
 */

// Ana Konteyner
const Sheet = SheetPrimitive.Root;

// Sheet'i Tetikleyen (Açan) Bileşen
const SheetTrigger = SheetPrimitive.Trigger;

// Sheet'i Kapatan Bileşen
const SheetClose = SheetPrimitive.Close;

// Sheet'i 'portal' ile 'body' etiketine render eder
const SheetPortal = SheetPrimitive.Portal;

// --- Sheet Arka Planı (Overlay) ---
const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className,
    )}
    {...props}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

// --- Sheet İçerik Stilleri (Varyantlar) ---
// 'cva' kullanarak 'side' (yön) prop'una göre
// farklı stiller (ve animasyonlar) tanımlar.
const sheetVariants = cva(
  // Temel Stiller
  'fixed z-50 gap-4 bg-card p-6 shadow-lg transition ease-in-out',
  'data-[state=open]:animate-in data-[state=closed]:animate-out',
  'data-[state=closed]:duration-300 data-[state=open]:duration-500',
  {
    variants: {
      side: {
        // Üstten açılır
        top: 'inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
        // Alttan açılır
        bottom:
          'inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        // Soldan açılır (Mobil Menü için bu kullanılacak)
        left: 'inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm',
        // Sağdan açılır
        right:
          'inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm',
      },
    },
    defaultVariants: {
      side: 'right',
    },
  },
);

// Varyantların 'props' arayüzü
interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

// --- Sheet İçerik Kutusu (Content Box) ---
const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = 'right', className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      // 'sheetVariants' (cva) ve 'cn' (Tailwind merge)
      // kullanarak stilleri uygula
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      {/* Sheet içeriği (children) */}
      {children}

      {/* Varsayılan Kapatma (X) Düğmesi */}
      <SheetPrimitive.Close
        className={cn(
          'absolute right-4 top-4 rounded-sm opacity-70',
          'ring-offset-background transition-opacity',
          'hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:pointer-events-none data-[state=open]:bg-secondary',
        )}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = SheetPrimitive.Content.displayName;

// --- Sheet Başlığı (Header) ---
const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col space-y-2 text-center sm:text-left',
      className,
    )}
    {...props}
  />
);
SheetHeader.displayName = 'SheetHeader';

// --- Sheet Alt Bilgisi (Footer) ---
const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      className,
    )}
    {...props}
  />
);
SheetFooter.displayName = 'SheetFooter';

// --- Sheet Ana Başlığı (Title) ---
const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold text-foreground', className)}
    {...props}
  />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

// --- Sheet Açıklaması (Description) ---
const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

// Tüm bileşenleri dışa aktar
export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};