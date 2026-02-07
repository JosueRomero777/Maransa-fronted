import { apiService } from './api.service';
import { API_BASE_URL } from '../config/api.config';

export enum EstadoLogistica {
  PENDIENTE = 'PENDIENTE',
  ASIGNADO = 'ASIGNADO',
  EN_RUTA = 'EN_RUTA',
  COMPLETADO = 'COMPLETADO'
}

export type Logistics = {
  id: number
  orderId: number
  assignedUserId?: number
  estado: EstadoLogistica
  fechaAsignacion?: string
  fechaInicio?: string
  fechaFinalizacion?: string
  vehiculoAsignado?: string
  choferAsignado?: string
  recursosUtilizados?: any
  ubicacionOrigen?: string
  ubicacionDestino?: string
  rutaPlanificada?: string
  origenLat?: number
  origenLng?: number
  destinoLat?: number
  destinoLng?: number
  trackingActivo?: boolean
  ubicacionActualLat?: number
  ubicacionActualLng?: number
  ultimaActualizacion?: string
  historialUbicaciones?: Array<{ lat: number; lng: number; timestamp: number }>
  evidenciasCarga: string[]
  evidenciasTransporte: string[]
  archivosAdjuntos?: string[]
  observaciones?: string
  incidentes?: string
  createdAt: string
  updatedAt: string
  order: {
    id: number
    codigo: string
    estado: string
    cantidadEstimada: number
    provider: {
      id: number
      name: string
    }
  }
  assignedUser?: {
    id: number
    name: string
    email: string
  }
}

export type CreateLogisticsDto = {
  orderId: number
  assignedUserId?: number
  vehiculoAsignado?: string
  choferAsignado?: string
  ubicacionOrigen?: string
  ubicacionDestino?: string
  origenLat?: number
  origenLng?: number
  destinoLat?: number
  destinoLng?: number
  observaciones?: string
}

export type UpdateLogisticsDto = {
  vehiculoAsignado?: string
  choferAsignado?: string
  recursosUtilizados?: string
  ubicacionOrigen?: string
  ubicacionDestino?: string
  rutaPlanificada?: string
  observaciones?: string
  incidentes?: string
}

export type LogisticsFilterDto = {
  estado?: EstadoLogistica
  assignedUserId?: number
  orderId?: number
  vehiculoAsignado?: string
  fechaDesde?: string
  fechaHasta?: string
}

class LogisticsService {
  async listLogistics(filters?: LogisticsFilterDto): Promise<Logistics[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    
    const endpoint = `/logistics${params.toString() ? `?${params}` : ''}`;
    return apiService.get<Logistics[]>(endpoint);
  }

  async getLogistics(id: number): Promise<Logistics> {
    return apiService.get<Logistics>(`/logistics/${id}`);
  }

  async createLogistics(data: CreateLogisticsDto): Promise<Logistics> {
    return apiService.post<Logistics>('/logistics', data);
  }

  async updateLogistics(id: number, data: UpdateLogisticsDto): Promise<Logistics> {
    return apiService.patch<Logistics>(`/logistics/${id}`, data);
  }

  async deleteLogistics(id: number): Promise<void> {
    return apiService.delete(`/logistics/${id}`);
  }

  async assignToUser(id: number, assignedUserId: number): Promise<Logistics> {
    return apiService.put<Logistics>(`/logistics/${id}/assign`, { assignedUserId });
  }

  async assignVehicle(id: number, data: { vehiculoAsignado: string; choferAsignado: string }): Promise<Logistics> {
    return apiService.patch<Logistics>(`/logistics/${id}/assign-vehicle`, data);
  }

  async assignVehicleAndDriver(id: number, data: { vehiculoAsignado: string; choferAsignado: string; rutaPlanificada?: string }): Promise<Logistics> {
    return apiService.put<Logistics>(`/logistics/${id}/assign-vehicle`, data);
  }

  async startTransport(id: number, data: { ubicacionOrigen?: string; observaciones?: string }): Promise<Logistics> {
    return apiService.put<Logistics>(`/logistics/${id}/start-transport`, data);
  }

  async completeTransport(id: number, data: { ubicacionDestino?: string; observaciones?: string }): Promise<Logistics> {
    return apiService.put<Logistics>(`/logistics/${id}/complete`, data);
  }

  async reportIncident(id: number, data: { descripcion: string; ubicacion?: string; severidad: 'BAJA' | 'MEDIA' | 'ALTA' }): Promise<Logistics> {
    return apiService.put<Logistics>(`/logistics/${id}/report-incident`, data);
  }

  async uploadFiles(id: number, files: FileList): Promise<Logistics> {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    return apiService.post<Logistics>(`/logistics/${id}/upload-files`, formData);
  }

  async addEvidence(id: number, tipo: string, descripcion: string, files: FileList): Promise<Logistics> {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });
    formData.append('tipo', tipo);
    if (descripcion) {
      formData.append('descripcion', descripcion);
    }

    console.log('addEvidence FormData values:'); // Debug
    console.log('  tipo:', tipo);
    console.log('  descripcion:', descripcion);
    console.log('  files count:', Array.from(files).length);

    return apiService.post<Logistics>(`/logistics/${id}/add-evidence`, formData);
  }

  async downloadFile(id: number, filename: string): Promise<void> {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }
    
    console.log('Downloading file:', { id, filename, hasToken: !!token });
    
    const response = await fetch(`${API_BASE_URL}/logistics/${id}/files/${filename}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('Download response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Download error response:', response.status, errorData);
      throw new Error(errorData.message || `Error al descargar archivo: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  async startRoute(id: number): Promise<Logistics> {
    return apiService.patch<Logistics>(`/logistics/${id}/start-route`, {});
  }

  async completeRoute(id: number, data: { observaciones?: string }): Promise<Logistics> {
    return apiService.patch<Logistics>(`/logistics/${id}/complete-route`, data);
  }

  async getActiveRoutes(): Promise<{
    rutasActivas: number;
    vehiculosEnUso: number;
    tiempoPromedioEntrega: number;
    incidentesReportados: number;
  }> {
    return apiService.get<any>('/logistics/active-routes');
  }

  async getStatistics(): Promise<{
    total: number;
    pendientes: number;
    asignados: number;
    enTransporte: number;
    completados: number;
    incidentesTotales: number;
    tiempoPromedioTransporte: number;
  }> {
    return apiService.get<any>('/logistics/statistics');
  }

  // Nuevos métodos para seguimiento en tiempo real
  async startTracking(id: number): Promise<Logistics> {
    return apiService.patch<Logistics>(`/logistics/${id}/start-tracking`, {});
  }

  async stopTracking(id: number): Promise<Logistics> {
    return apiService.patch<Logistics>(`/logistics/${id}/stop-tracking`, {});
  }

  async updateLocation(id: number, lat: number, lng: number): Promise<Logistics> {
    return apiService.patch<Logistics>(`/logistics/${id}/update-location`, { lat, lng });
  }

  async updateTracking(id: number, position: { lat: number; lng: number }): Promise<Logistics> {
    return this.updateLocation(id, position.lat, position.lng);
  }

  async getTrackingData(id: number): Promise<{
    trackingActivo: boolean;
    ubicacionActual: { lat: number; lng: number } | null;
    ultimaActualizacion: string | null;
    historial: Array<{ lat: number; lng: number; timestamp: number }>;
  }> {
    return apiService.get<any>(`/logistics/${id}/tracking`);
  }
}

export const logisticsService = new LogisticsService();