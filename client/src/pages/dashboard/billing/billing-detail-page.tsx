"use client";

import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Download, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

import { useGetInvoiceById, downloadInvoicePDF } from '@/api/billing-api'; // Adım 76
import { Spinner } from '@/components/ui/full-page-spinner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'; // Adım 91
import { Badge } from '@/components/ui/badge'; // Adım 93
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'; // Adım 92
import { formatCurrency, formatDate } from '@/lib/utils'; // Adım 64

/**
 * BillingDetailPage (Fatura Detay Sayfası)
 *
 * '/billing/:id' rotasında, 'DashboardLayout' içinde 'Outlet'
 * aracılığıyla render edilir.
 *
 * Sorumlulukları:
 * 1. URL'den ':id' (fatura ID'si) parametresini almak ('useParams').
 * 2. 'useGetInvoiceById' (React Query) kancası ile faturanın
 * tam detaylarını (hasta bilgisi, kalemler/items) API'den çekmek.
 * 3. Veri yüklenirken (isLoading) veya hata (isError) durumunda
 * ilgili bileşenleri göstermek.
 * 4. Faturayı (statik, düzenlenemez) bir önizleme (preview)
 * formatında göstermek.
 * 5. "PDF İndir" (Download PDF) düğmesini sağlamak.
 *
 * NOT: Bu v1 (MVP) projesinde fatura *düzenleme* (update)
 * sayfası bulunmamaktadır. Bu sayfa sadece *detay/önizleme*
 * amaçlıdır.
 */
const BillingDetailPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // URL'den 'id'yi al
  const invoiceId = Number(id) || null;

  // PDF indirme (loading) durumu
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  // 1. React Query 'useQuery' (Fetch Hook)
  // 'billing-api.ts' (Adım 76) içinden 'useGetInvoiceById' kancasını kullan.
  const {
    data: invoiceDataResponse,
    isLoading,
    isError,
    error,
  } = useGetInvoiceById(invoiceId);

  // 2. PDF İndirme Fonksiyonu
  const handleDownloadPDF = async () => {
    if (!invoiceId) return;
    setIsDownloadingPDF(true);
    try {
      const { blob, filename } = await downloadInvoicePDF(invoiceId);
      // 'billing-table-columns.tsx' (Adım 125) içindeki
      // indirme mantığının aynısı
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
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

  // --- Render Mantığı ---

  // 3. Yükleme (Loading) Durumu
  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] w-full items-center justify-center">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  // 4. Hata (Error) Durumu (örn. Fatura bulunamadı - 404)
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
  const invoice = invoiceDataResponse?.data;
  if (!invoice) {
    return <div>{t('generics.error_not_found')}</div>;
  }

  // Durum (Status) için Badge varyantını belirle
  const statusVariant: 'success' | 'warning' | 'danger' =
    invoice.status === 'paid'
      ? 'success'
      : invoice.status === 'pending'
        ? 'warning'
        : 'danger';

  return (
    <>
      {/* Sayfa başlığını (HTML <title>) dinamik olarak ayarla */}
      <Helmet>
        <title>
          {t('billing.details')}: {invoice.invoiceNumber} - ClinicAdmin
        </title>
      </Helmet>

      <div className="mx-auto max-w-4xl">
        {/* 1. Başlık ve Eylemler (Geri, PDF İndir) */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/billing')}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Geri</span>
            </Button>
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold tracking-tight">
                {invoice.invoiceNumber}
              </h1>
              <p className="text-lg text-muted-foreground">
                {t('billing.details')}
              </p>
            </div>
          </div>
          {/* PDF İndir Düğmesi */}
          <Button
            onClick={handleDownloadPDF}
            isLoading={isDownloadingPDF}
          >
            <Download className="mr-2 h-4 w-4" />
            {t('billing.download_pdf')}
          </Button>
        </div>

        {/* 2. Fatura Önizleme (Preview) Kartı */}
        <Card>
          {/* 2a. Fatura Başlığı (Header) - Klinik ve Hasta Bilgileri */}
          <CardHeader className="grid grid-cols-2 gap-6 border-b p-6">
            {/* Klinik Bilgileri (TODO: v2 - 'useGetSettings' ile çek) */}
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                ClinicAdmin Demo
              </h3>
              <p className="text-sm text-muted-foreground">
                123 Sağlık Sokak, Çankaya
                <br />
                Ankara, Türkiye
              </p>
            </div>
            {/* Hasta Bilgileri (Bill To) */}
            <div className="text-right">
              <h3 className="text-lg font-semibold text-foreground">
                {t('patients.title')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {invoice.patientName}
                <br />
                {invoice.patientAddress || 'Adres bilgisi yok'}
                <br />
                {invoice.patientEmail}
              </p>
            </div>
          </CardHeader>
          
          {/* 2b. Fatura Meta Bilgileri (Tarihler, Durum) */}
          <CardContent className="space-y-8 p-6">
            <div className="grid grid-cols-3 gap-4">
              {/* Fatura Durumu (Status) */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  {t('billing.table_status')}
                </h4>
                <Badge variant={statusVariant} className="mt-1 text-base">
                  {t(`billing.status_${invoice.status}` as any)}
                </Badge>
              </div>
              {/* Düzenlenme Tarihi (Issue Date) */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  {t('billing.table_issue_date')}
                </h4>
                <p className="text-base font-semibold">
                  {formatDate(invoice.issueDate, 'long')}
                </p>
              </div>
              {/* Son Ödeme Tarihi (Due Date) */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  {t('billing.table_due_date')}
                </h4>
                <p className="text-base font-semibold">
                  {formatDate(invoice.dueDate, 'long')}
                </p>
              </div>
            </div>

            {/* 2c. Fatura Kalemleri (Items) Tablosu */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Açıklama</TableHead>
                    <TableHead className="text-right">Miktar</TableHead>
                    <TableHead className="text-right">Birim Fiyat</TableHead>
                    <TableHead className="text-right">Toplam</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.description}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* 2d. Notlar (Notes) */}
            {invoice.notes && (
              <div className="rounded-md border bg-muted/50 p-4">
                 <h4 className="text-sm font-medium text-muted-foreground">
                   Notlar
                 </h4>
                <p className="text-sm">{invoice.notes}</p>
              </div>
            )}

          </CardContent>

          {/* 2e. Fatura Alt Bilgisi (Footer) - Toplam Tutar */}
          <CardFooter className="flex justify-end border-t p-6">
            <div className="grid w-full max-w-sm gap-4 text-right">
              {/*
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ara Toplam</span>
                <span>{formatCurrency(invoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vergi (%18)</span>
                <span>{formatCurrency(invoice.totalAmount * 0.18)}</span>
              </div>
              <div className="border-t" />
              */}
              <div className="flex justify-between">
                <span className="text-lg font-bold">GENEL TOPLAM</span>
                <span className="text-lg font-bold">
                  {formatCurrency(invoice.totalAmount)}
                </span>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  );
};

export default BillingDetailPage;