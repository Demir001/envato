"use client";

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

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
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header'; // Adım 117
import { IPatient, useDeletePatient } from '@/api/patient-api'; // Adım 74
import { formatDate } from '@/lib/utils'; // Adım 64

/**
 * PatientTableColumns (Hasta Tablosu Sütunları)
 *
 * 'patient-list-page.tsx' (Ana Hasta Listesi Sayfası) içinde kullanılır.
 * 'TanStack Table' (react-table) kütüphanesinin 'columns' prop'u
 * için gereken sütun tanımlamalarını (ColumnDef) içerir.
 *
 * Sorumlulukları:
 * 1. Hangi sütunların (örn. 'name', 'email') gösterileceğini tanımlamak.
 * 2. Her sütunun 'header' (başlık) bölümünün nasıl render edileceğini
 * (örn. sıralama (sorting) düğmesi ile) belirlemek.
 * 3. Her sütunun 'cell' (hücre) bölümünün nasıl render edileceğini
 * (örn. tarih formatlama veya "Eylemler" menüsü) belirlemek.
 */

// --- Eylemler (Actions) Sütunu Bileşeni ---
// 'patientTableColumns' dizisinin içinde 'cell' (hücre)
// olarak kullanılan özel bir bileşen.
const PatientActionsCell = ({ row }: { row: any }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // 'useDeletePatient' (React Query) kancası (Adım 74)
  const { mutate: deletePatient, isPending: isDeleting } = useDeletePatient();

  // 'row.original', TanStack Table tarafından sağlanan,
  // bu satırın API'den gelen orijinal 'IPatient' verisidir.
  const patient = row.original as IPatient;

  // Silme işlemini onayla (AlertDialog'dan tetiklenir)
  const handleDelete = () => {
    deletePatient(patient.id);
  };

  return (
    // 'AlertDialog' (Silme Onayı)
    <AlertDialog>
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
          
          {/* Düzenle (Edit) / Detaylar (Details) */}
          <DropdownMenuItem
            onClick={() => navigate(`/patients/${patient.id}`)}
          >
            {t('patients.details')} / {t('generics.edit')}
          </DropdownMenuItem>
          
          {/* Sil (Delete) */}
          {/* 'AlertDialogTrigger' 'DropdownMenuItem'ı sarmalar.
              'destructive' prop'u (Adım 89) kırmızı renk verir.
          */}
          <AlertDialogTrigger asChild>
            <DropdownMenuItem destructive>
              {t('generics.delete')}
            </DropdownMenuItem>
          </AlertDialogTrigger>
          
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 3. Silme Onay (Alert) Modalı (Gizli) */}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('patients.delete_confirm_title')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('patients.delete_confirm_text', { name: patient.name })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('generics.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            isLoading={isDeleting} // 'Button' (Adım 86) 'isLoading'ı destekler
          >
            {t('generics.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// --- Sütun (Column) Tanımlamaları ---
export const patientTableColumns: ColumnDef<IPatient>[] = [
  // 1. Sütun: İsim (Name)
  {
    accessorKey: 'name', // API'den gelen 'IPatient' nesnesindeki anahtar (key)
    // Başlık (Header) render fonksiyonu
    header: ({ column }) => (
      // 'DataTableColumnHeader' (Adım 117)
      // sıralama (sorting) işlevselliği ekler.
      <DataTableColumnHeader
        column={column}
        title="İsim" // TODO: i18n t('patients.table_name')
      />
    ),
    // Hücre (Cell) render fonksiyonu
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

  // 3. Sütun: Telefon (Phone)
  {
    accessorKey: 'phone',
    header: 'Telefon', // TODO: i18n
  },

  // 4. Sütun: Doğum Tarihi (Date of Birth)
  {
    accessorKey: 'dob',
    header: 'Doğum Tarihi', // TODO: i18n
    // Hücre (Cell) render fonksiyonu (Formatlama)
    cell: ({ row }) => {
      const dob = row.getValue('dob') as string;
      if (!dob) return '-';
      // 'formatDate' (Adım 64)
      return formatDate(dob, 'short');
    },
  },

  // 5. Sütun: Eylemler (Actions)
  {
    id: 'actions', // Benzersiz ID (accessorKey yok)
    // Hücre (Cell) render fonksiyonu
    cell: PatientActionsCell, // Yukarıda tanımlanan özel bileşen
  },
];