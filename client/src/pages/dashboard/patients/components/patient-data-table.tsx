"use client";

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState, // Sıralama (Sorting)
  getSortedRowModel,
  ColumnFiltersState, // Filtreleme (Filtering)
  getFilteredRowModel,
  PaginationState, // Sayfalama (Pagination)
} from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'; // Adım 92
import { Button } from '@/components/ui/button'; // Adım 86
import { Input } from '@/components/ui/input'; // Adım 87
import { DataTablePagination } from '@/components/ui/data-table-pagination'; // Adım 117

/**
 * PatientDataTable (Hasta Veri Tablosu)
 *
 * 'patient-list-page.tsx' (Ana Hasta Listesi Sayfası) içinde kullanılır.
 * Bu bileşen, 'TanStack Table' (react-table) kütüphanesini kullanarak
 * hasta verilerini (data) ve sütun tanımlarını (columns) alır,
 * etkileşimli (filtreleme, sıralama, sayfalama) bir HTML tablosu
 * olarak render eder.
 *
 * Bu bileşen "Sunucu Taraflı" (Server-Side) filtreleme ve
 * sayfalama (pagination) için tasarlanmıştır.
 * Kendi 'state'ini (örn. 'sorting', 'columnFilters') tutar
 * ANCAK sayfalama (pagination) ve filtreleme (filtering)
 * işlemlerini URL arama parametreleri (query params)
 * aracılığıyla yönetir.
 */

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount: number; // Toplam sayfa sayısı (API'den)
}

export function PatientDataTable<TData, TValue>({
  columns,
  data,
  pageCount,
}: DataTableProps<TData, TValue>) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // --- State Yönetimi (TanStack Table) ---

  // 1. URL'den Filtreleme (Filtering) State'ini Oku
  // (Sadece 'search' filtresi)
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    searchParams.get('search')
      ? [{ id: 'name', value: searchParams.get('search') }]
      : [],
  );
  
  // 2. URL'den Sayfalama (Pagination) State'ini Oku
  const pagination = React.useMemo<PaginationState>(() => ({
    pageIndex: Number(searchParams.get('page') ?? 1) - 1, // 'pageIndex' 0'dan başlar
    pageSize: Number(searchParams.get('limit') ?? 10),
  }), [searchParams]);

  // 3. Sıralama (Sorting) State'i (Şimdilik client-side, v2'de URL'e taşınabilir)
  const [sorting, setSorting] = React.useState<SortingState>([]);
  
  // --- URL Güncelleme (Filtreleme için) ---
  // Kullanıcı 'Input'a yazdığında (debounce ile) URL'i güncelle
  const setSearchQuery = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set('search', value);
    } else {
      newParams.delete('search');
    }
    newParams.set('page', '1'); // Arama yapıldığında 1. sayfaya dön
    navigate(`${location.pathname}?${newParams.toString()}`);
  };

  // 'Input'a yazma (debounce)
  const [searchValue, setSearchValue] = React.useState(
    searchParams.get('search') ?? ''
  );
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      // Sadece 'searchValue' URL'deki 'search'ten
      // farklıysa URL'i güncelle
      if (searchValue !== (searchParams.get('search') ?? '')) {
         setSearchQuery(searchValue);
      }
    }, 500); // 500ms gecikme (debounce)

    return () => clearTimeout(timeout);
  }, [searchValue, searchParams, setSearchQuery]);
  

  // --- TanStack Table (useReactTable) Kancası ---
  const table = useReactTable({
    data,
    columns,
    pageCount: pageCount, // Toplam sayfa sayısı (API'den)

    // --- Model ve State Yönetimi ---
    getCoreRowModel: getCoreRowModel(),
    // Sayfalama (Pagination)
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: (updater) => {
      // 'updater' bir fonksiyon veya yeni state olabilir
      if (typeof updater === 'function') {
        const newState = updater(pagination);
        // 'DataTablePagination' (Adım 117) URL'i güncellediği için
        // buranın tekrar URL'i güncellemesi gerekmez.
        // Bu, 'DataTablePagination' bileşeni
        // 'table.setPagination'ı çağırırsa kullanılır.
        // Bizim 'DataTablePagination'ımız doğrudan URL'i güncelliyor.
        // Bu yüzden bu 'manualPagination: true' ile birleştiğinde
        // 'DataTablePagination'daki 'updateQueryParams' kullanılır.
      }
    },
    // Sıralama (Sorting)
    onSortingChange: setSorting, // Client-side sıralamayı state'e kaydet
    getSortedRowModel: getSortedRowModel(),
    // Filtreleme (Filtering)
    onColumnFiltersChange: setColumnFilters, // Client-side filtrelemeyi state'e kaydet
    getFilteredRowModel: getFilteredRowModel(),

    // --- Sunucu Taraflı (Server-Side) Ayarlar ---
    // 'patient-list-page.tsx' (üst bileşen) URL'i
    // okuyup API'yi çağırdığı için bu ayarlar 'true' olmalı.
    manualPagination: true,
    manualFiltering: true,
    manualSorting: false, // v1: Sıralamayı client-side yapıyoruz
    
    // State'leri 'useReactTable' kancasına bağla
    state: {
      pagination,
      sorting,
      columnFilters,
    },
  });

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      {/* 1. Tablo Üstü (Toolbar) - Filtreleme ve Eylemler */}
      <div className="flex items-center justify-between p-4">
        {/* Arama (Search) Input'u */}
        <Input
          placeholder={t('patients.search_placeholder')}
          value={searchValue}
          onChange={(event) => {
            setSearchValue(event.target.value); // Debounce state'ini güncelle
          }}
          className="max-w-sm"
          // TanStack Table'ın 'name' filtresine bağlanır
          // (Bu, 'manualFiltering: false' olsaydı gerekirdi,
          // 'manualFiltering: true' olduğunda biz yönetiyoruz)
        />
        
        {/* "Yeni Hasta Ekle" Düğmesi */}
        <Button onClick={() => navigate('/patients/new')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('patients.add_new')}
        </Button>
      </div>

      {/* 2. Ana Tablo (Table) */}
      <div className="overflow-x-auto">
        <Table>
          {/* Tablo Başlığı (Header) */}
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : // 'header'ı (başlığı) render et
                          // (Bu, 'patient-table-columns.tsx' (Adım 119)
                          // içindeki 'header' fonksiyonunu çağırır)
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          {/* Tablo Gövdesi (Body) */}
          <TableBody>
            {table.getRowModel().rows?.length ? (
              // Veri varsa, satırları (rows) map'le (dön)
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {/* 'cell'i (hücreyi) render et
                          (Bu, 'patient-table-columns.tsx' (Adım 119)
                          içindeki 'cell' fonksiyonunu çağırır)
                      */}
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              // Veri yoksa (veya filtre/arama sonucu boşsa)
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {t('generics.no_data')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 3. Tablo Altı (Pagination) */}
      <DataTablePagination table={table} pageCount={pageCount} />
    </div>
  );
}