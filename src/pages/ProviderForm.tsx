import { useEffect, useState } from 'react';
import { providerService } from '../services/provider.service';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Container,
  Paper,
  CircularProgress,
  Alert,
  Divider,
  Stack,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';

// Enum for provider types (matching backend)
export enum TipoProveedor {
  PEQUENA_CAMARONERA = 'PEQUENA_CAMARONERA',
  MEDIANA_CAMARONERA = 'MEDIANA_CAMARONERA', 
  GRAN_CAMARONERA = 'GRAN_CAMARONERA'
}

// Options for the select dropdown
const tipoProveedorOptions = [
  { value: TipoProveedor.PEQUENA_CAMARONERA, label: 'Pequeña Camaronera' },
  { value: TipoProveedor.MEDIANA_CAMARONERA, label: 'Mediana Camaronera' },
  { value: TipoProveedor.GRAN_CAMARONERA, label: 'Gran Camaronera' }
];

// Parse backend errors into user-friendly messages
const parseErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    // Handle common backend validation messages
    if (error.includes('contact_email must be an email')) {
      return 'Por favor, ingresa un email válido (ejemplo: usuario@dominio.com)';
    }
    if (error.includes('Bad Request')) {
      return 'Los datos enviados no son válidos. Por favor, revisa la información.';
    }
    return error;
  }
  
  // Handle error objects
  if (error?.message) {
    if (error.message.includes('contact_email must be an email')) {
      return 'Por favor, ingresa un email válido (ejemplo: usuario@dominio.com)';
    }
    return error.message;
  }
  
  // Default fallback
  return 'Ocurrió un error inesperado. Por favor, intenta nuevamente.';
};

// Validation schema with async name validation
const validationSchema = yup.object().shape({
  name: yup
    .string()
    .required('Nombre es requerido')
    .trim()
    .test('unique-name', 'Ya existe un proveedor con este nombre', async function(value) {
      if (!value) return true; // Let required validation handle this
      
      try {
        // Get the current form context to access editId
        const editId = (this.options.context as any)?.editId;
        const response = await providerService.checkNameAvailability(value, editId);
        return !response.isDuplicate;
      } catch (error) {
        console.error('Error validating name:', error);
        // If API fails, allow the validation to pass to avoid blocking the form
        return true;
      }
    }),
  type: yup.string().oneOf(Object.values(TipoProveedor), 'Tipo de proveedor es requerido').required('Tipo es requerido'),
  location: yup.string().required('Ubicación es requerida').trim(),
  capacity: yup.number().required('Capacidad es requerida').min(1, 'La capacidad debe ser mayor a 0'),
  contact_email: yup
    .string()
    .transform((value) => value === '' ? undefined : value)
    .optional()
    .test('email', 'Por favor, ingresa un email válido (ejemplo: usuario@dominio.com)', 
      (value) => !value || yup.string().email().isValidSync(value)),
  contact_phone: yup
    .string()
    .transform((value) => value === '' ? undefined : value)
    .optional()
    .test('phone', 'Número de teléfono inválido', 
      (value) => !value || /^\+?[0-9 ()-]{6,20}$/.test(value)),
  contact_whatsapp: yup
    .string()
    .required('WhatsApp es requerido')
    .matches(/^\+?[0-9 ()-]{6,20}$/, 'Número de WhatsApp inválido'),
  notes: yup.string().optional(),
  active: yup.boolean().default(true),
});

type FormData = yup.InferType<typeof validationSchema>;

