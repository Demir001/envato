import { Link } from 'react-router-dom';
import { Home, Stethoscope } from 'lucide-react'; // İkonlar

import { cn } from '@/lib/utils';
import { SidebarNav } from './sidebar-nav'; // Sidebar linklerini içeren bileşen
import { useAuthStore, selectUserRole } from '@/store/use-auth-store';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Sidebar (Sol Menü) Bileşeni
 *
 * Bu, 'DashboardLayout' içinde sol tarafta sabit duran
 * ana navigasyon menüsüdür.
 * Sadece 'lg' (masaüstü) ekranlarda görünür ('hidden lg:block').
 */
const Sidebar = ({ className }: SidebarProps) => {
  // Mevcut kullanıcının rolünü Zustand store'dan al
  // 'useAuthStore(selectUserRole)' kullanımı, sadece 'role' değiştiğinde
  // bu bileşenin yeniden render olmasını sağlar (performans optimizasyonu).
  const userRole = useAuthStore(selectUserRole);

  // Rolün 'admin' olup olmadığını kontrol et
  const isAdmin = userRole === 'admin';

  return (
    // 'aside' (veya 'div') etiketi, menü konteyneridir
    <aside
      className={cn(
        'relative h-screen w-72 flex-col border-r',
        'bg-background text-foreground',
        className,
      )}
    >
      <div className="flex h-full max-h-screen flex-col gap-2">
        {/* 1. Logo / Klinik Adı (Üst Kısım) */}
        <div className="flex h-16 items-center border-b px-6">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 font-semibold"
          >
            {/* İkon (Stetoskop) */}
            <Stethoscope className="h-6 w-6 text-primary" />
            {/* Klinik Adı (veya Proje Adı) */}
            <span className="text-lg">ClinicAdmin</span>
          </Link>
        </div>

        {/* 2. Navigasyon Linkleri (Orta Kısım) */}
        <div className="flex-1 overflow-y-auto">
          {/* 'SidebarNav', 'sidebar-nav.tsx' dosyasından
             gelen asıl navigasyon linklerini (nav/a) içerir.
             'isAdmin' prop'u, 'Personel' (Staff) linkinin
             görünürlüğünü kontrol etmek için kullanılır.
          */}
          <SidebarNav isAdmin={isAdmin} />
        </div>

        {/* 3. Alt Kısım (Opsiyonel - örn. Yardım Merkezi) */}
        <div className="mt-auto border-t p-4">
          {/* Buraya opsiyonel bir alt bilgi (footer) eklenebilir */}
          <div className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} ClinicAdmin
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;