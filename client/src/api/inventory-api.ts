import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './axios-instance';
import { toast } from 'sonner';

// --- Tipler (Types) ---
// Backend'deki 'inventory.types.ts' ile eşleşmeli.

// Stok (Inventory) Kalemi nesnesinin arayüzü
export interface IInventoryItem {
  id: number;
  tenantId: string;
  name: string;
  category: string | null;
  quantity: number;
  lowStockThreshold: number;
  supplier: string | null;
  lastRestockDate: string | null; // YYYY-MM-DD
}

// Stok listesi için sorgu parametreleri
export interface IInventoryListParams {
  page?: number;
  limit?: number;
  search?: string;
  lowStock?: 'true' | 'false';
}

// API'den dönen paginated stok listesi yanıtı
interface PaginatedInventoryResponse {
  success: boolean;
  message: string;
  data: {
    items: IInventoryItem[];
    pagination: {
      totalItems: number;
      totalPages: number;
      currentPage: number;
      pageSize: number;
    };
  };
}

// Tek stok kalemi yanıtı
interface InventoryItemResponse {
  success: boolean;
  message: string;
  data: IInventoryItem;
}

// Yeni stok kalemi oluşturma (Create) payload'u
export type CreateItemInput = Omit<
  IInventoryItem,
  'id' | 'tenantId' | 'lastRestockDate'
>;

// Stok kalemi güncelleme (Update) payload'u
// GÜNCELLEME: 'quantity' (miktar) 'adjust' ile yapıldığı için
// bu tip 'quantity' içermemelidir. (Backend Servisi Adım 47'ye göre)
export type UpdateItemInput = Omit<CreateItemInput, 'quantity'>;

// Stok miktarı düzenleme (Adjust) payload'u
export type AdjustStockInput = {
  amount: number; // Pozitif veya negatif
  notes?: string;
};

// --- API Fonksiyonları ---

/**
 * Stok kalemlerini listeler (paginated, searchable).
 */
const fetchInventoryItems = async (
  params: IInventoryListParams,
): Promise<PaginatedInventoryResponse> => {
  const query = new URLSearchParams(
    params as Record<string, string>,
  ).toString();
  return apiClient.get(`/inventory?${query}`);
};

/**
 * (EKLENDİ) ID ile tek bir stok kalemi çeker.
 * @param id - Kalem ID'si
 * @returns InventoryItemResponse
 */
const fetchInventoryItemById = async (
  id: number,
): Promise<InventoryItemResponse> => {
  return apiClient.get(`/inventory/${id}`);
};

/**
 * Yeni bir stok kalemi oluşturur.
 */
const createInventoryItem = async (
  itemData: CreateItemInput,
): Promise<InventoryItemResponse> => {
  return apiClient.post('/inventory', itemData);
};

/**
 * Mevcut bir stok kalemini günceller (detaylar, miktar DEĞİL).
 */
const updateInventoryItem = async ({
  id,
  itemData,
}: {
  id: number;
  itemData: UpdateItemInput;
}): Promise<InventoryItemResponse> => {
  return apiClient.put(`/inventory/${id}`, itemData);
};

/**
 * Bir stok kaleminin miktarını ayarlar.
 */
const adjustInventoryStock = async ({
  id,
  adjustmentData,
}: {
  id: number;
  adjustmentData: AdjustStockInput;
}): Promise<InventoryItemResponse> => {
  return apiClient.post(`/inventory/${id}/adjust`, adjustmentData);
};

/**
 * Bir stok kalemini siler.
 */
const deleteInventoryItem = async (id: number) => {
  return apiClient.delete(`/inventory/${id}`);
};

// --- React Query Kancaları (Hooks) ---

/**
 * Stok kalemlerini listelemek (fetchInventoryItems) için 'useQuery' kancası.
 */
export const useGetInventoryItems = (params: IInventoryListParams) => {
  return useQuery<PaginatedInventoryResponse, Error>({
    queryKey: ['inventory', params],
    queryFn: () => fetchInventoryItems(params),
    staleTime: 1000 * 60 * 2, // 2 dakika
  });
};

/**
 * (EKLENDİ) Tek bir stok kalemini (fetchInventoryItemById)
 * çekmek için 'useQuery' kancası.
 * @param id - Kalem ID'si
 */
export const useGetInventoryItemById = (id: number | null) => {
  return useQuery<InventoryItemResponse, Error>({
    queryKey: ['inventory', id],
    queryFn: () => fetchInventoryItemById(id!),
    enabled: !!id, // Sadece 'id' null değilse çalış
    staleTime: 1000 * 60 * 5, // 5 dakika
  });
};

/**
 * Yeni stok kalemi oluşturmak (createInventoryItem) için 'useMutation' kancası.
 */
export const useCreateInventoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createInventoryItem,
    onSuccess: (response) => {
      toast.success(response.message || 'Stok kalemi başarıyla oluşturuldu.');
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

/**
 * Stok kalemini güncellemek (updateInventoryItem) için 'useMutation' kancası.
 */
export const useUpdateInventoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateInventoryItem,
    onSuccess: (response, variables) => {
      toast.success(response.message || 'Stok kalemi başarıyla güncellendi.');
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      // Detay sorgusunu (varsa) güncelle
      queryClient.setQueryData(['inventory', variables.id], response);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

/**
 * Stok miktarını ayarlamak (adjustInventoryStock) için 'useMutation' kancası.
 */
export const useAdjustInventoryStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adjustInventoryStock,
    onSuccess: (response) => {
      toast.success(response.message || 'Stok miktarı başarıyla düzenlendi.');
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error: any) => {
      console.error('Adjust stock error:', error);
    },
  });
};

/**
 * Stok kalemini silmek (deleteInventoryItem) için 'useMutation' kancası.
 */
export const useDeleteInventoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteInventoryItem,
    onSuccess: (response: any) => {
      toast.success(response.message || 'Stok kalemi başarıyla silindi.');
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};