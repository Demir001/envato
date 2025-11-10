"use client";

import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Archive,
  UserCog,
  Settings,
} from 'lucide-react';

import { cn } from '@/lib/utils';

// Prop arayüzü
interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Kullanıcının 'admin' olup olmadığını belirler.
   * 'Personel' (Staff) linkini göstermek/gizlemek için kullanılır.
   */
  isAdmin: boolean;
  /**
   * (Mobil Sidebar için) Bir linke tıklandığında
   * çağrılacak opsiyonel bir callback fonksiyonu.
   * (örn. menüyü kapatmak için).
   */
  onLinkClick?: () => void;
}

// Navigasyon linkinin yapısını tanımlayan arayüz
interface NavLinkItem {
  to: string; // React Router 'to' prop'u (örn. "/dashboard")
  icon: React.ElementType; // Lucide ikonu (örn. LayoutDashboard)
  labelKey: string; // i18n JSON dosyasındaki anahtar (örn. "sidebar.dashboard")
  adminOnly: boolean; // Sadece 'admin' rolü mü görebilir?
}

/**
 * SidebarNav Bileşeni
 *
 * Ana navigasyon linklerini (Gösterge Paneli, Hastalar, vb.)
 * 'react-router-dom'dan 'NavLink' kullanarak render eder.
 * Aktif (active) olan linki otomatik olarak vurgular.
 */
export function SidebarNav({
  className,
  isAdmin,
  onLinkClick,
}: SidebarNavProps) {
  // 'useTranslation' kancası, 'tr.json' veya 'en.json'
  // dosyalarından çevirileri ('t' fonksiyonu) alır.
  const { t } = useTranslation();

  // Tüm navigasyon linklerini bir dizi (array) olarak tanımla
  const navLinks: NavLinkItem[] = [
    {
      to: '/dashboard',
      icon: LayoutDashboard,
      labelKey: 'sidebar.dashboard',
      adminOnly: false,
    },
    {
      to: '/calendar',
      icon: Calendar,
      labelKey: 'sidebar.calendar',
      adminOnly: false,
    },
    {
      to: '/patients',
      icon: Users,
      labelKey: 'sidebar.patients',
      adminOnly: false,
    },
    {
      to: '/billing',
      icon: FileText,
      labelKey: 'sidebar.billing',
      adminOnly: false,
    },
    {
      to: '/inventory',
      icon: Archive,
      labelKey: 'sidebar.inventory',
      adminOnly: false,
    },
    {
      to: '/staff', // Personel Yönetimi
      icon: UserCog,
      labelKey: 'sidebar.staff',
      adminOnly: true, // Sadece 'admin' görebilir
    },
    {
      to: '/settings',
      icon: Settings,
      labelKey: 'sidebar.settings',
      adminOnly: false, // Ayarlar (Tüm roller görebilir)
    },
  ];

  /**
   * 'NavLink' bileşeninin 'className' prop'u için bir fonksiyon.
   * 'isActive' (aktif mi?) parametresini React Router'dan alır
   * ve uygun CSS sınıflarını (class) döndürür.
   */
  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 rounded-lg px-3 py-2 transition-all',
      'text-base font-medium', // Font boyutu ve kalınlığı
      isActive
        ? 'bg-accent text-accent-foreground' // Aktif link (vurgulu)
        : 'text-muted-foreground hover:text-foreground', // Pasif link (soluk)
    );

  return (
    <nav
      className={cn(
        'flex flex-col space-y-1 p-4', // Linkler arası boşluk ve padding
        className,
      )}
    >
      {/* Navigasyon linklerini 'map' ile dön ve render et */}
      {navLinks.map((link) => {
        // Eğer link 'adminOnly' (sadece admin) ise VE
        // kullanıcı 'admin' DEĞİLSE, bu linki render etme (null dön).
        if (link.adminOnly && !isAdmin) {
          return null;
        }

        return (
          <NavLink
            key={link.to}
            to={link.to}
            className={getNavLinkClass}
            // 'onLinkClick', mobil menüde tıklandığında menüyü kapatır
            onClick={onLinkClick}
            // 'end' prop'u: 'NavLink'in sadece tam eşleşmede
            // (exact match) 'active' olmasını sağlar.
            // Bu, '/patients' linkinin '/patients/new'
            // adresindeyken aktif *kalmamasını* sağlar (eğer istenirse).
            // Biz *kalmasını* istiyoruz (örn. /patients aktif kalsın).
            // Bu yüzden 'end' prop'unu KULLANMIYORUZ (varsayılan: false).
            // Düzeltme: Ana linkler (örn. /dashboard, /calendar) için 'end'
            // kullanmak, alt sayfalara (örn. /patients/1) gidildiğinde
            // sadece '/patients'in aktif kalmasını sağlar.
            // '/patients' için 'end' KULLANMA.
            // '/dashboard' için 'end' KULLAN.
            end={link.to === '/dashboard' || link.to === '/calendar'}
          >
            {/* Link İkonu */}
            <link.icon className="h-5 w-5" />
            {/* Link Metni (i18n çevirisi) */}
            {t(link.labelKey)}
          </NavLink>
        );
      })}
    </nav>
  );
}