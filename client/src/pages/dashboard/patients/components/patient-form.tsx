"use client";

import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
// --- DÜZELTME BAŞLANGIÇ ---
// Hata: import ... in ... (hatalı)
import { useNavigate } from 'react-router-dom'; // (doğru 'from')
// --- DÜZELTME SONU ---

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea'; // Adım 120.1
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IPatient, PatientInput } from '@/api/patient-api'; // Adım 74

/**
 * PatientForm (Hasta Formu)
 *
 * 'patient-create-page.tsx' (Adım 121) ve
 * 'patient-detail-page.tsx' (Adım 122) içinde kullanılan,
 * yeni hasta ekleme ve mevcut hastayı düzenleme işlemlerini
 * yapan, yeniden kullanılabilir (reusable) bir form bileşenidir.
 */

// --- Zod Validasyon Şeması ---
const patientFormSchema = z.object({
  name: z
    .string()
    .min(3, 'İsim en az 3 karakter olmalıdır.'),
  email: z
    .string()
    .email('Geçersiz e-posta adresi.')
    .optional()
    .nullable()
    .or(z.literal('')), // Boş string'i 'null'a çevir
  phone: z
    .string()
    .min(10, 'Telefon numarası en az 10 haneli olmalıdır.')
    .optional()
    .nullable()
    .or(z.literal('')),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Tarih YYYY-AA-GG formatında olmalıdır.')
    .optional()
    .nullable()
    .or(z.literal('')),
  gender: z
    .enum(['male', 'female', 'other'])
    .optional()
    .nullable(),
  address: z
    .string()
    .optional()
    .nullable(),
  bloodGroup: z
    .string()
    .optional()
    .nullable(),
  notes: z
    .string()
    .optional()
    .nullable(),
});

type PatientFormValues = z.infer<typeof patientFormSchema>;

// --- Bileşen (Component) Props ---
interface PatientFormProps {
  /**
   * Mod: 'create' (yeni) veya 'update' (düzenleme)
   */
  mode: 'create' | 'update';
  /**
   * 'update' modunda, forma doldurulacak mevcut hasta verisi
   */
  initialData?: IPatient;
  /**
   * Form gönderildiğinde (submit) çağrılacak fonksiyon
   * (API 'mutate' fonksiyonu)
   */
  onSubmit: (data: PatientInput) => void;
  /**
   * Formun 'isLoading' durumu (API isteği bekleniyor)
   */
  isSubmitting: boolean;
}

export const PatientForm: React.FC<PatientFormProps> = ({
  mode,
  initialData,
  onSubmit,
  isSubmitting,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // 1. React Hook Form
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    // 'defaultValues', 'initialData' (prop) veya
    // boş string/null kullanır.
    defaultValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      dob: initialData?.dob || '',
      gender: initialData?.gender || undefined,
      address: initialData?.address || '',
      bloodGroup: initialData?.bloodGroup || '',
      notes: initialData?.notes || '',
    },
  });

  // 2. Form Gönderme (Submit) Fonksiyonu
  const handleFormSubmit = (data: PatientFormValues) => {
    // Zod şeması 'optional' ve 'nullable' olduğu için
    // boş string'leri (örn. "") 'null'a çevirerek
    // API'ye (ve veritabanına) temiz veri gönder.
    const cleanData: PatientInput = {
      ...data,
      email: data.email || null,
      phone: data.phone || null,
      dob: data.dob || null,
      gender: data.gender || null,
      address: data.address || null,
      bloodGroup: data.bloodGroup || null,
      notes: data.notes || null,
    };
    
    // 'onSubmit' prop'unu (parent'tan gelen 'mutate' fonksiyonu) çağır
    onSubmit(cleanData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === 'create'
            ? t('patients.create_title')
            : t('patients.update_title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 'Form' (Adım 88) */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-8"
          >
            {/* 1. Sıra: İsim (Zorunlu) */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('patients.form_name')} *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ahmet Yılmaz"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 2. Sıra: E-posta ve Telefon (Grid) */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('patients.form_email')}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="ahmet@example.com"
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
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('patients.form_phone')}</FormLabel>
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
            </div>

            {/* 3. Sıra: Doğum Tarihi, Cinsiyet, Kan Grubu (Grid) */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <FormField
                control={form.control}
                name="dob"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('patients.form_dob')}</FormLabel>
                    <FormControl>
                      {/* TODO: v2 - DatePicker (Popover) kullan */}
                      <Input
                        type="date"
                        placeholder="YYYY-AA-GG"
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
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('patients.form_gender')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || ''}
                      value={field.value || ''}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('generics.select_option')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">
                          {t('patients.gender_male')}
                        </SelectItem>
                        <SelectItem value="female">
                          {t('patients.gender_female')}
                        </SelectItem>
                        <SelectItem value="other">
                          {t('patients.gender_other')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bloodGroup"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('patients.form_blood_group')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="A+"
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

            {/* 4. Sıra: Adres */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('patients.form_address')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Hastanın adresi..."
                      className="min-h-[100px]"
                      disabled={isSubmitting}
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 5. Sıra: Notlar */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('patients.form_notes')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Alerjiler, geçmiş rahatsızlıklar..."
                      className="min-h-[100px]"
                      disabled={isSubmitting}
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 6. Sıra: Düğmeler (Sağa Yaslı) */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/patients')} // İptal et -> Listeye dön
                disabled={isSubmitting}
              >
                {t('generics.cancel')}
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                {isSubmitting
                  ? t('generics.saving')
                  : t('generics.save')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};