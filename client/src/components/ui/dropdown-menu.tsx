"use client";

import * as React from 'react';
// --- DÜZELTME BAŞLANGIÇ ---
// Hata: import *GrupDropdownPrimitive from... (hatalı)
import * as GrupDropdownPrimitive from '@radix-ui/react-dropdown-menu'; // (doğru)
// --- DÜZELTME SONU ---
import { Check, ChevronRight, Circle } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Dropdown Menu (Açılır Menü) Bileşenleri
 *
 * Bu dosya, Radix UI Dropdown Menu Primitive'lerini kullanarak
 * stilize edilmiş bir açılır menü (örn. Kullanıcı Profili menüsü,
 * Tablo 'Eylemler' menüsü) oluşturur.
 */

// Ana Konteyner
const DropdownMenu = GrupDropdownPrimitive.Root;

// Menüyü Tetikleyen (Açan) Bileşen
const DropdownMenuTrigger = GrupDropdownPrimitive.Trigger;

// Menü Grubu (Etiketli)
const DropdownMenuGroup = GrupDropdownPrimitive.Group;

// Menüyü 'portal' ile 'body' etiketine render eder
const DropdownMenuPortal = GrupDropdownPrimitive.Portal;

// Alt Menü (İç içe açılır menü)
const DropdownMenuSub = GrupDropdownPrimitive.Sub;

// Radyo Buton Grubu (Sadece biri seçilebilir)
const DropdownMenuRadioGroup = GrupDropdownPrimitive.RadioGroup;

// --- Alt Menü Tetikleyicisi (SubTrigger) ---
// (örn. "Durumu Değiştir >")
const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof GrupDropdownPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof GrupDropdownPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <GrupDropdownPrimitive.SubTrigger
    ref={ref}
    className={cn(
      'flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
      'focus:bg-accent data-[state=open]:bg-accent',
      inset && 'pl-8', // Icon varsa içeriden başlat
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </GrupDropdownPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName =
  GrupDropdownPrimitive.SubTrigger.displayName;

// --- Alt Menü İçeriği (SubContent) ---
const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof GrupDropdownPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof GrupDropdownPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <GrupDropdownPrimitive.SubContent
    ref={ref}
    className={cn(
      'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
      'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
      'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
      className,
    )}
    {...props}
  />
));
DropdownMenuSubContent.displayName =
  GrupDropdownPrimitive.SubContent.displayName;

// --- Ana Menü İçeriği (Content) ---
const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof GrupDropdownPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof GrupDropdownPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <GrupDropdownPrimitive.Portal>
    <GrupDropdownPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
        'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        className,
      )}
      {...props}
    />
  </GrupDropdownPrimitive.Portal>
));
DropdownMenuContent.displayName = GrupDropdownPrimitive.Content.displayName;

// --- Menü Öğesi (Item) ---
// (örn. "Düzenle", "Sil")
const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof GrupDropdownPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof GrupDropdownPrimitive.Item> & {
    inset?: boolean;
    /** Hata/Yıkıcı (örn. Sil) stili uygular */
    destructive?: boolean;
  }
>(({ className, inset, destructive, ...props }, ref) => (
  <GrupDropdownPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
      'focus:bg-accent focus:text-accent-foreground',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      inset && 'pl-8', // Checkbox/Radio iconu için boşluk
      // 'destructive' prop'u (örn. Sil butonu)
      destructive &&
        'text-destructive focus:bg-destructive/10 focus:text-destructive',
      className,
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = GrupDropdownPrimitive.Item.displayName;

// --- Onay Kutulu Menü Öğesi (CheckboxItem) ---
const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof GrupDropdownPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof GrupDropdownPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <GrupDropdownPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors',
      'focus:bg-accent focus:text-accent-foreground',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <GrupDropdownPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </GrupDropdownPrimitive.ItemIndicator>
    </span>
    {children}
  </GrupDropdownPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName =
  GrupDropdownPrimitive.CheckboxItem.displayName;

// --- Radyo Butonlu Menü Öğesi (RadioItem) ---
const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof GrupDropdownPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof GrupDropdownPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <GrupDropdownPrimitive.RadioItem
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors',
      'focus:bg-accent focus:text-accent-foreground',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <GrupDropdownPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </GrupDropdownPrimitive.ItemIndicator>
    </span>
    {children}
  </GrupDropdownPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = GrupDropdownPrimitive.RadioItem.displayName;

// --- Etiket (Label) ---
// Tıklanamayan, grup başlığı
const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof GrupDropdownPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof GrupDropdownPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <GrupDropdownPrimitive.Label
    ref={ref}
    className={cn(
      'px-2 py-1.5 text-sm font-semibold text-muted-foreground',
      inset && 'pl-8',
      className,
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = GrupDropdownPrimitive.Label.displayName;

// --- Ayıraç (Separator) ---
// Yatay çizgi
const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof GrupDropdownPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof GrupDropdownPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <GrupDropdownPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-border', className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = GrupDropdownPrimitive.Separator.displayName;

// --- Kısayol (Shortcut) ---
// Öğenin sağ tarafında görünen (örn. "⌘S")
const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn('ml-auto text-xs tracking-widest text-muted-foreground', className)}
      {...props}
    />
  );
};
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';

// Tüm bileşenleri dışa aktar
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};