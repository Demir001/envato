import { create } from 'zustand';

// Zustand store'unun state (durum) arayüzü
interface SidebarState {
  /**
   * Sidebar'ın mobil görünümde açık (true) veya kapalı (false)
   * olduğunu belirler.
   */
  isOpen: boolean;
}

// Store'daki eylemlerin (actions) arayüzü
interface SidebarActions {
  /**
   * Sidebar'ı açar.
   */
  open: () => void;

  /**
   * Sidebar'ı kapatır.
   */
  close: () => void;

  /**
   * Sidebar'ın mevcut durumunu tersine çevirir (açıksa kapatır, kapalıysa açar).
   */
  toggle: () => void;
}

/**
 * Zustand Sidebar Store
 *
 * Bu store, özellikle mobil cihazlarda sidebar menüsünün
 * (açma/kapama) durumunu global olarak yönetmek için kullanılır.
 * 'persist' middleware'i KULLANILMAZ, çünkü bu durumun
 * sayfa yenilemeleri arasında hatırlanması istenmez (genellikle kapalı başlar).
 */
export const useSidebarStore = create<SidebarState & SidebarActions>((set) => ({
  isOpen: false, // Başlangıçta (mobil için) kapalı

  /**
   * AÇMA EYLEMİ
   * 'isOpen' durumunu 'true' olarak ayarlar.
   */
  open: () => set({ isOpen: true }),

  /**
   * KAPATMA EYLEMİ
   * 'isOpen' durumunu 'false' olarak ayarlar.
   */
  close: () => set({ isOpen: false }),

  /**
   * TOGGLE (TERSİNE ÇEVİRME) EYLEMİ
   * 'set' fonksiyonunun state callback'ini kullanarak
   * mevcut 'isOpen' durumunu okur ve tersiyle günceller.
   */
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}));