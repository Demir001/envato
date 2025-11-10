import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Table (Tablo) Bileşenleri
 *
 * Bu dosya, TanStack Table (react-table) gibi headless (stilsliz)
 * tablo kütüphaneleriyle kullanılmak üzere tasarlanmış,
 * stilize edilmiş temel HTML tablo elemanlarını (<table>, <thead>, <tbody>, <tr>, <th>, <td>)
 * içerir.
 *
 * 'TanStack Table' kancası ('useReactTable') bize hangi elemanın
 * (örn. 'th', 'td') render edileceğini söyler, biz de bu
 * stilize bileşenleri kullanarak tabloyu oluştururuz.
 *
 * Örnek (TanStack Table ile):
 * <table>
 * <TableHeader>
 * ... (headerGroup.map)
 * <TableRow>
 * ... (header.map)
 * <TableHead>{flexRender(header.column.columnDef.header, ...)}</TableHead>
 * ...
 * </TableRow>
 * ...
 * </TableHeader>
 * <TableBody>
 * ... (row.map)
 * <TableRow>
 * ... (cell.map)
 * <TableCell>{flexRender(cell.column.columnDef.cell, ...)}</TableCell>
 * ...
 * </TableRow>
 * ...
 * </TableBody>
 * </table>
 */

// --- Ana Tablo Konteyneri (<table>) ---
const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn('w-full caption-bottom text-sm', className)}
      {...props}
    />
  </div>
));
Table.displayName = 'Table';

// --- Tablo Başlığı (<thead>) ---
const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
));
TableHeader.displayName = 'TableHeader';

// --- Tablo Gövdesi (<tbody>) ---
const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('[&_tr:last-child]:border-0', className)} // Son satırın alt çizgisini kaldır
    {...props}
  />
));
TableBody.displayName = 'TableBody';

// --- Tablo Alt Bilgisi (<tfoot>) ---
const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      'border-t bg-muted/50 font-medium [&>tr]:last:border-b-0',
      className,
    )}
    {...props}
  />
));
TableFooter.displayName = 'TableFooter';

// --- Tablo Satırı (<tr>) ---
const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'border-b transition-colors',
      'hover:bg-muted/50', // Satırın üzerine gelince (hover) arka planı değiştir
      'data-[state=selected]:bg-muted', // TanStack Row Selection ile uyumlu
      className,
    )}
    {...props}
  />
));
TableRow.displayName = 'TableRow';

// --- Tablo Başlık Hücresi (<th>) ---
const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'h-12 px-4 text-left align-middle font-medium text-muted-foreground',
      '[&>[role=button]]:flex [&>[role=button]]:items-center', // TanStack Sorting (Sıralama) iconları için
      className,
    )}
    {...props}
  />
));
TableHead.displayName = 'TableHead';

// --- Tablo Veri Hücresi (<td>) ---
const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn('p-4 align-middle', className)} // Pading 'p-4' olarak ayarlandı
    {...props}
  />
));
TableCell.displayName = 'TableCell';

// --- Tablo Açıklaması (<caption>) ---
const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn('mt-4 text-sm text-muted-foreground', className)}
    {...props}
  />
));
TableCaption.displayName = 'TableCaption';

// Tüm bileşenleri dışa aktar
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};