"use client";

import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/**
 * Label Stilleri
 *
 * 'react-hook-form' ile 'FormItem' içinde kullanıldığında
 * 'aria-invalid' (hata durumu) için stilleri yönetir.
 */
const labelVariants = cva(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  {
    variants: {
      // Hata (destructive) varyantı, Zod validasyonu
      // başarısız olduğunda 'FormMessage' tarafından
      // 'useFormField' kancası aracılığıyla otomatik uygulanır.
      isInvalid: {
        true: 'text-destructive', // Hata durumunda etiketi kırmızı yap
      },
    },
    defaultVariants: {
      isInvalid: false,
    },
  },
);

/**
 * Label Bileşeni
 *
 * Erişilebilirlik (a11y) için 'Radix UI Label Primitive' kullanır.
 * Bir 'Input'a tıklandığında ona odaklanmayı (focus) sağlar.
 * 'react-hook-form' entegrasyonu için (bkz: 'form.tsx')
 * 'isInvalid' varyantını destekler.
 */
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, isInvalid, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants({ isInvalid }), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };