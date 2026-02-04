export interface Invoice {
  id: number;
  numeroFactura: string;
  claveAcceso?: string;
  numeroAutorizacion?: string;
  estado: 'BORRADOR' | 'EMITIDA' | 'AUTORIZADA_SRI' | 'PAGADA' | 'ANULADA' | 'VENCIDA';
  tipoComprobante: 'FACTURA' | 'NOTA_CREDITO' | 'NOTA_DEBITO' | 'RETENCION';
  packagerId: number;
  orderId?: number;
  fechaEmision: string;
  fechaVencimiento?: string;
  fechaAutorizacion?: string;
  subtotalSinImpuestos: number;
  subtotal0: number;
  subtotal12: number;
  iva: number;
  ice: number;
  total: number;
  formaPago?: string;
  plazoCredito?: number;
  observaciones?: string;
  motivoAnulacion?: string;
  packager?: {
    id: number;
    name: string;
    ruc: string;
  };
  order?: {
    id: number;
    codigo: string;
  };
  detalles?: InvoiceDetail[];
  pagos?: Payment[];
  totalPagado?: number;
  saldoPendiente?: number;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceDetail {
  id: number;
  invoiceId: number;
  codigoPrincipal: string;
  codigoAuxiliar?: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  precioTotalSinImpuesto: number;
  codigoImpuesto: string;
  codigoPorcentaje: string;
  tarifa: number;
  baseImponible: number;
  valor: number;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: number;
  numeroPago: string;
  invoiceId: number;
  packagerId: number;
  monto: number;
  fechaPago: string;
  formaPago: string;
  banco?: string;
  numeroCuenta?: string;
  numeroComprobante?: string;
  estado: 'RECIBIDO' | 'CONCILIADO' | 'ANULADO';
  observaciones?: string;
  invoice?: {
    id: number;
    numeroFactura: string;
    total: number;
  };
  packager?: {
    id: number;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProviderPayment {
  id: number;
  numeroLiquidacion: string;
  providerId: number;
  orderId?: number;
  monto: number;
  fechaPago: string;
  formaPago: string;
  banco?: string;
  numeroCuenta?: string;
  numeroComprobante?: string;
  concepto: string;
  cantidadLibras?: number;
  precioLibra?: number;
  estado: 'PAGADO' | 'ANULADO';
  observaciones?: string;
  provider?: {
    id: number;
    name: string;
  };
  order?: {
    id: number;
    codigo: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CuentaPorCobrar {
  orderId: number;
  codigo: string;
  provider: {
    id: number;
    name: string;
  };
  cantidadLibras: number;
  precioLibra: number;
  montoEstimado: number;
  totalPagado: number;
  saldoPendiente: number;
  pagos: ProviderPayment[];
}
