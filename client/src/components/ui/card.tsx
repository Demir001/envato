import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Card (Kart) Bileşenleri
 *
 * Bu dosya, Dashboard'daki KPI kartları veya diğer içerik
 * gruplamaları için kullanılacak temel 'Card' bileşenini oluşturur.
 * 'globals.css' içindeki '--card' ve '--card-foreground'
 * CSS değişkenlerini kullanır.
 *
 * Genellikle şu sırayla kullanılır:
 * <Card>
 * <CardHeader>
 * <CardTitle>KPI Başlığı</CardTitle>
 * <CardDescription>KPI Açıklaması</CardDescription>
 * </CardHeader>
 * <CardContent>
 * <p>...Kart içeriği (örn. "$1,250")...</p>
 * </CardContent>
 * <CardFooter>
 * <p>...Alt bilgi (örn. "+%5 vs dün")...</p>
 * </CardFooter>
 * </Card>
 */

// --- Ana Kart Konteyneri ---
// 'border', 'bg-card' ve 'shadow-sm' stillerini uygular.
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-lg border bg-card text-card-foreground shadow-sm',
      className,
    )}
    {...props}
  />
));
Card.displayName = 'Card';

// --- Kart Başlığı (Header) ---
// Başlık (Title) ve Açıklamayı (Description) gruplar.
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

// --- Kart Ana Başlığı (Title) ---
// '<h2>' etiketidir (veya prop'a göre değişir), kalın (semibold) font kullanır.
const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight', // Shadcn/ui 2xl'den lg'ye düşürüldü, KPI'lar için daha iyi
      className,
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

// --- Kart Açıklaması (Description) ---
// Başlığın altında yer alan soluk (muted) renkli açıklama metni.
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

// --- Kart İçeriği (Content) ---
// Kartın ana gövdesi.
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

// --- Kart Alt Bilgisi (Footer) ---
// Kartın en altında yer alan bölüm (örn. düğmeler veya özet bilgi).
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

// Tüm bileşenleri dışa aktar
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};