import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api.config';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Chip,
  Breadcrumbs,
  Link,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  ChangeCircle as ChangeStatusIcon,
  ExpandMore as ExpandMoreIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context';

interface OrderDetail {
  id: number;
  codigo: string;
  cantidadEstimada: number;
  cantidadFinal?: number;
  fechaTentativaCosecha?: string;
  fechaDefinitivaCosecha?: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  estado: string;
  precioEstimadoCompra?: number;
  precioRealCompra?: number;
  precioEstimadoVenta?: number;
  precioRealVenta?: number;
  condicionesIniciales?: string;
  observaciones?: string;
  presentationType?: {
    id: number;
    code: string;
    name: string;
    rendimiento: number;
  };
  shrimpSize?: {
    id: number;
    code: string;
    displayLabel: string;
    classification: string;
  };
  provider: {
    id: number;
    name: string;
    contact_whatsapp: string;
    contact_phone?: string;
    contact_email?: string;
    type: string;
  };
  packager?: {
    id: number;
    name: string;
    contact_whatsapp: string;
  };
  createdBy: {
    id: number;
    name: string;
    email: string;
  };
  laboratorio?: {
    estado: string;
    fechaAnalisis: string;
    resultadoGeneral?: string;
    analista: {
      name: string;
    };
  };
  logistica?: {
    estado: string;
    fechaAsignacion?: string;
    assignedUser?: {
      name: string;
    };
  };
  custodia?: {
    horarioPesca?: string;
    horarioEstimadoLlegada?: string;
    assignedUser?: {
      name: string;
    };
  };
  recepcion?: {
    fechaLlegada: string;
    pesoRecibido?: number;
    calidadValidada: boolean;
    loteAceptado: boolean;
  };
  eventLog: Array<{
    id: number;
    accion: string;
    descripcion: string;
    createdAt: string;
    user: {
      name: string;
    };
  }>;
}

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusDialog, setStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadOrderDetail();
    }
  }, [id]);

  const loadOrderDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar detalles del pedido');
      }

      const data = await response.json();
      setOrder(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!newStatus || !order) return;

    try {
      setStatusLoading(true);
      const response = await fetch(`${API_BASE_URL}/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ estado: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cambiar estado');
      }

      await loadOrderDetail();
      setStatusDialog(false);
      setNewStatus('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado');
    } finally {
      setStatusLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
      'CREADO': 'info',
      'EN_ANALISIS': 'warning',
      'APROBADO': 'success',
      'RECHAZADO': 'error',
      'EN_REEVALUACION': 'warning',
      'DESCARTADO': 'default',
      'EN_COSECHA': 'primary',
      'EN_TRANSITO': 'primary',
      'EN_CUSTODIA': 'primary',
      'RECIBIDO': 'success',
      'FACTURADO': 'success',
      'FINALIZADO': 'secondary',
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'CREADO': 'Creado',
      'EN_ANALISIS': 'En Análisis',
      'APROBADO': 'Aprobado',
      'RECHAZADO': 'Rechazado',
      'EN_REEVALUACION': 'En Reevaluación',
      'DESCARTADO': 'Descartado',
      'EN_COSECHA': 'En Cosecha',
      'EN_TRANSITO': 'En Tránsito',
      'EN_CUSTODIA': 'En Custodia',
      'RECIBIDO': 'Recibido',
      'FACTURADO': 'Facturado',
      'FINALIZADO': 'Finalizado',
    };
    return labels[status] || status;
  };

  const formatCurrency = (value?: number) => {
    return value ? `$${value.toFixed(2)}` : 'N/A';
  };

  const formatDate = (dateString?: string) => {
    return dateString ? new Date(dateString).toLocaleString() : 'N/A';
  };

  const formatDateOnly = (dateString?: string) => {
    return dateString ? new Date(dateString).toLocaleDateString() : 'N/A';
  };

  const canEditOrder = () => {
    if (!order || (user?.role !== 'ADMIN' && user?.role !== 'COMPRAS')) return false;
    return !['FINALIZADO', 'FACTURADO', 'DESCARTADO'].includes(order.estado);
  };

  const canChangeStatus = () => {
    if (!order) return false;
    const allowedRoles = ['ADMIN', 'COMPRAS', 'LABORATORIO', 'LOGISTICA', 'CUSTODIA', 'EMPACADORA'];
    return allowedRoles.includes(user?.role || '') && !['FINALIZADO', 'DESCARTADO'].includes(order.estado);
  };

  if (loading) {
    return (
      <Grid item sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Grid>
    );
  }

  if (error || !order) {
    return (
      <Grid item sx={{ p: 3 }}>
        <Alert severity="error">
          {error || 'Pedido no encontrado'}
        </Alert>
      </Grid>
    );
  }

  return (
    <Grid item sx={{ p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          color="inherit"
          href="/orders"
          onClick={(e) => {
            e.preventDefault();
            navigate('/orders');
          }}
        >
          Pedidos
        </Link>
        <Typography color="text.primary">
          {order.codigo}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Grid item sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Grid item sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/orders')}
            sx={{ mr: 2 }}
          >
            Volver
          </Button>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            Pedido {order.codigo}
          </Typography>
          <Chip
            label={getStatusLabel(order.estado)}
            color={getStatusColor(order.estado)}
            sx={{ ml: 2 }}
          />
        </Grid>
        
        <Grid item sx={{ display: 'flex', gap: 2 }}>
          {canChangeStatus() && (
            <Button
              variant="outlined"
              startIcon={<ChangeStatusIcon />}
              onClick={() => setStatusDialog(true)}
            >
              Cambiar Estado
            </Button>
          )}
          
          {canEditOrder() && (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/orders/${order.id}/edit`)}
            >
              Editar
            </Button>
          )}
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Información Principal */}
        <Grid item xs={12} lg={8}>
          {/* Información del Pedido */}
          <Card sx={{ mb: 3 }}>
            <CardHeader
              title="Información del Pedido"
              avatar={<AssignmentIcon />}
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Presentación
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {order.presentationType ? order.presentationType.name : '-'}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Talla
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {order.shrimpSize ? order.shrimpSize.code : '-'}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Cantidad Estimada
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {order.cantidadEstimada} lbs
                    {order.cantidadFinal && ` → ${order.cantidadFinal} lbs (final)`}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Fecha Tentativa Cosecha
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatDateOnly(order.fechaTentativaCosecha)}
                    {order.fechaDefinitivaCosecha && (
                      <Typography variant="body2" color="text.secondary">
                        Definitiva: {formatDateOnly(order.fechaDefinitivaCosecha)}
                      </Typography>
                    )}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Creado por
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {order.createdBy.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(order.fechaCreacion)}
                  </Typography>
                </Grid>

                {order.condicionesIniciales && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Condiciones Iniciales
                    </Typography>
                    <Typography variant="body1">
                      {order.condicionesIniciales}
                    </Typography>
                  </Grid>
                )}

                {order.observaciones && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Observaciones
                    </Typography>
                    <Typography variant="body1">
                      {order.observaciones}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Información del Proveedor */}
          <Card sx={{ mb: 3 }}>
            <CardHeader
              title="Información del Proveedor"
              avatar={<BusinessIcon />}
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Nombre Comercial
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {order.provider.name}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Tipo
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {order.provider.type}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    WhatsApp
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {order.provider.contact_whatsapp}
                  </Typography>
                </Grid>

                {order.provider.contact_phone && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Teléfono
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {order.provider.contact_phone}
                    </Typography>
                  </Grid>
                )}

                {order.provider.contact_email && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {order.provider.contact_email}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Información Comercial */}
          <Card sx={{ mb: 3 }}>
            <CardHeader
              title="Información Comercial"
              avatar={<MoneyIcon />}
            />
            <CardContent>
              <TableContainer>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell>Precio Estimado Compra</TableCell>
                      <TableCell>{formatCurrency(order.precioEstimadoCompra)}</TableCell>
                      <TableCell>Total Est.</TableCell>
                      <TableCell>
                        {order.precioEstimadoCompra 
                          ? formatCurrency(order.precioEstimadoCompra * order.cantidadEstimada)
                          : 'N/A'
                        }
                      </TableCell>
                    </TableRow>
                    {order.precioRealCompra && (
                      <TableRow>
                        <TableCell>Precio Real Compra</TableCell>
                        <TableCell>{formatCurrency(order.precioRealCompra)}</TableCell>
                        <TableCell>Total Real</TableCell>
                        <TableCell>
                          {formatCurrency(order.precioRealCompra * (order.cantidadFinal || order.cantidadEstimada))}
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow>
                      <TableCell>Precio Estimado Venta</TableCell>
                      <TableCell>{formatCurrency(order.precioEstimadoVenta)}</TableCell>
                      <TableCell>Total Est.</TableCell>
                      <TableCell>
                        {order.precioEstimadoVenta 
                          ? formatCurrency(order.precioEstimadoVenta * order.cantidadEstimada)
                          : 'N/A'
                        }
                      </TableCell>
                    </TableRow>
                    {order.precioRealVenta && (
                      <TableRow>
                        <TableCell>Precio Real Venta</TableCell>
                        <TableCell>{formatCurrency(order.precioRealVenta)}</TableCell>
                        <TableCell>Total Real</TableCell>
                        <TableCell>
                          {formatCurrency(order.precioRealVenta * (order.cantidadFinal || order.cantidadEstimada))}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Módulos de Proceso */}
          <Card>
            <CardHeader title="Estado de Módulos de Proceso" />
            <CardContent>
              {/* Laboratorio */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Grid item sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Typography sx={{ flexGrow: 1 }}>Laboratorio</Typography>
                    {order.laboratorio && (
                      <Chip
                        size="small"
                        label={order.laboratorio.estado}
                        color={order.laboratorio.estado === 'APROBADO' ? 'success' : 'warning'}
                      />
                    )}
                  </Grid>
                </AccordionSummary>
                <AccordionDetails>
                  {order.laboratorio ? (
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Analista
                        </Typography>
                        <Typography>{order.laboratorio.analista.name}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Fecha Análisis
                        </Typography>
                        <Typography>{formatDate(order.laboratorio.fechaAnalisis)}</Typography>
                      </Grid>
                      {order.laboratorio.resultadoGeneral && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            Resultado General
                          </Typography>
                          <Typography>{order.laboratorio.resultadoGeneral}</Typography>
                        </Grid>
                      )}
                    </Grid>
                  ) : (
                    <Typography color="text.secondary">
                      Análisis de laboratorio no iniciado
                    </Typography>
                  )}
                </AccordionDetails>
              </Accordion>

              {/* Logística */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Grid item sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Typography sx={{ flexGrow: 1 }}>Logística</Typography>
                    {order.logistica && (
                      <Chip
                        size="small"
                        label={order.logistica.estado}
                        color={order.logistica.estado === 'COMPLETADO' ? 'success' : 'primary'}
                      />
                    )}
                  </Grid>
                </AccordionSummary>
                <AccordionDetails>
                  {order.logistica ? (
                    <Grid container spacing={2}>
                      {order.logistica.assignedUser && (
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Usuario Asignado
                          </Typography>
                          <Typography>{order.logistica.assignedUser.name}</Typography>
                        </Grid>
                      )}
                      {order.logistica.fechaAsignacion && (
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Fecha Asignación
                          </Typography>
                          <Typography>{formatDate(order.logistica.fechaAsignacion)}</Typography>
                        </Grid>
                      )}
                    </Grid>
                  ) : (
                    <Typography color="text.secondary">
                      Proceso logístico no iniciado
                    </Typography>
                  )}
                </AccordionDetails>
              </Accordion>

              {/* Custodia */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Custodia</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {order.custodia ? (
                    <Grid container spacing={2}>
                      {order.custodia.assignedUser && (
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Usuario Asignado
                          </Typography>
                          <Typography>{order.custodia.assignedUser.name}</Typography>
                        </Grid>
                      )}
                      {order.custodia.horarioPesca && (
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Horario Pesca
                          </Typography>
                          <Typography>{formatDate(order.custodia.horarioPesca)}</Typography>
                        </Grid>
                      )}
                    </Grid>
                  ) : (
                    <Typography color="text.secondary">
                      Proceso de custodia no iniciado
                    </Typography>
                  )}
                </AccordionDetails>
              </Accordion>

              {/* Recepción */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Recepción</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {order.recepcion ? (
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Fecha Llegada
                        </Typography>
                        <Typography>{formatDate(order.recepcion.fechaLlegada)}</Typography>
                      </Grid>
                      {order.recepcion.pesoRecibido && (
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Peso Recibido
                          </Typography>
                          <Typography>{order.recepcion.pesoRecibido} lbs</Typography>
                        </Grid>
                      )}
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Calidad Validada
                        </Typography>
                        <Chip
                          size="small"
                          label={order.recepcion.calidadValidada ? 'Sí' : 'No'}
                          color={order.recepcion.calidadValidada ? 'success' : 'error'}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Lote Aceptado
                        </Typography>
                        <Chip
                          size="small"
                          label={order.recepcion.loteAceptado ? 'Sí' : 'No'}
                          color={order.recepcion.loteAceptado ? 'success' : 'error'}
                        />
                      </Grid>
                    </Grid>
                  ) : (
                    <Typography color="text.secondary">
                      Recepción no procesada
                    </Typography>
                  )}
                </AccordionDetails>
              </Accordion>
            </CardContent>
          </Card>
        </Grid>

        {/* Timeline de Eventos */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardHeader
              title="Historial de Eventos"
              avatar={<ScheduleIcon />}
            />
            <CardContent>
              <List>
                {order.eventLog.map((event, index) => (
                  <ListItem key={event.id} alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                        {index + 1}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={event.descripcion}
                      secondary={
                        <>
                          <Typography variant="caption" color="text.secondary">
                            {event.user.name}
                          </Typography>
                          <br />
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(event.createdAt)}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog para cambio de estado */}
      <Dialog
        open={statusDialog}
        onClose={() => setStatusDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Cambiar Estado del Pedido</DialogTitle>
        <DialogContent>
          <Grid item sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Nuevo Estado</InputLabel>
              <Select
                value={newStatus}
                label="Nuevo Estado"
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <MenuItem value="CREADO">Creado</MenuItem>
                <MenuItem value="EN_ANALISIS">En Análisis</MenuItem>
                <MenuItem value="APROBADO">Aprobado</MenuItem>
                <MenuItem value="RECHAZADO">Rechazado</MenuItem>
                <MenuItem value="EN_REEVALUACION">En Reevaluación</MenuItem>
                <MenuItem value="EN_COSECHA">En Cosecha</MenuItem>
                <MenuItem value="EN_TRANSITO">En Tránsito</MenuItem>
                <MenuItem value="EN_CUSTODIA">En Custodia</MenuItem>
                <MenuItem value="RECIBIDO">Recibido</MenuItem>
                <MenuItem value="FACTURADO">Facturado</MenuItem>
                <MenuItem value="FINALIZADO">Finalizado</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleStatusChange}
            variant="contained"
            disabled={!newStatus || statusLoading}
          >
            {statusLoading ? <CircularProgress size={20} /> : 'Cambiar Estado'}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default OrderDetail;
