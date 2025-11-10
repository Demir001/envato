import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './axios-instance';
import { toast } from 'sonner';

// --- Tipler (Types) ---
// Backend'deki 'billing.types.ts' ile eşleşmeli.

export interface IInvoiceItem {
  id: number;
  invoiceId: number;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// Fatura listesinde (TanStack Table) gösterilecek özet tip
export interface IInvoiceListItem {
  id: number;
  invoiceNumber: string;
  patientId: number;
  patientName: string; // Listede bu gerekli
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  totalAmount: number;
  status: 'pending' | 'paid' | 'overdue';
}

// Tek bir fatura detayının tam tipi
export interface IInvoiceDetails extends IInvoiceListItem {
  patientEmail: string | null;
  patientAddress: string | null;
  notes: string | null;
  items: IInvoiceItem[];
  tenantId: string;
  createdAt: string;
}

// Fatura listesi için sorgu parametreleri
export interface IInvoiceListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'pending' | 'paid' | 'overdue';
  patientId?: string;
}

// API'den dönen paginated fatura listesi yanıtı
interface PaginatedInvoicesResponse {
  success: boolean;
  message: string;
  data: {
    invoices: IInvoiceListItem[];
    pagination: {
      totalItems: number;
      totalPages: number;
      currentPage: number;
      pageSize: number;
    };
  };
}

// Tek fatura yanıtı
interface InvoiceResponse {
  success: boolean;
  message: string;
  data: IInvoiceDetails;
}

// Fatura oluşturma (Create) payload'u için kalem tipi
type InvoiceItemInput = Omit<IInvoiceItem, 'id' | 'invoiceId' | 'total'>;

// Fatura oluşturma (Create) payload'u
export type CreateInvoiceInput = {
  patientId: number;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  status?: 'pending' | 'paid';
  notes?: string | null;
  items: InvoiceItemInput[];
};

// --- API Fonksiyonları ---

/**
 * Faturaları listeler (paginated, searchable).
 * @param params - { page, limit, search, status }
 * @returns PaginatedInvoicesResponse
 */
const fetchInvoices = async (
  params: IInvoiceListParams,
): Promise<PaginatedInvoicesResponse> => {
  const query = new URLSearchParams(
    params as Record<string, string>,
  ).toString();
  return apiClient.get(`/billing?${query}`);
};

/**
 * ID ile tek bir fatura detayı çeker.
 * @param id - Fatura ID'si
 * @returns InvoiceResponse
 */
const fetchInvoiceById = async (id: number): Promise<InvoiceResponse> => {
  return apiClient.get(`/billing/${id}`);
};

/**
 * Yeni bir fatura oluşturur.
 * @param invoiceData - CreateInvoiceInput
 * @returns InvoiceResponse (yeni oluşturulan fatura)
 */
const createInvoice = async (
  invoiceData: CreateInvoiceInput,
): Promise<InvoiceResponse> => {
  return apiClient.post('/billing', invoiceData);
};

/**
 * Bir faturayı siler.
 * @param id - Silinecek fatura ID'si
 */
const deleteInvoice = async (id: number) => {
  return apiClient.delete(`/billing/${id}`);
};

/**
 * PDF faturayı indirir (Bu bir 'hook' DEĞİLDİR).
 * @param id - Fatura ID'si
 * @returns Blob (PDF dosyası)
 */
export const downloadInvoicePDF = async (
  id: number,
): Promise<{ blob: Blob; filename: string }> => {
  // 'apiClient' (Axios) interceptor'ı JSON yanıtı beklediği için
  // PDF (blob) indirmek için 'axios'u doğrudan kullanmak
  // veya 'apiClient'ı özel yapılandırmak gerekir.
  
  // Çözüm: Ayrı bir 'axios.get' çağrısı yap, ama token'ı manuel ekle.
  const token = (await import('../store/use-auth-store')).useAuthStore.getState().token;

  // Axios'u yeniden import et
  const axios = (await import('axios')).default;
  
  const response = await axios.get(`/api/v1/billing/${id}/pdf`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    responseType: 'blob', // Yanıt tipini 'blob' (binary file) olarak ayarla
  });

  // Sunucunun 'Content-Disposition' header'ından dosya adını almayı dene
  const contentDisposition = response.headers['content-disposition'];
  let filename = `Invoice-${id}.pdf`; // Varsayılan
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="(.+)"/);
    if (filenameMatch && filenameMatch.length > 1) {
      filename = filenameMatch[1];
    }
  }

  return { blob: new Blob([response.data], { type: 'application/pdf' }), filename };
};

// --- React Query Kancaları (Hooks) ---

/**
 * Faturaları listelemek (fetchInvoices) için 'useQuery' kancası.
 * @param params - IInvoiceListParams (state'den alınır)
 */
export const useGetInvoices = (params: IInvoiceListParams) => {
  return useQuery<PaginatedInvoicesResponse, Error>({
    queryKey: ['invoices', params],
    queryFn: () => fetchInvoices(params),
    staleTime: 1000 * 60 * 2, // 2 dakika
  });
};

/**
 * Tek bir faturayı ID ile (fetchInvoiceById) çekmek için 'useQuery' kancası.
 * @param id - Fatura ID'si
 */
export const useGetInvoiceById = (id: number | null) => {
  return useQuery<InvoiceResponse, Error>({
    queryKey: ['invoice', id],
    queryFn: () => fetchInvoiceById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 dakika
  });
};

/**
 * Yeni fatura oluşturmak (createInvoice) için 'useMutation' kancası.
 */
export const useCreateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createInvoice,
    onSuccess: (response) => {
      toast.success(response.message || 'Fatura başarıyla oluşturuldu.');
      // Fatura listesini yenile
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      // Dashboard KPI'larını (bekleyen fatura) yenile
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

/**
 * Faturayı silmek (deleteInvoice) için 'useMutation' kancası.
 * (Not: updateInvoice kasıtlı olarak eklenmedi,
 * PDF/Excel export odaklı istendi. Gerekirse eklenebilir.)
 */
export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteInvoice,
    onSuccess: (response: any) => {
      toast.success(response.message || 'Fatura başarıyla silindi.');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};