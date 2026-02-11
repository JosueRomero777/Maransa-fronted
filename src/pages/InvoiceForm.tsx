import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api.config';
import {
  Box,
  Button,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Add, Delete, Save, ArrowBack } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';

// Códigos de Forma de Pago según SRI Ecuador
const FORMAS_PAGO = [
  { codigo: '01', nombre: 'Efectivo' },
  { codigo: '02', nombre: 'Cheque' },
  { codigo: '03', nombre: 'Débito Bancario' },
  { codigo: '04', nombre: 'Crédito Bancario' },
  { codigo: '15', nombre: 'Tarjeta Débito' },
  { codigo: '16', nombre: 'Tarjeta Crédito' },
  { codigo: '17', nombre: 'Dinero Electrónico' },
  { codigo: '19', nombre: 'Compensación' },
];

// Códigos de IVA según SRI Ecuador
// Nota: El camarón en Ecuador es producto de exportación, normalmente con 0% IVA
const TARIFAS_IVA = [
  { codigoPorcentaje: '0', tarifa: 0, nombre: '0% (Exento - Camarón Exportación)' },
  { codigoPorcentaje: '4', tarifa: 5, nombre: '5% (Reducido)' },
  { codigoPorcentaje: '2', tarifa: 12, nombre: '12% (General)' },
  { codigoPorcentaje: '3', tarifa: 14, nombre: '14% (Especial)' },
  { codigoPorcentaje: '7', tarifa: 15, nombre: '15% (Especial)' },
  { codigoPorcentaje: '5', tarifa: 20, nombre: '20% (Especial)' },
];

interface InvoiceDetailForm {
  codigoPrincipal: string;
  codigoAuxiliar: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  codigoImpuesto: string;
  codigoPorcentaje: string;
  tarifa: number;
}

