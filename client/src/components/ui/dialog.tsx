"use client";

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Dialog (Modal) Bileşenleri
 *
 * Bu dosya, Radix UI Dialog Primitive'lerini kullanarak
 * tam erişilebilir (accessible) ve stilize edilmiş bir modal
 * (dialog) bileşeni oluşturur.
 *
 * Genellikle şu sırayla kullanılır:
 * <Dialog>
 * <DialogTrigger asChild>
 * <Button>Modalı Aç</Button>
 * </DialogTrigger>
 * <DialogContent>
 * <DialogHeader>
 * <DialogTitle>Başlık</DialogTitle>
 * <DialogDescription>Açıklama</DialogDescription>
 * </DialogHeader>
 *
 * ... Modal içeriği (örn. bir form) ...
 *
 * <DialogFooter>
 * <Button type="submit">Kaydet</Button>
 * </DialogFooter>
 * </DialogContent>
 * </Dialog>
 */

// Ana Dialog konteyneri
const Dialog = DialogPrimitive.Root;

// Modalı tetikleyen (açan) bileşen (örn. Button)
const DialogTrigger = DialogPrimitive.Trigger;

// Modalı 'portal' aracılığıyla 'body' etiketine render eder
const DialogPortal = DialogPrimitive.Portal;

// Modalı kapatan bileşen
const DialogClose = DialogPrimitive.Close;

// --- Modal Arka Planı (Overlay) ---
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
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
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

// --- Modal İçerik Kutusu (Content Box) ---
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg',
        'translate-x-[-50%] translate-y-[-50%] gap-4',
        'border bg-card p-6 shadow-lg duration-200 sm:rounded-lg',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
        'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
        className,
      )}
      {...props}
    >
      {/* Modal içeriği (children) */}
      {children}

      {/* Varsayılan Kapatma (X) Düğmesi */}
      <DialogPrimitive.Close
        className={cn(
          'absolute right-4 top-4 rounded-sm opacity-70',
          'ring-offset-background transition-opacity',
          'hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground',
        )}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

// --- Modal Başlığı (Header) ---
const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col space-y-1.5 text-center sm:text-left',
      className,
    )}
    {...props}
  />
);
DialogHeader.displayName = 'DialogHeader';

// --- Modal Alt Bilgisi (Footer) ---
// Genellikle 'Kaydet' veya 'İptal' düğmelerini içerir
const DialogFooter = ({
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
DialogFooter.displayName = 'DialogFooter';

// --- Modal Ana Başlığı (Title) ---
// '<h2>' etiketidir ve erişilebilirlik (a11y) için 'DialogTitle' ID'sini alır
const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight',
      className,
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

// --- Modal Açıklaması (Description) ---
// '<p>' etiketidir ve erişilebilirlik (a11y) için 'DialogDescription' ID'sini alır
const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

// Tüm modal bileşenlerini dışa aktar
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};