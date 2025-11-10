"use client";

import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'; // Adım 91
import { Button } from '@/components/ui/button'; // Adım 86
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'; // Adım 88
import { Input } from '@/components/ui/input'; // Adım 87
import { Checkbox } from '@/components/ui/checkbox'; // Adım 127
import { IOpeningHours, IClinicSettings, IDayHours } from '@/api/settings-api'; // Adım 80

/**
 * SettingsHoursForm (Çalışma Saatleri Formu)
 *
 * 'settings-page.tsx' (Adım 137) içinde, "Çalışma Saatleri"
 * sekmesi (Tab) altında render edilir.
 *
 * Sorumlulukları:
 * 1. Haftanın 7 günü için 'isOpen' (Açık mı?), 'open' (Açılış)
 * ve 'close' (Kapanış) ayarlarını içeren formu yönetmek.
 * 2. 'react-hook-form'un 'useFieldArray' kancasını kullanarak
 * bu 7 günlük dinamik (aslında statik 7) listeyi yönetmek.
 * 3. 'initialData' (prop) ile formu doldurmak.
 * 4. Form gönderildiğinde (submit), 'onSubmit' (prop)
 * fonksiyonunu tetiklemek.
 */

// --- Zod Validasyon Şeması ---
// 'settings.validation.ts' (Adım 59) içindeki şemalarla eşleşmeli.

// Tek bir gün için şema
const dayHoursSchema = z.object({
  dayKey: z.string(), // (örn. "mon")
  dayName: z.string(), // (örn. "Pazartesi")
  isOpen: z.boolean(),
  open: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'HH:SS formatı'),
  close: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'HH:SS formatı'),
})
// 'refine' (Gelişmiş Kural): Eğer 'isOpen' (Açık) 'true' ise,
// 'close' (Kapanış) saati 'open' (Açılış) saatinden *sonra* olmalıdır.
.refine(
  (data) => {
    if (!data.isOpen) return true; // Kapalıysa (isOpen=false) kuralı atla
    return data.close > data.open;
  },
  {
    message: 'Kapanış saati, açılış saatinden sonra olmalıdır.',
    path: ['close'], // Hatanın 'close' alanına gitmesi
  }
);

// Formun tamamı için şema (7 günlük dizi)
const openingHoursSchema = z.object({
  days: z.array(dayHoursSchema).length(7, '7 gün olmalı'),
});

type OpeningHoursFormValues = z.infer<typeof openingHoursSchema>;

// --- Bileşen (Component) Props ---
interface SettingsHoursFormProps {
  initialData?: IOpeningHours | null;
  onSubmit: (data: Partial<IClinicSettings>) => void;
  isSubmitting: boolean;
}

// Varsayılan (default) çalışma saatleri (API'den veri gelmezse kullanılır)
const defaultDay = (isOpen: boolean): IDayHours => ({
  open: '09:00',
  close: '17:00',
  isOpen,
});
const defaultHours: IOpeningHours = {
  mon: defaultDay(true),
  tue: defaultDay(true),
  wed: defaultDay(true),
  thu: defaultDay(true),
  fri: defaultDay(true),
  sat: defaultDay(false),
  sun: defaultDay(false),
};

