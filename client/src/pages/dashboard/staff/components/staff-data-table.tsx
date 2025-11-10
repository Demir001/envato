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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'; // Adım 94
import { DataTablePagination } from '@/components/ui/data-table-pagination'; // Adım 117
import { StaffItemModal } from './staff-item-modal'; // Adım 134 (sonraki)

/**
 * StaffDataTable (Personel Veri Tablosu)
 *
 * 'staff-list-page.tsx' (Ana Personel Listesi Sayfası) içinde kullanılır.
 * Diğer data table bileşenlerine (örn. InventoryDataTable) benzer.
 * 'Role' (Rol) ve 'Status' (Durum) için 'Select' (Seçim)
 * filtreleri içerir ve "Yeni Personel Ekle" düğmesi
 * bir 'Modal' (Adım 134) açar.
 */

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount: number; // Toplam sayfa sayısı (API'den)
}

export function StaffDataTable<TData, TValue>({
  columns,
  data,
  pageCount,
}: DataTableProps<TData, TValue>) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // --- Modal State (Yeni Personel / Düzenleme) ---
  // 'null' -> Kapalı
  // 'new' -> Yeni Personel Modu
  // 'number' (ID) -> Düzenleme Modu
  // 'StaffTableColumns' (Adım 133) 'onEdit' prop'u ile
  // 'setModalState(id)' fonksiyonunu çağıracak.
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

  // 4. Rol ve Durum Filtreleri (URL'den)
  const roleFilter = searchParams.get('role') ?? 'all';
  const statusFilter = searchParams.get('status') ?? 'all';

  // --- URL Güncelleme Fonksiyonları ---

  // Arama (Search), Rol (Role) veya Durum (Status) Filtresini Güncelle
  const updateFilters = (
    key: 'search' | 'role' | 'status',
    value: string,
  ) => {
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
    // 'columns' (Adım 133) 'onEdit' prop'unu (modalı açmak için)
    // 'meta' aracılığıyla alacak.
    columns: columns.map((col) => ({
      ...col,
      meta: {
        // 'staff-table-columns.tsx' (Adım 133) içindeki
        // 'Actions' hücresi (cell) bu 'setModalState'
        // fonksiyonuna erişebilecek.
        openEditModal: (id: number) => setModalState(id),
      },
      ...col.meta, // 'col.meta' zaten varsa üzerine yazma
    })),
    pageCount: pageCount,
    
    state: {
      pagination,
      sorting,
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
            placeholder={t('staff.search_placeholder')}
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            className="w-full md:max-w-sm"
          />

          {/* Rol (Role) Filtresi (Select) */}
          <Select
            value={roleFilter}
            onValueChange={(value) => updateFilters('role', value)}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Role göre filtrele" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('generics.all')} Roller</SelectItem>
              <SelectItem value="admin">{t('staff.role_admin')}</SelectItem>
              <SelectItem value="doctor">{t('staff.role_doctor')}</SelectItem>
              <SelectItem value="reception">{t('staff.role_reception')}</SelectItem>
            </SelectContent>
          </Select>
          
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
              <SelectItem value="active">{t('staff.status_active')}</SelectItem>
              <SelectItem value="inactive">{t('staff.status_inactive')}</SelectItem>
            </SelectContent>
          </Select>

          {/* "Yeni Personel Ekle" Düğmesi (Sağa Yaslı) */}
          <div className="md:ml-auto">
            <Button onClick={() => setModalState('new')}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('staff.add_new')}
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

      {/* 4. Yeni Personel / Düzenle Modalı (Gizli) */}
      {/*
        'StaffItemModal' (Adım 134), 'modalState' değiştiğinde
        (açık olduğunda) 'useGetStaffById' kancasını
        tetikleyerek (eğer 'edit' modundaysa) veriyi çeker.
      */}
      <StaffItemModal
        mode={modalState === 'new' ? 'create' : 'update'}
        staffId={typeof modalState === 'number' ? modalState : null}
        isOpen={modalState !== null}
        onClose={() => setModalState(null)}
      />
    </>
  );
}