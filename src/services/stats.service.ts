import { apiService } from './api.service';
import { providerService } from './provider.service';
import { packagerService } from './packager.service';
import axios from 'axios';

import { API_BASE_URL } from '../config/api.config';

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

export interface DashboardStats {
  totalProviders: number;
  activeProviders: number;
  totalPackagers: number;
  activePackagers: number;
  totalOrders: number;
  pendingOrders: number;
  totalUsers: number;
}

class StatsService {
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Obtener estadísticas de proveedores
      const providers = await providerService.listProviders();
      const totalProviders = providers.length;
      const activeProviders = providers.filter(p => p.active).length;

      // Obtener estadísticas de empacadoras
      const packagers = await packagerService.listPackagers();
      const totalPackagers = packagers.length;
      const activePackagers = packagers.filter(p => p.active).length;

      // Obtener estadísticas de pedidos
      const ordersStats = await this.getOrdersStats();

      // Obtener estadísticas de usuarios
      const usersStats = await this.getUsersStats();

      return {
        totalProviders,
        activeProviders,
        totalPackagers,
        activePackagers,
        totalOrders: ordersStats.total,
        pendingOrders: ordersStats.pending,
        totalUsers: usersStats.total,
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas del dashboard:', error);
      // Retornar valores por defecto en caso de error
      return {
        totalProviders: 0,
        activeProviders: 0,
        totalPackagers: 0,
        activePackagers: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalUsers: 0,
      };
    }
  }

  private async getOrdersStats(): Promise<{ total: number; pending: number }> {
    try {
      const response = await api.get('/orders');
      const orders = response.data.orders || response.data || [];
      
      const total = orders.length;
      const pending = orders.filter((order: any) => 
        order.estado === 'pendiente' || order.estado === 'PENDIENTE'
      ).length;

      return { total, pending };
    } catch (error) {
      console.error('Error obteniendo estadísticas de pedidos:', error);
      return { total: 0, pending: 0 };
    }
  }

  private async getUsersStats(): Promise<{ total: number }> {
    try {
      const response = await api.get('/users');
      const users = response.data || [];
      return { total: users.length };
    } catch (error) {
      console.error('Error obteniendo estadísticas de usuarios:', error);
      return { total: 0 };
    }
  }
}

export const statsService = new StatsService();
