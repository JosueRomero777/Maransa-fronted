import axios from 'axios';
import type { 
  Reception, 
  CreateReceptionData, 
  UpdateReceptionData, 
  ReceptionFilter, 
  ReceptionListResponse,
  OrderForSelection 
} from '../types/reception.types';

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

export const receptionService = {
  // CRUD operations
  async getReceptions(filters: ReceptionFilter = {}): Promise<ReceptionListResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/receptions?${params.toString()}`);
    return response.data;
  },

  async getReception(id: number): Promise<Reception> {
    const response = await api.get(`/receptions/${id}`);
    return response.data;
  },

  async createReception(data: CreateReceptionData): Promise<Reception> {
    const response = await api.post('/receptions', data);
    return response.data;
  },

  async updateReception(id: number, data: UpdateReceptionData): Promise<Reception> {
    const response = await api.patch(`/receptions/${id}`, data);
    return response.data;
  },

  async deleteReception(id: number): Promise<void> {
    await api.delete(`/receptions/${id}`);
  },

  // Helper endpoints
  async getClassifications(): Promise<string[]> {
    const response = await api.get('/receptions/classifications');
    return response.data;
  },

  async getOrdersWithoutReception(): Promise<OrderForSelection[]> {
    const response = await api.get('/receptions/orders-without-reception');
    return response.data;
  }
};