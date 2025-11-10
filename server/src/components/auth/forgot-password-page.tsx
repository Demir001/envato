"use client";

import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
// import { useForgotPassword } from '@/api/auth-api'; // TODO: API hook'u (Bu v1'de atlandı)

/**
 * Zod Validasyon Şeması (Şifremi Unuttum)
 */
const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'E-posta adresi gereklidir.' })
    .email('Geçersiz e-posta adresi.'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

/**
 * ForgotPasswordPage (Şifremi Unuttum Sayfası)
 *
 * '/auth/forgot-password' rotasında, 'AuthLayout' içinde 'Outlet'
 * aracılığıyla render edilir.
 *
 * NOT: Bu v1 (MVP) projesinde, backend (sunucu) tarafında
 * bir e-posta gönderme (SMTP) servisi veya şifre sıfırlama
 * token'ı mekanizması (Adım 1-62) oluşturmadık.
 *
 * Bu nedenle, bu form şu anda *işlevsel değildir* (mock-up).
 * Sadece UI (arayüz) ve validasyon içerir.
 */
const ForgotPasswordPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // 1. (Mock) React Query 'useMutation'
  // const { mutate: requestReset, isPending } = useForgotPassword();
  const isPending = false; // Mock durum

  // 2. React Hook Form
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  // 3. Form Gönderme (Submit) Fonksiyonu
  const onSubmit = (data: ForgotPasswordFormValues) => {
    // Gerçek uygulamada:
    // requestReset(data, {
    //   onSuccess: () => {
    //     toast.success("Şifre sıfırlama bağlantısı e-postanıza gönderildi.");
    //     navigate('/auth/login');
    //   },
    //   onError: (error) => { ... }
    // });

    // Mock (Sahte) İşlem:
    console.log('Şifre sıfırlama isteği (mock):', data);
    toast.info(
      'Bu özellik şu anda aktif değildir. (Backend e-posta servisi kurulmadı)',
    );
    // navigate('/auth/login');
  };

  return (
    <>
      <Helmet>
        <title>{t('login.forgot_password')} - ClinicAdmin</title>
      </Helmet>

      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('login.forgot_password')}
        </h1>
        <p className="text-sm text-muted-foreground">
          E-postanızı girin, size şifrenizi sıfırlama bağlantısı gönderelim.
        </p>
      </div>

      {/* Şifremi Unuttum Formu */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('login.email')}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="ornek@klinik.com"
                    autoComplete="email"
                    disabled={isPending}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" isLoading={isPending}>
            {isPending ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
          </Button>
        </form>
      </Form>

      {/* Giriş (Login) Sayfasına Geri Dön Linki */}
      <p className="px-8 text-center text-sm text-muted-foreground">
        <Link
          to="/auth/login"
          className="font-medium text-primary hover:underline"
        >
          {t('register.login')}
        </Link>
      </p>
    </>
  );
};

export default ForgotPasswordPage;