import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, selectUserRole } from '@/store/use-auth-store';
import { toast } from 'sonner';

/**
 * RoleGuard (Rol Kontrolü Koruyucusu)
 *
 * 'App.tsx' içinde belirli rotaları (örn. '/staff' - Personel Yönetimi)
 * sarmalar ve sadece belirli kullanıcı rollerinin (örn. 'admin')
 * bu sayfalara erişmesine izin verir.
 *
 * Sorumlulukları:
 * 1. 'allowedRoles' (izin verilen roller) dizisini prop olarak almak.
 * 2. Mevcut kullanıcının rolünü (Zustand store'dan) kontrol etmek.
 * 3. Eğer kullanıcının rolü 'allowedRoles' içinde *yoksa*,
 * kullanıcıyı 'Dashboard' ana sayfasına ('/dashboard') yönlendirmek
 * ve bir hata bildirimi (toast) göstermek.
 * 4. Eğer rol *varsa*, alt bileşenleri (children) (örn. <StaffListPage />)
 * render etmek.
 *
 * ÖNEMLİ: Bu koruyucu (Guard), her zaman 'AuthGuard' (Giriş Kontrolü)
 * *içinde* kullanılmalıdır.
 *
 * @example
 * <Route
 * path="staff"
 * element={
 * <RoleGuard allowedRoles={['admin']}>
 * <StaffListPage />
 * </RoleGuard>
 * }
 * />
 */
const RoleGuard = ({
  children,
  allowedRoles,
}: {
  children: React.ReactElement;
  allowedRoles: ('admin' | 'doctor' | 'reception')[];
}) => {
  // 1. Mevcut kullanıcının rolünü Zustand store'dan al
  // 'selectUserRole' selector'ü, sadece rol değiştiğinde
  // yeniden render tetikler.
  const userRole = useAuthStore(selectUserRole);
  const location = useLocation();

  // 2. Rolü kontrol et
  // 'userRole' (örn. 'doctor') 'allowedRoles' (örn. ['admin'])
  // dizisi içinde mi?
  const hasPermission = userRole && allowedRoles.includes(userRole);

  // 3. İzin (Permission) Yoksa
  if (!hasPermission) {
    // Kullanıcı giriş yapmış ancak rolü yetersiz.
    // (Eğer 'userRole' undefined ise, 'AuthGuard'
    // zaten bu sayfaya erişimi engellemiş olmalıydı).

    // Bir hata bildirimi (toast) göster.
    // 'useEffect' içine alarak çift render'ı önle (strict mode)
    React.useEffect(() => {
      toast.error('Bu sayfaya erişim yetkiniz bulunmuyor.');
    }, [location]); // Sadece 'location' değiştiğinde göster

    // Kullanıcıyı 'Dashboard' ana sayfasına yönlendir.
    // 'replace: true' -> Tarayıcı geçmişinde "yetkisiz"
    // sayfayı tutmaz (Geri tuşu düzgün çalışır).
    return <Navigate to="/dashboard" replace />;
  }

  // 4. İzin Varsa
  // Alt bileşeni (children) (yani korunan sayfayı) render et.
  return children;
};

export default RoleGuard;