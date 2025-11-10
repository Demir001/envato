"use client";

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { UseMutationResult } from '@tanstack/react-query';
import { DateSelectArg, EventClickArg } from '@fullcalendar/core';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'; // Adım 90
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/full-page-spinner';

import { useGetPatients, IPatient } from '@/api/patient-api'; // Adım 74
import { useGetStaffList, IStaffUser } from '@/api/staff-api'; // Adım 78
import {
  CreateAppointmentInput,
  UpdateAppointmentInput,
  AppointmentResponse,
} from '@/api/appointment-api'; // Adım 75

// --- Zod Validasyon Şeması ---
// 'calendar-page' (Adım 112) içinde kullanılan 'ModalState' tipi
type ModalState = {
  isOpen: boolean;
  event: EventClickArg | DateSelectArg | null;
  appointmentId?: number;
};

// Form verisi için Zod şeması
const appointmentFormSchema = z.object({
  patientId: z.string().min(1, 'Hasta seçimi zorunludur.'),
  doctorId: z.string().min(1, 'Doktor seçimi zorunludur.'),
  start: z.string(), // Başlangıç (Gizli input, ISO formatı)
  end: z.string(), // Bitiş (Gizli input, ISO formatı)
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Geçersiz saat formatı (HH:SS).'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Geçersiz saat formatı (HH:SS).'),
  notes: z.string().nullable().optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

// --- Bileşen (Component) Props ---
interface AppointmentModalProps {
  state: ModalState;
  onClose: () => void;
  // API Mutations (calendar-page'den prop olarak alınır)
  createAppointment: UseMutationResult<any, Error, CreateAppointmentInput, unknown>;
  updateAppointment: UseMutationResult<any, Error, { id: number; apptData: UpdateAppointmentInput; }, unknown>;
  deleteAppointment: UseMutationResult<any, Error, number, unknown>;
}

/**
 * AppointmentModal (Randevu Modalı)
 *
 * 'calendar-page.tsx' içinde kullanılır.
 * Yeni randevu oluşturmak (create) veya mevcut
 * bir randevuyu düzenlemek/silmek (update/delete) için kullanılır.
 */
export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  state,
  onClose,
  createAppointment,
  updateAppointment,
  deleteAppointment,
}) => {
  const { t } = useTranslation();

  // --- Modal Durum (State) Yönetimi ---
  // 'state.event' prop'una göre modun 'create' (yeni) mi
  // 'edit' (düzenleme) mi olduğunu belirle.
  const isEditMode = !!state.appointmentId;
  
  // Silme (Delete) onayı için AlertDialog'un durumunu yönet
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);

  // --- API (React Query) Veri Çekme ---
  // Formdaki 'Select' kutularını doldurmak için
  // hasta ve doktor listelerini çek.

  // 1. Hasta Listesi
  const { data: patientsData, isLoading: isLoadingPatients } = useGetPatients({
    limit: 1000, // TODO: Büyük listeler için 'combobox' (arama) kullan
  });
  const patients = patientsData?.data.patients || [];

  // 2. Doktor Listesi
  const { data: staffData, isLoading: isLoadingDoctors } = useGetStaffList({
    role: 'doctor',
    status: 'active',
    limit: 100,
  });
  const doctors = staffData?.data.users || [];

  // --- React Hook Form ---
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
  });

  // 'useEffect', 'state' (modal açıldığında) değiştiğinde
  // formu doldurur (populate).
  useEffect(() => {
    if (state.isOpen && state.event) {
      const { event } = state;
      
      // ISO tarihinden 'HH:mm' formatını al
      const getFormattedTime = (date: Date) => format(date, 'HH:mm');
      // ISO tarihinden 'YYYY-MM-DD' formatını al
      const getFormattedDate = (date: Date) => format(date, 'yyyy-MM-dd');

      if (isEditMode && 'event' in event) {
        // --- DÜZENLEME (EDIT) MODU ---
        // 'EventClickArg' (mevcut randevuya tıklandı)
        const extendedProps = event.event.extendedProps;
        const startDate = event.event.start!;
        const endDate = event.event.end!;
        
        form.reset({
          patientId: extendedProps.patientId.toString(),
          doctorId: extendedProps.doctorId.toString(),
          start: getFormattedDate(startDate),
          end: getFormattedDate(endDate),
          startTime: getFormattedTime(startDate),
          endTime: getFormattedTime(endDate),
          notes: extendedProps.notes || '',
        });
      } else if (!isEditMode && 'start' in event) {
        // --- YENİ (CREATE) MODU ---
        // 'DateSelectArg' (boş tarihe tıklandı/sürüklendi)
        const { start, end } = event;
        
        form.reset({
          patientId: '',
          doctorId: '',
          start: getFormattedDate(start), // YYYY-MM-DD
          end: getFormattedDate(end), // YYYY-MM-DD
          startTime: getFormattedTime(start), // HH:mm
          endTime: getFormattedTime(end), // HH:mm
          notes: '',
        });
      }
    } else {
      // Modal kapandığında formu temizle
      form.reset();
    }
  }, [state.isOpen, state.event, form, isEditMode]);

  // --- Form Gönderme (Submit) Fonksiyonu ---
  const onSubmit = (data: AppointmentFormValues) => {
    // Formdaki tarih (YYYY-MM-DD) ve saat (HH:mm) verilerini
    // tam ISO DateTime (YYYY-MM-DDTHH:mm:ss) formatına birleştir.
    const startISO = `${data.start}T${data.startTime}:00`;
    const endISO = `${data.end}T${data.endTime}:00`;
    
    // API'ye gönderilecek 'payload'
    const apiPayload: CreateAppointmentInput | UpdateAppointmentInput = {
      patientId: Number(data.patientId),
      doctorId: Number(data.doctorId),
      start: startISO,
      end: endISO,
      notes: data.notes,
    };

    if (isEditMode) {
      // --- GÜNCELLEME (UPDATE) ---
      updateAppointment.mutate(
        { id: state.appointmentId!, apptData: apiPayload },
        {
          onSuccess: () => {
            onClose(); // Modalı kapat
            // (toast ve cache invalidation 'useUpdateAppointment'
            // kancası (Adım 75) tarafından otomatik yapılır)
          },
          onError: () => {
            // (toast 'axios-instance' (Adım 72) tarafından
            // otomatik gösterilir)
          },
        },
      );
    } else {
      // --- OLUŞTURMA (CREATE) ---
      createAppointment.mutate(apiPayload as CreateAppointmentInput, {
        onSuccess: () => {
          onClose(); // Modalı kapat
        },
      });
    }
  };

  // --- Silme (Delete) Fonksiyonu ---
  const handleDelete = () => {
    if (isEditMode && state.appointmentId) {
      deleteAppointment.mutate(state.appointmentId, {
        onSuccess: () => {
          setDeleteAlertOpen(false); // Silme Alert'ini kapat
          onClose(); // Ana Modalı kapat
        },
      });
    }
  };
  
  // Yükleme (Loading) durumlarını birleştir
  const isSubmitting = createAppointment.isPending || updateAppointment.isPending;
  const isDataLoading = isLoadingPatients || isLoadingDoctors;

  return (
    <Dialog open={state.isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditMode
              ? t('calendar.update_appointment')
              : t('calendar.new_appointment')}
          </DialogTitle>
          {isEditMode && (
            <DialogDescription>
              {/* Tarih bilgisi (Form yüklendiğinde gelir) */}
              {format(parseISO(`${form.getValues('start')}T${form.getValues('startTime')}:00`), 'dd MMMM yyyy, HH:mm')}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Form Alanı */}
        {isDataLoading ? (
          // Hasta/Doktor listesi yüklenirken
          <div className="flex h-40 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          // Form (Liste yüklendikten sonra)
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* 1. Hasta Seçimi (Select) */}
              <FormField
                control={form.control}
                name="patientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('calendar.form_patient')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('generics.select_option')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {patients.map((p: IPatient) => (
                          <SelectItem key={p.id} value={p.id.toString()}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 2. Doktor Seçimi (Select) */}
              <FormField
                control={form.control}
                name="doctorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('calendar.form_doctor')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('generics.select_option')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {doctors.map((d: IStaffUser) => (
                          <SelectItem key={d.id} value={d.id.toString()}>
                            {d.name} ({d.specialty})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 3. Başlangıç ve Bitiş Saatleri (Yan Yana) */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('calendar.form_start_time')}</FormLabel>
                      <FormControl>
                        <Input type="time" step="900" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('calendar.form_end_time')}</FormLabel>
                      <FormControl>
                        <Input type="time" step="900" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 4. Notlar (Input/Textarea) */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('calendar.form_notes')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Rutin kontrol..."
                        disabled={isSubmitting}
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Modal Alt Bilgisi (Footer) - Düğmeler */}
              <DialogFooter className="pt-4">
                {isEditMode && (
                  // --- Silme (Delete) Düğmesi (Sadece Edit Modunda) ---
                  <AlertDialog
                    open={isDeleteAlertOpen}
                    onOpenChange={setDeleteAlertOpen}
                  >
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="destructive"
                        className="mr-auto" // Sola yasla
                        disabled={deleteAppointment.isPending}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t('generics.delete')}
                      </Button>
                    </AlertDialogTrigger>
                    {/* Silme Onay (Alert) Modalı */}
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {t('calendar.delete_confirm_title')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('calendar.delete_confirm_text')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          {t('generics.cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          isLoading={deleteAppointment.isPending}
                        >
                          {t('generics.delete')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                
                {/* İptal (Cancel) ve Kaydet (Save) Düğmeleri */}
                <Button type="button" variant="outline" onClick={onClose}>
                  {t('generics.cancel')}
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  {t('generics.save')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};