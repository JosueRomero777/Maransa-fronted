import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Breadcrumbs,
  Link,
  CircularProgress,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../context';
import shrimpSizesService, { 
  type ShrimpType, 
  type PresentationType, 
  type ShrimpSize 
} from '../services/shrimp-sizes.service';

interface OrderFormData {
  providerId: number;
  packagerId?: number;
  presentationTypeId?: number;
  shrimpSizeId?: number;
  tallaEstimada?: string;
  cantidadEstimada: number;
  fechaTentativaCosecha?: dayjs.Dayjs | null;
  precioEstimadoCompra?: number;
  precioEstimadoVenta?: number;
  condicionesIniciales?: string;
  observaciones?: string;
}

interface Provider {
  id: number;
  name: string;
  contact_whatsapp: string;
  type: string;
}

interface Packager {
  id: number;
  name: string;
  contact_whatsapp: string;
}

const orderSchema = yup.object({
  providerId: yup.number().required('El proveedor es requerido'),
  packagerId: yup.number().optional(),
  presentationTypeId: yup.number().optional(),
  shrimpSizeId: yup.number().optional(),
  tallaEstimada: yup.string().optional(),
  cantidadEstimada: yup
    .number()
    .required('La cantidad estimada es requerida')
    .min(0.1, 'La cantidad debe ser mayor a 0'),
  fechaTentativaCosecha: yup.mixed().optional(),
  precioEstimadoCompra: yup
    .number()
    .optional()
    .min(0, 'El precio debe ser mayor o igual a 0'),
  precioEstimadoVenta: yup
    .number()
    .optional()
    .min(0, 'El precio debe ser mayor o igual a 0'),
  condicionesIniciales: yup.string().optional(),
  observaciones: yup.string().optional(),
});

const OrderForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = Boolean(id);

  const [providers, setProviders] = useState<Provider[]>([]);
  const [packagers, setPackagers] = useState<Packager[]>([]);
  const [presentationTypes, setPresentationTypes] = useState<PresentationType[]>([]);
  const [shrimpSizes, setShrimpSizes] = useState<ShrimpSize[]>([]);
  const [selectedShrimpSize, setSelectedShrimpSize] = useState<ShrimpSize | null>(null);

  // Debug: Log cuando cambia el estado de proveedores
  useEffect(() => {
    console.log('Estado de proveedores actualizado:', providers);
  }, [providers]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<OrderFormData>({
    resolver: yupResolver(orderSchema),
    defaultValues: {
      cantidadEstimada: 0,
    },
  });

  // Cargar datos iniciales
  useEffect(() => {
    console.log('UseEffect ejecutándose - cargando datos...');
    loadProviders();
    loadPackagers();
    loadShrimpData();
    if (isEdit) {
      loadOrderData();
    }
  }, [id, isEdit]);

  // Cargar tipos de presentación
  const loadShrimpData = async () => {
    try {
      const presentations = await shrimpSizesService.getPresentationTypes();
      setPresentationTypes(presentations);
    } catch (error) {
      console.error('Error loading presentation types:', error);
    }
  };

  // Cargar tallas cuando se selecciona presentación
  const handlePresentationTypeChange = async (presentationTypeId: number) => {
    setValue('presentationTypeId', presentationTypeId);
    
    try {
      const sizes = await shrimpSizesService.getShrimpSizesByPresentation(presentationTypeId);
      setShrimpSizes(sizes);
      setValue('shrimpSizeId', undefined);
    } catch (error) {
      console.error('Error loading shrimp sizes:', error);
    }
  };

  const handleShrimpSizeChange = (sizeId: number) => {
    setValue('shrimpSizeId', sizeId);
    const size = shrimpSizes.find((s) => s.id === sizeId);
    setSelectedShrimpSize(size || null);
  };

  const loadProviders = async () => {
    console.log('🔄 Iniciando carga de proveedores...');
    try {
      const token = localStorage.getItem('token');
      console.log('🔑 Token:', token ? 'Disponible' : 'No disponible');
      
      const response = await fetch(`${API_BASE_URL}/providers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Datos recibidos:', data);
        setProviders(Array.isArray(data) ? data : data.data || []);
        console.log('📝 Providers set:', Array.isArray(data) ? data.length : (data.data?.length || 0), 'proveedores');
      } else {
        console.error('❌ Error en respuesta:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error details:', errorText);
      }
    } catch (error) {
      console.error('💥 Error loading providers:', error);
    }
  };

  const loadPackagers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/packagers`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPackagers(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Error loading packagers:', error);
    }
  };

  const loadOrderData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar datos del pedido');
      }

      const order = await response.json();
      
      // Llenar el formulario con los datos existentes
      reset({
        providerId: order.providerId,
        packagerId: order.packagerId || undefined,
        tallaEstimada: order.tallaEstimada || undefined,
        cantidadEstimada: order.cantidadEstimada,
        fechaTentativaCosecha: order.fechaTentativaCosecha 
          ? dayjs(order.fechaTentativaCosecha)
          : null,
        precioEstimadoCompra: order.precioEstimadoCompra || undefined,
        precioEstimadoVenta: order.precioEstimadoVenta || undefined,
        condicionesIniciales: order.condicionesIniciales || undefined,
        observaciones: order.observaciones || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: OrderFormData) => {
    try {
      setSubmitLoading(true);
      setError(null);
      
      // Convertir fecha a string para el backend
      const submitData = {
        ...data,
        fechaTentativaCosecha: data.fechaTentativaCosecha
          ? data.fechaTentativaCosecha.format('YYYY-MM-DD')
          : undefined,
      };
      
      const url = isEdit 
        ? `${API_BASE_URL}/orders/${id}`
        : `${API_BASE_URL}/orders`;
      
      const method = isEdit ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al guardar el pedido');
      }

      setSuccess(
        isEdit
          ? 'Pedido actualizado exitosamente'
          : 'Pedido creado exitosamente'
      );

      // Redirigir después de un breve delay
      setTimeout(() => {
        navigate('/orders');
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSubmitLoading(false);
    }
  };

  const selectedProvider = watch('providerId');
  const cantidadEstimada = watch('cantidadEstimada');
  const precioEstimadoCompra = watch('precioEstimadoCompra');
  const precioEstimadoVenta = watch('precioEstimadoVenta');

  // Calcular totales estimados
  const totalEstimadoCompra = cantidadEstimada && precioEstimadoCompra
    ? cantidadEstimada * precioEstimadoCompra
    : 0;
  
  const totalEstimadoVenta = cantidadEstimada && precioEstimadoVenta
    ? cantidadEstimada * precioEstimadoVenta
    : 0;

  const margenEstimado = totalEstimadoVenta && totalEstimadoCompra
    ? ((totalEstimadoVenta - totalEstimadoCompra) / totalEstimadoCompra) * 100
    : 0;

  if (loading) {
    return (
      <Grid item sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
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
          {isEdit ? 'Editar Pedido' : 'Nuevo Pedido'}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Grid item sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/orders')}
          sx={{ mr: 2 }}
        >
          Volver
        </Button>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          {isEdit ? 'Editar Pedido' : 'Nuevo Pedido'}
        </Typography>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid item sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Información básica */}
          <Grid item sx={{ width: '100%' }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Información Básica
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
                <Box>
                  <Controller
                    name="providerId"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.providerId} sx={{ minWidth: 250 }}>
                        <InputLabel>Proveedor *</InputLabel>
                        <Select
                          {...field}
                          label="Proveedor *"
                        >
                          {providers && providers.map((provider) => (
                            <MenuItem key={provider.id} value={provider.id}>
                              {provider.name} ({provider.type})
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.providerId && (
                          <Typography variant="caption" color="error">
                            {errors.providerId.message}
                          </Typography>
                        )}
                      </FormControl>
                    )}
                  />
                </Box>

                <Box>
                  <Controller
                    name="packagerId"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth sx={{ minWidth: 250 }}>
                        <InputLabel>Empacadora</InputLabel>
                        <Select
                          {...field}
                          label="Empacadora"
                        >
                          <MenuItem value="">Ninguna</MenuItem>
                          {packagers && packagers.map((packager) => (
                            <MenuItem key={packager.id} value={packager.id}>
                              {packager.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Box>

                {/* Tipo de Presentación */}
                <Box>
                  <Controller
                    name="presentationTypeId"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Tipo de Presentación</InputLabel>
                        <Select
                          {...field}
                          label="Tipo de Presentación"
                          onChange={(e) => handlePresentationTypeChange(e.target.value as unknown as number)}
                        >
                          <MenuItem value="">Seleccione presentación</MenuItem>
                          {presentationTypes.map((type) => (
                            <MenuItem key={type.id} value={type.id}>
                              {type.name} (Rendimiento: {type.rendimiento}%, Vida útil: {type.lifeSpanDays}d)
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Box>

                {/* Talla Estimada */}
                {watch('presentationTypeId') && shrimpSizes.length > 0 && (
                  <>
                    <Box>
                      <Controller
                        name="shrimpSizeId"
                        control={control}
                        render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel>Talla Estimada</InputLabel>
                            <Select
                              {...field}
                              label="Talla Estimada"
                              onChange={(e) => handleShrimpSizeChange(e.target.value as unknown as number)}
                            >
                              <MenuItem value="">Seleccione talla</MenuItem>
                              {shrimpSizes.map((size) => (
                                <MenuItem key={size.id} value={size.id}>
                                  {size.displayLabel}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Box>

                    {/* Información detallada de la talla seleccionada */}
                    {selectedShrimpSize && (
                      <Box sx={{ gridColumn: '1 / -1' }}>
                        <Card sx={{ backgroundColor: '#f5f5f5' }}>
                          <CardContent>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                              Detalles de la Talla Seleccionada
                            </Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 1 }}>
                              <Box>
                                <Typography variant="caption" color="textSecondary">
                                  Código
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {selectedShrimpSize.code}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" color="textSecondary">
                                  Clasificación
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {selectedShrimpSize.classification}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" color="textSecondary">
                                  Peso por Pieza
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {selectedShrimpSize.minWeightGrams}-{selectedShrimpSize.maxWeightGrams}g
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" color="textSecondary">
                                  Piezas por Libra
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {selectedShrimpSize.minPiecesPerLb}-{selectedShrimpSize.maxPiecesPerLb}
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </Box>
                    )}
                  </>
                )}

                <Box>
                  <Controller
                    name="cantidadEstimada"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Cantidad Estimada *"
                        type="number"
                        inputProps={{ min: 0, step: 0.1 }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">lbs</InputAdornment>,
                        }}
                        error={!!errors.cantidadEstimada}
                        helperText={errors.cantidadEstimada?.message}
                      />
                    )}
                  />
                </Box>

                <Box>
                  <Controller
                    name="fechaTentativaCosecha"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        label="Fecha Tentativa de Cosecha"
                        value={field.value || null}
                        onChange={(newValue) => field.onChange(newValue)}
                        minDate={dayjs()}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!errors.fechaTentativaCosecha,
                            helperText: errors.fechaTentativaCosecha?.message,
                            onKeyDown: (e) => e.preventDefault(),
                            sx: {
                              '& input': {
                                cursor: 'pointer',
                                caretColor: 'transparent'
                              }
                            },
                            inputProps: {
                              readOnly: true,
                              style: { cursor: 'pointer' }
                            }
                          },
                        }}
                      />
                    )}
                  />
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Información comercial */}
          <Grid item sx={{ width: '100%' }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Información Comercial
              </Typography>
              
              <Grid item sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Grid item sx={{ width: { xs: '100%', md: '50%' } }}>
                  <Controller
                    name="precioEstimadoCompra"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Precio Estimado de Compra"
                        type="number"
                        inputProps={{ min: 0, step: 0.01 }}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                          endAdornment: <InputAdornment position="end">/ lb</InputAdornment>,
                        }}
                        error={!!errors.precioEstimadoCompra}
                        helperText={errors.precioEstimadoCompra?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Controller
                    name="precioEstimadoVenta"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Precio Estimado de Venta"
                        type="number"
                        inputProps={{ min: 0, step: 0.01 }}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                          endAdornment: <InputAdornment position="end">/ lb</InputAdornment>,
                        }}
                        error={!!errors.precioEstimadoVenta}
                        helperText={errors.precioEstimadoVenta?.message}
                      />
                    )}
                  />
                </Grid>

                {/* Cálculos automáticos */}
                {(totalEstimadoCompra > 0 || totalEstimadoVenta > 0) && (
                  <Grid item sx={{ width: '100%' }}>
                    <Grid item sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Cálculos Estimados
                      </Typography>
                      <Grid item sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        <Grid item sx={{ width: { xs: '100%', md: '33.33%' } }}>
                          <Typography variant="body2" color="text.secondary">
                            Total Estimado Compra
                          </Typography>
                          <Typography variant="h6">
                            ${totalEstimadoCompra.toFixed(2)}
                          </Typography>
                        </Grid>
                        <Grid item sx={{ width: { xs: '100%', md: '33.33%' } }}>
                          <Typography variant="body2" color="text.secondary">
                            Total Estimado Venta
                          </Typography>
                          <Typography variant="h6">
                            ${totalEstimadoVenta.toFixed(2)}
                          </Typography>
                        </Grid>
                        <Grid item sx={{ width: { xs: '100%', md: '33.33%' } }}>
                          <Typography variant="body2" color="text.secondary">
                            Margen Estimado
                          </Typography>
                          <Typography 
                            variant="h6"
                            color={margenEstimado > 0 ? 'success.main' : 'error.main'}
                          >
                            {margenEstimado.toFixed(1)}%
                          </Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                )}

                <Grid item sx={{ width: '100%' }}>
                  <Controller
                    name="condicionesIniciales"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Condiciones Iniciales"
                        multiline
                        rows={3}
                        placeholder="Ej: Pago contra entrega, descuento por volumen, etc."
                      />
                    )}
                  />
                </Grid>

                <Grid item sx={{ width: '100%' }}>
                  <Controller
                    name="observaciones"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Observaciones"
                        multiline
                        rows={3}
                        placeholder="Notas adicionales sobre el pedido..."
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Botones de acción */}
          <Grid item sx={{ width: '100%' }}>
            <Grid item sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/orders')}
                disabled={submitLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={submitLoading}
                startIcon={submitLoading ? <CircularProgress size={20} /> : null}
              >
                {submitLoading
                  ? 'Guardando...'
                  : isEdit
                  ? 'Actualizar Pedido'
                  : 'Crear Pedido'
                }
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </form>
    </Grid>
  );
};

export default OrderForm;
