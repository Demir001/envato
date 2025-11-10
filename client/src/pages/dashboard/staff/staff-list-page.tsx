"use client";

import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { z } from 'zod';

import { useGetStaffList, IStaffUser } from '@/api/staff-api'; // Adım 78
import { StaffDataTable } from './components/staff-data-table'; // Adım 132 (sonraki)
import { staffTableColumns } from './components/staff-table-columns'; // Adım 133 (sonraki)
import { Spinner } from '@/components/ui/full-page-spinner';

/**
 * Zod Şeması (URL Arama Parametreleri)
 *
 * 'staff-list-page' için URL query parametrelerini
 * (örn. /staff?page=1&role=doctor&search=ahmet)
 * doğrulamak ve tip-güvenli (type-safe) hale getirmek için kullanılır.
 */
const staffSearchSchema = z.object({
  page: z.coerce.number().default(1).catch(1),
  limit: z.coerce.number().default(10).catch(10),
  search: z.string().optional().default(''),
  role: z
    .enum(['admin', 'doctor', 'reception'])
    .optional()
    .default(undefined),
  status: z
    .enum(['active', 'inactive'])
    .optional()
    .default(undefined),
});

type StaffListQuery = z.infer<typeof staffSearchSchema>;

/**
 * StaffListPage (Personel Listesi Sayfası)
 *
 * '/staff' rotasında, 'DashboardLayout' içinde 'Outlet'
 * aracılığıyla render edilir.
 * Bu rota 'RoleGuard' (Adım 104) ile korunur (Sadece Admin).
 *
 * Sorumlulukları:
 * 1. URL'deki arama parametrelerini (page, search, role, status) okumak
 * ('useSearchParams').
 * 2. Bu parametreleri 'useGetStaffList' (React Query) kancasına
 * vererek personel listesini API'den çekmek.
 * 3. Veri yüklenirken (isLoading) veya hata (isError) durumunda
 * ilgili bileşenleri göstermek.
 * 4. Çekilen 'data' (personel) ve 'pagination' (sayfalama)
 * bilgilerini 'StaffDataTable' (Adım 132) bileşenine
 * 'prop' olarak geçmek.
 */
const StaffListPage = () => {
  const { t } = useTranslation();

  // 1. URL Arama Parametrelerini (Query Params) Oku
  const [searchParams] = useSearchParams();

  // Zod ile parametreleri doğrula ve varsayılan değerleri ata
  const queryParams: StaffListQuery = staffSearchSchema.parse({
    page: searchParams.get('page'),
    limit: searchParams.get('limit'),
    search: searchParams.get('search'),
    role: searchParams.get('role'),
    status: searchParams.get('status'),
  });

  // 2. API'den Veri Çek (React Query)
  const {
    data: staffDataResponse,
    isLoading,
    isError,
    error,
  } = useGetStaffList(queryParams);

  // 3. Yükleme (Loading) Durumu
  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] w-full items-center justify-center">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

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

  // 5. Başarı Durumu (Veri mevcut)
  const staff = staffDataResponse?.data.users || [];
  const pagination = staffDataResponse?.data.pagination;
  const pageCount = pagination?.totalPages || 1;

  return (
    <>
      <Helmet>
        <title>{t('staff.list_title')} - ClinicAdmin</title>
      </Helmet>

      <div className="flex flex-col gap-8">
        {/* 1. Başlık */}
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {t('staff.list_title')}
          </h1>
          <p className="text-lg text-muted-foreground">
            Klinik personelinizi (Doktor, Resepsiyon) yönetin.
          </p>
        </div>

        {/* 2. TanStack Veri Tablosu (Data Table) */}
        {/*
          'StaffDataTable' (Adım 132) bileşeni,
          TanStack Table'ın tüm karmaşıklığını (state,
          filtreleme, sayfalama) soyutlar (abstract).
        */}
        <StaffDataTable
          // 'columns' (Adım 133)
          columns={staffTableColumns}
          // API'den gelen 'staff' dizisi
          data={staff}
          // API'den gelen 'totalPages'
          pageCount={pageCount}
        />
      </div>
    </>
  );
};

export default StaffListPage;