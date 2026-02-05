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

export interface PriceComparison {
  receptionId: number;
  calibre: string;
  presentacion: string;
  realPrice: number;
  receptionDate: string;
  predictions: Array<{
    id: number;
    predictedPrice: number;
    predictionDate: string;
    difference: number;
    percentageDifference: string;
    accuracy: number | string;
  }>;
}

export interface AccuracyMetrics {
  totalMatches: number;
  totalReceptions: number;
  totalPredictions: number;
  averageDifference: number;
  maxDifference: number;
  minDifference: number;
  accuracy: number;
}

export interface Calibresummary {
  calibre: string;
  averageRealPrice: number;
  averagePredictedPrice: number;
  difference: number;
  percentageDifference: number;
  receptionCount: number;
  predictionCount: number;
}

class StatisticsService {
  async getPredictionsVsReceptions(calibre?: string, presentacion?: string, startDate?: string, endDate?: string) {
    try {
      const params = new URLSearchParams();
      if (calibre) params.append('calibre', calibre);
      if (presentacion) params.append('presentacion', presentacion);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await api.get(
        `/ai/statistics/predictions-vs-receptions?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error('Error obteniendo comparativa predicciones vs recepciones:', error);
      throw error;
    }
  }

  async getAccuracyMetrics(presentacion?: string, startDate?: string, endDate?: string) {
    try {
      const params = new URLSearchParams();
      if (presentacion) params.append('presentacion', presentacion);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await api.get(`/ai/statistics/accuracy-metrics?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo métricas de precisión:', error);
      throw error;
    }
  }

  async getPriceComparisonSummary(presentacion?: string) {
    try {
      const params = new URLSearchParams();
      if (presentacion) params.append('presentacion', presentacion);

      const response = await api.get(`/ai/statistics/price-comparison-summary?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo resumen de comparación:', error);
      throw error;
    }
  }
}

export const statisticsService = new StatisticsService();
