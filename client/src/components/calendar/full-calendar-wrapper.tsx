"use client";

import React, { useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction'; // Sürükleme (drop) ve seçme (select)
import trLocale from '@fullcalendar/core/locales/tr'; // Türkçe dil paketi
import { useTranslation } from 'react-i18next';
import { EventApi, DateSelectArg, EventClickArg, EventDropArg, DatesSetArg } from '@fullcalendar/core';

import { IAppointmentDetails } from '@/api/appointment-api'; // Adım 75 (API)

/**
 * FullCalendarWrapper (FullCalendar Sarmalayıcısı)
 *
 * 'calendar-page.tsx' (Ana Takvim Sayfası) içinde kullanılır.
 * Bu bileşen, 'FullCalendar' kütüphanesinin React entegrasyonunu
 * ve projemizin gereksinimlerine (i18n, stil, olaylar) göre
 * yapılandırılmasını yönetir.
 *
 * Sorumlulukları:
 * 1. FullCalendar'ı 'tr' (Türkçe) veya 'en' (İngilizce) dilinde
 * (i18n state'ine göre) başlatmak.
 * 2. API'den gelen 'events' (randevular) dizisini FullCalendar
 * formatına dönüştürmek.
 * 3. Kullanıcı etkileşimlerini (tıklama, sürükleme, tarih seçme)
 * yakalamak ve 'calendar-page.tsx'deki (parent)
 * 'handler' fonksiyonlarına (props) iletmek.
 * 4. Tailwind CSS (globals.css) ile uyumlu stil sağlamak.
 */

interface FullCalendarWrapperProps {
  /**
   * API'den gelen randevu listesi (useGetAppointments)
   */
  events: IAppointmentDetails[];
  /**
   * Takvimde boş bir tarihe tıklandığında tetiklenir
   */
  onDateSelect: (selectInfo: DateSelectArg) => void;
  /**
   * Mevcut bir randevuya tıklandığında tetiklenir
   */
  onEventClick: (clickInfo: EventClickArg) => void;
  /**
   * Randevu sürüklenip bırakıldığında tetiklenir
   */
  onEventDrop: (dropInfo: EventDropArg) => void;
  /**
   * Takvimin tarih aralığı değiştiğinde (örn. İleri/Geri) tetiklenir
   */
  onDatesSet: (dateInfo: DatesSetArg) => void;
  /**
   * Kullanıcının takvimi düzenleyip düzenleyemeyeceğini belirler
   * (Sürükleme, seçme)
   */
  isEditable: boolean;
}

const FullCalendarWrapper: React.FC<FullCalendarWrapperProps> = ({
  events,
  onDateSelect,
  onEventClick,
  onEventDrop,
  onDatesSet,
  isEditable,
}) => {
  const { i18n } = useTranslation();
  const calendarRef = useRef<FullCalendar>(null); // Takvim API'sine erişim

  // i18n dili değiştiğinde FullCalendar'ın dilini güncelle
  useEffect(() => {
    calendarRef.current?.getApi().setOption('locale', i18n.language);
  }, [i18n.language]);

  // --- Olayları (Events) FullCalendar Formatına Dönüştür ---
  // API'den gelen 'IAppointmentDetails' dizisini
  // FullCalendar'ın beklediği formata map'le (dönüştür).
  const formattedEvents = events.map((event: IAppointmentDetails) => ({
    id: event.id.toString(),
    title: `${event.patientName} (Dr. ${event.doctorName})`,
    start: event.start, // ISO DateTime (örn. "2024-10-25T10:00:00")
    end: event.end, // ISO DateTime (örn. "2024-10-25T10:30:00")
    // 'extendedProps', 'onEventClick'te (Modal)
    // kolay erişim için ekstra veri taşır.
    extendedProps: {
      patientId: event.patientId,
      doctorId: event.doctorId,
      notes: event.notes,
      status: event.status,
    },
    // Duruma (status) göre stil
    // (Opsiyonel: Renkleri backend'den veya doktora göre de alabiliriz)
    backgroundColor:
      event.status === 'completed'
        ? '#10B981' // Green-500
        : event.status === 'cancelled'
          ? '#6B7280' // Gray-500
          : '#8B5CF6', // Primary (Violet-500)
    borderColor:
      event.status === 'completed'
        ? '#059669'
        : event.status === 'cancelled'
          ? '#4B5563'
          : '#7C3AED',
  }));

  return (
    // FullCalendar'ın stillerinin Tailwind tarafından
    // üzerine yazılmasını önlemek için bir konteyner.
    <div className="fullcalendar-container text-sm">
      <style>
        {`
          /* FullCalendar'ın Tailwind (globals.css) tarafından
             ezilen stillerini düzelt */
          
          .fc .fc-toolbar-title {
            font-size: 1.25rem; /* text-xl */
            font-weight: 600; /* font-semibold */
          }
          .fc .fc-button {
            /* 'Button' (Adım 86) bileşenimizin 'outline'
               varyantını taklit et */
            background-color: transparent;
            border: 1px solid hsl(var(--border));
            color: hsl(var(--foreground));
            padding: 0.5rem 1rem;
            text-transform: none; /* Büyük harf yapma */
            border-radius: 0.5rem; /* --radius */
          }
          .fc .fc-button-primary {
            /* Aktif (Ay/Hafta/Gün) düğmesi */
            background-color: hsl(var(--accent));
            color: hsl(var(--accent-foreground));
            border-color: hsl(var(--border));
          }
          .fc .fc-button:hover, .fc .fc-button:focus {
            background-color: hsl(var(--accent));
            color: hsl(var(--accent-foreground));
          }
          .fc .fc-daygrid-day.fc-day-today {
            /* 'Bugün' (Today) vurgusu */
            background-color: hsl(var(--primary) / 0.1);
          }
          .fc .fc-timegrid-slot-label, .fc .fc-daygrid-day-number {
            color: hsl(var(--muted-foreground));
          }
          .fc .fc-col-header-cell-cushion {
            color: hsl(var(--foreground));
            font-weight: 500;
          }
          .fc .fc-border, .fc th, .fc td {
             border-color: hsl(var(--border));
          }
        `}
      </style>

      <FullCalendar
        ref={calendarRef}
        // --- Eklentiler (Plugins) ---
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        
        // --- Üst Bar (Header) ---
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        
        // --- Temel Ayarlar ---
        initialView="timeGridWeek" // Varsayılan görünüm: Hafta
        height="auto" // Ebeveyn (parent) konteynere sığ
        navLinks={true} // Gün/Hafta adlarına tıklanabilir
        nowIndicator={true} // 'Şu anki saat' çizgisi
        
        // --- Dil (i18n) ---
        locale={i18n.language === 'tr' ? trLocale : 'en'}
        firstDay={1} // Haftanın ilk günü: Pazartesi (1)
        buttonText={{
          today: i18n.language === 'tr' ? 'Bugün' : 'Today',
          month: i18n.language === 'tr' ? 'Ay' : 'Month',
          week: i18n.language === 'tr' ? 'Hafta' : 'Week',
          day: i18n.language === 'tr' ? 'Gün' : 'Day',
        }}
        
        // --- Etkileşim (Interaction) Ayarları ---
        editable={isEditable} // Sürükleme (Drag & Drop)
        selectable={isEditable} // Tarih seçme (Yeni randevu)
        selectMirror={true}
        dayMaxEvents={true}
        
        // --- Veri (Events) ---
        events={formattedEvents} // API'den gelen randevular
        
        // --- Olay (Event) Handler'ları ---
        // Bu fonksiyonlar, 'calendar-page.tsx' (parent)
        // bileşenine prop olarak geçilir.
        select={onDateSelect} // Boş tarihe tıklama
        eventClick={onEventClick} // Randevuya tıklama
        eventDrop={onEventDrop} // Randevuyu sürükleme
        // eventResize={onEventResize} // (v2 - Randevu süresini uzatma)
        datesSet={onDatesSet} // Tarih aralığı değişimi
      />
    </div>
  );
};

export default FullCalendarWrapper;