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
  Tooltip,
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
    contact_phone?: string;
    contact_email?: string;
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
    estado?: string;
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

  const getCustodyStatusColor = (status?: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    if (!status) return 'default';
    if (status === 'COMPLETADO') return 'success';
    if (status === 'EN_CUSTODIA') return 'primary';
    if (status === 'ASIGNADO') return 'info';
    return 'warning';
  };

  const hasEditPermission = user?.role === 'ADMIN' || user?.role === 'COMPRAS';

  const getEditDisabledReason = () => {
    if (!order) return null;
    const editableStatuses = new Set([
      'CREADO',
      'EN_ANALISIS',
      'APROBADO',
      'RECHAZADO',
      'EN_REEVALUACION',
      'LABORATORIO_APROBADO',
      'LABORATORIO_RECHAZADO',
      'LABORATORIO_REEVALUACION',
      'DEFINIENDO_COSECHA',
      'COSECHA_DEFINIDA',
      'COSECHA_RECHAZADA',
    ]);

    if (editableStatuses.has(order.estado)) {
      return null;
    }

    const statusReasons: Record<string, string> = {
      COSECHA_APROBADA: 'No se puede editar porque la cosecha ya fue aprobada',
      LOGISTICA_ASIGNADA: 'No se puede editar porque el pedido ya pasó a logística',
      EN_TRANSPORTE: 'No se puede editar porque el pedido está en transporte',
      CUSTODIA_ASIGNADA: 'No se puede editar porque el pedido ya tiene custodia asignada',
      EN_CUSTODIA: 'No se puede editar porque el pedido está en custodia',
      CUSTODIA_COMPLETADA: 'No se puede editar porque la custodia ya fue completada',
      ENTREGADO: 'No se puede editar porque el pedido ya fue entregado',
      EN_COSECHA: 'No se puede editar porque el pedido ya está en cosecha',
      EN_TRANSITO: 'No se puede editar porque el pedido está en tránsito',
      RECIBIDO: 'No se puede editar porque el pedido ya fue recibido',
      FACTURADO: 'No se puede editar porque el pedido ya fue facturado',
      FINALIZADO: 'No se puede editar porque el pedido está finalizado',
      CANCELADO: 'No se puede editar porque el pedido está cancelado',
      DESCARTADO: 'No se puede editar porque el pedido está descartado',
    };

    return statusReasons[order.estado] || 'No se puede editar en el estado actual del pedido';
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
          {hasEditPermission && (
            <Tooltip title={getEditDisabledReason() || 'Editar'}>
              <span>
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/orders/${order.id}/edit`)}
                  disabled={Boolean(getEditDisabledReason())}
                >
                  Editar
                </Button>
              </span>
            </Tooltip>
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

          {/* Información de la Empacadora */}
          <Card sx={{ mb: 3 }}>
            <CardHeader
              title="Información de la Empacadora"
              avatar={<BusinessIcon />}
            />
            <CardContent>
              {order.packager ? (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Nombre
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {order.packager.name}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      WhatsApp
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {order.packager.contact_whatsapp || 'No registrado'}
                    </Typography>
                  </Grid>

                  {order.packager.contact_phone && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">
                        Teléfono
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {order.packager.contact_phone}
                      </Typography>
                    </Grid>
                  )}

                  {order.packager.contact_email && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">
                        Email
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {order.packager.contact_email}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              ) : (
                <Typography color="text.secondary">No tiene empacadora asignada</Typography>
              )}
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
                  <Grid item sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Typography sx={{ flexGrow: 1 }}>Custodia</Typography>
                    {order.custodia && (
                      <Chip
                        size="small"
                        label={order.custodia.estado || 'EN_CUSTODIA'}
                        color={getCustodyStatusColor(order.custodia.estado)}
                      />
                    )}
                  </Grid>
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
                  <Grid item sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Typography sx={{ flexGrow: 1 }}>Recepción</Typography>
                    {order.recepcion && (
                      <Chip
                        size="small"
                        label="COMPLETADO"
                        color="success"
                      />
                    )}
                  </Grid>
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
    </Grid>
  );
};

export default OrderDetail;
