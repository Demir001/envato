import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges multiple class values into a single string, resolving Tailwind CSS conflicts.
 *
 * This is a standard utility function (often named `cn`) used in modern
 * Tailwind-based projects (like Shadcn/ui).
 *
 * @param inputs - A list of class values (strings, arrays, objects).
 * @returns A single, clean class string.
 *
 * @example
 * cn("p-4", "font-bold", { "bg-red-500": hasError });
 * // => "p-4 font-bold bg-red-500" (if hasError is true)
 *
 * cn("bg-blue-500", "bg-red-500");
 * // => "bg-red-500" (twMerge resolves the conflict)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as currency.
 * Note: Uses a basic implementation. For production, consider 'Intl.NumberFormat'.
 *
 * @param amount - The number to format.
 * @param currencySymbol - The currency symbol (e.g., "$", "₺").
 * @returns Formatted currency string (e.g., "₺1,250.00").
 */
export function formatCurrency(amount: number, currencySymbol = '₺') {
  const formatter = new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currencySymbol === '₺' ? 'TRY' : 'USD', // Simple mapping
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // 'Intl' might place the symbol differently (e.g., "TRY 1.250,00").
  // If we strictly want the symbol at the front:
  // return `${currencySymbol}${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
  
  // Using Intl is generally safer for i18n
  return formatter.format(amount);
}

/**
 * Formats an ISO date string (YYYY-MM-DD or DateTime) into a readable format.
 * @param dateString - The ISO date string.
 * @param format - 'short' (e.g., "10.11.2025") or 'long' (e.g., "10 Kasım 2025").
 * @returns Formatted date string.
 */
export function formatDate(dateString: string | Date, format: 'short' | 'long' = 'short') {
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    if (format === 'long') {
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
    
    // Default 'short'
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (error) {
    console.error("Invalid date string:", dateString);
    return "Geçersiz Tarih";
  }
}