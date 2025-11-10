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
import * as XLSX from 'xlsx'; // SheetJS (Excel Export için)

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'; // Adım 94
import { DataTablePagination } from '@/components/ui/data-table-pagination'; // Adım 117
import { IInvoiceListItem } from '@/api/billing-api'; // Adım 76

/**
 * BillingDataTable (Fatura Veri Tablosu)
 */

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount: number; // Toplam sayfa sayısı (API'den)
}

export function BillingDataTable<TData, TValue>({
  columns,
  data,
  pageCount,
}: DataTableProps<TData, TValue>) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

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

  // 4. Durum (Status) Filtresi State'i
  const statusFilter = searchParams.get('status') ?? 'all';

  // --- URL Güncelleme Fonksiyonları ---

  // Arama (Search) veya Durum (Status) Filtresini Güncelle
  const updateFilters = (key: 'search' | 'status', value: string) => {
    const newParams = new URLSearchParams(searchParams);
    
    // 'all' veya boş string ise parametreyi kaldır
    if (value === 'all' || !value) {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
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

  // --- TanStack Table (useReactTable) Kancası ---
  const table = useReactTable({
    data,
    columns,
    pageCount: pageCount,
    
    // State
    state: {
      pagination,
      sorting,
    },
    
    // Modeller
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    
    // State Değişiklik (Change) Handler'ları
    onSortingChange: setSorting, // Client-side sıralama
    
    // Sunucu Taraflı (Server-Side) Ayarlar
    manualPagination: true,
    manualFiltering: true,
    manualSorting: false, // v1: Sıralamayı client-side yap
  });

  // --- Excel Export Fonksiyonu ---
  const handleExcelExport = () => {
    toast.info('Mevcut sayfa Excel\'e aktarılıyor...');
    
    // --- DÜZELTME BAŞLANGIÇ ---
    // Hata: data.map((row: any) as IInvoiceListItem => ({
    // 'as IInvoiceListItem' dönüşümü .map() parametresi
    // içinde kullanılamaz.
    const formattedData = (data as IInvoiceListItem[]).map((row) => ({
    // --- DÜZELTME SONU ---
      'Fatura No': row.invoiceNumber,
      'Hasta': row.patientName,
      'Tarih': row.issueDate,
      'Son Ödeme': row.dueDate,
      'Toplam': row.totalAmount,
      // 't' fonksiyonunun senkron (async olmayan)
      // bir bileşen/fonksiyon içinde kullanılması gerekir.
      // Şimdilik 'status'u ham (raw) veri olarak aktarıyoruz.
      'Durum': row.status, 
    }));

    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Faturalar');
    XLSX.writeFile(wb, `Faturalar_${new Date().toISOString().split('T')[0]}.xlsx`);
  };


  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      {/* 1. Tablo Üstü (Toolbar) - Filtreleme ve Eylemler */}
      <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
        {/* Arama (Search) Input'u */}
        <Input
          placeholder={t('billing.search_placeholder')}
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          className="max-w-sm"
        />

        {/* Durum (Status) Filtresi (Select) */}
        <Select
          value={statusFilter}
          onValueChange={(value) => updateFilters('status', value)}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Duruma göre filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('generics.all')} Durumlar</SelectItem>
            <SelectItem value="pending">{t('billing.status_pending')}</SelectItem>
            <SelectItem value="paid">{t('billing.status_paid')}</SelectItem>
            <SelectItem value="overdue">{t('billing.status_overdue')}</SelectItem>
          </SelectContent>
        </Select>

        {/* Excel Export Düğmesi (Sağa Yaslı) */}
        <div className="md:ml-auto">
          <Button
            variant="outline"
            onClick={handleExcelExport}
            disabled={data.length === 0}
          >
            {t('billing.export_excel')}
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
  );
}