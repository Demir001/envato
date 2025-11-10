"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { Table } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'; // Adım 94

/**
 * DataTablePagination (Veri Tablosu Sayfalama)
 *
 * 'TanStack Table' (react-table) kullanan herhangi bir data tablosunun
 * (örn. 'PatientDataTable') altında yer alan, yeniden kullanılabilir
 * (reusable) bir sayfalama (pagination) bileşenidir.
 *
 * Bu bileşen "Sunucu Taraflı" (Server-Side) sayfalama için tasarlanmıştır.
 * Sayfa veya limit değiştiğinde, React Router ('useNavigate')
 * kullanarak URL'deki arama parametrelerini (query params)
 * günceller. Bu da '...-list-page.tsx' (üst bileşen)
 * içindeki 'useQuery' kancasını (API çağrısını) yeniden tetikler.
 */

interface DataTablePaginationProps<TData> {
  /**
   * TanStack Table'dan gelen 'table' nesnesi.
   * 'getState', 'getPageCount' gibi metotları içerir.
   */
  table: Table<TData>;
  /**
   * API'den gelen toplam sayfa sayısı (totalPages).
   */
  pageCount: number;
}

export function DataTablePagination<TData>({
  table,
  pageCount,
}: DataTablePaginationProps<TData>) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // --- URL Güncelleme Fonksiyonu ---
  /**
   * Yeni sayfa (page) veya limit (pageSize) değerleriyle
   * URL'deki arama parametrelerini günceller.
   */
  const updateQueryParams = (key: 'page' | 'limit', value: string) => {
    const newParams = new URLSearchParams(searchParams);
    
    // 'page' değişirse '1'e ayarla (limit değiştiğinde)
    if (key === 'limit') {
      newParams.set('page', '1');
    }
    // Yeni değeri ayarla
    newParams.set(key, value);
    
    // 'navigate' ile URL'i güncelle (Bu, API'yi yeniden tetikler)
    navigate(`${location.pathname}?${newParams.toString()}`);
  };

  // --- TanStack Table State'inden Veri Al ---
  const { pageIndex, pageSize } = table.getState().pagination;
  const currentPage = pageIndex + 1; // 'pageIndex' 0'dan başlar

  return (
    <div className="flex items-center justify-between px-2 py-4">
      {/* 1. Sol Taraf (Toplam Satır - Client-Side) */}
      {/*
        Sunucu taraflı (server-side) sayfalama yaptığımız için
        'getFilteredSelectedRowModel().rows.length' yerine
        API'den gelen 'totalItems'ı göstermek daha doğru olurdu.
        Şimdilik bunu gizliyoruz (veya 'totalItems'ı prop olarak almalıyız).
      */}
      <div className="flex-1 text-sm text-muted-foreground">
        {/* {table.getFilteredSelectedRowModel().rows.length} of{' '}
        {table.getFilteredRowModel().rows.length} row(s) selected. */}
      </div>

      {/* 2. Orta Taraf (Sayfa Başına Satır) */}
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Sayfa Başına Satır</p>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => {
              // 'limit'i URL'de güncelle
              updateQueryParams('limit', value);
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 3. Sağ Taraf (Sayfa Kontrolleri) */}
        {/* Sayfa X / Y */}
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          {t('generics.page')} {currentPage} {t('generics.of')} {pageCount}
        </div>
        
        {/* Navigasyon Düğmeleri (İlk, Önceki, Sonraki, Son) */}
        <div className="flex items-center space-x-2">
          {/* İlk Sayfa */}
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => updateQueryParams('page', '1')}
            disabled={currentPage === 1}
          >
            <span className="sr-only">İlk sayfaya git</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          {/* Önceki Sayfa */}
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => updateQueryParams('page', (currentPage - 1).toString())}
            disabled={currentPage === 1}
          >
            <span className="sr-only">Önceki sayfaya git</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {/* Sonraki Sayfa */}
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => updateQueryParams('page', (currentPage + 1).toString())}
            disabled={currentPage === pageCount}
          >
            <span className="sr-only">Sonraki sayfaya git</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          {/* Son Sayfa */}
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => updateQueryParams('page', pageCount.toString())}
            disabled={currentPage === pageCount}
          >
            <span className="sr-only">Son sayfaya git</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}