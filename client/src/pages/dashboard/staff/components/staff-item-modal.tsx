"use client";

import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyRound } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'; // Adım 89
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'; // Adım 88
import { Button } from '@/components/ui/button'; // Adım 86
import { Input } from '@/components/ui/input'; // Adım 87
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'; // Adım 94
import { Checkbox } from '@/components/ui/checkbox'; // Adım 127
import { Skeleton } from '@/components/ui/skeleton'; // Adım 116
import { StaffPasswordForm } from './staff-password-form'; // Adım 135 (sonraki)

import {
  useGetStaffById,
  useCreateStaff,
  useUpdateStaff,
  CreateStaffInput,
  UpdateStaffInput,
} from '@/api/staff-api'; // Adım 78 (Güncellendi)

/**
 * StaffItemModal (Personel Kalemi Modalı)
 *
 * 'staff-data-table.tsx' (Adım 132) içinde kullanılır.
 * Yeni personel oluşturmak ('create') veya mevcut
 * bir personelin detaylarını ('update') düzenlemek için kullanılır.
 */

// --- Zod Validasyon Şeması ---
// Backend 'user.validation.ts' (Adım 49) ile eşleşmeli.
const staffFormSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalıdır.'),
  email: z.string().email('Geçersiz e-posta adresi.'),
  // 'password' SADECE 'create' modunda gereklidir.
  password: z
    .string()
    .min(8, 'Şifre en az 8 karakter olmalıdır.')
    .optional(),
  role: z.enum(['admin', 'doctor', 'reception'], {
    required_error: 'Rol seçimi zorunludur.',
  }),
  specialty: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
})
// 'refine' (Gelişmiş Kural): Eğer rol 'doctor' ise,
// 'specialty' (Uzmanlık) alanı zorunludur.
.refine(
  (data) => {
    if (data.role === 'doctor' && (!data.specialty || data.specialty.length < 2)) {
      return false;
    }
    return true;
  },
  {
    message: 'Doktor rolü için uzmanlık alanı zorunludur.',
    path: ['specialty'], // Hatanın 'specialty' alanına gitmesi
  }
);

type StaffFormValues = z.infer<typeof staffFormSchema>;

// --- Bileşen (Component) Props ---
interface StaffItemModalProps {
  mode: 'create' | 'update';
  staffId: number | null; // 'update' modu için ID
  isOpen: boolean;
  onClose: () => void;
}

