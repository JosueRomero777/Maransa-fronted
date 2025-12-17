import { apiService } from './api.service';

export interface Provider {
  id: number;
  name: string;
  type: string;
  location?: string;
  capacity?: number;
  active: boolean;
  email?: string;
  phone?: string;
  contactPerson?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProviderDto {
  name: string;
  type: string;
  location?: string;
  capacity?: number;
  email?: string;
  phone?: string;
  contactPerson?: string;
  active?: boolean;
}

export interface UpdateProviderDto extends Partial<CreateProviderDto> {}

export interface ListProvidersQuery {
  search?: string;
  type?: string;
  location?: string;
  minCapacity?: string;
  active?: boolean;
}

class ProviderService {
  async listProviders(query?: ListProvidersQuery): Promise<Provider[]> {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    
    const endpoint = `/providers${params.toString() ? `?${params}` : ''}`;
    return apiService.get<Provider[]>(endpoint);
  }

  async getProvider(id: number): Promise<Provider> {
    return apiService.get<Provider>(`/providers/${id}`);
  }

  async createProvider(data: CreateProviderDto): Promise<Provider> {
    return apiService.post<Provider>('/providers', data);
  }

  async updateProvider(id: number, data: UpdateProviderDto): Promise<Provider> {
    return apiService.patch<Provider>(`/providers/${id}`, data);
  }

  async deleteProvider(id: number): Promise<void> {
    return apiService.delete<void>(`/providers/${id}`);
  }

  async checkNameAvailability(name: string, excludeId?: number): Promise<{ isDuplicate: boolean }> {
    const params = new URLSearchParams();
    if (excludeId) {
      params.append('excludeId', String(excludeId));
    }
    
    const endpoint = `/providers/check-name/${encodeURIComponent(name)}${params.toString() ? `?${params}` : ''}`;
    return apiService.get<{ isDuplicate: boolean }>(endpoint);
  }
}

export const providerService = new ProviderService();