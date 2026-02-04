import axios from 'axios';
import type { 
  Packager, 
  CreatePackagerData, 
  UpdatePackagerData, 
  PackagerFilter 
} from '../types/packager.types';

const API_BASE_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor para incluir el token de autenticación
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const packagerService = {
  async listPackagers(filters?: PackagerFilter): Promise<Packager[]> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const response = await api.get(`/packagers?${params.toString()}`);
    return response.data;
  },

  async getPackager(id: number): Promise<Packager> {
    const response = await api.get(`/packagers/${id}`);
    return response.data;
  },

  async createPackager(data: CreatePackagerData): Promise<Packager> {
    const response = await api.post('/packagers', data);
    return response.data;
  },

  async updatePackager(id: number, data: UpdatePackagerData): Promise<Packager> {
    const response = await api.patch(`/packagers/${id}`, data);
    return response.data;
  },

  async deletePackager(id: number): Promise<void> {
    await api.delete(`/packagers/${id}`);
  },

  async checkDuplicateName(name: string, excludeId?: number): Promise<boolean> {
    const params = excludeId ? `?excludeId=${excludeId}` : '';
    const response = await api.get(`/packagers/check-name/${encodeURIComponent(name)}${params}`);
    return response.data.isDuplicate;
  },

  async checkDuplicateRuc(ruc: string, excludeId?: number): Promise<boolean> {
    const params = excludeId ? `?excludeId=${excludeId}` : '';
    const response = await api.get(`/packagers/check-ruc/${encodeURIComponent(ruc)}${params}`);
    return response.data.isDuplicate;
  }
};