export const StaffItemModal: React.FC<StaffItemModalProps> = ({
  mode,
  staffId,
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const isCreateMode = mode === 'create';
  
  // 'Şifre Değiştir' alt modalının durumu
  const [isPasswordModalOpen, setPasswordModalOpen] = React.useState(false);

  // --- API Kancaları (React Query) ---

  // 1. Veri Çekme (Fetch) - (Sadece 'update' modunda)
  const {
    data: staffDataResponse,
    isLoading: isLoadingStaff,
    isError,
  } = useGetStaffById(isCreateMode ? null : staffId);

  // 2. Eylemler (Mutations)
  const { mutate: createStaff, isPending: isCreating } = useCreateStaff();
  const { mutate: updateStaff, isPending: isUpdating } = useUpdateStaff();

  const isSubmitting = isCreating || isUpdating;

  // --- React Hook Form ---
  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
  });

  // 'useEffect', 'isOpen' veya 'staffDataResponse'
  // (API verisi) değiştiğinde formu doldurur.
  useEffect(() => {
    if (isOpen && isCreateMode) {
      // 'create' modu: Formu sıfırla
      form.reset({
        name: '',
        email: '',
        password: '',
        role: undefined,
        specialty: '',
        phone: '',
        isActive: true,
      });
    } else if (isOpen && !isCreateMode && staffDataResponse) {
      // 'update' modu: Formu API verisiyle doldur
      const staff = staffDataResponse.data;
      form.reset({
        name: staff.name,
        email: staff.email,
        password: '', // 'password' 'update'te GÖSTERİLMEZ/GÖNDERİLMEZ
        role: staff.role,
        specialty: staff.specialty,
        phone: staff.phone,
        isActive: staff.isActive,
      });
    }
  }, [isOpen, isCreateMode, staffDataResponse, form]);

  // --- Form Gönderme (Submit) Fonksiyonu ---
  const onSubmit = (data: StaffFormValues) => {
    if (isCreateMode) {
      // --- OLUŞTURMA (CREATE) ---
      // 'password' zorunlu mu kontrol et
      if (!data.password) {
        form.setError('password', { message: 'Şifre zorunludur.' });
        return;
      }
      
      const payload: CreateStaffInput = {
        ...data,
        password: data.password, // 'optional' tipini 'string'e zorla
      };
      
      createStaff(payload, {
        onSuccess: () => onClose(), // Başarılıysa modalı kapat
      });

    } else if (staffId) {
      // --- GÜNCELLEME (UPDATE) ---
      // 'password' ve 'email' 'update' payload'undan çıkarılmalıdır.
      // (Backend Adım 49/52: email güncellenemez, şifre ayrı yoldan güncellenir)
      const { password, email, ...updateData } = data;
      
      const payload: UpdateStaffInput = updateData;
      
      updateStaff({ id: staffId, itemData: payload }, {
        onSuccess: () => onClose(), // Başarılıysa modalı kapat
      });
    }
  };
  
  // 'onOpenChange' (Dialog) -> 'isOpen' false olduğunda
  // 'onClose' (parent state) fonksiyonunu çağırır.
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  // 'role' alanı (Select) değiştiğinde 'specialty'
  // (Uzmanlık) alanını (Input) göster/gizle.
  const selectedRole = form.watch('role');

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isCreateMode
                ? t('staff.add_new')
                : `Düzenle: ${staffDataResponse?.data.name || '...'}`}
            </DialogTitle>
            <DialogDescription>
              {isCreateMode
                ? 'Yeni bir personel (Doktor/Resepsiyon) ekleyin.'
                : 'Personel detaylarını güncelleyin.'}
            </DialogDescription>
          </DialogHeader>

          {/* Form Alanı */}
          {isLoadingStaff ? (
            // 'update' modunda veri yüklenirken 'Skeleton' (iskelet) göster
            <div className="space-y-4 py-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            // Form (Veri hazır veya 'create' modu)
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* 1. İsim (Name) */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('staff.table_name')} *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Dr. Ahmet Yılmaz"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 2. E-posta (Email) */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('staff.table_email')} *</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="ahmet@klinik.com"
                          disabled={isSubmitting || !isCreateMode} // E-posta (username) güncellenemez
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* 3. Şifre (Password) - (Sadece 'create' modunda) */}
                {isCreateMode && (
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Şifre *</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            disabled={isSubmitting}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* 4. Rol (Role) ve Uzmanlık (Specialty) */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('staff.table_role')} *</FormLabel>
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
                            <SelectItem value="doctor">{t('staff.role_doctor')}</SelectItem>
                            <SelectItem value="reception">{t('staff.role_reception')}</SelectItem>
                            <SelectItem value="admin">{t('staff.role_admin')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* 'specialty' (Uzmanlık) alanı SADECE 'role'='doctor' ise görünür */}
                  <FormField
                    control={form.control}
                    name="specialty"
                    render={({ field }) => (
                      <FormItem
                        className={selectedRole === 'doctor' ? 'block' : 'hidden'}
                      >
                        <FormLabel>{t('staff.table_specialty')} *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Kardiyoloji"
                            disabled={isSubmitting}
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* 5. Telefon (Phone) ve Durum (Status) */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefon</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="0555 123 4567"
                            disabled={isSubmitting}
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-col justify-end pb-2">
                         <div className="flex items-center space-x-2 rounded-md border p-3">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormLabel>{t('staff.status_active')}</FormLabel>
                         </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Düğmeler (Footer) */}
                <DialogFooter className="pt-4">
                  {/* "Şifre Değiştir" Düğmesi (Sadece 'update' modunda) */}
                  {!isCreateMode && (
                    <Button
                      type="button"
                      variant="secondary"
                      className="mr-auto" // Sola yasla
                      onClick={() => setPasswordModalOpen(true)}
                    >
                      <KeyRound className="mr-2 h-4 w-4" />
                      Şifre Değiştir
                    </Button>
                  )}
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isSubmitting}
                  >
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
      
      {/* (EKLENDİ) Şifre Değiştirme Alt Modalı (Gizli)
        'StaffPasswordForm' (Adım 135 - sonraki)
      */}
      {!isCreateMode && staffId && (
        <StaffPasswordForm
          staffId={staffId}
          staffName={staffDataResponse?.data.name || ''}
          isOpen={isPasswordModalOpen}
          onClose={() => setPasswordModalOpen(false)}
        />
      )}
    </>
  );
};