export const SettingsHoursForm: React.FC<SettingsHoursFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting,
}) => {
  const { t } = useTranslation();

  // 'initialData' (API verisi) veya 'defaultHours' (varsayılan)
  const data = initialData || defaultHours;
  
  // Çeviri (i18n) anahtarları ve gün anahtarları (keys)
  const dayKeys: (keyof IOpeningHours)[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const dayLabels: Record<keyof IOpeningHours, string> = {
    mon: t('settings.day_mon'),
    tue: t('settings.day_tue'),
    wed: t('settings.day_wed'),
    thu: t('settings.day_thu'),
    fri: t('settings.day_fri'),
    sat: t('settings.day_sat'),
    sun: t('settings.day_sun'),
  };

  // 1. React Hook Form
  const form = useForm<OpeningHoursFormValues>({
    resolver: zodResolver(openingHoursSchema),
    // 'defaultValues' 'initialData'yı 'useFieldArray'
    // formatına (dizi/array) dönüştürür.
    defaultValues: {
      days: dayKeys.map((key) => ({
        dayKey: key,
        dayName: dayLabels[key],
        isOpen: data[key].isOpen,
        open: data[key].open,
        close: data[key].close,
      })),
    },
  });

  // 'useFieldArray' kancası, formdaki 'days' (günler)
  // dizisini yönetir.
  const { fields } = useFieldArray({
    control: form.control,
    name: 'days',
  });

  // 'initialData' (API'den) yüklendiğinde formu 'reset'le (güncelle)
  useEffect(() => {
    if (initialData) {
      form.reset({
        days: dayKeys.map((key) => ({
          dayKey: key,
          dayName: dayLabels[key],
          isOpen: initialData[key].isOpen,
          open: initialData[key].open,
          close: initialData[key].close,
        })),
      });
    }
  }, [initialData, form, t]); // 't' (çeviri) değişirse de çalış

  // 2. Form Gönderme (Submit) Fonksiyonu
  const handleFormSubmit = (data: OpeningHoursFormValues) => {
    // Formdaki 'days' (günler) dizisini (array),
    // API'nin beklediği 'openingHours' nesne (object)
    // formatına (örn. { mon: {...}, tue: {...} }) dönüştür.
    
    const openingHoursPayload: IOpeningHours = data.days.reduce(
      (acc, day) => {
        acc[day.dayKey as keyof IOpeningHours] = {
          isOpen: day.isOpen,
          open: day.open,
          close: day.close,
        };
        return acc;
      },
      {} as IOpeningHours,
    );

    // 'onSubmit' (prop) fonksiyonunu
    // API'nin beklediği formatla çağır
    onSubmit({
      openingHours: openingHoursPayload,
    });
  };

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)}>
          <CardHeader>
            <CardTitle>{t('settings.opening_hours')}</CardTitle>
            <CardDescription>
              Hastaların randevu alabileceği
              haftalık çalışma saatlerinizi belirleyin.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* 'fields' (useFieldArray'den gelen 7 gün)
              dizisini 'map' (dön) ile render et.
            */}
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-4 items-center gap-4 rounded-md border p-4"
              >
                {/* 1. Sütun: Gün Adı ve Açık/Kapalı Checkbox */}
                <div className="col-span-4 md:col-span-1">
                  <FormField
                    control={form.control}
                    name={`days.${index}.isOpen`}
                    render={({ field: checkboxField }) => (
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={checkboxField.value}
                            onCheckedChange={checkboxField.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-base font-medium">
                          {field.dayName} {/* (örn. "Pazartesi") */}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* 'watch' kancası, bu satırdaki 'isOpen'
                  Checkbox'ının *mevcut* değerini izler.
                */}
                {form.watch(`days.${index}.isOpen`) ? (
                  // Eğer AÇIK (isOpen: true) ise:
                  <>
                    {/* 2. Sütun: Açılış Saati (Open Time) */}
                    <FormField
                      control={form.control}
                      name={`days.${index}.open`}
                      render={({ field: inputField }) => (
                        <FormItem>
                          <FormLabel className="sr-only">Açılış</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              disabled={isSubmitting}
                              {...inputField}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* 3. Sütun: Kapanış Saati (Close Time) */}
                    <FormField
                      control={form.control}
                      name={`days.${index}.close`}
                      render={({ field: inputField }) => (
                        <FormItem>
                          <FormLabel className="sr-only">Kapanış</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              disabled={isSubmitting}
                              {...inputField}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                ) : (
                  // Eğer KAPALI (isOpen: false) ise:
                  <div className="col-span-2 text-sm text-muted-foreground md:col-span-2">
                    Kapalı
                  </div>
                )}
              </div>
            ))}
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