"use client";

import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import {
  useGetPatientById,
  useUpdatePatient,
  PatientInput,
} from '@/api/patient-api'; // Adım 74
import { PatientForm } from './components/patient-form'; // Adım 120
import { Spinner } from '@/components/ui/full-page-spinner';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * PatientDetailPage (Hasta Detay/Düzenleme Sayfası)
 *
 * '/patients/:id' rotasında, 'DashboardLayout' içinde 'Outlet'
 * aracılığıyla render edilir.
 *
 * Sorumlulukları:
 * 1. URL'den ':id' (hasta ID'si) parametresini almak ('useParams').
 * 2. 'useGetPatientById' (React Query) kancası ile o hastanın
 * verisini API'den çekmek.
 * 3. Veri yüklenirken (isLoading) veya hata (isError) durumunda
 * ilgili bileşenleri göstermek.
 * 4. 'PatientForm' (Adım 120) bileşenini 'update' (düzenleme)
 * modunda render etmek ve 'initialData' olarak çekilen
 * hasta verisini forma geçmek.
 * 5. Form gönderildiğinde (onSubmit), 'useUpdatePatient' (React Query)
 * kancasını tetiklemek.
 * 6. (v2) Bu formun yanında hastanın randevu geçmişi,
 * faturaları vb. bilgileri de gösterebilir.
 */
const PatientDetailPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // URL'den 'id'yi al
  const patientId = Number(id) || null; // 'id'yi sayıya (number) çevir

  // 1. React Query 'useQuery' (Fetch Hook)
  // 'patient-api.ts' (Adım 74) içinden 'useGetPatientById' kancasını kullan.
  // 'enabled: !!patientId' -> 'patientId' null değilse sorguyu çalıştır.
  const {
    data: patientDataResponse,
    isLoading: isLoadingPatient,
    isError,
    error,
  } = useGetPatientById(patientId);

  // 2. React Query 'useMutation' (Update Hook)
  const { mutate: updatePatient, isPending: isSubmitting } =
    useUpdatePatient();

  // 3. Form Gönderme (Submit) Fonksiyonu
  // Bu fonksiyon, 'PatientForm' (child) bileşenine
  // 'onSubmit' prop'u olarak geçirilir.
  const handleUpdatePatient = (data: PatientInput) => {
    if (!patientId) return; // ID yoksa (teorik olarak imkansız) işlemi durdur

    // 'mutate' (updatePatient) fonksiyonunu çağır
    updatePatient(
      { id: patientId, patientData: data },
      {
        onSuccess: (response) => {
          // Başarılı güncelleme sonrası:
          // (API kancası 'toast'u ve 'cache invalidation'ı
          // (Adım 74) zaten hallediyor.)
          
          // (Opsiyonel) Kullanıcıyı 'Hasta Listesi'ne geri yönlendir
          toast.success(
            response.message || 'Hasta başarıyla güncellendi.',
          );
          // navigate('/patients');
        },
        onError: (error: any) => {
          // (Hata 'toast'u 'axios-instance' (Adım 72)
          // tarafından zaten hallediliyor.)
          console.error('Update patient error:', error);
        },
      },
    );
  };

  // --- Render Mantığı ---

  // 4. Yükleme (Loading) Durumu
  if (isLoadingPatient) {
    return (
      <div className="flex h-[calc(100vh-8rem)] w-full items-center justify-center">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  // 5. Hata (Error) Durumu (örn. Hasta bulunamadı - 404)
  if (isError) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-destructive">
          {t('generics.error_message')}: {error?.message}
        </p>
      </div>
    );
  }

  // 6. Başarı Durumu (Veri mevcut)
  const patient = patientDataResponse?.data;
  if (!patient) {
    return <div>{t('generics.error_not_found')}</div>;
  }

  return (
    <>
      {/* Sayfa başlığını (HTML <title>) dinamik olarak ayarla */}
      <Helmet>
        <title>
          {t('patients.update_title')}: {patient.name} - ClinicAdmin
        </title>
      </Helmet>

      <div className="flex flex-col gap-8">
        {/* 1. Başlık ve Geri Düğmesi */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/patients')}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Geri</span>
          </Button>
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {patient.name}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t('patients.update_title')}
            </p>
          </div>
        </div>

        {/* 2. Hasta Düzenleme Formu */}
        {/* TODO: v2 - Bu sayfa 'Tabs' (Sekmeler) içerebilir:
            <Tabs defaultValue="details">
              <TabsList>
                <TabsTrigger value="details">Detaylar</TabsTrigger>
                <TabsTrigger value="appointments">Randevular</TabsTrigger>
                <TabsTrigger value="billing">Faturalar</TabsTrigger>
              </TabsList>
              <TabsContent value="details">
                <PatientForm ... />
              </TabsContent>
              <TabsContent value="appointments">
                <PatientAppointmentList patientId={patientId} />
              </TabsContent>
            </Tabs>
        */}
        
        {/* v1: Sadece form göster */}
        <PatientForm
          mode="update"
          onSubmit={handleUpdatePatient}
          isSubmitting={isSubmitting}
          initialData={patient} // API'den çekilen veriyi forma doldur
        />
      </div>
    </>
  );
};

export default PatientDetailPage;