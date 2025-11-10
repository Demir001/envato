"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'; // Adım 94
import { IStaffUser } from '@/api/staff-api'; // Adım 78
import { Skeleton } from '@/components/ui/skeleton'; // Adım 115.1 (sonraki)

/**
 * CalendarToolbar (Takvim Araç Çubuğu)
 *
 * 'calendar-page.tsx' (Ana Takvim Sayfası) içinde kullanılır.
 * Takvimin sağ üst köşesinde yer alır ve ek filtreler (örn. Doktor Filtresi)
 * veya eylemler (örn. "Yeni Randevu Ekle" düğmesi) içerir.
 */

interface CalendarToolbarProps {
  /**
   * API'den gelen doktor listesi (useGetStaffList)
   */
  doctors: IStaffUser[];
  /**
   * 'calendar-page.tsx' state'inden gelen,
   * şu anda seçili olan doktorun ID'si ('all' veya sayı)
   */
  selectedDoctorId: string;
  /**
   * 'calendar-page.tsx' state'ini güncelleyen
   * callback fonksiyonu
   */
  onDoctorChange: (doctorId: string) => void;
  /**
   * Doktor listesinin yüklenip yüklenmediği
   */
  isLoading: boolean;
}

export const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
  doctors,
  selectedDoctorId,
  onDoctorChange,
  isLoading,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-4">
      {/*
        TODO: "Yeni Randevu Ekle" düğmesi.
        (Bu, 'handleDateSelect' (boş tarihe tıklama)
        ile aynı işlevi (modalı açma) yapacağı için
        v1'de opsiyoneldir.)
      */}
      {/*
      <Button>
        {t('calendar.new_appointment')}
      </Button>
      */}

      {/* --- Doktor Filtresi (Select) --- */}
      {isLoading ? (
        // Doktor listesi yüklenirken 'Skeleton' (İskelet) göster
        <Skeleton className="h-10 w-48 rounded-md" />
      ) : (
        // Liste yüklendiğinde 'Select' kutusunu göster
        <Select
          value={selectedDoctorId}
          onValueChange={onDoctorChange} // State'i (parent) güncelle
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t('calendar.all_doctors')} />
          </SelectTrigger>
          <SelectContent>
            {/* 1. "Tüm Doktorlar" seçeneği */}
            <SelectItem value="all">{t('calendar.all_doctors')}</SelectItem>
            
            {/* 2. API'den gelen doktor listesi */}
            {doctors.map((doctor) => (
              <SelectItem key={doctor.id} value={doctor.id.toString()}>
                {doctor.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};