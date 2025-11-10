"use client";


import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme={'system' as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          error:
            'group-[.toast]:bg-destructive group-[.toast]:text-destructive-foreground group-[.toaster]:border-destructive/50',
          success:
            'group-[.toast]:bg-primary/90 group-[.toast]:text-primary-foreground group-[.toaster]:border-primary/50', // Başarıyı 'primary' ile gösteriyoruz
          warning:
            'group-[.toast]:bg-yellow-500 group-[.toast]:text-white group-[.toaster]:border-yellow-500/50',
          info: 'group-[.toast]:bg-blue-500 group-[.toast]:text-white group-[.toaster]:border-blue-500/50',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };