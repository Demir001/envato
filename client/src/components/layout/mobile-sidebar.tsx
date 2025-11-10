"use client";

import { Link } from 'react-router-dom';
import { Stethoscope } from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle, // SheetClose (Zustand ile manuel kapatılacak)
} from '@/components/ui/sheet'; // Az önce (100.2) oluşturduğumuz Sheet
import { SidebarNav } from './sidebar-nav'; // Adım 98'de oluşturuldu
import { useSidebarStore } from '@/store/use-sidebar-store'; // Adım 71'de oluşturuldu
import { useAuthStore, selectUserRole } from '@/store/use-auth-store';

/**
 * MobileSidebar Bileşeni
 *
 * Sadece 'lg' (tablet/mobil) altı ekranlarda 'Header' (Üst Bar)
 * içindeki hamburger menüye tıklandığında, ekranın solundan kayarak
 * açılan 'Sheet' (Çekmece) bileşenidir.
 *
 * 'Header' (Adım 99) içinde render edilir ancak varsayılan olarak gizlidir.
 * Görünürlüğü (açık/kapalı olma durumu) 'useSidebarStore' (Zustand)
 * tarafından global olarak yönetilir.
 */
export function MobileSidebar() {
  // Zustand store'dan 'isOpen' (açık mı?), 'close' (kapat eylemi)
  // ve 'open' (aç eylemi) al.
  const { isOpen, close, open } = useSidebarStore((state) => ({
    isOpen: state.isOpen,
    close: state.close,
    open: state.open,
  }));

  // 'isAdmin' durumunu al (Personel linki için)
  const isAdmin = useAuthStore(selectUserRole) === 'admin';

  // 'Sheet' bileşeninin 'open' state'i değiştiğinde (örn. 'Esc' tuşu
  // veya dışarı tıklama ile kapandığında) Zustand state'ini güncelle.
  const onOpenChange = (openState: boolean) => {
    if (openState) {
      open();
    } else {
      close();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      {/* 'SheetTrigger' (tetikleyici) 'Header' (Adım 99)
          içindeki 'Button' olduğu için burada GEREKMEZ.
          'Sheet'i doğrudan state (isOpen) ile kontrol ediyoruz.
      */}
      <SheetContent
        side="left" // Soldan açıl
        className="flex h-full max-h-screen w-72 flex-col p-0" // w-72 (Sidebar ile aynı genişlik)
      >
        {/* 1. Logo / Klinik Adı (Üst Kısım) */}
        <SheetHeader className="h-16 items-start border-b px-6">
          <SheetTitle asChild>
            <Link
              to="/dashboard"
              className="flex items-center gap-2 font-semibold"
              onClick={close} // Logoya tıklayınca da menü kapansın
            >
              <Stethoscope className="h-6 w-6 text-primary" />
              <span className="text-lg">ClinicAdmin</span>
            </Link>
          </SheetTitle>
        </SheetHeader>

        {/* 2. Navigasyon Linkleri (Orta Kısım) */}
        <div className="flex-1 overflow-y-auto">
          {/* 'SidebarNav', 'sidebar-nav.tsx' (Adım 98)
             içindeki linkleri render eder.
          */}
          <SidebarNav
            isAdmin={isAdmin}
            // 'onLinkClick={close}' prop'u:
            // Mobil menüde bir linke tıklandığında,
            // 'SidebarNav' bileşeni 'close()' (Zustand)
            // eylemini tetikler ve menü otomatik olarak kapanır.
            onLinkClick={close}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}