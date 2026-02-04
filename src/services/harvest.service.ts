import { apiService } from './api.service';

export interface Harvest {
  id: number;
  orderId: number;
  assignedUserId?: number;
  estado: EstadoCosecha;
  fechaAsignacion: string;
  fechaDefinicion?: string;
  fechaAprobacion?: string;
  fechaRechazo?: string;
  cantidadEstimada?: number;
  fechaEstimada?: string;
  cantidadFinal?: number;
  fechaDefinitiva?: string;
  calidadEsperada?: string;
  condicionesCosecha?: string;
  temperaturaOptima?: number;
  tiempoMaximoTransporte?: number;
  requerimientosEspeciales?: string;
  evidenciasIniciales?: string[];
  evidenciasDefinicion?: string[];
  observaciones?: string;
  motivoRechazo?: string;
  createdAt: string;
  updatedAt: string;
  order: {
    id: number;
    codigo: string;
    estado: string;
    cantidadEstimada: number;
    provider: {
      id: number;
      name: string;
    };
  };
  assignedUser?: {
    id: number;
    name: string;
    email: string;
  };
}

export enum EstadoCosecha {
  PENDIENTE = 'PENDIENTE',
  EN_DEFINICION = 'EN_DEFINICION',
  DEFINIDA = 'DEFINIDA',
  APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA'
}

export interface CreateHarvestDto {
  orderId: number;
  assignedUserId?: number;
  cantidadEstimada?: number;
  fechaEstimada?: string;
  observaciones?: string;
}

export interface UpdateHarvestDto {
  cantidadFinal?: number;
  fechaDefinitiva?: string;
  calidadEsperada?: string;
  condicionesCosecha?: string;
  temperaturaOptima?: number;
  tiempoMaximoTransporte?: number;
  requerimientosEspeciales?: string;
  observaciones?: string;
  motivoRechazo?: string;
}

export interface HarvestFilterDto {
  estado?: EstadoCosecha;
  assignedUserId?: number;
  orderId?: number;
  fechaDesde?: string;
  fechaHasta?: string;
}

class HarvestService {
  async listHarvests(filters?: HarvestFilterDto): Promise<Harvest[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    
    const endpoint = `/harvest${params.toString() ? `?${params}` : ''}`;
    return apiService.get<Harvest[]>(endpoint);
  }

  async getHarvest(id: number): Promise<Harvest> {
    return apiService.get<Harvest>(`/harvest/${id}`);
  }

  async createHarvest(data: CreateHarvestDto): Promise<Harvest> {
    return apiService.post<Harvest>('/harvest', data);
  }

  async updateHarvest(id: number, data: UpdateHarvestDto): Promise<Harvest> {
    return apiService.put<Harvest>(`/harvest/${id}`, data);
  }

  async deleteHarvest(id: number): Promise<void> {
    return apiService.delete(`/harvest/${id}`);
  }

  async assignToUser(id: number, assignedUserId: number): Promise<Harvest> {
    return apiService.put<Harvest>(`/harvest/${id}/assign`, { assignedUserId });
  }

  async defineHarvest(id: number, data: {
    cantidadFinal: number;
    fechaDefinitiva: string;
    calidadEsperada?: string;
    condicionesCosecha?: string;
    temperaturaOptima?: number;
    tiempoMaximoTransporte?: number;
    requerimientosEspeciales?: string;
    observaciones?: string;
  }): Promise<Harvest> {
    return apiService.put<Harvest>(`/harvest/${id}/define`, data);
  }

  async approveHarvest(id: number, data: { observaciones?: string }): Promise<Harvest> {
    return apiService.put<Harvest>(`/harvest/${id}/approve`, data);
  }

  async rejectHarvest(id: number, data: { motivoRechazo: string; observaciones?: string }): Promise<Harvest> {
    return apiService.put<Harvest>(`/harvest/${id}/reject`, data);
  }

  async uploadEvidence(id: number, files: FileList): Promise<Harvest> {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/harvest/${id}/upload-evidence`, {
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

  async updateFiles(id: number, files: FileList): Promise<Harvest> {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/harvest/${id}/update-files`, {
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
    enDefinicion: number;
    definidas: number;
    aprobadas: number;
    rechazadas: number;
    promedioTiempoDefinicion: number;
  }> {
    return apiService.get<any>('/harvest/statistics');
  }
}

export const harvestService = new HarvestService();