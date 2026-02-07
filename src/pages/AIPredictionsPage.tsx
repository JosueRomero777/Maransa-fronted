import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api.config';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  Alert,
  MenuItem,
  Chip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  TrendingUp as TrendingIcon,
  Refresh as RefreshIcon,
  Psychology as PsychologyIcon,
  WarningAmber as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import * as AIService from '../services/ai.service';
import './AIPredictionsPage.css';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

const AIPredictionsPage: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [marketFactors, setMarketFactors] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [loadingFactors, setLoadingFactors] = useState(true);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [predictionTimer, setPredictionTimer] = useState(12); // Tiempo estimado en segundos
  const [showPredictionForm, setShowPredictionForm] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState<any>(null);

  // Formulario de predicción
  const [predictionForm, setPredictionForm] = useState({
    presentacion: 'HEADLESS',
    calibre: '',
    fechaObjetivo: dayjs().utc().add(30, 'days').format('YYYY-MM-DD'),
  });

  const [calibres, setCalibreS] = useState<any[]>([]);
  const [loadingCalibreS, setLoadingCalibreS] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Contador de tiempo para loading de predicción
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (loadingPrediction) {
      setPredictionTimer(12); // Resetear a 12 segundos estimados
      interval = setInterval(() => {
        setPredictionTimer(prev => {
          if (prev <= 1) {
            return 0; // No bajar de 0
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setPredictionTimer(12);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loadingPrediction]);

  const mapPresentationToName = (presentation: string) => {
    switch (presentation?.toUpperCase()) {
      case 'HEADLESS':
        return 'Sin Cabeza';
      case 'WHOLE':
        return 'Entero con Cabeza';
      case 'LIVE':
        return 'Vivo';
      default:
        return presentation || 'Camarón';
    }
  };

  // Cargar calibres cuando cambia la presentación
  useEffect(() => {
    const loadCalibreS = async () => {
      if (!predictionForm.presentacion) return;
      
      console.log(`📍 Cargando calibres para presentación: ${predictionForm.presentacion}`);
      setLoadingCalibreS(true);
      try {
        const response = await AIService.aiService.getCalibresByPresentation(predictionForm.presentacion);
        console.log(`✓ Calibres recibidos:`, response.calibres);
        setCalibreS(response.calibres || []);
        
        // Seleccionar el primer calibre disponible automáticamente
        if (response.calibres && response.calibres.length > 0) {
          const firstCalibre = response.calibres[0].calibre;
          console.log(`📌 Auto-seleccionando calibre: ${firstCalibre}`);
          setPredictionForm(prev => {
            const updated = {
              ...prev,
              calibre: firstCalibre
            };
            console.log(`📌 Estado actualizado:`, updated);
            return updated;
          });
        } else {
          console.warn('⚠️ No hay calibres disponibles');
          setPredictionForm(prev => ({
            ...prev,
            calibre: ''
          }));
        }
      } catch (err) {
        console.error('❌ Error cargando calibres:', err);
        setCalibreS([]);
        setPredictionForm(prev => ({
          ...prev,
          calibre: ''
        }));
      } finally {
        setLoadingCalibreS(false);
      }
    };

    loadCalibreS();
  }, [predictionForm.presentacion]);

  useEffect(() => {
    loadSystemData();
    loadPredictionHistory();
    const interval = setInterval(loadSystemData, 30000); // Recargar cada 30s
    return () => clearInterval(interval);
  }, []);

  const loadPredictionHistory = async () => {
    try {
      console.log('Cargando historial de predicciones...');
      const response = await fetch(`${API_BASE_URL}/ai/predictions/history?limit=10`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      console.log('Respuesta del historial:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Datos del historial:', result);
        
        if (result.success && result.data.predictions) {
          // Transformar las predicciones del backend al formato del frontend
          const transformedPredictions = result.data.predictions.map((p: any) => ({
            id: p.id,
            timestamp: p.fechaCreacion,
            presentacion: p.presentacion || p.tipoProducto || 'HEADLESS',
            calibre: p.calibre || p.tipoProducto || 'N/A',
            dias_prediccion: p.diasPrediccion, // Ahora el backend siempre calcula esto
            fecha_objetivo: p.fechaPrediccion || p.fechaObjetivo || new Date().toISOString(),
            resultado: {
              precio_despacho_predicho: p.precioDespachoPredicho || p.precioPredicho || 0,
              intervalo_confianza: p.intervaloConfianza || {
                min: p.intervalo_confianza_despacho?.minimo || 0,
                max: p.intervalo_confianza_despacho?.maximo || 0,
              },
              confianza_porcentaje: p.confianzaPorcentaje || 0,
              correlacion: p.correlacion || {},
            },
          }));
          console.log('Predicciones transformadas:', transformedPredictions);
          setPredictions(transformedPredictions);
        }
      } else {
        console.error('Error al cargar historial:', response.status, await response.text());
      }
    } catch (err) {
      console.error('Error al cargar historial:', err);
    }
  };

  const loadSystemData = async () => {
    try {
      setError(null);
      
      // Cargar estado del sistema
      const health = await AIService.aiService.getHealthStatus();
      setHealthStatus(health);
      setLoadingHealth(false);

      // Cargar factores de mercado
      const factors = await AIService.aiService.getMarketFactors();
      setMarketFactors(Array.isArray(factors) ? factors : []);
      setLoadingFactors(false);

      // Las recomendaciones vienen en cada predicción, no en endpoint separado
      setRecommendations([]);
      setLoadingRecommendations(false);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error conectando con el microservicio de IA');
      setLoadingHealth(false);
      setLoadingFactors(false);
      setLoadingRecommendations(false);
    }
  };

  const handlePredictPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoadingPrediction(true);
      setError(null);

      console.log('🚀 handlePredictPrice iniciado');
      console.log('📋 Estado actual del formulario:', predictionForm);

      // Validar que calibre esté seleccionado
      if (!predictionForm.calibre || predictionForm.calibre.trim() === '') {
        console.error('❌ Calibre no está seleccionado');
        setError('Debes seleccionar un calibre');
        setLoadingPrediction(false);
        return;
      }

      // Calcular días basado en la fecha objetivo
      const today = dayjs().utc().startOf('day');
      const targetDate = dayjs(predictionForm.fechaObjetivo).utc().startOf('day');
      const dias = targetDate.diff(today, 'days');

      if (dias <= 0) {
        console.error('❌ Fecha inválida - no es posterior a hoy');
        setError('La fecha debe ser posterior a hoy');
        setLoadingPrediction(false);
        return;
      }

      const requestPayload = {
        calibre: predictionForm.calibre,
        presentacion: predictionForm.presentacion,
        dias,
      };
      
      console.log('📤 Enviando request:', requestPayload);

      const response = await AIService.aiService.predictDespachoPrice({
        calibre: predictionForm.calibre,
        presentacion: predictionForm.presentacion,
        dias,
      });

      const predictionForModal = {
        id: `temp-${Date.now()}`,
        timestamp: new Date().toISOString(),
        presentacion: mapPresentationToName(predictionForm.presentacion),
        calibre: predictionForm.calibre,
        dias_prediccion: dias,
        fecha_objetivo: response.fecha_objetivo,
        resultado: {
          precio_despacho_predicho: response.precio_despacho_predicho_usd_lb,
          intervalo_confianza: {
            min: response.intervalo_confianza_despacho?.minimo,
            max: response.intervalo_confianza_despacho?.maximo,
          },
          confianza_porcentaje: response.confianza_porcentaje,
          correlacion: response.correlacion,
        },
      };

      // Recargar el historial desde el backend
      await loadPredictionHistory();

      // Mostrar el resultado inmediato con la presentación elegida
      setSelectedPrediction(predictionForModal);

      setShowPredictionForm(false);
      setPredictionForm({
        presentacion: 'HEADLESS',
        calibre: predictionForm.calibre,
        fechaObjetivo: dayjs().utc().add(30, 'days').format('YYYY-MM-DD'),
      });
    } catch (err) {
      setError(`Error en predicción: ${(err as Error).message}`);
    } finally {
      setLoadingPrediction(false);
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'online':
      case 'ok':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
      case 'offline':
        return 'error';
      default:
        return 'default';
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'online':
      case 'ok':
        return <CheckCircleIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'error':
      case 'offline':
        return <WarningIcon />;
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 1.5, sm: 2, md: 3 } }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        mb: 3,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1.5, sm: 0 }
      }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
           
            Sistema de Predicción de Precios con IA
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Predicciones inteligentes basadas en historial de precios y analisis de mercado en tiempo real.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<TrendingIcon />}
          onClick={() => setShowPredictionForm(true)}
          size="large"
          sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }}
        >
          Nueva Predicción
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Estado del Sistema */}
      <div className="status-grid">
        <Card>
          <CardHeader
            title="Estado del Servicio"
            avatar={getHealthStatusIcon(healthStatus?.status)}
            titleTypographyProps={{ variant: 'body2' }}
          />
          <CardContent>
            {loadingHealth ? (
              <CircularProgress size={24} />
            ) : (
              <Box>
                <Chip
                  label={healthStatus?.status || 'desconocido'}
                  color={getHealthStatusColor(healthStatus?.status)}
                  size="small"
                  sx={{ mb: 1 }}
                />
                <Typography variant="caption" display="block" color="text.secondary">
                  {healthStatus?.timestamp ? new Date(healthStatus.timestamp).toLocaleTimeString() : 'N/A'}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Confianza del Modelo" titleTypographyProps={{ variant: 'body2' }} />
          <CardContent>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {predictions.length > 0 && predictions[0].resultado?.confianza_porcentaje !== undefined
                ? `${Math.round(predictions[0].resultado.confianza_porcentaje)}%`
                : 'N/A'}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Última Predicción" titleTypographyProps={{ variant: 'body2' }} />
          <CardContent>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {predictions.length > 0 && predictions[0].resultado?.precio_despacho_predicho
                ? `$${predictions[0].resultado.precio_despacho_predicho.toFixed(2)}`
                : 'N/A'}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Predicciones Realizadas" titleTypographyProps={{ variant: 'body2' }} />
          <CardContent>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {predictions.length}
            </Typography>
          </CardContent>
        </Card>
      </div>

      {/* Factores de Mercado */}
      {marketFactors.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardHeader title="Factores de Mercado Actuales" />
          <CardContent>
            <Grid container spacing={2}>
              {marketFactors.slice(0, 6).map((factor: any, idx) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {factor.nombre || factor.nombre || 'Factor'}
                    </Typography>
                    <Typography variant="h6">{factor.valor?.toFixed(2) || 'N/A'}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {factor.categoria || 'General'}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Historial de Predicciones */}
      {predictions.length > 0 && (
        <Card>
          <CardHeader title="Historial de Predicciones" />
          <CardContent>
            <Stack spacing={2}>
              {predictions.map((pred) => (
                <Paper
                  key={pred.id}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                  onClick={() => setSelectedPrediction(pred)}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle2">
                        {pred.presentacion} - {pred.calibre}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Creada: {new Date(pred.timestamp).toLocaleDateString()} 
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Objetivo: {dayjs(pred.fecha_objetivo).utc().format('DD/MM/YYYY')} ({pred.dias_prediccion} días)
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        ${pred.resultado?.precio_despacho_predicho?.toFixed(2)}
                      </Typography>
                      <Chip
                        label={`Confianza: ${Math.round(pred.resultado?.confianza_porcentaje || 0)}%`}
                        size="small"
                        color={(pred.resultado?.confianza_porcentaje || 0) > 80 ? 'success' : 'warning'}
                      />
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Predicción */}
      <Dialog 
        open={showPredictionForm} 
        onClose={() => setShowPredictionForm(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { 
            margin: { xs: '16px', sm: 'auto' },
            maxHeight: { xs: 'calc(100vh - 32px)', sm: 'auto' }
          }
        }}
      >
        <DialogTitle sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>Nueva Predicción de Precio</DialogTitle>
        <DialogContent sx={{ pt: { xs: 1.5, sm: 2 } }}>
          <Box component="form" onSubmit={handlePredictPrice} sx={{ pt: 1 }}>
            <Stack spacing={{ xs: 1.5, sm: 2 }}>
              {/* Presentación */}
              <FormControl fullWidth>
                <InputLabel>Presentación del Camarón</InputLabel>
                <Select
                  value={predictionForm.presentacion}
                  label="Presentación del Camarón"
                  onChange={(e) =>
                    setPredictionForm({ ...predictionForm, presentacion: e.target.value })
                  }
                >
                  <MenuItem value="HEADLESS">Sin Cabeza (Headless)</MenuItem>
                  <MenuItem value="WHOLE">Entero con Cabeza (Whole)</MenuItem>
                </Select>
              </FormControl>

              {/* Calibre Dinámico */}
              <FormControl fullWidth disabled={loadingCalibreS || calibres.length === 0}>
                <InputLabel>Calibre</InputLabel>
                <Select
                  value={predictionForm.calibre}
                  label="Calibre"
                  onChange={(e) =>
                    setPredictionForm({ ...predictionForm, calibre: e.target.value })
                  }
                >
                  {loadingCalibreS ? (
                    <MenuItem disabled>Cargando calibres...</MenuItem>
                  ) : calibres.length === 0 ? (
                    <MenuItem disabled>No hay calibres disponibles</MenuItem>
                  ) : (
                    calibres.filter(c => c.disponible).map(cal => (
                      <MenuItem key={cal.calibre} value={cal.calibre}>
                        {cal.nombre}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>

                <DatePicker
                label="Fecha de Predicción"
                value={dayjs(predictionForm.fechaObjetivo).utc()}
                onChange={(newValue) => {
                  if (newValue) {
                    setPredictionForm({ 
                      ...predictionForm, 
                      fechaObjetivo: newValue.utc().format('YYYY-MM-DD') 
                    });
                  }
                }}
                minDate={dayjs().utc().add(1, 'day')}
                maxDate={dayjs().utc().add(365, 'days')}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    sx: { 
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

              {error && (
                <Alert severity="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loadingPrediction || calibres.length === 0}
                startIcon={loadingPrediction ? <CircularProgress size={20} /> : <TrendingIcon />}
              >
                {loadingPrediction 
                  ? predictionTimer > 0 
                    ? `Generando predicción... ${predictionTimer}s restantes` 
                    : 'Finalizando...'
                  : 'Predecir Precio'}
              </Button>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Dialog de Detalle */}
      <Dialog
        open={!!selectedPrediction}
        onClose={() => setSelectedPrediction(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Detalle de Predicción</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedPrediction && (
            <Stack spacing={2}>
              <Box>
                <Typography color="text.secondary" variant="caption">
                  Presentación
                </Typography>
                <Typography variant="body1">{selectedPrediction.presentacion}</Typography>
              </Box>
              <Box>
                <Typography color="text.secondary" variant="caption">
                  Calibre
                </Typography>
                <Typography variant="body1">{selectedPrediction.calibre}</Typography>
              </Box>
              <Box>
                <Typography color="text.secondary" variant="caption">
                  Días de Predicción
                </Typography>
                <Typography variant="body1">{selectedPrediction.dias_prediccion}</Typography>
              </Box>
              <Box>
                <Typography color="text.secondary" variant="caption">
                  Fecha Objetivo
                </Typography>
                <Typography variant="body1">
                  {dayjs(selectedPrediction.fecha_objetivo).utc().format('DD/MM/YYYY')}
                </Typography>
              </Box>
              <Box>
                <Typography color="text.secondary" variant="caption">
                  Fecha de Creación
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {new Date(selectedPrediction.timestamp).toLocaleString('es-EC')}
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography color="text.secondary" variant="caption">
                  Precio Despacho Predicho (USD/libra)
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  ${selectedPrediction.resultado?.precio_despacho_predicho?.toFixed(2)}
                </Typography>
              </Box>
              <Box>
                <Typography color="text.secondary" variant="caption">
                  Rango de Confianza (95%)
                </Typography>
                <Typography variant="body2">
                  ${selectedPrediction.resultado?.intervalo_confianza?.min?.toFixed(2)} -{' '}
                  ${selectedPrediction.resultado?.intervalo_confianza?.max?.toFixed(2)}
                </Typography>
              </Box>
              <Box>
                <Typography color="text.secondary" variant="caption">
                  Confianza del Modelo
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={
                      selectedPrediction.resultado?.confianza_porcentaje || 0
                    }
                    sx={{ flex: 1 }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {Math.round(selectedPrediction.resultado?.confianza_porcentaje || 0)}%
                  </Typography>
                </Box>
              </Box>
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default AIPredictionsPage;
