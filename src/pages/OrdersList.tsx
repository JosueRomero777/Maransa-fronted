import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Pagination,
  Alert,
  CircularProgress,
  Tooltip,
  Card,
  CardContent,
  useMediaQuery,
  useTheme,
  Stack,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Download as ExportIcon,
  Assessment as StatsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context';
import dayjs from 'dayjs';

interface Order {
  id: number;
  codigo: string;
  cantidadEstimada: number;
  cantidadFinal?: number;
  fechaTentativaCosecha?: string;
  fechaDefinitivaCosecha?: string;
  fechaCreacion: string;
  estado: string;
  precioEstimadoCompra?: number;
  precioRealCompra?: number;
  precioEstimadoVenta?: number;
  precioRealVenta?: number;
  observaciones?: string;
  presentationType?: {
    id: number;
    code: string;
    name: string;
  };
  shrimpSize?: {
    id: number;
    code: string;
    displayLabel: string;
  };
  provider: {
    id: number;
    name: string;
    contact_whatsapp: string;
  };
  createdBy: {
    id: number;
    name: string;
  };
}

interface OrderFilters {
  providerId?: number;
  estado?: string;
  fechaDesde?: dayjs.Dayjs | null;
  fechaHasta?: dayjs.Dayjs | null;
  page: number;
  limit: number;
}

interface OrderStats {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  recent: number;
  averageValues: {
    _avg: {
      precioEstimadoCompra?: number;
      precioRealCompra?: number;
    };
  };
}

