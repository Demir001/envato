"use client";

import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

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
  useUpdateStaffPassword,
  ChangePasswordInput,
} from '@/api/staff-api'; // Adım 78 (Güncellendi)

/**
 * StaffPasswordForm (Personel Şifre Değiştirme Formu)
 *
 * 'staff-item-modal.tsx' (Adım 134) içinde,
 * "Şifre Değiştir" düğmesine tıklandığında açılan
 * bir *alt modal* (sub-modal) bileşenidir.
 *
 * Sorumlulukları:
 * 1. Admin'in, seçilen personel (staffId) için
 * yeni bir şifre ve şifre tekrarı girmesini sağlamak.
 * 2. Formu doğrulamak (Zod).
 * 3. 'useUpdateStaffPassword' (React Query) kancasını
 * tetikleyerek şifreyi değiştirmek.
 */

// --- Zod Validasyon Şeması ---
// 'password' ve 'passwordConfirmation' (tekrar) alanlarını
// ve bu ikisinin eşleşmesi gerektiğini ('refine') tanımlar.
const passwordFormSchema = z
  .object({
    newPassword: z.string().min(8, 'Yeni şifre en az 8 karakter olmalıdır.'),
    passwordConfirmation: z
      .string()
      .min(8, 'Şifre tekrarı en az 8 karakter olmalıdır.'),
  })
  .refine((data) => data.newPassword === data.passwordConfirmation, {
    message: 'Şifreler eşleşmiyor.',
    path: ['passwordConfirmation'], // Hatanın 'passwordConfirmation' alanına gitmesi
  });

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

// --- Bileşen (Component) Props ---
interface StaffPasswordFormProps {
  staffId: number;
  staffName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const StaffPasswordForm: React.FC<StaffPasswordFormProps> = ({
  staffId,
  staffName,
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();

  // 1. React Query 'useMutation' (Update Password Hook)
  // 'staff-api.ts' (Adım 78 Güncellendi) içinden 'useUpdateStaffPassword' kancasını kullan.
  const { mutate: updatePassword, isPending: isSubmitting } =
    useUpdateStaffPassword();

  // 2. React Hook Form
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      newPassword: '',
      passwordConfirmation: '',
    },
  });

  // 'useEffect', modal kapandığında formu sıfırlar
  useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  // 3. Form Gönderme (Submit) Fonksiyonu
  const onSubmit = (data: PasswordFormValues) => {
    // 'passwordConfirmation' alanını backend'e GÖNDERME.
    // Backend API'si (Adım 49/51) 'newPassword' bekler.
    const apiPayload: ChangePasswordInput = {
      newPassword: data.newPassword,
    };

    // 'mutate' (updatePassword) fonksiyonunu çağır
    updatePassword(
      { id: staffId, passwordData: apiPayload },
      {
        onSuccess: () => {
          // (API kancası 'toast'u (Adım 78) zaten hallediyor.)
          onClose(); // Şifre modalını kapat
        },
        onError: (error: any) => {
          // (Hata 'toast'u 'axios-instance' (Adım 72)
          // tarafından zaten hallediliyor.)
          console.error('Update password error:', error);
        },
      },
    );
  };

  return (
    // Bu, ana 'StaffItemModal'ın *üzerinde* açılan
    // ikinci bir 'Dialog' bileşenidir.
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Şifre Değiştir</DialogTitle>
          <DialogDescription>
            {staffName} adlı personelin şifresini
            güncelliyorsunuz.
          </DialogDescription>
        </DialogHeader>

        {/* Şifre Değiştirme Formu */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* 1. Yeni Şifre */}
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Yeni Şifre</FormLabel>
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

            {/* 2. Yeni Şifre Tekrarı */}
            <FormField
              control={form.control}
              name="passwordConfirmation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Yeni Şifre (Tekrar)</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  {/* Zod 'refine' hatası (eşleşmiyor) burada görünür */}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Düğmeler (Footer) */}
            <DialogFooter className="pt-4">
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
      </DialogContent>
    </Dialog>
  );
};