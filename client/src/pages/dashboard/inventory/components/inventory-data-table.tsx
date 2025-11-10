"use client";

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
  PaginationState,
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
import { Checkbox } from '@/components/ui/checkbox'; // Adım 127
import { DataTablePagination } from '@/components/ui/data-table-pagination'; // Adım 117
import { InventoryItemModal } from './inventory-item-modal'; // Adım 130 (sonraki)

/**
 * InventoryDataTable (Stok Veri Tablosu)
 *
 * 'inventory-list-page.tsx' (Ana Stok Listesi Sayfası) içinde kullanılır.
 * 'BillingDataTable' (Adım 124) bileşenine benzer, ancak
 * 'Status' (Durum) filtresi yerine 'lowStock' (Azalan Stok)
 * 'Checkbox' filtresi içerir ve "Yeni Kalem Ekle" (Add New)
 * düğmesi bir 'Modal' (Adım 130) açar.
 */

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount: number; // Toplam sayfa sayısı (API'den)
}

export function InventoryDataTable<TData, TValue>({
  columns,
  data,
  pageCount,
}: DataTableProps<TData, TValue>) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // --- Modal State (Yeni Kalem / Düzenleme) ---
  // 'null' -> Kapalı
  // 'new' -> Yeni Kalem Modu
  // 'number' (ID) -> Düzenleme Modu
  const [modalState, setModalState] = React.useState<'new' | number | null>(
    null,
  );

  // --- State Yönetimi (TanStack Table & URL) ---

  // 1. URL'den Sayfalama (Pagination) State'ini Oku
  const pagination = React.useMemo<PaginationState>(() => ({
    pageIndex: Number(searchParams.get('page') ?? 1) - 1,
    pageSize: Number(searchParams.get('limit') ?? 10),
  }), [searchParams]);

  // 2. Sıralama (Sorting) State'i (Client-side)
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // 3. Arama (Search) State'i (Debounced)
  const [searchValue, setSearchValue] = React.useState(
    searchParams.get('search') ?? '',
  );

  // 4. Azalan Stok (lowStock) Filtresi State'i
  const lowStockFilter = searchParams.get('lowStock') === 'true';

  // --- URL Güncelleme Fonksiyonları ---

  // URL'deki filtre parametrelerini (search, lowStock) günceller
  const updateFilters = (key: 'search' | 'lowStock', value: string | boolean) => {
    const newParams = new URLSearchParams(searchParams);
    
    // 'false' (boolean) veya 'all' (string) veya boş string ise kaldır
    if (!value || value === 'all' || value === false) {
      newParams.delete(key);
    } else {
      newParams.set(key, String(value)); // 'true' veya arama metni
    }
    
    newParams.set('page', '1'); // Filtre değiştiğinde 1. sayfaya dön
    navigate(`${location.pathname}?${newParams.toString()}`);
  };

  // Arama (Search) için Debounce
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchValue !== (searchParams.get('search') ?? '')) {
        updateFilters('search', searchValue);
      }
    }, 500); // 500ms gecikme
    return () => clearTimeout(timeout);
  }, [searchValue, searchParams, updateFilters]);
  
  // 'lowStock' Checkbox'ı değiştiğinde URL'i anında güncelle
  const handleLowStockChange = (checked: boolean) => {
    updateFilters('lowStock', checked);
  };


  // --- TanStack Table (useReactTable) Kancası ---
  const table = useReactTable({
    data,
    columns,
    pageCount: pageCount,
    
    state: {
      pagination,
      sorting,
      // 'rowSelection' state'i (Adım 129'da 'Checkbox' sütunu
      // eklendiğinde gereklidir)
    },
    
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    
    onSortingChange: setSorting, // Client-side sıralama
    
    // Sunucu Taraflı (Server-Side) Ayarlar
    manualPagination: true,
    manualFiltering: true,
    manualSorting: false, // v1: Sıralamayı client-side yap
  });

  return (
    <>
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        {/* 1. Tablo Üstü (Toolbar) - Filtreleme ve Eylemler */}
        <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
          {/* Arama (Search) Input'u */}
          <Input
            placeholder={t('inventory.search_placeholder')}
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            className="max-w-sm"
          />

          {/* Azalan Stok (lowStock) Filtresi (Checkbox) */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="lowStock"
              checked={lowStockFilter}
              onCheckedChange={handleLowStockChange}
            />
            <label
              htmlFor="lowStock"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {t('inventory.show_low_stock')}
            </label>
          </div>

          {/* "Yeni Kalem Ekle" Düğmesi (Sağa Yaslı) */}
          <div className="md:ml-auto">
            <Button onClick={() => setModalState('new')}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('inventory.add_new')}
            </Button>
          </div>
        </div>

        {/* 2. Ana Tablo (Table) */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
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

      {/* 4. Yeni Kalem / Düzenle Modalı (Gizli) */}
      {/*
        'InventoryItemModal' (Adım 130), 'modalState' değiştiğinde
        (açık olduğunda) 'useGetInventoryItemById' kancasını
        tetikleyerek (eğer 'edit' modundaysa) veriyi çeker.
      */}
      <InventoryItemModal
        mode={modalState === 'new' ? 'create' : 'update'}
        itemId={typeof modalState === 'number' ? modalState : null}
        isOpen={modalState !== null}
        onClose={() => setModalState(null)}
      />
    </>
  );
}