const OrdersList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [usedProviders, setUsedProviders] = useState<any[]>([]);
  const [usedStatuses, setUsedStatuses] = useState<string[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(false);
  
  const [filters, setFilters] = useState<OrderFilters>({
    page: 1,
    limit: 10,
    fechaDesde: null,
    fechaHasta: null,
  });
  
  const [totalPages, setTotalPages] = useState(1);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; order: Order | null }>({
    open: false,
    order: null,
  });

  // Cargar datos iniciales
  useEffect(() => {
    loadOrders();
    loadProviders();
    loadAvailableDates();
    loadUsedProviders();
    loadUsedStatuses();
    if (user?.role === 'ADMIN' || user?.role === 'GERENCIA') {
      loadStats();
    }
  }, [filters, user]);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          // Convert dayjs dates to string format for API
          if (dayjs.isDayjs(value)) {
            queryParams.append(key, value.format('YYYY-MM-DD'));
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });

      const response = await fetch(`http://localhost:3000/orders?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar pedidos');
      }

      const data = await response.json();
      setOrders(data.orders);
      setTotalPages(data.pagination.pages);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadProviders = async () => {
    try {
      const response = await fetch('http://localhost:3000/providers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setProviders(data.data);
      }
    } catch (error) {
      console.error('Error loading providers:', error);
    }
  };

  const loadAvailableDates = async () => {
    try {
      const response = await fetch('http://localhost:3000/orders/available-dates', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        // Convert string dates to dayjs for date picker
        setAvailableDates(data.map((dateStr: string) => dayjs(dateStr)));
      }
    } catch (error) {
      console.error('Error loading available dates:', error);
    }
  };

  const loadUsedProviders = async () => {
    try {
      const response = await fetch('http://localhost:3000/orders/used-providers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsedProviders(data);
      }
    } catch (error) {
      console.error('Error loading used providers:', error);
    }
  };

  const loadUsedStatuses = async () => {
    try {
      const response = await fetch('http://localhost:3000/orders/used-statuses', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsedStatuses(data);
      }
    } catch (error) {
      console.error('Error loading used statuses:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('http://localhost:3000/orders/statistics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleDeleteOrder = async (order: Order) => {
    try {
      const response = await fetch(`http://localhost:3000/orders/${order.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al eliminar pedido');
      }

      await loadOrders();
      setDeleteDialog({ open: false, order: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
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
    return dateString ? new Date(dateString).toLocaleDateString() : 'N/A';
  };

  const canEditOrder = (order: Order) => {
    if (user?.role !== 'ADMIN' && user?.role !== 'COMPRAS') return false;
    return !['FINALIZADO', 'FACTURADO', 'DESCARTADO'].includes(order.estado);
  };

  const canDeleteOrder = (order: Order) => {
    if (user?.role !== 'ADMIN' && user?.role !== 'COMPRAS') return false;
    return !['FINALIZADO', 'FACTURADO'].includes(order.estado);
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Grid item sx={{ p: { xs: 1.5, sm: 2.5, md: 3 } }}>
      {/* Header */}
      <Grid item sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        mb: 3,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1.5, sm: 0 }
      }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
          Gestión de Pedidos
        </Typography>
        
        <Grid item sx={{ 
          display: 'flex', 
          gap: 1, 
          flexDirection: { xs: 'column', sm: 'row' },
          width: { xs: '100%', sm: 'auto' }
        }}>
          {(user?.role === 'ADMIN' || user?.role === 'GERENCIA') && (
            <Button
              variant="outlined"
              startIcon={<StatsIcon />}
              onClick={() => setShowStats(!showStats)}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Estadísticas
            </Button>
          )}
          
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Filtros
          </Button>
          
          {(user?.role === 'ADMIN' || user?.role === 'COMPRAS') && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/orders/new')}
            >
              Nuevo Pedido
            </Button>
          )}
        </Grid>
      </Grid>

      {/* Estadísticas */}
      {showStats && stats && (
        <Grid item sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Grid item sx={{ width: { xs: '100%', sm: '50%', md: '25%' } }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Pedidos
                </Typography>
                <Typography variant="h5" component="div">
                  {stats.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item sx={{ width: { xs: '100%', sm: '50%', md: '25%' } }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Pedidos Recientes
                </Typography>
                <Typography variant="h5" component="div">
                  {stats.recent}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item sx={{ width: { xs: '100%', sm: '50%', md: '25%' } }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Precio Promedio Estimado
                </Typography>
                <Typography variant="h5" component="div">
                  {formatCurrency(stats.averageValues._avg.precioEstimadoCompra)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item sx={{ width: { xs: '100%', sm: '50%', md: '25%' } }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Precio Promedio Real
                </Typography>
                <Typography variant="h5" component="div">
                  {formatCurrency(stats.averageValues._avg.precioRealCompra)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filtros */}
      {showFilters && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filtros de búsqueda
          </Typography>
          
          <Grid item sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <Grid item sx={{ width: { xs: '100%', sm: '50%', md: '33.33%', lg: '25%' } }}>
              <FormControl fullWidth sx={{ minWidth: 200 }}>
                <InputLabel>Proveedor</InputLabel>
                <Select
                  value={filters.providerId || ''}
                  label="Proveedor"
                  onChange={(e) => setFilters(prev => ({ ...prev, providerId: e.target.value || undefined }))}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {usedProviders && usedProviders.map((provider) => (
                    <MenuItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item sx={{ width: { xs: '100%', sm: '50%', md: '33.33%', lg: '25%' } }}>
              <FormControl fullWidth sx={{ minWidth: 200 }}>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filters.estado || ''}
                  label="Estado"
                  onChange={(e) => setFilters(prev => ({ ...prev, estado: e.target.value || undefined }))}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {usedStatuses && usedStatuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {getStatusLabel(status)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item sx={{ width: { xs: '100%', sm: '50%', md: '33.33%', lg: '25%' } }}>
              <DatePicker
                label="Fecha Desde"
                value={filters.fechaDesde}
                onChange={(newValue) => setFilters(prev => ({ ...prev, fechaDesde: newValue }))}
                shouldDisableDate={(date) => {
                  // Only show dates that have orders
                  return !availableDates.some(availableDate => 
                    date.format('YYYY-MM-DD') === availableDate.format('YYYY-MM-DD')
                  );
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    sx: { 
                      minWidth: 200,
                      '& input': {
                        cursor: 'pointer',
                        caretColor: 'transparent'
                      }
                    },
                    onKeyDown: (e) => e.preventDefault(),
                    inputProps: {
                      readOnly: true,
                      style: { cursor: 'pointer' }
                    }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4} lg={3}>
              <DatePicker
                label="Fecha Hasta"
                value={filters.fechaHasta}
                onChange={(newValue) => setFilters(prev => ({ ...prev, fechaHasta: newValue }))}
                shouldDisableDate={(date) => {
                  // Only show dates that have orders
                  return !availableDates.some(availableDate => 
                    date.format('YYYY-MM-DD') === availableDate.format('YYYY-MM-DD')
                  );
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    sx: { 
                      minWidth: 200,
                      '& input': {
                        cursor: 'pointer',
                        caretColor: 'transparent'
                      }
                    },
                    onKeyDown: (e) => e.preventDefault(),
                    inputProps: {
                      readOnly: true,
                      style: { cursor: 'pointer' }
                    }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4} lg={3}>
              <Button
                variant="contained"
                onClick={() => setFilters({ page: 1, limit: 10, fechaDesde: null, fechaHasta: null })}
                fullWidth
                sx={{ minWidth: 200, height: '56px' }}
              >
                Limpiar Filtros
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Tabla de Pedidos - Desktop */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Proveedor</TableCell>
                <TableCell>Presentación</TableCell>
                <TableCell>Talla</TableCell>
                <TableCell>Cantidad Est.</TableCell>
                <TableCell>Fecha Cosecha</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Precio Est.</TableCell>
                <TableCell>Creado por</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : !orders || orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    No se encontraron pedidos
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {order.codigo}
                      </Typography>
                    </TableCell>
                    <TableCell>{order.provider.name}</TableCell>
                    <TableCell>
                      {order.presentationType ? (
                        <Chip label={order.presentationType.name} size="small" />
                      ) : (
                        <Typography variant="caption">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {order.shrimpSize ? (
                        <Typography variant="body2">{order.shrimpSize.code}</Typography>
                      ) : (
                        <Typography variant="caption">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>{order.cantidadEstimada} lbs</TableCell>
                    <TableCell>{formatDate(order.fechaTentativaCosecha)}</TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(order.estado)}
                        color={getStatusColor(order.estado)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatCurrency(order.precioEstimadoCompra)}</TableCell>
                    <TableCell>{order.createdBy.name}</TableCell>
                    <TableCell>
                      <Grid item sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Ver detalles">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/orders/${order.id}`)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        
                        {canEditOrder(order) && (
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/orders/${order.id}/edit`)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {canDeleteOrder(order) && (
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteDialog({ open: true, order })}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Grid>
                    </TableCell>
                  </TableRow>
                )) || null
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Tabla de Pedidos - Mobile (Cards) */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : !orders || orders.length === 0 ? (
          <Paper elevation={1} sx={{ p: 4, textAlign: 'center', backgroundColor: 'grey.50', borderRadius: 2 }}>
            <Typography color="text.secondary">
              No se encontraron pedidos
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={2} sx={{ width: '100%' }}>
            {orders.map((order) => (
              <Card elevation={1} key={order.id} sx={{ borderRadius: 2, width: '100%' }}>
                  <CardContent sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {order.codigo}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {order.provider.name}
                        </Typography>
                      </Box>
                      <Chip
                        label={getStatusLabel(order.estado)}
                        color={getStatusColor(order.estado)}
                        size="small"
                      />
                    </Box>

                    <Stack spacing={1} sx={{ mb: 2 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Producto
                        </Typography>
                        <Typography variant="body2">
                          Camarón {order.tallaEstimada && `(Talla: ${order.tallaEstimada})`}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Cantidad
                          </Typography>
                          <Typography variant="body2">
                            {order.cantidadEstimada} lbs
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Fecha Cosecha
                          </Typography>
                          <Typography variant="body2">
                            {formatDate(order.fechaTentativaCosecha)}
                          </Typography>
                        </Box>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Precio Estimado
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(order.precioEstimadoCompra)}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Creado por
                        </Typography>
                        <Typography variant="body2">
                          {order.createdBy.name}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>

                  <Box sx={{ px: 2, pb: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Tooltip title="Ver detalles">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    
                    {canEditOrder(order) && (
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => navigate(`/orders/${order.id}/edit`)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    {canDeleteOrder(order) && (
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteDialog({ open: true, order })}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Card>
              ))}
            </Stack>
          )}
      </Box>

      {/* Paginación */}
      {totalPages > 1 && (
        <Grid item sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={filters.page}
            onChange={(_, page) => setFilters(prev => ({ ...prev, page }))}
            color="primary"
          />
        </Grid>
      )}

      {/* Dialog de confirmación de eliminación */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, order: null })}
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro de que desea eliminar el pedido{' '}
            <strong>{deleteDialog.order?.codigo}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta acción marcará el pedido como descartado.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, order: null })}>
            Cancelar
          </Button>
          <Button
            onClick={() => deleteDialog.order && handleDeleteOrder(deleteDialog.order)}
            color="error"
            variant="contained"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default OrdersList;
