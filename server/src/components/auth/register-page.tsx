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
import { useRegister } from '@/api/auth-api'; // Adım 73'te oluşturuldu

/**
 * Zod Validasyon Şeması (Kayıt)
 *
 * Backend 'registerSchema' (Adım 25) ile eşleşmelidir.
 * 'passwordConfirmation' (Şifre Tekrarı) alanı ekleyerek
 * frontend'de (istemci tarafı) şifrelerin eşleştiğini
 * kontrol ederiz ('refine' metodu ile).
 */
const registerFormSchema = z
  .object({
    clinicName: z
      .string()
      .min(2, 'Klinik adı en az 2 karakter olmalıdır.'),
    userName: z.string().min(2, 'Adınız en az 2 karakter olmalıdır.'),
    email: z.string().email('Geçersiz e-posta adresi.'),
    password: z.string().min(8, 'Şifre en az 8 karakter olmalıdır.'),
    passwordConfirmation: z
      .string()
      .min(8, 'Şifre tekrarı en az 8 karakter olmalıdır.'),
  })
  // 'refine', Zod'un gelişmiş kuralıdır.
  // 'data.password' ile 'data.passwordConfirmation'
  // eşleşmiyorsa, 'passwordConfirmation' alanına (path)
  // özel bir hata (message) ekler.
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'Şifreler eşleşmiyor.',
    path: ['passwordConfirmation'],
  });

// Şemadan TypeScript tipini (type) çıkar
type RegisterFormValues = z.infer<typeof registerFormSchema>;

/**
 * RegisterPage (Kayıt Sayfası)
 *
 * '/auth/register' rotasında, 'AuthLayout' içinde 'Outlet'
 * aracılığıyla render edilir.
 */
const RegisterPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // 1. React Query 'useMutation' (Register Hook)
  // 'auth-api.ts' (Adım 73) içinden 'useRegister' kancasını kullan.
  const { mutate: registerUser, isPending: isRegistering } = useRegister();

  // 2. React Hook Form
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      clinicName: '',
      userName: '',
      email: '',
      password: '',
      passwordConfirmation: '',
    },
  });

  // 3. Form Gönderme (Submit) Fonksiyonu
  const onSubmit = (data: RegisterFormValues) => {
    // console.log('Kayıt formu verisi:', data);

    // 'passwordConfirmation' alanını backend'e GÖNDERME.
    // Backend API'si (Adım 25, 28) 'clinicName', 'userName',
    // 'email' ve 'password' bekler.
    const { passwordConfirmation, ...apiPayload } = data;

    // 'useRegister' (useMutation) kancasının 'mutate' fonksiyonunu çağır
    registerUser(apiPayload, {
      onSuccess: (response: any) => {
        // 'response' (Adım 73) toast mesajını zaten göstermiş olmalı.
        // Başarılı kayıt sonrası kullanıcıyı 'login' sayfasına yönlendir.
        toast.success(
          response.message || 'Kayıt başarılı. Lütfen giriş yapın.',
        );
        navigate('/auth/login');
      },
      onError: (error: any) => {
        // Hata (örn. 409 - E-posta zaten kullanılıyor)
        // Axios interceptor'ı (Adım 72) zaten bir 'toast'
        // göstermiş olmalı.
        console.error('Register error:', error);
      },
    });
  };

  return (
    <>
      {/* Sayfa başlığını (HTML <title>) dinamik olarak ayarla */}
      <Helmet>
        <title>{t('register.title')} - ClinicAdmin</title>
      </Helmet>

      {/* Form Başlığı */}
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('register.title')}
        </h1>
      </div>

      {/* Kayıt Formu (react-hook-form) */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* 1. Klinik Adı */}
          <FormField
            control={form.control}
            name="clinicName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('register.clinic_name')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Örn: Gemini Sağlık Kliniği"
                    disabled={isRegistering}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 2. Ad Soyad */}
          <FormField
            control={form.control}
            name="userName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('register.your_name')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ahmet Yılmaz"
                    disabled={isRegistering}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 3. E-posta */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('register.email')}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="ahmet@klinik.com"
                    autoComplete="email"
                    disabled={isRegistering}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 4. Şifre */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('register.password')}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={isRegistering}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 5. Şifre Tekrarı */}
          <FormField
            control={form.control}
            name="passwordConfirmation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Şifre Tekrarı</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={isRegistering}
                    {...field}
                  />
                </FormControl>
                {/* 'refine' ile Zod'da tanımlanan "Şifreler eşleşmiyor"
                    hatası burada gösterilir.
                */}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 6. Gönderme (Submit) Düğmesi */}
          <Button
            type="submit"
            className="w-full"
            isLoading={isRegistering}
          >
            {isRegistering ? t('register.signing_up') : t('register.sign_up')}
          </Button>
        </form>
      </Form>

      {/* Giriş (Login) Sayfasına Link */}
      <p className="px-8 text-center text-sm text-muted-foreground">
        {t('register.has_account')}{' '}
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

export default RegisterPage;