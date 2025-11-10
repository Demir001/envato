"use client";

import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { z } from 'zod';

import { useGetInventoryItems, IInventoryItem } from '@/api/inventory-api'; // Adım 77
import { InventoryDataTable } from './components/inventory-data-table'; // Adım 128 (sonraki)
import { inventoryTableColumns } from './components/inventory-table-columns'; // Adım 129 (sonraki)
import { Spinner } from '@/components/ui/full-page-spinner';

/**
 * Zod Şeması (URL Arama Parametreleri)
 *
 * 'inventory-list-page' için URL query parametrelerini
 * (örn. /inventory?page=1&lowStock=true&search=aspirin)
 * doğrulamak ve tip-güvenli (type-safe) hale getirmek için kullanılır.
 */
const inventorySearchSchema = z.object({
  page: z.coerce.number().default(1).catch(1),
  limit: z.coerce.number().default(10).catch(10),
  search: z.string().optional().default(''),
  lowStock: z
    .enum(['true', 'false'])
    .optional()
    .default(undefined),
});

type InventoryListQuery = z.infer<typeof inventorySearchSchema>;

/**
 * InventoryListPage (Stok Listesi Sayfası)
 *
 * '/inventory' rotasında, 'DashboardLayout' içinde 'Outlet'
 * aracılığıyla render edilir.
 *
 * Sorumlulukları:
 * 1. URL'deki arama parametrelerini (page, search, lowStock) okumak
 * ('useSearchParams').
 * 2. Bu parametreleri 'useGetInventoryItems' (React Query) kancasına
 * vererek stok listesini API'den çekmek.
 * 3. Veri yüklenirken (isLoading) veya hata (isError) durumunda
 * ilgili bileşenleri göstermek.
 * 4. Çekilen 'data' (stok kalemleri) ve 'pagination' (sayfalama)
 * bilgilerini 'InventoryDataTable' (Adım 128) bileşenine
 * 'prop' olarak geçmek.
 */
const InventoryListPage = () => {
  const { t } = useTranslation();

  // 1. URL Arama Parametrelerini (Query Params) Oku
  const [searchParams] = useSearchParams();

  // Zod ile parametreleri doğrula ve varsayılan değerleri ata
  const queryParams: InventoryListQuery = inventorySearchSchema.parse({
    page: searchParams.get('page'),
    limit: searchParams.get('limit'),
    search: searchParams.get('search'),
    lowStock: searchParams.get('lowStock'),
  });

  // 2. API'den Veri Çek (React Query)
  const {
    data: inventoryDataResponse,
    isLoading,
    isError,
    error,
  } = useGetInventoryItems(queryParams);

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
  const items = inventoryDataResponse?.data.items || [];
  const pagination = inventoryDataResponse?.data.pagination;
  const pageCount = pagination?.totalPages || 1;

  return (
    <>
      <Helmet>
        <title>{t('inventory.list_title')} - ClinicAdmin</title>
      </Helmet>

      <div className="flex flex-col gap-8">
        {/* 1. Başlık */}
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {t('inventory.list_title')}
          </h1>
          <p className="text-lg text-muted-foreground">
            Kliniğinizin ilaç ve malzeme stoğunu yönetin.
          </p>
        </div>

        {/* 2. TanStack Veri Tablosu (Data Table) */}
        {/*
          'InventoryDataTable' (Adım 128) bileşeni,
          TanStack Table'ın tüm karmaşıklığını (state,
          filtreleme, sayfalama) soyutlar (abstract).
        */}
        <InventoryDataTable
          // 'columns' (Adım 129)
          columns={inventoryTableColumns}
          // API'den gelen 'items' dizisi
          data={items}
          // API'den gelen 'totalPages'
          pageCount={pageCount}
        />
      </div>
    </>
  );
};

export default InventoryListPage;