import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './axios-instance';
import { toast } from 'sonner';

// --- Tipler (Types) ---
// Backend'deki 'user.types.ts' ile eşleşmeli.

// Personel (Kullanıcı) nesnesinin tam arayüzü
export interface IStaffUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'doctor' | 'reception';
  specialty: string | null;
  phone: string | null;
  isActive: boolean;
}

// Personel listesi için sorgu parametreleri
export interface IStaffListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'admin' | 'doctor' | 'reception';
  status?: 'active' | 'inactive';
}

// API'den dönen paginated personel listesi yanıtı
interface PaginatedStaffResponse {
  success: boolean;
  message: string;
  data: {
    users: IStaffUser[];
    pagination: {
      totalItems: number;
      totalPages: number;
      currentPage: number;
      pageSize: number;
    };
  };
}

// Tek personel yanıtı
interface StaffUserResponse {
  success: boolean;
  message: string;
  data: IStaffUser;
}

// Yeni personel oluşturma (Create) payload'u
export type CreateStaffInput = {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'doctor' | 'reception';
  specialty?: string | null;
  phone?: string | null;
  isActive?: boolean;
};

// Personel güncelleme (Update) payload'u
export type UpdateStaffInput = Partial<
  Omit<CreateStaffInput, 'password' | 'email'>
>;

// (EKLENDİ) Şifre değiştirme (Change Password) payload'u
export type ChangePasswordInput = {
  newPassword: string;
};

// --- API Fonksiyonları ---

/**
 * Personel listesini çeker (paginated, searchable).
 */
const fetchStaffList = async (
  params: IStaffListParams,
): Promise<PaginatedStaffResponse> => {
  const query = new URLSearchParams(
    params as Record<string, string>,
  ).toString();
  return apiClient.get(`/users?${query}`);
};

/**
 * ID ile tek bir personel çeker.
 */
const fetchStaffById = async (id: number): Promise<StaffUserResponse> => {
  return apiClient.get(`/users/${id}`);
};

/**
 * Yeni bir personel oluşturur.
 */
const createStaff = async (
  userData: CreateStaffInput,
): Promise<StaffUserResponse> => {
  return apiClient.post('/users', userData);
};

/**
 * Mevcut bir personeli günceller.
 */
const updateStaff = async ({
  id,
  userData,
}: {
  id: number;
  userData: UpdateStaffInput;
}): Promise<StaffUserResponse> => {
  return apiClient.put(`/users/${id}`, userData);
};

/**
 * (EKLENDİ) Bir personelin şifresini günceller.
 */
const updatePassword = async ({
  id,
  passwordData,
}: {
  id: number;
  passwordData: ChangePasswordInput;
}): Promise<any> => {
  return apiClient.put(`/users/${id}/password`, passwordData);
};

/**
 * Bir personeli siler.
 */
const deleteStaff = async (id: number) => {
  return apiClient.delete(`/users/${id}`);
};

// --- React Query Kancaları (Hooks) ---

/**
 * Personel listesini (fetchStaffList) çekmek için 'useQuery' kancası.
 */
export const useGetStaffList = (params: IStaffListParams) => {
  return useQuery<PaginatedStaffResponse, Error>({
    queryKey: ['staff', params],
    queryFn: () => fetchStaffList(params),
    staleTime: 1000 * 60 * 5, // 5 dakika
  });
};

/**
 * Tek bir personeli ID ile (fetchStaffById) çekmek için 'useQuery' kancası.
 */
export const useGetStaffById = (id: number | null) => {
  return useQuery<StaffUserResponse, Error>({
    queryKey: ['staff', id], // 'id' değiştiğinde yeniden çeker
    queryFn: () => fetchStaffById(id!),
    enabled: !!id, // Sadece 'id' null değilse çalış
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Yeni personel oluşturmak (createStaff) için 'useMutation' kancası.
 */
export const useCreateStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStaff,
    onSuccess: (response) => {
      toast.success(response.message || 'Personel başarıyla oluşturuldu.');
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      if (response.data.role === 'doctor') {
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }
    },
  });
};

/**
 * Personeli güncellemek (updateStaff) için 'useMutation' kancası.
 */
export const useUpdateStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateStaff,
    onSuccess: (response, variables) => {
      toast.success(response.message || 'Personel başarıyla güncellendi.');
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.setQueryData(['staff', variables.id], response);
    },
  });
};

/**
 * (EKLENDİ) Personel şifresini güncellemek (updatePassword) için 'useMutation'.
 */
export const useUpdateStaffPassword = () => {
  return useMutation({
    mutationFn: updatePassword,
    onSuccess: (response: any) => {
      toast.success(
        response.message || "Personel şifresi başarıyla güncellendi.",
      );
    },
    onError: (error: any) => {
      // Axios interceptor'ı hatayı zaten gösterdi.
      console.error('Update password error:', error);
    },
  });
};

/**
 * Personeli silmek (deleteStaff) için 'useMutation' kancası.
 */
export const useDeleteStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteStaff,
    onSuccess: (response: any) => {
      toast.success(response.message || 'Personel başarıyla silindi.');
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error: any) => {
      console.error('Delete staff error:', error);
    },
  });
};