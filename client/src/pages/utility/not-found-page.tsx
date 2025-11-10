"use client";

import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { TriangleAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';

/**
 * NotFoundPage (404 - Bulunamadı Sayfası)
 *
 * 'App.tsx' (Adım 66) içinde, 'Routes' (Rotalar) bölümünün
 * en altında yer alan '*' (wildcard) rotası aracılığıyla render edilir.
 * Eşleşen hiçbir URL (örn. /abc/xyz) bulunamadığında bu sayfa gösterilir.
 *
 * Sorumlulukları:
 * 1. Kullanıcıya bir 404 hata mesajı göstermek.
 * 2. Kullanıcının 'Ana Sayfa'ya ('/dashboard') dönmesi için
 * bir link (düğme) sağlamak.
 */
const NotFoundPage = () => {
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>404 - Sayfa Bulunamadı - ClinicAdmin</title>
      </Helmet>
      
      {/* Tüm ekranı kaplayan (min-h-screen) ve
        içeriği ortalayan (items-center justify-center)
        bir konteyner.
      */}
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
        <div className="flex max-w-md flex-col items-center text-center">
          {/* Hata İkonu */}
          <TriangleAlert className="h-24 w-24 text-destructive" />

          {/* Hata Kodu */}
          <h1 className="mt-8 text-6xl font-bold text-foreground">
            404
          </h1>
          
          {/* Başlık */}
          <h2 className="mt-4 text-2xl font-semibold tracking-tight">
            Sayfa Bulunamadı
          </h2>
          
          {/* Açıklama */}
          <p className="mt-2 text-lg text-muted-foreground">
            Aradığınız sayfa mevcut değil, taşınmış veya silinmiş olabilir.
          </p>

          {/* Eylem Düğmesi (Ana Sayfaya Dön) */}
          <Button asChild className="mt-8">
            <Link to="/dashboard">
              {t('sidebar.dashboard')}
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
};

export default NotFoundPage;