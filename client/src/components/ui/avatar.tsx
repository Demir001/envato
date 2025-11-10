"use client";

import * as React from 'react';
// --- DÜZELTME BAŞLANGIÇ ---
// Hata: import *AvatarPrimitive from... (hatalı)
import * as AvatarPrimitive from '@radix-ui/react-avatar'; // (doğru)
// --- DÜZELTME SONU ---

import { cn } from '@/lib/utils';

/**
 * Avatar Bileşenleri
 *
 * Bu dosya, Radix UI Avatar Primitive'lerini kullanarak
 * 'UserNav' (Kullanıcı Menüsü) içinde kullanılacak
 * profil resmini (veya baş harfleri) oluşturur.
 */

// --- Ana Avatar Konteyneri ---
const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
      className,
    )}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

// --- Avatar Resmi (Image) ---
const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn('aspect-square h-full w-full object-cover', className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

// --- Avatar Yedeği (Fallback) ---
// 'AvatarImage' yüklenemezse veya 'src' yoksa gösterilir.
const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-muted font-medium',
      className,
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

// Tüm bileşenleri dışa aktar
export { Avatar, AvatarImage, AvatarFallback };