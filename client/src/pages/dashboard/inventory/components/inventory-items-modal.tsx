"use client";

import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'; // Adım 89
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'; // Adım 88
import { Button } from '@/components/ui/button'; // Adım 86
import { Input } from '@/components/ui/input'; // Adım 87
import { Spinner } from '@/components/ui/full-page-spinner'; // Adım 84
import { Skeleton } from '@/components/ui/skeleton'; // Adım 116

import {
  useGetInventoryItemById,
  useCreateInventoryItem,
  useUpdateInventoryItem,
  CreateItemInput,
  UpdateItemInput,
} from '@/api/inventory-api'; // Adım 77 (Güncellendi)

/**
 * InventoryItemModal (Stok Kalemi Modalı)
 *
 * 'inventory-data-table.tsx' (Adım 128) içinde kullanılır.
 * Yeni stok kalemi oluşturmak ('create') veya mevcut
 * bir kalemin detaylarını ('update') (miktar hariç)
 * düzenlemek için kullanılır.
 */

// --- Zod Validasyon Şeması ---
// Backend 'inventory.validation.ts' (Adım 44) ile eşleşmeli.
const itemFormSchema = z.object({
  name: z.string().min(2, 'Kalem adı en az 2 karakter olmalıdır.'),
  category: z.string().optional().nullable(),
  // 'quantity' (miktar) 'create' modunda gereklidir,
  // 'update' modunda GÖNDERİLMEZ (çünkü 'adjustStock' kullanılır).
  quantity: z
    .number({ invalid_type_error: 'Miktar sayı olmalıdır' })
    .int('Miktar tam sayı olmalıdır')
    .min(0, 'Miktar negatif olamaz')
    .optional(), // 'update' modu için opsiyonel
  lowStockThreshold: z
    .number({ invalid_type_error: 'Eşik sayı olmalıdır' })
    .int('Eşik tam sayı olmalıdır')
    .min(0, 'Eşik negatif olamaz')
    .default(10),
  supplier: z.string().optional().nullable(),
});

type ItemFormValues = z.infer<typeof itemFormSchema>;

// --- Bileşen (Component) Props ---
interface InventoryItemModalProps {
  mode: 'create' | 'update';
  /**
   * 'update' modunda, düzenlenecek kalemin ID'si
   */
  itemId: number | null;
  /**
   * Modalın açık (true) veya kapalı (false) olduğunu belirler
   */
  isOpen: boolean;
  /**
   * Modal kapandığında (içeriden veya dışarıdan)
   * çağrılacak fonksiyon
   */
  onClose: () => void;
}

export const InventoryItemModal: React.FC<InventoryItemModalProps> = ({
  mode,
  itemId,
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const isCreateMode = mode === 'create';

  // --- API Kancaları (React Query) ---

  // 1. Veri Çekme (Fetch) - (Sadece 'update' modunda)
  const {
    data: itemDataResponse,
    isLoading: isLoadingItem, // Kalem verisi yükleniyor
    isError,
  } = useGetInventoryItemById(isCreateMode ? null : itemId); // 'create' modunda 'null' (çalışmaz)

  // 2. Eylemler (Mutations)
  const { mutate: createItem, isPending: isCreating } =
    useCreateInventoryItem();
  const { mutate: updateItem, isPending: isUpdating } =
    useUpdateInventoryItem();

  const isSubmitting = isCreating || isUpdating;

  // --- React Hook Form ---
  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
  });

  // 'useEffect', 'itemDataResponse' (API'den gelen veri)
  // değiştiğinde (yüklendiğinde) formu 'update' modu için doldurur.
  useEffect(() => {
    if (isCreateMode) {
      // 'create' modunda formu sıfırla
      form.reset({
        name: '',
        category: '',
        quantity: 0,
        lowStockThreshold: 10,
        supplier: '',
      });
    } else if (itemDataResponse) {
      // 'update' modunda formu API verisiyle doldur
      const item = itemDataResponse.data;
      form.reset({
        name: item.name,
        category: item.category,
        quantity: item.quantity, // 'quantity' 'update'te GÖNDERİLMEZ, ama gösterilir
        lowStockThreshold: item.lowStockThreshold,
        supplier: item.supplier,
      });
    }
  }, [isOpen, isCreateMode, itemDataResponse, form]);

  // --- Form Gönderme (Submit) Fonksiyonu ---
  const onSubmit = (data: ItemFormValues) => {
    if (isCreateMode) {
      // --- OLUŞTURMA (CREATE) ---
      // 'quantity' (miktar) zorunludur
      if (data.quantity === undefined) {
         form.setError("quantity", { message: "Miktar zorunludur." });
         return;
      }
      
      const payload: CreateItemInput = {
        ...data,
        quantity: data.quantity, // 'optional' tipini 'number'a zorla
      };
      
      createItem(payload, {
        onSuccess: () => onClose(), // Başarılıysa modalı kapat
      });
      
    } else if (itemId) {
      // --- GÜNCELLEME (UPDATE) ---
      // 'quantity' alanı API'ye (PUT) gönderilmez.
      // (Backend Adım 47 - 'quantity' update'i 'adjustStock' ile yapılır)
      const { quantity, ...updatePayload } = data;
      
      const payload: UpdateItemInput = updatePayload;
      
      updateItem({ id: itemId, itemData: payload }, {
        onSuccess: () => onClose(), // Başarılıysa modalı kapat
      });
    }
  };
  
  // 'onOpenChange' (Dialog) -> 'isOpen' false olduğunda
  // 'onClose' (parent state) fonksiyonunu çağırır.
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isCreateMode
              ? t('inventory.add_new')
              : `Düzenle: ${itemDataResponse?.data.name || t('generics.loading')}`}
          </DialogTitle>
          <DialogDescription>
            {isCreateMode
              ? 'Stoğa yeni bir kalem ekleyin.'
              : 'Kalem detaylarını güncelleyin. (Miktar hariç)'}
          </DialogDescription>
        </DialogHeader>

        {/* Form Alanı */}
        {/* 'update' modunda veri yüklenirken 'Skeleton' (iskelet) göster */}
        {isLoadingItem ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          // Form (Veri hazır veya 'create' modu)
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* 1. Kalem Adı (Name) */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('inventory.table_item')} *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Aspirin 100mg"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 2. Kategori (Category) ve Tedarikçi (Supplier) */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('inventory.table_category')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="İlaç"
                          disabled={isSubmitting}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="supplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('inventory.table_supplier')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Bayer"
                          disabled={isSubmitting}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 3. Miktar (Quantity) ve Kritik Stok (Threshold) */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {isCreateMode 
                          ? `${t('inventory.table_quantity')} *`
                          : t('inventory.table_quantity')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="100"
                          disabled={isSubmitting || !isCreateMode} // 'update' modunda Miktar DEĞİŞTİRİLEMEZ
                          {...field}
                          // 'value' 0 olsa bile göstermesi için
                          value={field.value ?? 0}
                          // 'react-hook-form'un 'number' tipi
                          // yönetimi için 'onChangeAsNumber'
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        />
                      </FormControl>
                       {!isCreateMode && (
                        <FormMessage>
                          Miktarı 'Stok Düzenle' eylemiyle değiştirin.
                        </FormMessage>
                       )}
                       {isCreateMode && <FormMessage />}
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lowStockThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('inventory.table_threshold')} *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="10"
                          disabled={isSubmitting}
                          {...field}
                           value={field.value ?? 10}
                           onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Düğmeler (Footer) */}
              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  {t('generics.cancel')}
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  {t('generics.save')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};