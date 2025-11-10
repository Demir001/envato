"use client";

import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { z } from 'zod';

import { useGetInvoices, IInvoiceListItem } from '@/api/billing-api'; // Adım 76
import { BillingDataTable } from './components/billing-data-table'; // Adım 124 (sonraki)
import { billingTableColumns } from './components/billing-table-columns'; // Adım 125 (sonraki)
import { Spinner } from '@/components/ui/full-page-spinner';

/**
 * Zod Şeması (URL Arama Parametreleri)
 *
 * 'billing-list-page' için URL query parametrelerini
 * (örn. /billing?page=1&status=pending&search=inv-001)
 * doğrulamak ve tip-güvenli (type-safe) hale getirmek için kullanılır.
 */
const billingSearchSchema = z.object({
  page: z.coerce.number().default(1).catch(1),
  limit: z.coerce.number().default(10).catch(10),
  search: z.string().optional().default(''),
  status: z
    .enum(['pending', 'paid', 'overdue'])
    .optional()
    .default(undefined),
});

type BillingListQuery = z.infer<typeof billingSearchSchema>;

/**
 * BillingListPage (Fatura Listesi Sayfası)
 *
 * '/billing' rotasında, 'DashboardLayout' içinde 'Outlet'
 * aracılığıyla render edilir.
 *
 * Sorumlulukları:
 * 1. URL'deki arama parametrelerini (page, search, status) okumak
 * ('useSearchParams').
 * 2. Bu parametreleri 'useGetInvoices' (React Query) kancasına
 * vererek fatura listesini API'den çekmek.
 * 3. Veri yüklenirken (isLoading) veya hata (isError) durumunda
 * ilgili bileşenleri göstermek.
 * 4. Çekilen 'data' (faturalar) ve 'pagination' (sayfalama)
 * bilgilerini 'BillingDataTable' (Adım 124) bileşenine
 * 'prop' olarak geçmek.
 */
const BillingListPage = () => {
  const { t } = useTranslation();

  // 1. URL Arama Parametrelerini (Query Params) Oku
  const [searchParams] = useSearchParams();
  
  // Zod ile parametreleri doğrula ve varsayılan değerleri ata
  const queryParams: BillingListQuery = billingSearchSchema.parse({
    page: searchParams.get('page'),
    limit: searchParams.get('limit'),
    search: searchParams.get('search'),
    status: searchParams.get('status'),
  });

  // 2. API'den Veri Çek (React Query)
  const {
    data: invoiceDataResponse,
    isLoading,
    isError,
    error,
  } = useGetInvoices(queryParams);

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
  const invoices = invoiceDataResponse?.data.invoices || [];
  const pagination = invoiceDataResponse?.data.pagination;
  const pageCount = pagination?.totalPages || 1;

  return (
    <>
      <Helmet>
        <title>{t('billing.list_title')} - ClinicAdmin</title>
      </Helmet>

      <div className="flex flex-col gap-8">
        {/* 1. Başlık */}
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {t('billing.list_title')}
          </h1>
          <p className="text-lg text-muted-foreground">
            Kliniğinizin faturalarını ve ödemelerini yönetin.
          </p>
        </div>

        {/* 2. TanStack Veri Tablosu (Data Table) */}
        {/*
          'BillingDataTable' (Adım 124) bileşeni,
          TanStack Table'ın tüm karmaşıklığını (state,
          filtreleme, sayfalama) soyutlar (abstract).
        */}
        <BillingDataTable
          // 'columns' (Adım 125)
          columns={billingTableColumns}
          // API'den gelen 'invoices' dizisi
          data={invoices}
          // API'den gelen 'totalPages'
          pageCount={pageCount}
        />
      </div>
    </>
  );
};

export default BillingListPage;