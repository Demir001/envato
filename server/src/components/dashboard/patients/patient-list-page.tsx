"use client";

import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { z } from 'zod';

import { useGetPatients, IPatient } from '@/api/patient-api'; // Adım 74
import { PatientDataTable } from './components/patient-data-table'; // Adım 118
import { patientTableColumns } from './components/patient-table-columns'; // Adım 119
import { Spinner } from '@/components/ui/full-page-spinner';

/**
 * Zod Şeması (URL Arama Parametreleri)
 *
 * 'patient-list-page' için URL query parametrelerini
 * (örn. /patients?page=2&limit=10&search=ahmet)
 * doğrulamak ve tip-güvenli (type-safe) hale getirmek için kullanılır.
 */
const patientSearchSchema = z.object({
  page: z.coerce.number().default(1).catch(1), // 'coerce' string'i number'a çevirir
  limit: z.coerce.number().default(10).catch(10),
  search: z.string().optional().default(''),
  // TODO: sortBy, sortOrder eklenebilir
});

/**
 * PatientListPage (Hasta Listesi Sayfası)
 *
 * '/patients' rotasında, 'DashboardLayout' içinde 'Outlet'
 * aracılığıyla render edilir.
 *
 * Sorumlulukları:
 * 1. URL'deki arama parametrelerini (page, limit, search) okumak
 * ('useSearchParams').
 * 2. Bu parametreleri 'useGetPatients' (React Query) kancasına
 * vererek hasta listesini API'den çekmek.
 * 3. Veri yüklenirken (isLoading) veya hata (isError) durumunda
 * ilgili bileşenleri göstermek.
 * 4. Çekilen 'data' (hastalar) ve 'pagination' (sayfalama)
 * bilgilerini 'PatientDataTable' (Adım 118) bileşenine
 * 'prop' olarak geçmek.
 */
const PatientListPage = () => {
  const { t } = useTranslation();

  // 1. URL Arama Parametrelerini (Query Params) Oku
  const [searchParams] = useSearchParams();
  const search = searchParams.get('search');
  const page = searchParams.get('page');
  const limit = searchParams.get('limit');

  // Zod ile parametreleri doğrula ve varsayılan değerleri ata
  const queryParams = patientSearchSchema.parse({
    page,
    limit,
    search,
  });

  // 2. API'den Veri Çek (React Query)
  const {
    data: patientDataResponse,
    isLoading,
    isError,
    error,
  } = useGetPatients(queryParams);

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
  const patients = patientDataResponse?.data.patients || [];
  const pagination = patientDataResponse?.data.pagination;
  const pageCount = pagination?.totalPages || 1;

  return (
    <>
      <Helmet>
        <title>{t('patients.list_title')} - ClinicAdmin</title>
      </Helmet>

      <div className="flex flex-col gap-8">
        {/* 1. Başlık */}
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {t('patients.list_title')}
          </h1>
          <p className="text-lg text-muted-foreground">
            Kliniğinizdeki tüm hastaları yönetin.
          </p>
        </div>

        {/* 2. TanStack Veri Tablosu (Data Table) */}
        {/*
          'PatientDataTable' (Adım 118) bileşeni,
          TanStack Table'ın tüm karmaşıklığını (state,
          filtreleme, sayfalama) soyutlar (abstract).
        */}
        <PatientDataTable
          // 'columns' (Adım 119)
          columns={patientTableColumns}
          // API'den gelen 'patients' dizisi
          data={patients}
          // API'den gelen 'totalPages'
          pageCount={pageCount}
        />
      </div>
    </>
  );
};

export default PatientListPage;