export default function ProviderForm() {
  const { id } = useParams();
  const editId = id ? Number(id) : null;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validatingName, setValidatingName] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema),
    context: { editId },
    defaultValues: {
      name: '',
      type: TipoProveedor.PEQUENA_CAMARONERA,
      location: '',
      capacity: 0,
      contact_whatsapp: '',
      contact_email: '',
      contact_phone: '',
      notes: '',
      active: true,
    },
  });

  useEffect(() => {
    if (!editId) return;
    setLoading(true);
    providerService
      .getProvider(editId)
      .then((data) => {
        setValue('name', data.name || '');
        setValue('type', data.type || '');
        setValue('location', data.location || '');
        setValue('capacity', data.capacity ?? 0);
        setValue('contact_whatsapp', data.contact_whatsapp || '');
        setValue('contact_email', data.contact_email || '');
        setValue('contact_phone', data.contact_phone || '');
        setValue('notes', data.notes || '');
        setValue('active', data.active ?? true);
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, [editId, setValue]);

  const onSubmit = async (data: FormData) => {
    try {
      setError(null);
      setSuccess(false);
      
      // Clean empty string fields to avoid backend validation issues
      const cleanData = {
        ...data,
        name: data.name.trim(),
        type: data.type,
        location: data.location.trim(),
        contact_whatsapp: data.contact_whatsapp.trim(),
        contact_email: data.contact_email?.trim() || undefined,
        contact_phone: data.contact_phone?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
      };
      
      if (editId) {
        await providerService.updateProvider(editId, cleanData);
      } else {
        await providerService.createProvider(cleanData);
      }
      
      setSuccess(true);
      
      // Navigate after a short delay to show success message
      setTimeout(() => {
        navigate('/providers');
      }, 1500);
    } catch (err) {
      console.error('Form submission error:', err);
      setError(parseErrorMessage(err));
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-start', sm: 'center' }, mb: 4, width: '100%', position: 'relative' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/providers')}
          sx={{ mr: 2, textTransform: 'none', display: { xs: 'none', sm: 'flex' }, position: 'absolute', left: 0 }}
        >
          Volver
        </Button>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, textAlign: { xs: 'left', sm: 'center' } }}>
          {editId ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          ¡Proveedor {editId ? 'actualizado' : 'creado'} exitosamente! Redirigiendo...
        </Alert>
      )}

      {/* Loading */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={40} />
        </Box>
      ) : (
        <Paper elevation={2} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2, width: '100%', mx: 'auto' }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={4}>
              {/* Información básica */}
              <Box sx={{ width: '100%' }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Información Básica
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Datos principales del proveedor
                </Typography>
                
                <Box
                  sx={{
                    width: '100%',
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr' },
                    rowGap: { xs: 2, sm: 3 },
                  }}
                >
                  <Box>
                    <Controller
                      name="name"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Nombre del Proveedor"
                          placeholder="Ingrese el nombre del proveedor"
                          error={!!errors.name}
                          helperText={
                            errors.name?.message || 
                            'Nombre único del proveedor (se validará automáticamente)'
                          }
                          required
                          InputProps={{
                            endAdornment: validatingName ? (
                              <CircularProgress size={20} />
                            ) : null,
                          }}
                        />
                      )}
                    />
                  </Box>

                  <Box>
                    <Controller
                      name="type"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.type} required>
                          <InputLabel>Tipo de Proveedor</InputLabel>
                          <Select
                            {...field}
                            label="Tipo de Proveedor"
                          >
                            {tipoProveedorOptions.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                          {errors.type && (
                            <Typography variant="caption" color="error" sx={{ mt: 0.5, mx: 1.75 }}>
                              {errors.type.message}
                            </Typography>
                          )}
                        </FormControl>
                      )}
                    />
                  </Box>

                  <Box>
                    <Controller
                      name="location"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Ubicación"
                          placeholder="Ciudad / Región"
                          error={!!errors.location}
                          helperText={errors.location?.message}
                          required
                        />
                      )}
                    />
                  </Box>
                </Box>
              </Box>

              <Divider />

              {/* Contacto y Capacidad */}
              <Box sx={{ width: '100%' }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Contacto y Capacidad
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Información de contacto y capacidad de manejo
                </Typography>
                
                <Box
                  sx={{
                    width: '100%',
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                    rowGap: { xs: 2, sm: 3 },
                    columnGap: { sm: 3 },
                  }}
                >
                  <Box>
                    <Controller
                      name="capacity"
                      control={control}
                      render={({ field: { onChange, value, ...field } }) => (
                        <TextField
                          {...field}
                          fullWidth
                          type="number"
                          label="Capacidad (libras)"
                          placeholder="1000"
                          value={value || ''}
                          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : 0)}
                          error={!!errors.capacity}
                          helperText={errors.capacity?.message || 'Capacidad de manejo en libras'}
                          InputProps={{
                            inputProps: { min: 1 }
                          }}
                          required
                        />
                      )}
                    />
                  </Box>

                  <Box>
                    <Controller
                      name="contact_whatsapp"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="WhatsApp"
                          placeholder="+51 999 999 999"
                          error={!!errors.contact_whatsapp}
                          helperText={errors.contact_whatsapp?.message || 'Número de WhatsApp principal'}
                          required
                        />
                      )}
                    />
                  </Box>

                  <Box>
                    <Controller
                      name="contact_email"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          type="email"
                          label="Email"
                          placeholder="ejemplo@empresa.com"
                          error={!!errors.contact_email}
                          helperText={errors.contact_email?.message || 'Email de contacto del proveedor'}
                        />
                      )}
                    />
                  </Box>

                  <Box>
                    <Controller
                      name="contact_phone"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Teléfono"
                          placeholder="(01) 234-5678"
                          error={!!errors.contact_phone}
                          helperText={errors.contact_phone?.message}
                        />
                      )}
                    />
                  </Box>
                </Box>
              </Box>

              <Divider />

              {/* Notas y Estado */}
              <Box sx={{ width: '100%' }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Información Adicional
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Notas y configuración del proveedor
                </Typography>
                
                <Box
                  sx={{
                    width: '100%',
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr' },
                    rowGap: { xs: 2, sm: 3 },
                  }}
                >
                  <Box>
                    <Controller
                      name="notes"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          multiline
                          rows={4}
                          label="Notas"
                          placeholder="Comentarios internos o indicaciones especiales..."
                          error={!!errors.notes}
                          helperText={errors.notes?.message}
                        />
                      )}
                    />
                  </Box>

                  <Box>
                    <Controller
                      name="active"
                      control={control}
                      render={({ field: { value, onChange, ...field } }) => (
                        <FormControlLabel
                          {...field}
                          control={
                            <Switch
                              checked={value}
                              onChange={onChange}
                              color="primary"
                            />
                          }
                          label="Proveedor activo"
                        />
                      )}
                    />
                  </Box>
                </Box>
              </Box>

              {/* Actions */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/providers')}
                  disabled={isSubmitting}
                  sx={{ textTransform: 'none' }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={isSubmitting ? <CircularProgress size={20} /> : <SaveIcon />}
                  disabled={isSubmitting}
                  sx={{ textTransform: 'none' }}
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar Proveedor'}
                </Button>
              </Box>
            </Stack>
          </form>
        </Paper>
      )}
    </Container>
  );
}
