import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import React from 'react';

/**
 * KpiCard (KPI Kartı) Bileşeni
 *
 * 'DashboardOverviewPage' (Ana Dashboard) üzerinde,
 * "Toplam Hasta", "Bugünkü Satışlar" gibi anahtar performans
 * göstergelerini (KPI) göstermek için kullanılan,
 * stilize edilmiş 'Card' bileşenidir.
 */

interface KpiCardProps {
  /**
   * Kartın başlığı (örn. "Toplam Hasta")
   */
  title: string;
  /**
   * Kartın ana değeri (örn. "1,250" veya "$5,430")
   */
  value: string;
  /**
   * Kartın içinde (genellikle başlığın sağında) görünecek ikon
   */
  icon: React.ReactNode;
  /**
   * (Opsiyonel) Kartın altında görünecek
   * küçük, soluk (muted) açıklama metni
   * (örn. "+%5.2 vs dün", "Önümüzdeki 7 gün")
   */
  description?: string;
  /**
   * (Opsiyonel) Ekstra CSS sınıfları (class)
   */
  className?: string;
}

export const KpiCard = ({
  title,
  value,
  icon,
  description,
  className,
}: KpiCardProps) => {
  return (
    <Card className={cn('flex flex-col justify-between', className)}>
      {/* 1. Kart Başlığı (Header) */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        {/* Başlık Metni (örn. "Toplam Hasta") */}
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {/* İkon (örn. <Users />) */}
        {icon}
      </CardHeader>

      {/* 2. Kart İçeriği (Content) */}
      <CardContent>
        {/* Ana Değer (örn. "1,250") */}
        <div className="text-2xl font-bold">{value}</div>
        {/* Açıklama Metni (örn. "+%5.2 vs dün") */}
        {description && (
          <p className="pt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};