export default function InvoiceForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [packagers, setPackagers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    packagerId: '',
    orderId: '',
    fechaEmision: new Date().toISOString().split('T')[0],
    fechaVencimiento: '',
    formaPago: '01', // Efectivo por defecto
    plazoCredito: 0,
    observaciones: '',
  });

  const [detalles, setDetalles] = useState<InvoiceDetailForm[]>([
    {
      codigoPrincipal: '',
      codigoAuxiliar: '',
      descripcion: '',
      cantidad: 1,
      precioUnitario: 0,
      descuento: 0,
      codigoImpuesto: '2', // IVA
      codigoPorcentaje: '0', // 0% - Camarón es producto de exportación (exento)
      tarifa: 0,
    },
  ]);

  const [buyerOverride, setBuyerOverride] = useState(false);
  const [buyerData, setBuyerData] = useState({
    nombre: '',
    identificacion: '',
    direccion: '',
    email: '',
  });

  const selectedPackager = Array.isArray(packagers)
    ? packagers.find((p) => p.id === parseInt(formData.packagerId))
    : undefined;

  const getTipoIdentificacionComprador = (identificacion?: string) => {
    const cleaned = (identificacion || '').replace(/\D/g, '');
    if (cleaned.length === 13) return '04'; // RUC
    if (cleaned.length === 10) return '05'; // Cedula
    if (cleaned.length > 0) return '06'; // Pasaporte u otro
    return '07'; // Consumidor final
  };

  useEffect(() => {
    loadPackagers();
    if (isEdit) {
      loadInvoice();
    }
  }, [id]);

  useEffect(() => {
    if (!buyerOverride && selectedPackager) {
      setBuyerData({
        nombre: selectedPackager.name || '',
        identificacion: selectedPackager.ruc || '',
        direccion: selectedPackager.location || '',
        email: selectedPackager.email || '',
      });
    }
  }, [buyerOverride, selectedPackager]);

  // Cargar pedidos cuando cambie la empacadora seleccionada
  useEffect(() => {
    if (formData.packagerId) {
      loadOrders(parseInt(formData.packagerId));
    } else {
      setOrders([]);
      // Limpiar orderId si se deselecciona empacadora
      setFormData(prev => ({ ...prev, orderId: '' }));
    }
  }, [formData.packagerId]);

  // Auto-llenar detalles cuando se selecciona una orden
  useEffect(() => {
    if (formData.orderId) {
      const selectedOrder = orders.find(o => o.id === parseInt(formData.orderId));
      if (selectedOrder && selectedOrder.recepcion) {
        const recepcion = selectedOrder.recepcion;
        
        // Construir descripción detallada
        const presentacion = selectedOrder.presentationType?.name || 'Camarón';
        const talla = selectedOrder.shrimpSize?.displayLabel || selectedOrder.shrimpSize?.code || 'Varios';
        const descripcion = `${presentacion} ${talla} - Orden ${selectedOrder.codigo}`;
        
        // Usar valores FINALES de la recepción (no estimados)
        const cantidad = recepcion.pesoRecibido || selectedOrder.cantidadEstimada || 0;
        const precioUnitario = recepcion.precioFinalVenta || selectedOrder.precioEstimadoVenta || 0;
        
        const nuevosDetalles = [
          {
            codigoPrincipal: selectedOrder.codigo || '',
            codigoAuxiliar: selectedOrder.id?.toString() || '',
            descripcion: descripcion,
            cantidad: cantidad,
            precioUnitario: precioUnitario,
            descuento: 0,
            codigoImpuesto: '2', // IVA
            codigoPorcentaje: '0', // 0% - Camarón exento (exportación)
            tarifa: 0,
          },
        ];
        
        setDetalles(nuevosDetalles);
      }
    }
  }, [formData.orderId, orders]);

  // Calcular fecha de vencimiento automáticamente basado en plazo crédito
  useEffect(() => {
    if (formData.plazoCredito > 0 && formData.fechaEmision) {
      const fechaEmision = new Date(formData.fechaEmision);
      const fechaVencimiento = new Date(fechaEmision);
      fechaVencimiento.setDate(fechaVencimiento.getDate() + formData.plazoCredito);
      
      // Formato YYYY-MM-DD
      const fechaVencimientoStr = fechaVencimiento.toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        fechaVencimiento: fechaVencimientoStr,
      }));
    } else {
      // Limpiar fecha de vencimiento si no hay plazo
      setFormData(prev => ({
        ...prev,
        fechaVencimiento: '',
      }));
    }
  }, [formData.plazoCredito, formData.fechaEmision]);

  const loadPackagers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/packagers`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Error al cargar empacadoras');
      const data = await response.json();
      setPackagers(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const loadOrders = async (packagerId?: number) => {
    try {
      const token = localStorage.getItem('token');
      let url = `${API_BASE_URL}/orders?limit=100&includeRelations=true`;
      
      // Filtrar por empacadora si se proporciona
      if (packagerId) {
        url += `&packagerId=${packagerId}`;
      }
      
      console.log('📡 URL completa de pedidos:', url);
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Error al cargar pedidos');
      const data = await response.json();
      
      console.log('📦 Pedidos recibidos del backend:', data.orders?.length || 0);
      console.log('📦 Datos completos:', data.orders);
      
      // Filtrar solo pedidos con recepción aceptada
      const ordersWithAcceptedReception = (data.orders || []).filter((order: any) => {
        const hasReception = order.recepcion;
        const isAccepted = hasReception && order.recepcion.loteAceptado === true;
        
        console.log(`📦 Orden ${order.codigo || order.id}:`, {
          tieneRecepcion: !!hasReception,
          loteAceptado: order.recepcion?.loteAceptado,
          recepcion: order.recepcion
        });
        
        return isAccepted;
      });
      
      console.log('✅ Pedidos filtrados con recepción aceptada:', ordersWithAcceptedReception.length);
      
      setOrders(ordersWithAcceptedReception);
      
      // Si el orderId actual no está en la nueva lista, limpiar la selección
      if (formData.orderId) {
        const stillExists = ordersWithAcceptedReception.some(
          (o: any) => o.id === parseInt(formData.orderId)
        );
        if (!stillExists) {
          setFormData(prev => ({ ...prev, orderId: '' }));
        }
      }
    } catch (err: any) {
      console.error('❌ Error al cargar pedidos:', err);
      setOrders([]);
    }
  };

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/invoicing/invoices/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Error al cargar factura');

      const data = await response.json();
      setFormData({
        packagerId: data.packagerId.toString(),
        orderId: data.orderId?.toString() || '',
        fechaEmision: data.fechaEmision.split('T')[0],
        fechaVencimiento: data.fechaVencimiento?.split('T')[0] || '',
        formaPago: data.formaPago || 'EFECTIVO',
        plazoCredito: data.plazoCredito || 0,
        observaciones: data.observaciones || '',
      });

      if (data.detalles && data.detalles.length > 0) {
        setDetalles(data.detalles.map((d: any) => ({
          codigoPrincipal: d.codigoPrincipal,
          codigoAuxiliar: d.codigoAuxiliar || '',
          descripcion: d.descripcion,
          cantidad: d.cantidad,
          precioUnitario: d.precioUnitario,
          descuento: d.descuento,
          codigoImpuesto: d.codigoImpuesto,
          codigoPorcentaje: d.codigoPorcentaje,
          tarifa: d.tarifa,
        })));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDetail = () => {
    setDetalles([
      ...detalles,
      {
        codigoPrincipal: '',
        codigoAuxiliar: '',
        descripcion: '',
        cantidad: 1,
        precioUnitario: 0,
        descuento: 0,
        codigoImpuesto: '2',
        codigoPorcentaje: '2',
        tarifa: 12,
      },
    ]);
  };

  const handleRemoveDetail = (index: number) => {
    const newDetalles = detalles.filter((_, i) => i !== index);
    setDetalles(newDetalles);
  };

  const handleDetailChange = (index: number, field: string, value: any) => {
    const newDetalles = [...detalles];
    (newDetalles[index] as any)[field] = value;

    // Actualizar tarifa según código de porcentaje (SRI Ecuador)
    if (field === 'codigoPorcentaje') {
      const tarifaEncontrada = TARIFAS_IVA.find(t => t.codigoPorcentaje === value);
      if (tarifaEncontrada) {
        newDetalles[index].tarifa = tarifaEncontrada.tarifa;
      }
    }

    setDetalles(newDetalles);
  };

  const calculateTotal = () => {
    let subtotal0 = 0;
    let subtotal5 = 0;
    let subtotal12 = 0;
    let subtotal14 = 0;
    let subtotal20 = 0;
    let iva = 0;

    detalles.forEach((detalle) => {
      const total = detalle.cantidad * detalle.precioUnitario - detalle.descuento;
      
      // Clasificar por tarifa (SRI Ecuador)
      switch(detalle.tarifa) {
        case 0:
          subtotal0 += total;
          break;
        case 5:
          subtotal5 += total;
          iva += total * 0.05;
          break;
        case 12:
          subtotal12 += total;
          iva += total * 0.12;
          break;
        case 14:
          subtotal14 += total;
          iva += total * 0.14;
          break;
        case 20:
          subtotal20 += total;
          iva += total * 0.20;
          break;
      }
    });

    const totalFinal = subtotal0 + subtotal5 + subtotal12 + subtotal14 + subtotal20 + iva;

    return { subtotal0, subtotal5, subtotal12, subtotal14, subtotal20, iva, total: totalFinal };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.packagerId) {
      setError('Debe seleccionar una empacadora');
      return;
    }

    if (detalles.length === 0) {
      setError('Debe agregar al menos un detalle');
      return;
    }

    // Validar detalles
    const invalidDetail = detalles.find(
      (d) => !d.codigoPrincipal || !d.descripcion || d.cantidad <= 0 || d.precioUnitario <= 0
    );

    if (invalidDetail) {
      setError('Todos los detalles deben tener código, descripción, cantidad y precio válidos');
      return;
    }

    if (buyerOverride && !buyerData.identificacion) {
      setError('Debe ingresar la identificación del comprador');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const compradorIdentificacion = buyerOverride
        ? buyerData.identificacion
        : selectedPackager?.ruc;

      const payload = {
        packagerId: parseInt(formData.packagerId),
        orderId: formData.orderId ? parseInt(formData.orderId) : undefined,
        fechaEmision: formData.fechaEmision,
        fechaVencimiento: formData.fechaVencimiento || undefined,
        formaPago: formData.formaPago,
        plazoCredito: formData.plazoCredito || undefined,
        observaciones: formData.observaciones || undefined,
        tipoIdentificacionComprador: getTipoIdentificacionComprador(compradorIdentificacion),
        identificacionComprador: compradorIdentificacion || undefined,
        razonSocialComprador: buyerOverride ? buyerData.nombre || undefined : selectedPackager?.name || undefined,
        direccionComprador: buyerOverride ? buyerData.direccion || undefined : selectedPackager?.location || undefined,
        emailComprador: buyerOverride ? buyerData.email || undefined : undefined,
        detalles: detalles.map((d) => ({
          codigoPrincipal: d.codigoPrincipal,
          codigoAuxiliar: d.codigoAuxiliar || undefined,
          descripcion: d.descripcion,
          cantidad: d.cantidad,
          precioUnitario: d.precioUnitario,
          descuento: d.descuento,
          codigoImpuesto: d.codigoImpuesto,
          codigoPorcentaje: d.codigoPorcentaje,
          tarifa: d.tarifa,
        })),
      };

      const token = localStorage.getItem('token');
      const url = isEdit
        ? `${API_BASE_URL}/invoicing/invoices/${id}`
        : `${API_BASE_URL}/invoicing/invoices`;

      const response = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al guardar factura');
      }

      navigate('/invoices');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotal();

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/invoices')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4">
          {isEdit ? 'Editar Factura' : 'Nueva Factura'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Información General</Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ minWidth: 250, flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(50% - 8px)' } }}>
              <TextField
                fullWidth
                required
                select
                label="Empacadora"
                value={formData.packagerId}
                onChange={(e) => setFormData({ ...formData, packagerId: e.target.value })}
              >
                {Array.isArray(packagers) && packagers.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name} - {p.ruc}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box sx={{ minWidth: 250, flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(50% - 8px)' } }}>
              <TextField
                fullWidth
                select
                label="Pedido (opcional)"
                value={formData.orderId}
                onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
              >
                <MenuItem value="">Ninguno</MenuItem>
                {Array.isArray(orders) && orders.map((o) => (
                  <MenuItem key={o.id} value={o.id}>
                    {o.codigo}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box sx={{ minWidth: 150, flex: { xs: '1 1 100%', sm: '1 1 calc(25% - 6px)', md: '1 1 calc(25% - 6px)' } }}>
              <TextField
                fullWidth
                required
                type="date"
                label="Fecha Emisión"
                value={formData.fechaEmision}
                onChange={(e) => setFormData({ ...formData, fechaEmision: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            {/* Fecha Vencimiento - Solo mostrar si hay plazo de crédito o forma de pago requiere */}
            {(formData.plazoCredito > 0 || ['16', '17'].includes(formData.formaPago)) && (
              <Box sx={{ minWidth: 150, flex: { xs: '1 1 100%', sm: '1 1 calc(25% - 6px)', md: '1 1 calc(25% - 6px)' } }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha Vencimiento"
                  value={formData.fechaVencimiento}
                  onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  helperText="Se calcula automáticamente si ingresa plazo crédito"
                />
              </Box>
            )}

            <Box sx={{ minWidth: 150, flex: { xs: '1 1 100%', sm: '1 1 calc(25% - 6px)', md: '1 1 calc(25% - 6px)' } }}>
              <TextField
                fullWidth
                select
                label="Forma de Pago"
                value={formData.formaPago}
                onChange={(e) => setFormData({ ...formData, formaPago: e.target.value })}
              >
                {FORMAS_PAGO.map((fp) => (
                  <MenuItem key={fp.codigo} value={fp.codigo}>
                    {fp.nombre}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            {/* Plazo Crédito - Solo para formas de pago de crédito */}
            {['16', '17', '18', '19', '20', '21'].includes(formData.formaPago) && (
              <Box sx={{ minWidth: 150, flex: { xs: '1 1 100%', sm: '1 1 calc(25% - 6px)', md: '1 1 calc(25% - 6px)' } }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Plazo Crédito (días)"
                  value={formData.plazoCredito}
                  onChange={(e) => setFormData({ ...formData, plazoCredito: parseInt(e.target.value) || 0 })}
                  helperText="Solo requerido para pagos con plazo"
                />
              </Box>
            )}

            <Box sx={{ minWidth: 250, flex: '1 1 100%' }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Observaciones"
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              />
            </Box>
          </Box>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Comprador</Typography>
            <Button
              variant={buyerOverride ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setBuyerOverride((prev) => !prev)}
            >
              {buyerOverride ? 'Usar datos de empacadora' : 'Editar comprador'}
            </Button>
          </Box>

          {!buyerOverride && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <TextField
                fullWidth
                label="Razón social"
                value={buyerData.nombre}
                InputProps={{ readOnly: true }}
              />
              <TextField
                fullWidth
                label="Identificación"
                value={buyerData.identificacion}
                InputProps={{ readOnly: true }}
              />
              <TextField
                fullWidth
                label="Dirección"
                value={buyerData.direccion}
                InputProps={{ readOnly: true }}
              />
              <TextField
                fullWidth
                label="Email"
                value={buyerData.email}
                InputProps={{ readOnly: true }}
              />
            </Box>
          )}

          {buyerOverride && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <TextField
                fullWidth
                required
                label="Razón social"
                value={buyerData.nombre}
                onChange={(e) => setBuyerData((prev) => ({ ...prev, nombre: e.target.value }))}
              />
              <TextField
                fullWidth
                required
                label="Identificación (RUC o Cédula)"
                value={buyerData.identificacion}
                onChange={(e) => setBuyerData((prev) => ({ ...prev, identificacion: e.target.value }))}
              />
              <TextField
                fullWidth
                label="Dirección"
                value={buyerData.direccion}
                onChange={(e) => setBuyerData((prev) => ({ ...prev, direccion: e.target.value }))}
              />
              <TextField
                fullWidth
                label="Email"
                value={buyerData.email}
                onChange={(e) => setBuyerData((prev) => ({ ...prev, email: e.target.value }))}
              />
            </Box>
          )}
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Detalles</Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button startIcon={<Add />} onClick={handleAddDetail}>
                Agregar Línea
              </Button>
              {formData.orderId && (
                <Typography variant="caption" sx={{ color: 'info.main', fontStyle: 'italic' }}>
                  ℹ️ Los campos de la primera línea están auto-llenados y bloqueados. Edita otros detalles si es necesario.
                </Typography>
              )}
            </Box>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Código</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell width={80}>Cant.</TableCell>
                  <TableCell width={100}>Precio</TableCell>
                  <TableCell width={100}>Desc.</TableCell>
                  <TableCell width={120}>IVA</TableCell>
                  <TableCell width={100}>Subtotal</TableCell>
                  <TableCell width={50}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {detalles.map((detalle, index) => {
                  const subtotal = detalle.cantidad * detalle.precioUnitario - detalle.descuento;
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <TextField
                          size="small"
                          required
                          select
                          value={detalle.codigoPrincipal}
                          onChange={(e) => handleDetailChange(index, 'codigoPrincipal', e.target.value)}
                          disabled={!!(formData.orderId && index === 0)}
                        >
                          <MenuItem value="">Seleccionar</MenuItem>
                          {Array.isArray(orders) && orders.map((o) => (
                            <MenuItem key={o.id} value={o.codigo}>
                              {o.codigo} - {o.descripcion}
                            </MenuItem>
                          ))}
                        </TextField>
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          required
                          fullWidth
                          value={detalle.descripcion}
                          onChange={(e) => handleDetailChange(index, 'descripcion', e.target.value)}
                          disabled={!!(formData.orderId && index === 0)}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          required
                          value={detalle.cantidad}
                          onChange={(e) => handleDetailChange(index, 'cantidad', parseFloat(e.target.value) || 0)}
                          inputProps={{ min: 0, step: 0.01 }}
                          disabled={!!(formData.orderId && index === 0)}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          required
                          value={detalle.precioUnitario}
                          onChange={(e) => handleDetailChange(index, 'precioUnitario', parseFloat(e.target.value) || 0)}
                          inputProps={{ min: 0, step: 0.01 }}
                          disabled={!!(formData.orderId && index === 0)}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={detalle.descuento}
                          onChange={(e) => handleDetailChange(index, 'descuento', parseFloat(e.target.value) || 0)}
                          inputProps={{ min: 0, step: 0.01 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          select
                          fullWidth
                          value={detalle.codigoPorcentaje}
                          onChange={(e) => handleDetailChange(index, 'codigoPorcentaje', e.target.value)}
                        >
                          {TARIFAS_IVA.map((tarifa) => (
                            <MenuItem key={tarifa.codigoPorcentaje} value={tarifa.codigoPorcentaje}>
                              {tarifa.nombre}
                            </MenuItem>
                          ))}
                        </TextField>
                      </TableCell>
                      <TableCell align="right">
                        ${subtotal.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleRemoveDetail(index)}>
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Totales</Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Typography variant="body2" color="text.secondary">Subtotal 0%</Typography>
              <Typography variant="h6">${totals.subtotal0.toFixed(2)}</Typography>
            </Grid>
            {totals.subtotal5 > 0 && (
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <Typography variant="body2" color="text.secondary">Subtotal 5%</Typography>
                <Typography variant="h6">${totals.subtotal5.toFixed(2)}</Typography>
              </Grid>
            )}
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Typography variant="body2" color="text.secondary">Subtotal 12%</Typography>
              <Typography variant="h6">${totals.subtotal12.toFixed(2)}</Typography>
            </Grid>
            {totals.subtotal14 > 0 && (
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <Typography variant="body2" color="text.secondary">Subtotal 14%</Typography>
                <Typography variant="h6">${totals.subtotal14.toFixed(2)}</Typography>
              </Grid>
            )}
            {totals.subtotal20 > 0 && (
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <Typography variant="body2" color="text.secondary">Subtotal 20%</Typography>
                <Typography variant="h6">${totals.subtotal20.toFixed(2)}</Typography>
              </Grid>
            )}
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Typography variant="body2" color="text.secondary">IVA Total</Typography>
              <Typography variant="h6">${totals.iva.toFixed(2)}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Typography variant="body2" color="text.secondary">TOTAL</Typography>
              <Typography variant="h5" color="primary" fontWeight="bold">${totals.total.toFixed(2)}</Typography>
            </Grid>
          </Grid>
        </Paper>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <Save />}
            disabled={loading}
          >
            {isEdit ? 'Actualizar' : 'Guardar'}
          </Button>
          <Button onClick={() => navigate('/invoices')}>
            Cancelar
          </Button>
        </Box>
      </form>
    </Box>
  );
}
