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
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { API_BASE_URL } from '../config/api.config';
import shrimpSizesService, {
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
  // precioEstimadoVenta?: number; // Eliminado, se calcula automáticamente
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
  fechaTentativaCosecha: yup.mixed().nullable().optional(),
  precioEstimadoCompra: yup
    .number()
    .optional()
    .min(0, 'El precio debe ser mayor o igual a 0'),
  // precioEstimadoVenta: yup
  //   .number()
  //   .optional()
  //   .min(0, 'El precio debe ser mayor o igual a 0'),
  condicionesIniciales: yup.string().optional(),
  observaciones: yup.string().optional(),
});

const OrderForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
    resolver: yupResolver(orderSchema) as any,
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

      const orderPresentationTypeId = order.presentationTypeId ?? order.presentationType?.id;
      const orderShrimpSizeId = order.shrimpSizeId ?? order.shrimpSize?.id;

      let sizesForPresentation: ShrimpSize[] = [];
      if (orderPresentationTypeId) {
        try {
          sizesForPresentation = await shrimpSizesService.getShrimpSizesByPresentation(Number(orderPresentationTypeId));
          setShrimpSizes(sizesForPresentation);
        } catch (error) {
          console.error('Error loading shrimp sizes for existing order:', error);
          setShrimpSizes([]);
        }
      } else {
        setShrimpSizes([]);
      }

      if (orderShrimpSizeId) {
        const existingSize = sizesForPresentation.find((size) => size.id === Number(orderShrimpSizeId));
        setSelectedShrimpSize(existingSize || null);
      } else {
        setSelectedShrimpSize(null);
      }

      // Llenar el formulario con los datos existentes
      reset({
        providerId: order.providerId,
        packagerId: order.packagerId || undefined,
        presentationTypeId: orderPresentationTypeId ? Number(orderPresentationTypeId) : undefined,
        shrimpSizeId: orderShrimpSizeId ? Number(orderShrimpSizeId) : undefined,
        tallaEstimada: order.tallaEstimada || undefined,
        cantidadEstimada: order.cantidadEstimada,
        fechaTentativaCosecha: order.fechaTentativaCosecha
          ? dayjs(order.fechaTentativaCosecha)
          : null,
        precioEstimadoCompra: order.precioEstimadoCompra || undefined,
        // precioEstimadoVenta: order.precioEstimadoVenta || undefined,
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
          : null,
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

      // Obtener datos para WhatsApp si es un nuevo pedido
      if (!isEdit) {
        const selectedProvider = providers.find(p => p.id === Number(data.providerId));
        const selectedPresentation = presentationTypes.find(p => p.id === Number(data.presentationTypeId));
        const selectedSize = shrimpSizes.find(s => s.id === Number(data.shrimpSizeId));

        if (selectedProvider && selectedProvider.contact_whatsapp) {
          const presentationName = selectedPresentation ? selectedPresentation.name : 'No especificada';
          const sizeName = selectedSize ? selectedSize.displayLabel : (data.tallaEstimada || 'No especificada');

          const message = `Hola ${selectedProvider.name}, se ha generado un nuevo pedido en Maransa:\n` +
            `- *Presentación:* ${presentationName}\n` +
            `- *Talla:* ${sizeName}\n` +
            `- *Cantidad:* ${data.cantidadEstimada} lbs`;

          const encodedMessage = encodeURIComponent(message);
          let cleanPhone = selectedProvider.contact_whatsapp.replace(/\D/g, '');

          // Asegurar código de país (593 para Ecuador) si es necesario
          if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
            cleanPhone = '593' + cleanPhone.substring(1);
          } else if (cleanPhone.length === 9 && cleanPhone.startsWith('9')) {
            cleanPhone = '593' + cleanPhone;
          }

          // Abrir WhatsApp en una nueva pestaña después de un pequeño delay
          setTimeout(() => {
            window.open(`https://wa.me/${cleanPhone}/?text=${encodedMessage}`, '_blank');
          }, 1500);
        }
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

  const cantidadEstimada = watch('cantidadEstimada');
  const precioEstimadoCompra = watch('precioEstimadoCompra');

  const totalEstimadoCompra = cantidadEstimada && precioEstimadoCompra
    ? cantidadEstimada * precioEstimadoCompra
    : 0;

  if (loading) {
    return (
      <Grid sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Grid>
    );
  }

  return (
    <Grid sx={{ p: 3 }}>
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
      <Grid sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
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

      <form onSubmit={handleSubmit(onSubmit as any)}>
        <Grid sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Información básica */}
          <Grid sx={{ width: '100%' }}>
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
          <Grid sx={{ width: '100%' }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Información Comercial
              </Typography>

              <Grid sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Grid sx={{ width: { xs: '100%', md: '50%' } }}>
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

                {/* Input de precio estimado de venta eliminado, se calcula automáticamente por IA */}

                {/* Cálculos automáticos */}
                {(totalEstimadoCompra > 0) && (
                  <Grid sx={{ width: '100%' }}>
                    <Grid sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Cálculos Estimados
                      </Typography>
                      <Grid sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        <Grid sx={{ width: { xs: '100%', md: '50%' } }}>
                          <Typography variant="body2" color="text.secondary">
                            Total Estimado Compra
                          </Typography>
                          <Typography variant="h6">
                            ${totalEstimadoCompra.toFixed(2)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                )}

                <Grid sx={{ width: '100%' }}>
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

                <Grid sx={{ width: '100%' }}>
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
          <Grid sx={{ width: '100%' }}>
            <Grid sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
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
