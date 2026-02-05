import { apiService } from './api.service';

import { API_BASE_URL } from '../config/api.config';
const AI_SERVICE_URL = 'http://localhost:8000'; // Microservicio Python directo

export interface AIPredictionRequest {
  tipo_producto: string;
  mercado_destino: string;
  presentacion?: string;
  cantidad_estimada?: number;
  provincia?: string;
  fecha_prediccion: string;
  incluir_factores_externos?: boolean;
}

export interface AIDespachoPredictionRequest {
  calibre: string;
  presentacion: string;
  dias: number;
}

export interface AIPredictionResponse {
  precio_predicho: number;
  intervalo_confianza: {
    min: number;
    max: number;
    confianza: number;
  };
  factores_principales: Record<string, number | string>;
  confianza_modelo: number;
  fecha_prediccion: string;
  modelo_usado: string;
  recomendaciones: string[];
  presentacion?: string;
  calibre?: string;
  cantidad_estimada?: number;
}

export interface AIDespachoPredictionResponse {
  calibre: string;
  presentacion: string;
  dias_prediccion: number;
  fecha_objetivo: string;
  precio_publico_predicho_usd_lb: number;
  precio_despacho_predicho_usd_lb: number;
  intervalo_confianza_despacho: {
    minimo: number;
    maximo: number;
  };
  confianza_porcentaje: number;
  correlacion: {
    ratio_promedio?: number;
    r_cuadrado: number;
    formula: string;
  };
  metodo?: string;
}

export interface MarketFactor {
  factorName: string;
  value: number;
  impactScore: number;
  source: string;
  timestamp: string;
}

export interface AIHealthResponse {
  status: string;
  timestamp: string;
  services: {
    ollama: string;
    weather_api: string;
    exchange_api: string;
  };
}

export interface AIAnalyticsResponse {
  totalPredictions: number;
  averageAccuracy: number;
  activeModels: number;
  lastUpdate: string;
}

export interface AIMarketFactorsResponse {
  factors: MarketFactor[];
  lastUpdate: string;
}

export interface AIRecommendationsResponse {
  recommendations: string[];
  priority: 'high' | 'medium' | 'low';
  lastUpdate: string;
}

export interface AISettingsResponse {
  modelConfig: {
    name: string;
    version: string;
    accuracy: number;
  };
  apiEndpoints: {
    weather: string;
    exchange: string;
    market: string;
  };
  updateFrequency: {
    market: string;
    weather: string;
    exchange: string;
  };
}

export interface SentimentAnalysis {
  sentimiento: number;
  confianza: number;
  temas: string[];
  impactoPrecios: number;
  resumen: string;
}

class AIService {
  /**
   * Realiza una predicción de precio usando el backend NestJS
   */
  async predictPrice(request: AIPredictionRequest): Promise<AIPredictionResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/predict/price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          tipo_producto: request.tipo_producto,
          mercado_destino: request.mercado_destino,
          presentacion: request.presentacion || 'HEADLESS',
          cantidad_estimada: request.cantidad_estimada,
          provincia: request.provincia || 'GUAYAS',
          fecha_prediccion: request.fecha_prediccion,
          incluir_factores_externos: request.incluir_factores_externos !== false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `Error en predicción: ${response.status}`);
      }

      const result = await response.json();
      console.log('Respuesta del backend:', result);
      
      return {
        precio_predicho: result.data?.precioPredicho || result.precio_predicho,
        intervalo_confianza: result.data?.intervaloConfianza || result.intervalo_confianza,
        factores_principales: result.data?.factoresPrincipales || result.factores_principales,
        confianza_modelo: result.data?.confianzaModelo || result.confianza_modelo,
        fecha_prediccion: result.data?.fechaPrediccion || result.fecha_prediccion || request.fecha_prediccion,
        modelo_usado: result.data?.modeloUsado || result.modelo_usado || 'ensemble',
        recomendaciones: result.data?.recomendaciones || result.recomendaciones || [],
        presentacion: result.data?.presentacion || result.presentacion,
        calibre: result.data?.calibre || result.calibre,
        cantidad_estimada: result.data?.cantidad_estimada || result.cantidad_estimada,
      };
    } catch (error) {
      console.error('Error en predictPrice:', error);
      throw error;
    }
  }

  /**
   * Predicción simplificada de despacho
   */
  async predictDespachoPrice(
    request: AIDespachoPredictionRequest
  ): Promise<AIDespachoPredictionResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/predict/despacho`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          calibre: request.calibre,
          presentacion: request.presentacion,
          dias: request.dias,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `Error en predicción: ${response.status}`);
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error('Error en predictDespachoPrice:', error);
      throw error;
    }
  }

  /**
   * Obtiene los calibres disponibles para una presentación específica
   */
  async getCalibresByPresentation(presentacion: string): Promise<any> {
    try {
      const response = await fetch(`${AI_SERVICE_URL}/data/calibers-by-presentation/${presentacion}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error al obtener calibres: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error en getCalibresByPresentation:', error);
      throw error;
    }
  }

  /**
   * Obtiene los datos de factores de mercado del microservicio
   */
  async getMarketFactors(): Promise<any> {
    try {
      const response = await fetch(`${AI_SERVICE_URL}/data/market-factors`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error al obtener factores: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error en getMarketFactors:', error);
      return [];
    }
  }

  /**
   * Realiza análisis de sentimiento usando el microservicio
   */
  async analyzeSentiment(content: string): Promise<any> {
    try {
      const response = await fetch(`${AI_SERVICE_URL}/analysis/sentiment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error(`Error en análisis: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error en analyzeSentiment:', error);
      throw error;
    }
  }

  /**
   * Actualiza datos de mercado en el microservicio
   */
  async updateMarketData(): Promise<any> {
    try {
      const response = await fetch(`${AI_SERVICE_URL}/data/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error(`Error al actualizar: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error en updateMarketData:', error);
      throw error;
    }
  }

  /**
   * Verifica el estado del microservicio
   */
  async getHealthStatus(): Promise<any> {
    try {
      const response = await fetch(`${AI_SERVICE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          status: 'offline',
          timestamp: new Date().toISOString(),
          services: {
            ollama: 'offline',
            weather_api: 'offline',
            exchange_api: 'offline',
          },
        };
      }

      return await response.json();
    } catch (error) {
      console.error('Error en getHealthStatus:', error);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        services: {
          ollama: 'error',
          weather_api: 'error',
          exchange_api: 'error',
        },
      };
    }
  }

  /**
   * Obtiene recomendaciones del mercado
   * Las recomendaciones vienen en cada predicción, no hay endpoint separado
   */
  async getMarketRecommendations(): Promise<string[]> {
    // Las recomendaciones se obtienen de las predicciones individuales
    // No existe endpoint /recommendations en el microservicio
    return [];
  }

  /**
   * Obtiene información del modelo entrenado
   */
  async getModelInfo(): Promise<any> {
    try {
      const response = await fetch(`${AI_SERVICE_URL}/models/info`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error al obtener info: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error en getModelInfo:', error);
      throw error;
    }
  }

  /**
   * Entrena o re-entrena el modelo ML
   */
  async trainModel(): Promise<any> {
    try {
      const response = await fetch(`${AI_SERVICE_URL}/models/train`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error(`Error en entrenamiento: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error en trainModel:', error);
      throw error;
    }
  }
}

export const aiService = new AIService();