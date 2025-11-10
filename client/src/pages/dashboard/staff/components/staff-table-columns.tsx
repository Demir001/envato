"use client";

import { ColumnDef, Column } from '@tanstack/react-table';
import { MoreHorizontal, Trash2, Edit } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge'; // Adım 93
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header'; // Adım 117
import { IStaffUser, useDeleteStaff } from '@/api/staff-api'; // Adım 78

/**
 * StaffActionsCell (Personel Eylemleri Hücresi)
 *
 * 'staffTableColumns' dizisinin içinde 'cell' (hücre)
 * olarak kullanılan özel bir bileşen.
 * "Düzenle" (Modalı açar) ve "Sil" eylemlerini içerir.
 */
const StaffActionsCell = ({
  row,
  column,
}: {
  row: any;
  column: Column<IStaffUser>; // Sütun (meta verisi için)
}) => {
  const { t } = useTranslation();
  
  // 'row.original', bu satırın 'IStaffUser' verisidir.
  const staff = row.original as IStaffUser;
  
  // 'StaffDataTable' (Adım 132) içinden 'meta'
  // aracılığıyla geçirilen 'openEditModal' fonksiyonunu al.
  const meta = column.columnDef.meta as {
    openEditModal: (id: number) => void;
  };

  // --- API Kancaları ---
  const { mutate: deleteStaff, isPending: isDeleting } = useDeleteStaff();

  // --- State ---
  // Silme (Delete) onayı için AlertDialog'un durumunu yönet
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);

  // Silme işlemini onayla (AlertDialog'dan tetiklenir)
  const handleDelete = () => {
    deleteStaff(staff.id, {
      onSuccess: () => {
        setDeleteAlertOpen(false); // Alert'i kapat
      },
    });
  };

  // Düzenleme işlemini tetikle (Parent'taki modalı açar)
  const handleEdit = () => {
    meta.openEditModal(staff.id);
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

          {/* Düzenle (Edit) */}
          <DropdownMenuItem onClick={handleEdit}>
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
          <AlertDialogTitle>Personeli Sil?</AlertDialogTitle>
          <AlertDialogDescription>
            {staff.name} adlı personeli silmek istediğinizden
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
 * staffTableColumns (Personel Tablosu Sütunları)
 *
 * 'staff-list-page.tsx' (Adım 131) içinde kullanılır.
 * Personel tablosu için sütun tanımlamalarını (ColumnDef) içerir.
 */
export const staffTableColumns: ColumnDef<IStaffUser>[] = [
  // 1. Sütun: İsim (Name)
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="İsim" // TODO: i18n
      />
    ),
    cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
  },
  
  // 2. Sütun: E-posta (Email)
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="E-posta" // TODO: i18n
      />
    ),
    cell: ({ row }) => (
      <div className="lowercase text-muted-foreground">
        {row.getValue('email')}
      </div>
    ),
  },

  // 3. Sütun: Rol (Role)
  {
    accessorKey: 'role',
    header: 'Rol', // TODO: i18n
    cell: ({ row }) => {
      const role = row.getValue('role') as
        | 'admin'
        | 'doctor'
        | 'reception';
      
      const variant: 'default' | 'secondary' | 'outline' =
        role === 'admin'
          ? 'default' // Primary (mavi/mor)
          : role === 'doctor'
            ? 'secondary' // Gri
            : 'outline'; // Çerçeveli

      const text =
        role === 'admin'
          ? t('staff.role_admin')
          : role === 'doctor'
            ? t('staff.role_doctor')
            : t('staff.role_reception');

      return (
        <Badge variant={variant} className="capitalize">
          {text}
        </Badge>
      );
    },
    // TODO: v2 - Client-side 'filterFn' eklenebilir
  },

  // 4. Sütun: Uzmanlık (Specialty)
  {
    accessorKey: 'specialty',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Uzmanlık" // TODO: i18n
      />
    ),
    cell: ({ row }) => (
      <div>{row.getValue('specialty') || '-'}</div>
    ),
  },

  // 5. Sütun: Durum (Status)
  {
    accessorKey: 'isActive',
    header: 'Durum', // TODO: i18n
    cell: ({ row }) => {
      const isActive = row.getValue('isActive') as boolean;

      const variant: 'success' | 'danger' = isActive ? 'success' : 'danger';
      const text = isActive ? t('staff.status_active') : t('staff.status_inactive');
      
      return (
        <Badge variant={variant} className="capitalize">
          {text}
        </Badge>
      );
    },
    // TODO: v2 - Client-side 'filterFn' eklenebilir
  },

  // 6. Sütun: Eylemler (Actions)
  {
    id: 'actions',
    cell: StaffActionsCell, // Yukarıda tanımlanan özel bileşen
  },
];