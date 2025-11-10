"use client";

import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
import { useLogin } from '@/api/auth-api'; // Adım 73'te oluşturuldu

/**
 * Zod Validasyon Şeması
 * 'react-hook-form' için form doğrulama kurallarını tanımlar.
 * i18n (çeviri) KULLANILMADI, çünkü 't' hook'u
 * bileşen dışında (burada) çağrılamaz.
 * Hata mesajları 'FormMessage' tarafından (UI katmanında)
 * ele alınabilir veya şimdilik İngilizce/Türkçe kalabilir.
 */
const loginFormSchema = z.object({
  email: z
    .string({ required_error: 'E-posta adresi gereklidir.' })
    .email('Geçersiz e-posta adresi.'),
  password: z
    .string({ required_error: 'Şifre gereklidir.' })
    .min(1, 'Şifre boş olamaz.'), // Backend min 8 istiyor, ama burada sadece 'boş olamaz' diyelim
});

// Şemadan TypeScript tipini (type) çıkar
type LoginFormValues = z.infer<typeof loginFormSchema>;

/**
 * LoginPage (Giriş Sayfası)
 *
 * '/auth/login' rotasında, 'AuthLayout' içinde 'Outlet'
 * aracılığıyla render edilir.
 */
const LoginPage = () => {
  // Çeviri (i18n) fonksiyonunu ('t') al
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // 1. React Query 'useMutation' (Login Hook)
  // 'auth-api.ts' (Adım 73) içinden 'useLogin' kancasını kullan.
  // 'isPending', düğmenin 'isLoading' durumunu kontrol eder.
  const { mutate: loginUser, isPending: isLoggingIn } = useLogin();

  // 2. React Hook Form
  // Formun state'ini (durumunu), validasyonunu (doğrulamasını)
  // ve 'onSubmit' (gönderme) işlemini yönetir.
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema), // Zod'u validasyon çözücü olarak kullan
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // 3. Form Gönderme (Submit) Fonksiyonu
  const onSubmit = (data: LoginFormValues) => {
    // console.log('Form verisi:', data);

    // 'useLogin' (useMutation) kancasının 'mutate' fonksiyonunu çağır
    loginUser(data, {
      onSuccess: () => {
        // Başarılı girişten sonra:
        // 'AuthGuard' (Adım 103) içindeki 'state.from'
        // (kullanıcının gitmek istediği sayfa) var mı?
        const from = location.state?.from?.pathname || '/dashboard';
        
        // Kullanıcıyı 'from' (örn. /patients) veya
        // varsayılan olarak '/dashboard' sayfasına yönlendir.
        navigate(from, { replace: true });
      },
      onError: (error: any) => {
        // Hata (örn. 401 - Yanlış Şifre)
        // Axios interceptor'ı (Adım 72) zaten bir 'toast'
        // göstermiş olmalı.
        // Gerekirse, formu sıfırla:
        // form.resetField('password');
        console.error('Login error:', error);
      },
    });
  };

  return (
    <>
      {/* Sayfa başlığını (HTML <title>) dinamik olarak ayarla */}
      <Helmet>
        <title>{t('login.title')} - ClinicAdmin</title>
      </Helmet>
      
      {/* Form Başlığı */}
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('login.title')}
        </h1>
      </div>

      {/* Giriş Formu (react-hook-form) */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* 1. E-posta Alanı (FormField) */}
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
                    disabled={isLoggingIn} // Giriş yapılırken pasif yap
                    {...field} // 'onChange', 'onBlur', 'value', 'ref'
                  />
                </FormControl>
                {/* Zod validasyon hatası burada gösterilir */}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 2. Şifre Alanı (FormField) */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>{t('login.password')}</FormLabel>
                  <Link
                    to="/auth/forgot-password"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {t('login.forgot_password')}
                  </Link>
                </div>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={isLoggingIn} // Giriş yapılırken pasif yap
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 3. Gönderme (Submit) Düğmesi */}
          <Button
            type="submit"
            className="w-full"
            // 'useMutation' (useLogin) 'isPending' durumuna
            // göre 'isLoading' prop'unu ayarla.
            // (Adım 86'da oluşturulan 'Button' bileşeni
            // 'isLoading' true ise otomatik spinner gösterir.)
            isLoading={isLoggingIn}
          >
            {isLoggingIn ? t('login.logging_in') : t('login.sign_in')}
          </Button>
        </form>
      </Form>

      {/* Kayıt (Register) Sayfasına Link */}
      <p className="px-8 text-center text-sm text-muted-foreground">
        {t('login.no_account')}{' '}
        <Link
          to="/auth/register"
          className="font-medium text-primary hover:underline"
        >
          {t('login.register')}
        </Link>
      </p>
    </>
  );
};

export default LoginPage;