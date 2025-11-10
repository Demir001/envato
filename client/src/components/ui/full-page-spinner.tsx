import { Loader2 } from 'lucide-react';

/**
 * FullPageSpinner Bileşeni
 *
 * 'App.tsx' içinde React.Suspense (lazy loading) için 'fallback'
 * olarak kullanılır. Sayfanın tamamını kaplayan, ortalanmış bir
 * yükleme göstergesi (spinner) sağlar.
 */
const FullPageSpinner = () => {
  return (
    <div
      role="status"
      aria-label="Sayfa yükleniyor..."
      className="flex min-h-screen w-full items-center justify-center bg-background"
    >
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <span className="sr-only">Yükleniyor...</span>
    </div>
  );
};

export default FullPageSpinner;

/**
 * Spinner Bileşeni (Gömülü versiyon)
 * Sayfanın tamamını kaplamayan, bir düğmenin veya kartın
 * içinde kullanılabilen daha küçük spinner.
 *
 * @example
 * <Button disabled>
 * <Spinner className="mr-2" />
 * Kaydediliyor...
 * </Button>
 */
export const Spinner = ({ className, ...props }: React.ComponentProps<'svg'>) => {
  return (
    <Loader2
      className={`h-4 w-4 animate-spin ${className}`}
      {...props}
    />
  );
};