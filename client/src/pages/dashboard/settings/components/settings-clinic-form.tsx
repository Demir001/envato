"use client";

import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { IClinicSettings } from '@/api/settings-api'; // Adım 80

/**
 * SettingsClinicForm (Klinik Ayarları Formu)
 *
 * 'settings-page.tsx' (Adım 137) içinde, "Klinik Detayları"
 * sekmesi (Tab) altında render edilir.
 *
 * Sorumlulukları:
 * 1. 'clinicName' (Klinik Adı) ve 'currencySymbol' (Para Birimi)
 * alanlarını içeren formu 'react-hook-form' ile yönetmek.
 * 2. 'initialData' (prop) ile formu doldurmak.
 * 3. Form gönderildiğinde (submit), 'onSubmit' (prop)
 * fonksiyonunu (parent'taki 'updateSettings' mutate'i)
 * tetiklemek.
 */

// --- Zod Validasyon Şeması ---
// 'settings.validation.ts' (Adım 59) ile eşleşmeli.
const clinicFormSchema = z.object({
  clinicName: z
    .string()
    .min(2, 'Klinik adı en az 2 karakter olmalıdır.'),
  currencySymbol: z
    .string()
    .min(1, 'Para birimi sembolü zorunludur.')
    .max(5, 'Sembol çok uzun.'),
});

type ClinicFormValues = z.infer<typeof clinicFormSchema>;

// --- Bileşen (Component) Props ---
interface SettingsClinicFormProps {
  initialData?: IClinicSettings;
  onSubmit: (data: Partial<IClinicSettings>) => void;
  isSubmitting: boolean;
}

export const SettingsClinicForm: React.FC<SettingsClinicFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting,
}) => {
  const { t } = useTranslation();

  // 1. React Hook Form
  const form = useForm<ClinicFormValues>({
    resolver: zodResolver(clinicFormSchema),
    // 'defaultValues', 'initialData' (prop) veya
    // varsayılan (fallback) değerler kullanır.
    defaultValues: {
      clinicName: initialData?.clinicName || 'Benim Kliniğim',
      currencySymbol: initialData?.currencySymbol || '₺',
    },
  });

  // 'initialData' (API'den) yüklendiğinde formu 'reset'le (güncelle)
  useEffect(() => {
    if (initialData) {
      form.reset({
        clinicName: initialData.clinicName || '',
        currencySymbol: initialData.currencySymbol || '₺',
      });
    }
  }, [initialData, form]);

  // 2. Form Gönderme (Submit) Fonksiyonu
  const handleFormSubmit = (data: ClinicFormValues) => {
    // 'onSubmit' (prop) fonksiyonunu çağır
    onSubmit(data);
  };

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)}>
          <CardHeader>
            <CardTitle>{t('settings.clinic_details')}</CardTitle>
            <CardDescription>
              Kliniğinizin adını ve faturalarda kullanılacak
              para birimini belirleyin.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* 1. Klinik Adı (clinicName) */}
            <FormField
              control={form.control}
              name="clinicName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('settings.form_clinic_name')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Gemini Sağlık Kliniği"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 2. Para Birimi (currencySymbol) */}
            <FormField
              control={form.control}
              name="currencySymbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('settings.form_currency_symbol')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="₺"
                      className="max-w-[100px]" // Küçük input alanı
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('settings.form_currency_help')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          
          <CardFooter className="flex justify-end border-t px-6 py-4">
            <Button type="submit" isLoading={isSubmitting}>
              {isSubmitting
                ? t('generics.saving')
                : t('generics.save_changes')}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};