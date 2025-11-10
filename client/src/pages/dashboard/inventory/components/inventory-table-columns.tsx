"use client";

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown, Trash2, Edit, PlusCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'; // Adım 89
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'; // Adım 90
import { Checkbox } from '@/components/ui/checkbox'; // Adım 127
import { Badge } from '@/components/ui/badge'; // Adım 93
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header'; // Adım 117
import { IInventoryItem, useDeleteInventoryItem } from '@/api/inventory-api'; // Adım 77
// TODO: Adım 130'da (Modal) 'useAdjustInventoryStock' da buraya eklenecek

/**
 * InventoryActionsCell (Stok Eylemleri Hücresi)
 *
 * 'inventoryTableColumns' dizisinin içinde 'cell' (hücre)
 * olarak kullanılan özel bir bileşen.
 * "Stok Düzenle", "Düzenle" (Detay) ve "Sil" eylemlerini içerir.
 */
const InventoryActionsCell = ({ row }: { row: any }) => {
  const { t } = useTranslation();
  
  // 'row.original', bu satırın 'IInventoryItem' verisidir.
  const item = row.original as IInventoryItem;

  // --- API Kancaları ---
  const { mutate: deleteItem, isPending: isDeleting } = useDeleteInventoryItem();

  // --- State ---
  // Silme (Delete) onayı için AlertDialog'un durumunu yönet
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
  
  // TODO: v2 - "Düzenle" (Edit) ve "Stok Düzenle" (Adjust)
  // için modal state'lerini (Adım 128'deki) buradan tetikle.

  // Silme işlemini onayla (AlertDialog'dan tetiklenir)
  const handleDelete = () => {
    deleteItem(item.id, {
      onSuccess: () => {
        setDeleteAlertOpen(false); // Alert'i kapat
      },
    });
  };

  return (
    <AlertDialog open={isDeleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
      <DropdownMenu>
        {/* 1. Tetikleyici (Trigger) - Üç Nokta (...) Düğmesi */}
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Menüyü aç</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        {/* 2. Açılır Menü (Content) */}
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{t('generics.actions')}</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Stok Düzenle (Adjust Stock) */}
          <DropdownMenuItem
            // onClick={() => setAdjustModalOpen(item.id)} // v2
            onClick={() => alert(`TODO: Stok Düzenle Modal (ID: ${item.id})`)}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('inventory.adjust_stock')}
          </DropdownMenuItem>
          
          {/* Düzenle (Edit) */}
          <DropdownMenuItem
            // onClick={() => setEditModalOpen(item.id)} // v2
            onClick={() => alert(`TODO: Düzenle Modal (ID: ${item.id})`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            {t('generics.edit')}
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />

          {/* Sil (Delete) */}
          <AlertDialogTrigger asChild>
            <DropdownMenuItem destructive>
              <Trash2 className="mr-2 h-4 w-4" />
              {t('generics.delete')}
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 3. Silme Onay (Alert) Modalı (Gizli) */}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Stok Kalemini Sil?</AlertDialogTitle>
          <AlertDialogDescription>
            {item.name} adlı kalemi silmek istediğinizden
            emin misiniz? Bu işlem geri alınamaz.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('generics.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            isLoading={isDeleting}
          >
            {t('generics.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};


/**
 * inventoryTableColumns (Stok Tablosu Sütunları)
 *
 * 'inventory-list-page.tsx' (Adım 127) içinde kullanılır.
 * Stok tablosu için sütun tanımlamalarını (ColumnDef) içerir.
 */
export const inventoryTableColumns: ColumnDef<IInventoryItem>[] = [
  // 1. Sütun: Satır Seçimi (Row Selection) - Checkbox
  // (v2 - Opsiyonel: Toplu silme/düzenleme için)
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Tümünü seç"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Satırı seç"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },

  // 2. Sütun: Kalem Adı (Item Name)
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Kalem Adı" // TODO: i18n
      />
    ),
    cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
  },
  
  // 3. Sütun: Kategori (Category)
  {
    accessorKey: 'category',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Kategori" // TODO: i18n
      />
    ),
    cell: ({ row }) => (
      <div>{row.getValue('category') || '-'}</div>
    ),
  },

  // 4. Sütun: Stok Durumu (Stock Status)
  // (Miktar ve Kritik Stok'u birleştirir)
  {
    id: 'status',
    header: 'Stok Durumu', // TODO: i18n
    cell: ({ row }) => {
      const quantity = row.original.quantity;
      const threshold = row.original.lowStockThreshold;

      let variant: 'success' | 'warning' | 'danger';
      let text: string;

      if (quantity <= 0) {
        variant = 'danger';
        text = t('inventory.status_out_of_stock');
      } else if (quantity <= threshold) {
        variant = 'warning';
        text = t('inventory.status_low_stock');
      } else {
        variant = 'success';
        text = t('inventory.status_in_stock');
      }
      
      return (
        <Badge variant={variant} className="capitalize">
          {text}
        </Badge>
      );
    },
  },

  // 5. Sütun: Miktar (Quantity)
  {
    accessorKey: 'quantity',
    header: ({ column }) => (
      <div className="text-right">
        <DataTableColumnHeader
          column={column}
          title="Miktar" // TODO: i18n
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-right font-medium">
        {row.getValue('quantity')}
      </div>
    ),
  },

  // 6. Sütun: Kritik Stok (Threshold)
  {
    accessorKey: 'lowStockThreshold',
    header: ({ column }) => (
       <div className="text-right">
        <DataTableColumnHeader
          column={column}
          title="Kritik Stok" // TODO: i18n
        />
      </div>
    ),
     cell: ({ row }) => (
      <div className="text-right text-muted-foreground">
        {row.getValue('lowStockThreshold')}
      </div>
    ),
  },
  
  // 7. Sütun: Tedarikçi (Supplier)
  {
    accessorKey: 'supplier',
    header: 'Tedarikçi', // TODO: i18n
    cell: ({ row }) => (
      <div>{row.getValue('supplier') || '-'}</div>
    ),
  },

  // 8. Sütun: Eylemler (Actions)
  {
    id: 'actions',
    cell: InventoryActionsCell, // Yukarıda tanımlanan özel bileşen
  },
];