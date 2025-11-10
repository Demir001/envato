"use client";

import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core';

import { useGetAppointments, useCreateAppointment, useUpdateAppointment, useDeleteAppointment } from '@/api/appointment-api'; // Adım 75
import { useGetStaffList } from '@/api/staff-api'; // Adım 78 (Doktor listesi için)
import { useAuthStore, selectUserRole } from '@/store/use-auth-store';

import FullCalendarWrapper from '@/components/calendar/full-calendar-wrapper'; // Adım 113
import { AppointmentModal } from '@/components/calendar/appointment-modal'; // Adım 114
import { CalendarToolbar } from '@/components/calendar/calendar-toolbar'; // Adım 115
import { Spinner } from '@/components/ui/full-page-spinner';
import { toast } from 'sonner';

// Randevu Modalının (Adım 114) durumunu (state) yönetmek için tip
export type ModalState = {
  isOpen: boolean;
  // 'null' ise -> Yeni randevu (Tarih seçildi)
  // 'EventClickArg' ise -> Mevcut randevu (Üzerine tıklandı)
  event: EventClickArg | DateSelectArg | null;
  // 'event'in 'id'sini sayı (number) olarak tut
  appointmentId?: number; 
};

/**
 * CalendarPage (Randevu Takvimi Sayfası)
 *
 * '/calendar' rotasında, 'DashboardLayout' içinde 'Outlet'
 * aracılığıyla render edilir.
 *
 * Sorumlulukları:
 * 1. FullCalendar'ın ihtiyaç duyduğu tarih aralığını (start/end) yönetmek.
 * 2. Doktor filtresini (doctorId) yönetmek.
 * 3. 'useGetAppointments' (React Query) kancası ile randevuları çekmek.
 * 4. 'FullCalendarWrapper' bileşenine (Adım 113) verileri ve
 * olay (event) handler'larını (örn. onEventClick, onEventDrop) geçmek.
 * 5. 'AppointmentModal' (Adım 114) bileşeninin açılmasını/kapanmasını
 * ve veriyle dolmasını (yeni/düzenleme) yönetmek.
 */
