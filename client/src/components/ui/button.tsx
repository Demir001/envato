import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { Spinner } from './full-page-spinner'; // Yükleme spinner'ını import et

// --- Düğme (Button) Stillerini Tanımla ---
// 'class-variance-authority' (cva) kullanarak
// farklı düğme varyantları (variant), boyutları (size)
// ve durumları (state) için stilleri yönet.

const buttonVariants = cva(
  // Temel stiller (Tüm düğmelerde ortak)
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    // Varyantlar (Görünüm)
    variants: {
      variant: {
        // 'default': Ana (Primary) düğme
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        // 'destructive': Silme, iptal (Kırmızı)
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        // 'outline': Kenar çizgili (Border)
        outline:
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        // 'secondary': İkincil (Gri)
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        // 'ghost': Hayalet (Arka plansız, hover efekti)
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        // 'link': Bağlantı (Link) (Altı çizgili)
        link: 'text-primary underline-offset-4 hover:underline',
      },
      // Boyutlar (Size)
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10', // Sadece icon içeren düğmeler
      },
    },
    // Varsayılan (default) varyantlar
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

// --- Düğme (Button) Bileşenini Tanımla ---

// Düğmenin alabileceği 'props'ları (özellikleri) tanımla
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Eğer 'true' ise, düğmenin 'children' (içerik) yerine
   * bir 'Spinner' (yükleme göstergesi) gösterilir.
   * Düğme otomatik olarak 'disabled' (pasif) hale gelir.
   */
  isLoading?: boolean;
  /**
   * Eğer 'asChild' 'true' ise, bu bileşen bir 'button' etiketi
   * render etmez. Bunun yerine, 'children' (alt bileşen) olarak
   * verilen bileşeni (örn. '<Link>' veya '<a href...>') alır
   * ve düğme stillerini ona uygular.
   *
   * @example
   * <Button asChild>
   * <Link to="/profil">Profil</Link>
   * </Button>
   * // Sonuç: <a href="/profil" class="...düğme stilleri...">Profil</a>
   */
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        // Eğer 'isLoading' true ise, düğmeyi 'disabled' yap
        disabled={isLoading || props.disabled}
        {...props}
      >
        {/* Düğme içeriği:
           Eğer 'isLoading' true ise, Spinner göster.
           Değilse, 'children' (örn. "Kaydet" yazısı) göster.
        */}
        {isLoading ? <Spinner className="h-4 w-4" /> : children}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };