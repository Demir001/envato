"use client";

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Download, FileText, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';

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
import {
  IInvoiceListItem,
  useDeleteInvoice,
  downloadInvoicePDF, // API'den (Adım 76)
} from '@/api/billing-api'; // Adım 76
import { formatDate, formatCurrency } from '@/lib/utils'; // Adım 64

/**
 * BillingActionsCell (Fatura Eylemleri Hücresi)
 *
 * 'billingTableColumns' dizisinin içinde 'cell' (hücre)
 * olarak kullanılan özel bir bileşen.
 * "Detaylar", "PDF İndir" ve "Sil" eylemlerini içerir.
 */
const BillingActionsCell = ({ row }: { row: any }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // 'row.original', bu satırın 'IInvoiceListItem' verisidir.
  const invoice = row.original as IInvoiceListItem;

  // --- API Kancaları ---
  // Silme (Delete)
  const { mutate: deleteInvoice, isPending: isDeleting } = useDeleteInvoice();
  
  // PDF İndirme (Async Fonksiyon, Mutation değil)
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  // Silme işlemini onayla (AlertDialog'dan tetiklenir)
  const handleDelete = () => {
    deleteInvoice(invoice.id);
  };

  // PDF İndirme işlemini yönet
  const handleDownloadPDF = async () => {
    setIsDownloadingPDF(true);
    try {
      // 'downloadInvoicePDF' (Adım 76) API çağrısını yap
      const { blob, filename } = await downloadInvoicePDF(invoice.id);
      
      // İndirme (Download) linki oluştur ve tıkla
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Linki temizle
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF başarıyla indirildi.');
    } catch (error) {
      console.error('PDF indirme hatası:', error);
      toast.error('PDF indirilemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsDownloadingPDF(false);
    }
  };


  return (
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
          
          {/* Detaylar (Details) */}
          <DropdownMenuItem
            onClick={() => navigate(`/billing/${invoice.id}`)}
          >
            <FileText className="mr-2 h-4 w-4" />
            {t('billing.details')}
          </DropdownMenuItem>

          {/* PDF İndir (Download PDF) */}
          <DropdownMenuItem
            onClick={handleDownloadPDF}
            disabled={isDownloadingPDF}
          >
            <Download className="mr-2 h-4 w-4" />
            {isDownloadingPDF ? t('generics.loading') : t('billing.download_pdf')}
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
          <AlertDialogTitle>Faturayı Sil?</AlertDialogTitle>
          <AlertDialogDescription>
            {invoice.invoiceNumber} numaralı faturayı silmek
            istediğinizden emin misiniz? Bu işlem geri alınamaz.
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
 * BillingTableColumns (Fatura Tablosu Sütunları)
 *
 * 'billing-list-page.tsx' (Adım 123) içinde kullanılır.
 * Fatura tablosu için sütun tanımlamalarını (ColumnDef) içerir.
 */
export const billingTableColumns: ColumnDef<IInvoiceListItem>[] = [
  // 1. Sütun: Fatura No (Invoice #)
  {
    accessorKey: 'invoiceNumber',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Fatura No" // TODO: i18n
      />
    ),
    cell: ({ row }) => (
      <Button
        variant="link"
        className="p-0 font-medium"
        onClick={() =>
          // TODO: useNavigate hook'u burada (kolon tanımı)
          // doğrudan kullanılamaz.
          // 'cell'i (BillingActionsCell gibi) ayrı bir bileşen
          // yaparak 'navigate' kullanmak gerekir.
          // v1: Şimdilik link olmasın, 'Actions' menüsü kullanılsın.
          // navigate(`/billing/${row.original.id}`)
          console.log(`Go to billing ${row.original.id}`)
        }
      >
        {row.getValue('invoiceNumber')}
      </Button>
    ),
  },

  // 2. Sütun: Hasta (Patient)
  {
    accessorKey: 'patientName',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Hasta" // TODO: i18n
      />
    ),
    cell: ({ row }) => <div>{row.getValue('patientName')}</div>,
  },
  
  // 3. Sütun: Durum (Status)
  {
    accessorKey: 'status',
    header: 'Durum', // TODO: i18n
    cell: ({ row }) => {
      const status = row.getValue('status') as
        | 'pending'
        | 'paid'
        | 'overdue';
      
      // 'Badge' (Adım 93) varyantlarını kullan
      const variant: 'success' | 'warning' | 'danger' =
        status === 'paid'
          ? 'success'
          : status === 'pending'
            ? 'warning'
            : 'danger'; // overdue
      
      const text =
        status === 'paid'
          ? t('billing.status_paid')
          : status === 'pending'
            ? t('billing.status_pending')
            : t('billing.status_overdue');

      return (
        <Badge variant={variant} className="capitalize">
          {text}
        </Badge>
      );
    },
    // TODO: v2 - Client-side 'filterFn' eklenebilir
    // (ama biz server-side filtreleme yapıyoruz)
  },

  // 4. Sütun: Toplam (Total)
  {
    accessorKey: 'totalAmount',
    header: ({ column }) => (
      // Sağa yaslı (text-right)
      <div className="text-right">
        <DataTableColumnHeader
          column={column}
          title="Toplam" // TODO: i18n
        />
      </div>
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('totalAmount'));
      // 'formatCurrency' (Adım 64)
      const formatted = formatCurrency(amount); // ₺
      
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },

  // 5. Sütun: Düzenlenme Tarihi (Issue Date)
  {
    accessorKey: 'issueDate',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Tarih" // TODO: i18n
      />
    ),
    cell: ({ row }) => {
      // 'formatDate' (Adım 64)
      return formatDate(row.getValue('issueDate'), 'short');
    },
  },
  
  // 6. Sütun: Son Ödeme Tarihi (Due Date)
  {
    accessorKey: 'dueDate',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Son Ödeme" // TODO: i18n
      />
    ),
    cell: ({ row }) => {
      return formatDate(row.getValue('dueDate'), 'short');
    },
  },

  // 7. Sütun: Eylemler (Actions)
  {
    id: 'actions',
    cell: BillingActionsCell, // Yukarıda tanımlanan özel bileşen
  },
];