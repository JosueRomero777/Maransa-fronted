import { apiService } from './api.service';
import { API_BASE_URL } from '../config/api.config';

export interface Custody {
  id: number;
  orderId: number;
  logisticsId: number;
  assignedUserId?: number;
  estado: EstadoCustodia;
  fechaAsignacion: string;
  fechaInicio?: string;
  fechaFinalizacion?: string;
  personalAsignado?: string[];
  vehiculoCustodia?: string;
  rutaCustodia?: string;
  evidenciasIniciales?: string[];
  evidenciasFinales?: string[];
  incidentes?: any[];
  observaciones?: string;
  observacionesFinales?: string;
  createdAt: string;
  updatedAt: string;
  order: {
    id: number;
    codigo: string;
    estado: string;
    cantidadEstimada: number;
    fechaTentativaCosecha?: string;
    fechaDefinitivaCosecha?: string;
    fechaEntregaEstimada?: string;
    provider: {
      id: number;
      name: string;
    };
  };
  logistics: {
    id: number;
    vehiculoAsignado?: string;
    choferAsignado?: string;
    rutaPlanificada?: string;
    ubicacionOrigen?: string;
    ubicacionDestino?: string;
    origenLat?: number;
    origenLng?: number;
    destinoLat?: number;
    destinoLng?: number;
    trackingActivo?: boolean;
    ubicacionActualLat?: number;
    ubicacionActualLng?: number;
    ultimaActualizacion?: string;
    historialUbicaciones?: any;
  };
  assignedUser?: {
    id: number;
    name: string;
    email: string;
  };
}

export enum EstadoCustodia {
  PENDIENTE = 'PENDIENTE',
  ASIGNADO = 'ASIGNADO',
  EN_CUSTODIA = 'EN_CUSTODIA',
  COMPLETADO = 'COMPLETADO'
}

export interface CreateCustodyDto {
  orderId: number;
  logisticsId: number;
  personalAsignado?: string[];
  vehiculoCustodia?: string;
  rutaCustodia?: string;
  observaciones?: string;
}

export interface UpdateCustodyDto {
  personalAsignado?: string[];
  vehiculoCustodia?: string;
  rutaCustodia?: string;
  observaciones?: string;
  observacionesFinales?: string;
}

export interface CustodyFilterDto {
  estado?: EstadoCustodia;
  assignedUserId?: number;
  orderId?: number;
  vehiculoCustodia?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

export interface IncidentDto {
  descripcion: string;
  ubicacion?: string;
  severidad: 'BAJA' | 'MEDIA' | 'ALTA';
  accionesTomadas?: string;
}

class CustodyService {
  async listCustodies(filters?: CustodyFilterDto): Promise<Custody[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    
    const endpoint = `/custody${params.toString() ? `?${params}` : ''}`;
    return apiService.get<Custody[]>(endpoint);
  }

  async getCustody(id: number): Promise<Custody> {
    return apiService.get<Custody>(`/custody/${id}`);
  }

  async createCustody(data: CreateCustodyDto): Promise<Custody> {
    return apiService.post<Custody>('/custody', data);
  }

  async updateCustody(id: number, data: UpdateCustodyDto): Promise<Custody> {
    return apiService.put<Custody>(`/custody/${id}`, data);
  }

  async deleteCustody(id: number): Promise<void> {
    return apiService.delete(`/custody/${id}`);
  }

  async assignToUser(id: number, assignedUserId: number): Promise<Custody> {
    return apiService.put<Custody>(`/custody/${id}/assign`, { assignedUserId });
  }

  async assignPersonnel(id: number, data: { personalAsignado: string[]; vehiculoCustodia?: string; rutaCustodia?: string }): Promise<Custody> {
    return apiService.patch<Custody>(`/custody/${id}/assign-personnel`, data);
  }

  async startCustody(id: number, data: { observaciones?: string }): Promise<Custody> {
    return apiService.patch<Custody>(`/custody/${id}/start-custody`, data);
  }

  async completeCustody(id: number, data: { observacionesFinales?: string }): Promise<Custody> {
    return apiService.patch<Custody>(`/custody/${id}/complete-custody`, data);
  }

  async reportIncident(id: number, incident: IncidentDto): Promise<Custody> {
    return apiService.put<Custody>(`/custody/${id}/report-incident`, incident);
  }

  async addIncident(id: number, data: { descripcion: string; gravedad: 'leve' | 'moderada' | 'grave'; responsable?: string }): Promise<Custody> {
    return apiService.post<Custody>(`/custody/${id}/incidents`, data);
  }

  async listCustody(filters?: CustodyFilterDto): Promise<Custody[]> {
    return this.listCustodies(filters);
  }

  async uploadEvidence(id: number, files: FileList): Promise<Custody> {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/custody/${id}/upload-evidence`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al subir evidencias');
    }

    return response.json();
  }

  async updateFiles(id: number, files: FileList): Promise<Custody> {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/custody/${id}/update-files`, {
      method: 'PUT',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al actualizar archivos');
    }

    return response.json();
  }

  async getStatistics(): Promise<{
    total: number;
    pendientes: number;
    asignados: number;
    enCustodia: number;
    completados: number;
    totalIncidentes: number;
    tiempoPromedioCustodia: number;
  }> {
    return apiService.get<any>('/custody/statistics');
  }

  async getOrdersForCustody(): Promise<any[]> {
    try {
      const response = await apiService.get<any>('/custody/pending-assignments');
      console.log('Respuesta de pending-assignments:', response);
      return (response as any)?.data ?? response ?? [];
    } catch (err) {
      console.error('Error en getOrdersForCustody:', err);
      return [];
    }
  }
}

export const custodyService = new CustodyService();