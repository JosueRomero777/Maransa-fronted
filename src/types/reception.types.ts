// Reception types
export interface Reception {
  id: number;
  orderId: number;
  fechaLlegada: Date;
  horaLlegada: string;
  pesoRecibido?: number;
  calidadValidada: boolean;
  loteAceptado: boolean;
  motivoRechazo?: string;
  clasificacionFinal?: string;
  precioFinalVenta?: number;
  condicionesVenta?: string;
  observaciones?: string;
  createdAt: Date;
  updatedAt: Date;
  order?: {
    id: number;
    codigo: string;
    provider: {
      name: string;
      location: string;
    };
    cantidadEstimada: number;
    precioEstimadoCompra: number;
    fechaCreacion: Date;
  };
}

export interface CreateReceptionData {
  orderId: number;
  fechaLlegada: string;
  horaLlegada: string;
  pesoRecibido?: number;
  calidadValidada?: boolean;
  loteAceptado?: boolean;
  motivoRechazo?: string;
  clasificacionFinal?: string;
  precioFinalVenta?: number;
  condicionesVenta?: string;
  observaciones?: string;
}

export interface UpdateReceptionData {
  fechaLlegada?: string;
  horaLlegada?: string;
  pesoRecibido?: number;
  calidadValidada?: boolean;
  loteAceptado?: boolean;
  motivoRechazo?: string;
  clasificacionFinal?: string;
  precioFinalVenta?: number;
  condicionesVenta?: string;
  observaciones?: string;
}

export interface ReceptionFilter {
  orderId?: number;
  clasificacionFinal?: string;
  calidadValidada?: boolean;
  loteAceptado?: boolean;
  fechaLlegadaDesde?: string;
  fechaLlegadaHasta?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface ReceptionListResponse {
  data: Reception[];
  total: number;
  page: number;
  totalPages: number;
}

// Order types for selection
export interface OrderForSelection {
  id: number;
  codigo: string;
  provider: {
    name: string;
    location: string;
  };
  cantidadEstimada: number;
  precioEstimadoCompra: number;
  fechaCreacion: Date;
  estado: string;
}

// Classification options based on common industry standards
export const CLASSIFICATION_OPTIONS = [
  'PREMIUM',
  'EXTRA',
  'PRIMERA',
  'SEGUNDA',
  'TERCERA',
  'RECHAZO'
] as const;

export type Classification = typeof CLASSIFICATION_OPTIONS[number];