import { ArrowDown, ArrowUp, ArrowDownUp } from 'lucide-react';
import { Column } from '@tanstack/react-table';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'; // Adım 89

/**
 * DataTableColumnHeader (Veri Tablosu Sütun Başlığı)
 *
 * 'TanStack Table' (react-table) ile kullanılan,
 * 'PatientTableColumns' (Adım 119) içinde 'header'
 * olarak render edilen, yeniden kullanılabilir (reusable)
 * bir bileşendir.
 *
 * Sorumlulukları:
 * 1. Sütun başlığını (title) göstermek.
 * 2. Tıklandığında o sütuna göre 'sıralama' (sorting)
 * (asc/desc/none) işlemini tetiklemek.
 * 3. Mevcut sıralama durumuna göre (asc/desc)
 * ilgili ikonu (yukarı/aşağı ok) göstermek.
 *
 * NOT: Bu bileşeni 'ui' (genel) klasörüne koyduk, çünkü
 * 'Patient' (Hasta) tablosu dışında 'Billing' (Fatura) veya
 * 'Inventory' (Stok) tablolarında da yeniden kullanılabilir.
 */

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * TanStack Table'dan gelen 'column' nesnesi.
   * 'getSortByToggleHandler' gibi sıralama
   * fonksiyonlarını içerir.
   */
  column: Column<TData, TValue>;
  /**
   * Sütun başlığında gösterilecek metin (örn. "İsim", "E-posta")
   */
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  // --- Sıralama (Sort) Kontrolü ---

  // 'getCanSort()' -> Bu sütun sıralanabilir mi?
  if (!column.getCanSort()) {
    // Sıralanamıyorsa, sadece başlığı (title) göster
    return <div className={cn(className)}>{title}</div>;
  }

  // 'getIsSorted()' -> Mevcut sıralama durumunu al
  // ('asc', 'desc', veya 'false')
  const sortDirection = column.getIsSorted();

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      {/*
        Bu 'DropdownMenu', başlığa tıklandığında hem sıralama
        yapılmasını (Button) hem de ek eylemler (örn. Gizle)
        sunulmasını sağlar. (Basit versiyonu sadece 'Button' olabilirdi).
      */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {/* 1. Sıralama Düğmesi (Başlık + İkon) */}
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
          >
            <span>{title}</span>
            {/* 2. Sıralama İkonu */}
            {sortDirection === 'desc' ? (
              // Azalan (Desc)
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : sortDirection === 'asc' ? (
              // Artan (Asc)
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              // Sıralı değil
              <ArrowDownUp className="ml-2 h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>

        {/* 3. Açılır Menü (Ek Eylemler) */}
        <DropdownMenuContent align="start">
          {/* Artan Sıralama (Ascending) */}
          <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
            <ArrowUp className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Artan (A-Z)
          </DropdownMenuItem>
          {/* Azalan Sıralama (Descending) */}
          <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
            <ArrowDown className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Azalan (Z-A)
          </DropdownMenuItem>
          
          {/*
          // TODO: v2 - Sütun Gizleme (Column Hiding)
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
            <EyeOff className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Sütunu Gizle
          </DropdownMenuItem>
          */}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}