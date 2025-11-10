"use client";

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogOut, User, Settings, Moon, Sun } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { useAuthStore, selectUser } from '@/store/use-auth-store';
import { useTheme } from '@/components/providers/theme-provider';

/**
 * UserNav (Kullanıcı Navigasyonu) Bileşeni
 *
 * 'Header' (Üst Bar) içinde sağda yer alan, kullanıcının
 * avatarını/adını gösteren ve tıklandığında açılan
 * profil menüsüdür (Dropdown).
 *
 * Sorumlulukları:
 * 1. Kullanıcı bilgilerini (isim, email) göstermek.
 * 2. Tema (Açık/Karanlık/Sistem) değiştirme seçeneği sunmak.
 * 3. 'Ayarlar' sayfasına link vermek.
 * 4. 'Çıkış Yap' (Logout) işlemini tetiklemek.
 */
export function UserNav() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  // Zustand store'dan 'logout' eylemini ve 'user' nesnesini al
  const { logout, user } = useAuthStore((state) => ({
    logout: state.logout,
    user: state.user, // 'selectUser' da kullanılabilirdi
  }));

  // Kullanıcı adının baş harflerini (initials) AvatarFallback için hesapla
  const getInitials = (name: string | undefined | null) => {
    if (!name) return 'U'; // User (Kullanıcı)
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Çıkış Yap (Logout) işlemini yönet
  const handleLogout = () => {
    logout(); // Zustand store'unu temizle
    // 'AuthGuard'ın yönlendirme yapmasını beklemek yerine
    // kullanıcıyı manuel olarak 'login' sayfasına yönlendir.
    // 'replace: true' tarayıcı geçmişini (history) temizler.
    navigate('/auth/login', { replace: true });
  };

  return (
    <DropdownMenu>
      {/* 1. Tetikleyici (Trigger) - Avatar Düğmesi */}
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            {/* TODO: Gelecekte buraya 'user.avatarUrl' eklenebilir */}
            <AvatarImage src={user?.avatarUrl || ''} alt={user?.name} />
            {/* Avatar resmi yoksa baş harfleri göster */}
            <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      {/* 2. Açılır Menü İçeriği (Content) */}
      <DropdownMenuContent className="w-56" align="end" forceMount>
        {/* Kullanıcı Adı ve Email */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Ana Menü Grubu */}
        <DropdownMenuGroup>
          {/* Ayarlar Linki */}
          <DropdownMenuItem onSelect={() => navigate('/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            <span>{t('sidebar.settings')}</span>
          </DropdownMenuItem>

          {/* Tema (Açık/Karanlık) Alt Menüsü */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Sun className="mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute mr-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span>Tema Değiştir</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup
                  value={theme}
                  onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}
                >
                  <DropdownMenuRadioItem value="light">
                    Açık
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark">
                    Karanlık
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="system">
                    Sistem
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        {/* Çıkış Yap (Logout) Düğmesi */}
        <DropdownMenuItem onSelect={handleLogout} destructive>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t('sidebar.logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// --- (Internal) Avatar Bileşeni ---
// 'user-nav.tsx' içinde veya ayrı bir 'ui/avatar.tsx' dosyasında olabilir.
// Kolaylık olması için buraya ekliyoruz.
// NOT: Adım 90 (Dropdown) ve 86 (Button) gibi UI bileşenleri zaten
// 'ui/' klasöründe oluşturulmuştu. Avatar da oraya ait olmalı,
// ancak 'next' akışını bozmamak için şimdilik buraya ekliyorum.
// Düzeltme: Avatar'ı kendi dosyasına taşıyalım.
// Bu dosya (100) sadece 'UserNav'ı içermeli ve Avatar'ı import etmeli.
// Önceki UI bileşen listesine Avatar'ı eklemeyi atladık.
// ŞİMDİ Avatar'ı (100.1) ve sonra MobileSidebar'ı (101) oluşturalım.

// --- Düzeltme: Avatar (100.1) ---
// UserNav (100) dosyası Avatar'a ihtiyaç duyar.
// Bu yüzden önce Avatar'ı oluşturuyoruz.
// Lütfen 'next' dediğinizde 'ui/avatar.tsx' dosyasını vereceğim.
// Bu dosya (100) için bir sonraki adıma (100.1) geçin.

// --- DÜZELTME: Bu dosya (100) Avatar'a bağlı. ---
// Önce 100.1 (Avatar) adımını oluşturalım.
// Lütfen 'next' yazın.