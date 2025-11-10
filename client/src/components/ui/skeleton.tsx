import { cn } from '@/lib/utils';

/**
 * Skeleton (İskelet) Bileşeni
 *
 * Veri yüklenirken (loading) kullanıcı arayüzünde (UI)
 * içeriğin geleceği yerin bir 'iskelet' (yer tutucu)
 * gösterimini sağlar.
 *
 * 'full-page-spinner.tsx'den (Adım 84) farklı olarak, 'Spinner'
 * tüm sayfayı kaplarken, 'Skeleton' sayfanın düzenini (layout)
 * koruyarak, (örn.) bir 'Card' veya 'Select' kutusunun
 * *şeklinde* görünür.
 *
 * 'calendar-toolbar.tsx' (Adım 115) içinde 'Select'
 * kutusu yüklenirken kullanılmıştır.
 *
 * @example
 * <Skeleton className="h-10 w-48 rounded-md" /> // Bir 'Select' kutusu için
 * <Skeleton className="h-12 w-12 rounded-full" /> // Bir 'Avatar' için
 * <Skeleton className="h-4 w-[250px]" /> // Bir metin satırı için
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      // 'cn' fonksiyonu ile:
      // 1. Temel 'Skeleton' stillerini (animasyonlu arka plan) uygula.
      // 2. Dışarıdan gelen 'className'i (örn. h-10 w-48) ekle.
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

export { Skeleton };