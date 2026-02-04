import { apiService } from './api.service';

export type EventLog = {
  id: number;
  orderId: number;
  userId: number;
  accion: string;
  descripcion: string;
  fechaEvento: string;
  createdAt: string;
  order?: {
    id: number;
    codigo: string;
    provider?: {
      name: string;
    };
  };
  user?: {
    id: number;
    name: string;
    email: string;
  };
  details?: Array<{
    id: number;
    clave: string;
    valorAnterior: string | null;
    valorNuevo: string | null;
  }>;
};

export type LogsFilter = {
  orderId?: number;
  userName?: string;
  accion?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  page?: number;
  limit?: number;
};

export type LogsResponse = {
  data: EventLog[];
  total: number;
  page: number;
  limit: number;
};

class LogsService {
  async getLogs(filters?: LogsFilter): Promise<LogsResponse> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    
    const endpoint = `/event-logs${params.toString() ? `?${params}` : ''}`;
    const response = await apiService.get<LogsResponse>(endpoint);
    return response;
  }

  async getLogById(id: number): Promise<EventLog> {
    return apiService.get<EventLog>(`/event-logs/${id}`);
  }

  async getLogsByOrder(orderId: number): Promise<EventLog[]> {
    return apiService.get<EventLog[]>(`/event-logs/order/${orderId}`);
  }

  async getLogsByUser(userId: number): Promise<EventLog[]> {
    return apiService.get<EventLog[]>(`/event-logs/user/${userId}`);
  }
}

export const logsService = new LogsService();