const CalendarPage = () => {
  const { t } = useTranslation();
  const userRole = useAuthStore(selectUserRole);
  const isAdminOrReception = userRole === 'admin' || userRole === 'reception';

  // --- State Yönetimi ---

  // 1. Takvim Tarih Aralığı (FullCalendar tarafından güncellenir)
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });

  // 2. Doktor Filtresi (CalendarToolbar tarafından güncellenir)
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('all');

  // 3. Randevu Modalı (Açık/Kapalı, Yeni/Düzenleme)
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    event: null,
  });

  // --- API (React Query) Çağrıları ---

  // 1. Randevuları Çek (useGetAppointments)
  // 'enabled' -> Sadece 'dateRange.start' ve 'dateRange.end'
  // FullCalendar tarafından ayarlandığında çalışır.
  const {
    data: appointments = [], // 'select' (Adım 75) sayesinde bu doğrudan dizidir (array)
    isLoading: isLoadingAppointments,
    isError,
  } = useGetAppointments({
    start: dateRange.start,
    end: dateRange.end,
    doctorId: selectedDoctorId === 'all' ? undefined : selectedDoctorId,
  });

  // 2. Doktor Listesini Çek (Filtre için)
  const { data: staffData, isLoading: isLoadingStaff } = useGetStaffList({
    role: 'doctor', // Sadece doktorları getir
    status: 'active', // Sadece aktif doktorları
    limit: 100, // Tüm doktorları al
  });
  const doctors = staffData?.data.users || [];

  // 3. API Eylemleri (Mutations)
  const { mutate: createAppointment } = useCreateAppointment();
  const { mutate: updateAppointment } = useUpdateAppointment();
  const { mutate: deleteAppointment } = useDeleteAppointment();

  // --- Olay (Event) Handler Fonksiyonları (FullCalendar'a gönderilir) ---

  // 1. Takvimde boş bir tarihe tıklandığında (Yeni Randevu)
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    // Sadece admin ve resepsiyon yeni randevu oluşturabilir
    if (!isAdminOrReception) return;

    // FullCalendar'ın API'sini kullanarak seçimi kaldır (deselect)
    selectInfo.view.calendar.unselect();
    // Modalı 'yeni' modunda aç
    setModalState({ isOpen: true, event: selectInfo });
  };

  // 2. Mevcut bir randevunun üzerine tıklandığında (Düzenle/Sil)
  const handleEventClick = (clickInfo: EventClickArg) => {
    // Modalı 'düzenle' modunda aç
    setModalState({
      isOpen: true,
      event: clickInfo,
      appointmentId: Number(clickInfo.event.id), // Event ID'sini al
    });
  };

  // 3. Randevu sürüklenip bırakıldığında (Tarih/Saat Güncelleme)
  const handleEventDrop = (dropInfo: EventDropArg) => {
    // Sadece admin ve resepsiyon sürükleyebilir
    if (!isAdminOrReception) {
      toast.error('Randevu taşıma yetkiniz yok.');
      dropInfo.revert(); // Sürüklemeyi geri al
      return;
    }

    const { event } = dropInfo;
    
    // 'updateAppointment' (useMutation) kancasını çağır
    updateAppointment(
      {
        id: Number(event.id),
        apptData: {
          start: event.startStr, // Yeni başlangıç tarihi
          end: event.endStr, // Yeni bitiş tarihi
        },
      },
      {
        onSuccess: () => {
          toast.success(
            `${event.title} randevusu başarıyla taşındı.`,
          );
        },
        onError: () => {
          // React Query'nin 'onError' (Adım 75)
          // zaten 'invalidateQueries' yaparak
          // event'i eski yerine döndürür.
          toast.error('Randevu taşınamadı.');
        },
      },
    );
  };
  
  // 4. Modal Kapatıldığında
  const handleCloseModal = () => {
    setModalState({ isOpen: false, event: null, appointmentId: undefined });
  };

  return (
    <>
      <Helmet>
        <title>{t('sidebar.calendar')} - ClinicAdmin</title>
      </Helmet>

      <div className="flex flex-col gap-6">
        {/* 1. Başlık ve Toolbar (Filtreler) */}
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <h1 className="text-3xl font-bold tracking-tight">
            {t('calendar.title')}
          </h1>
          {/* CalendarToolbar (Adım 115) - Doktor Filtresi */}
          <CalendarToolbar
            doctors={doctors}
            selectedDoctorId={selectedDoctorId}
            onDoctorChange={setSelectedDoctorId}
            isLoading={isLoadingStaff}
          />
        </div>

        {/* 2. Ana Takvim Alanı */}
        <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
          {/* Yükleniyor (Loading) Durumu
              (isLoadingAppointments -> Randevular yükleniyor)
          */}
          {(isLoadingAppointments) && (
            <div className="absolute z-10 flex h-32 w-32 items-center justify-center">
              <Spinner />
            </div>
          )}
          
          {/* Hata (Error) Durumu */}
          {isError && (
             <p className="text-destructive">
               {t('generics.error_message')}
             </p>
          )}

          {/* FullCalendarWrapper (Adım 113) */}
          <FullCalendarWrapper
            events={appointments}
            // Olay (Event) Handler'ları
            onDateSelect={handleDateSelect}
            onEventClick={handleEventClick}
            onEventDrop={handleEventDrop}
            // Tarih aralığı değiştiğinde 'dateRange' state'ini güncelle
            onDatesSet={(range) =>
              setDateRange({
                start: range.startStr,
                end: range.endStr,
              })
            }
            // Yetkiye (rol) göre düzenlemeyi (sürükleme, seçme) aç/kapat
            isEditable={isAdminOrReception}
          />
        </div>
      </div>
      
      {/* 3. Randevu Modalı (Gizli, state ile açılır) */}
      {/* AppointmentModal (Adım 114) */}
      <AppointmentModal
        state={modalState}
        onClose={handleCloseModal}
        // API (Mutation) fonksiyonlarını prop olarak geç
        createAppointment={createAppointment}
        updateAppointment={updateAppointment}
        deleteAppointment={deleteAppointment}
      />
    </>
  );
};

export default CalendarPage;