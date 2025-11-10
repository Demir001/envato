"use client";

import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useCreatePatient, PatientInput } from '@/api/patient-api'; // Adım 74
import { PatientForm } from './components/patient-form'; // Adım 120
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * PatientCreatePage (Yeni Hasta Ekleme Sayfası)
 *
 * '/patients/new' rotasında, 'DashboardLayout' içinde 'Outlet'
 * aracılığıyla render edilir.
 *
 * Sorumlulukları:
 * 1. 'PatientForm' (Adım 120) bileşenini 'create' (yeni)
 * modunda render etmek.
 * 2. 'useCreatePatient' (React Query) kancasını çağırmak.
 * 3. Form gönderildiğinde (onSubmit), 'mutate' (createPatient)
 * fonksiyonunu tetiklemek.
 * 4. Başarılı oluşturma (onSuccess) sonrası kullanıcıyı
 * hasta listesi ('/patients') sayfasına yönlendirmek.
 */
const PatientCreatePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // 1. React Query 'useMutation' (Create Hook)
  // 'patient-api.ts' (Adım 74) içinden 'useCreatePatient' kancasını kullan.
  const { mutate: createPatient, isPending: isSubmitting } = useCreatePatient();

  // 2. Form Gönderme (Submit) Fonksiyonu
  // Bu fonksiyon, 'PatientForm' (child) bileşenine
  // 'onSubmit' prop'u olarak geçirilir.
  const handleCreatePatient = (data: PatientInput) => {
    // 'mutate' (createPatient) fonksiyonunu çağır
    createPatient(data, {
      onSuccess: () => {
        // Başarılı oluşturma sonrası:
        // (API kancası 'toast'u ve 'cache invalidation'ı
        // (Adım 74) zaten hallediyor.)
        
        // Kullanıcıyı 'Hasta Listesi' sayfasına geri yönlendir.
        navigate('/patients');
      },
      onError: (error: any) => {
        // (Hata 'toast'u 'axios-instance' (Adım 72)
        // tarafından zaten hallediliyor.)
        console.error('Create patient error:', error);
      },
    });
  };

  return (
    <>
      {/* Sayfa başlığını (HTML <title>) dinamik olarak ayarla */}
      <Helmet>
        <title>{t('patients.create_title')} - ClinicAdmin</title>
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
              {t('patients.create_title')}
            </h1>
            <p className="text-lg text-muted-foreground">
              Yeni bir hasta kaydı oluşturun.
            </p>
          </div>
        </div>

        {/* 2. Yeni Hasta Formu */}
        <PatientForm
          mode="create"
          onSubmit={handleCreatePatient}
          isSubmitting={isSubmitting}
          // 'initialData' prop'u 'create' modunda GÖNDERİLMEZ (undefined)
        />
      </div>
    </>
  );
};

export default PatientCreatePage;