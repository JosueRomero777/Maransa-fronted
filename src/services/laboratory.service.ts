import { apiService } from './api.service';
import { API_BASE_URL } from '../config/api.config';

export interface Laboratory {
  id: number;
  orderId: number;
  assignedUserId?: number;
  estado: EstadoLaboratorio;
  fechaAsignacion: string;
  fechaAnalisis?: string;
  fechaAprobacion?: string;
  fechaRechazo?: string;
  tipoAnalisis?: string;
  resultados?: string;
  observaciones?: string;
  motivoRechazo?: string;
  esperaReevaluacion?: boolean;
  fechaInicioEspera?: string;
  evidenciasAnalisis: string[];
  evidenciasAprobacion: string[];
  archivosAdjuntos?: string[];
  olor?: string;
  sabor?: string;
  textura?: string;
  apariencia?: string;
  parametrosQuimicos?: string;
  resultadoGeneral?: string;
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

export enum EstadoLaboratorio {
  PENDIENTE = 'PENDIENTE',
  EN_ANALISIS = 'EN_ANALISIS',
  APROBADO = 'APROBADO',
  RECHAZADO = 'RECHAZADO',
  EN_ESPERA = 'EN_ESPERA'
}

export interface CreateLaboratoryDto {
  orderId: number;
  assignedUserId?: number;
  tipoAnalisis?: string;
  observaciones?: string;
}

export interface UpdateLaboratoryDto {
  tipoAnalisis?: string;
  resultados?: string;
  observaciones?: string;
  motivoRechazo?: string;
}

export interface LaboratoryFilterDto {
  estado?: EstadoLaboratorio;
  assignedUserId?: number;
  orderId?: number;
  fechaDesde?: string;
  fechaHasta?: string;
}

class LaboratoryService {
  async listLaboratories(filters?: LaboratoryFilterDto): Promise<Laboratory[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    
    const endpoint = `/laboratory${params.toString() ? `?${params}` : ''}`;
    const response = await apiService.get<any>(endpoint);
    if (Array.isArray(response)) {
      return response;
    }
    if (response?.data && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  }

  async getLaboratory(id: number): Promise<Laboratory> {
    return apiService.get<Laboratory>(`/laboratory/${id}`);
  }

  async getById(id: number): Promise<Laboratory> {
    return this.getLaboratory(id);
  }

  async createLaboratory(data: CreateLaboratoryDto, files?: FileList | File[] | null): Promise<Laboratory> {
    // First, create the laboratory with JSON
    const laboratory = await apiService.post<Laboratory>('/laboratory', data);
    
    // Then, if there are files, upload them
    if (files && files.length > 0) {
      try {
        const updatedLaboratory = await this.uploadFiles(laboratory.id, files);
        return updatedLaboratory;
      } catch (error) {
        console.error('Error uploading files:', error);
        throw new Error(`Laboratorio creado pero error al subir archivos: ${error}`);
      }
    }
    
    return laboratory;
  }

  async uploadFiles(laboratoryId: number, files: FileList | File[]): Promise<Laboratory> {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });
    return apiService.post<Laboratory>(`/laboratory/${laboratoryId}/files`, formData);
  }

  async updateLaboratory(id: number, data: UpdateLaboratoryDto): Promise<Laboratory> {
    return apiService.patch<Laboratory>(`/laboratory/${id}`, data);
  }

  async addFilesToLaboratory(id: number, files: FileList | File[]): Promise<Laboratory> {
    return this.uploadFiles(id, files);
  }

  async deleteLaboratory(id: number): Promise<void> {
    return apiService.delete(`/laboratory/${id}`);
  }

  async assignToUser(id: number, assignedUserId: number): Promise<Laboratory> {
    return apiService.put<Laboratory>(`/laboratory/${id}/assign`, { assignedUserId });
  }

  async startAnalysis(id: number, data: { tipoAnalisis?: string; observaciones?: string }): Promise<Laboratory> {
    // Backend no tiene endpoint start-analysis; usamos update con estado EN_ANALISIS
    return apiService.patch<Laboratory>(`/laboratory/${id}`, {
      estado: EstadoLaboratorio.EN_ANALISIS,
      ...data,
    });
  }

  async approve(id: number, observaciones?: string): Promise<Laboratory> {
    return apiService.post<Laboratory>(`/laboratory/${id}/approve`, { observaciones });
  }

  async reject(id: number, motivoRechazo: string, observaciones?: string): Promise<Laboratory> {
    return apiService.post<Laboratory>(`/laboratory/${id}/reject`, { motivoRechazo, observaciones });
  }

  async uploadEvidence(id: number, files: FileList): Promise<Laboratory> {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/laboratory/${id}/upload-evidence`, {
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

  async requestReevaluation(id: number, dto: { nuevasObservaciones?: string; nuevosParametros?: string }, files?: FileList | null): Promise<Laboratory> {
    return apiService.post<Laboratory>(`/laboratory/${id}/request-reevaluation`, dto);
  }

  async discardOrder(id: number, justificacion: string): Promise<Laboratory> {
    return apiService.post<Laboratory>(`/laboratory/${id}/discard`, { justificacion });
  }

  async getStatistics(): Promise<{
    total: number;
    pendientes: number;
    enAnalisis: number;
    aprobados: number;
    rechazados: number;
    enEspera: number;
    promedioTiempoAnalisis: number;
    totalIncidentes: number;
  }> {
    return apiService.get<any>('/laboratory/statistics');
  }
}

export const laboratoryService = new LaboratoryService();