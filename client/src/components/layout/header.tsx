import { Link } from 'react-router-dom';
import { Menu, Stethoscope } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { UserNav } from './user-nav'; // Adım 100'de oluşturulacak
import { MobileSidebar } from './mobile-sidebar'; // Adım 101'de oluşturulacak
import { useSidebarStore } from '@/store/use-sidebar-store'; // Mobil menü state'i

/**
 * Header (Üst Bar) Bileşeni
 *
 * 'DashboardLayout' içinde yer alan, sayfanın en üstündeki
 * 'sticky' (sabit) çubuktur.
 *
 * Sorumlulukları:
 * 1. Mobil menü (hamburger) tetikleyicisini göstermek (sadece 'lg' altı).
 * 2. Kullanıcı profil menüsünü (UserNav) göstermek.
 * 3. Mobil sidebar'ı (Sheet/Drawer) render etmek (görünmez, state ile tetiklenir).
 */
const Header = () => {
  // 'useSidebarStore' kancasından 'open' eylemini al
  const openMobileSidebar = useSidebarStore((state) => state.open);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-8">
      {/* 1. Mobil Menü Tetikleyicisi (Hamburger) */}
      {/* 'lg:hidden' ile sadece mobil/tablet (lg altı) ekranlarda görünür */}
      <div className="flex items-center gap-2 lg:hidden">
        <Button
          variant="outline"
          size="icon"
          className="shrink-0"
          onClick={openMobileSidebar} // Tıklandığında Zustand store'unu tetikle
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>

        {/* 2. Mobil Logo (Opsiyonel, hamburger'ın yanında) */}
        <Link
          to="/dashboard"
          className="flex items-center gap-2 font-semibold"
        >
          <Stethoscope className="h-6 w-6 text-primary" />
          <span className="sr-only">ClinicAdmin</span>
        </Link>
      </div>

      {/* 3. Boşluk (Sağa Yaslamak İçin) */}
      {/* 'ml-auto', 'UserNav' bileşenini en sağa iter */}
      <div className="flex w-full items-center justify-end gap-4 md:ml-auto">
        {/* Gelecekte Arama Çubuğu (Search) veya Bildirim (Notification)
            gibi bileşenler buraya eklenebilir. */}
      </div>

      {/* 4. Kullanıcı Profil Menüsü (UserNav) */}
      <div className="flex-shrink-0">
        {/* 'UserNav', bir sonraki adımda (100) oluşturulacak.
            Profil resmi, 'Çıkış Yap' linki vb. içerir.
        */}
        <UserNav />
      </div>

      {/* 5. Mobil Sidebar (Görünmez, state ile tetiklenir) */}
      {/* Bu bileşen (Sheet/Dialog) 'useSidebarStore'u dinler
          ve 'isOpen' true olduğunda kendini gösterir.
          Adım 101'de oluşturulacak.
      */}
      <MobileSidebar />
    </header>
  );
};

export default Header;