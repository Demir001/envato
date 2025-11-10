"use client";

import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { useGetSettings, useUpdateSettings, IClinicSettings, IOpeningHours } from '@/api/settings-api'; // Adım 80
import { Spinner } from '@/components/ui/full-page-spinner';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Adım 136
import { SettingsClinicForm } from './settings/components/settings-clinic-form'; // Adım 138 (sonraki)
import { SettingsHoursForm } from './settings/components/settings-hours-form'; // Adım 139 (sonraki)
// import { SettingsHolidaysForm } from './settings/components/settings-holidays-form'; // v2

/**
 * SettingsPage (Ayarlar Sayfası)
 *
 * '/settings' rotasında, 'DashboardLayout' içinde 'Outlet'
 * aracılığıyla render edilir.
 *
 * Sorumlulukları:
 * 1. 'useGetSettings' (React Query) kancası ile mevcut
 * klinik ayarlarını API'den çekmek.
 * 2. Veri yüklenirken (isLoading) 'Skeleton' (iskelet) göstermek.
 * 3. 'Tabs' (Sekmeler) bileşenini (Adım 136) kullanarak
 * ayarları gruplandırmak ("Klinik Detayları", "Çalışma Saatleri").
 * 4. Her sekme (TabContent) içine ilgili formu
 * (örn. 'SettingsClinicForm' - Adım 138)
 * 'initialData' prop'u ile render etmek.
 * 5. Alt formlardan gelen 'onSubmit' verisini 'useUpdateSettings'
 * (React Query) kancası ile API'ye göndermek.
 */
const SettingsPage = () => {
  const { t } = useTranslation();

  // 1. React Query 'useQuery' (Fetch Hook)
  // 'settings-api.ts' (Adım 80) içinden 'useGetSettings' kancasını kullan.
  const {
    data: settingsDataResponse,
    isLoading: isLoadingSettings,
    isError,
    error,
  } = useGetSettings();

  // 2. React Query 'useMutation' (Update Hook)
  const { mutate: updateSettings, isPending: isSubmitting } =
    useUpdateSettings();

  // 3. Form Gönderme (Submit) Fonksiyonu
  // Bu fonksiyon, *tüm* alt formlar (ClinicForm, HoursForm)
  // tarafından 'onSubmit' prop'u olarak kullanılacaktır.
  // 'data' -> IUpdateSettingsPayload (Adım 80) tipinde olmalı.
  const handleSettingsUpdate = (
    data: Partial<IClinicSettings>,
  ) => {
    // 'mutate' (updateSettings) fonksiyonunu çağır
    updateSettings(data, {
      onSuccess: (response) => {
        // (API kancası 'toast'u ve 'cache invalidation'ı
        // (Adım 80) zaten hallediyor.)
        toast.success(
          response.message || 'Ayarlar başarıyla güncellendi.',
        );
      },
      onError: (error: any) => {
        // (Hata 'toast'u 'axios-instance' (Adım 72)
        // tarafından zaten hallediliyor.)
        console.error('Update settings error:', error);
      },
    });
  };

  // --- Render Mantığı ---

  // 4. Hata (Error) Durumu
  if (isError) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-destructive">
          {t('generics.error_message')}: {error?.message}
        </p>
      </div>
    );
  }

  // 5. Başarı Durumu (Veri mevcut veya yükleniyor)
  const settingsData = settingsDataResponse?.data;

  return (
    <>
      <Helmet>
        <title>{t('sidebar.settings')} - ClinicAdmin</title>
      </Helmet>

      <div className="flex flex-col gap-8">
        {/* 1. Başlık */}
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {t('settings.title')}
          </h1>
          <p className="text-lg text-muted-foreground">
            Kliniğinizin genel ayarlarını yönetin.
          </p>
        </div>

        {/* 2. Sekmeler (Tabs) */}
        <Tabs defaultValue="clinic" className="w-full">
          {/* 2a. Sekme Başlıkları (List) */}
          <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
            <TabsTrigger value="clinic">
              {t('settings.clinic_details')}
            </TabsTrigger>
            <TabsTrigger value="hours">
              {t('settings.opening_hours')}
            </TabsTrigger>
            {/* <TabsTrigger value="holidays">
              {t('settings.holidays')}
            </TabsTrigger>
            */}
          </TabsList>

          {/* 2b. Sekme İçeriği (Content) - Klinik Detayları */}
          <TabsContent value="clinic">
            {isLoadingSettings ? (
              // Yüklenirken (Loading) Skeleton göster
              <SettingsFormSkeleton />
            ) : (
              // Veri hazırsa 'SettingsClinicForm' (Adım 138)
              // bileşenini render et.
              <SettingsClinicForm
                initialData={settingsData}
                onSubmit={handleSettingsUpdate}
                isSubmitting={isSubmitting}
              />
            )}
          </TabsContent>

          {/* 2c. Sekme İçeriği (Content) - Çalışma Saatleri */}
          <TabsContent value="hours">
             {isLoadingSettings ? (
              // Yüklenirken (Loading) Skeleton göster
              <SettingsFormSkeleton />
            ) : (
              // Veri hazırsa 'SettingsHoursForm' (Adım 139)
              // bileşenini render et.
              <SettingsHoursForm
                initialData={settingsData?.openingHours}
                onSubmit={handleSettingsUpdate}
                isSubmitting={isSubmitting}
              />
            )}
          </TabsContent>
          
          {/* 2d. Sekme İçeriği (Content) - Tatiller (v2) */}
          {/*
          <TabsContent value="holidays">
            <SettingsHolidaysForm />
          </TabsContent>
          */}

        </Tabs>
      </div>
    </>
  );
};

// --- (Internal) Yükleme (Loading) İskeleti ---
const SettingsFormSkeleton = () => (
  <div className="mt-6 rounded-lg border bg-card p-6 shadow-sm">
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-4 w-[150px]" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
         <div className="space-y-2">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-10 w-full" />
        </div>
         <div className="space-y-2">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  </div>
);

export default SettingsPage;