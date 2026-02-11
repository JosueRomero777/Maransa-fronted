import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { 
  Close as CloseIcon, 
  Add as AddIcon, 
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { custodyService, EstadoCustodia } from '../services/custody.service';
import type { Custody } from '../services/custody.service';
import { useAuth } from '../context';
import { useCustodyTracking } from '../hooks/useCustodyTracking';
import { RealTimeMap } from '../components/RealTimeMap';
import { TrackingControlPanel } from '../components/TrackingControlPanel';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index } = props;
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

const estadoColor = (estado: string): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' => {
  const colors: Record<string, any> = {
    PENDIENTE: 'warning',
    ASIGNADO: 'info',
    EN_CUSTODIA: 'primary',
    COMPLETADO: 'success',
  };
  return colors[estado] || 'default';
};

interface Incident {
  fecha: string;
  descripcion: string;
  gravedad: 'leve' | 'moderada' | 'grave';
  responsable?: string;
}

export default function CustodyPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Custody[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustody, setSelectedCustody] = useState<Custody | null>(null);
  const [tabValue, setTabValue] = useState(0);

  // Custody tracking hook
  const currentUserId = user?.id ?? 0;
  const custodyId = selectedCustody?.id ?? 0;
  const {
    isTracking,
    isConnected,
    currentLocation: custodyCurrentLocation,
    spectatorCount,
    error: trackingError,
    sessionId,
    isOwner: isTrackingOwner,
    trackerName,
    trackerEmail,
    startTracking,
    stopTracking,
    joinAsSpectator,
  } = useCustodyTracking(custodyId, currentUserId, selectedCustody?.estado === EstadoCustodia.EN_CUSTODIA);

  const [assignDialog, setAssignDialog] = useState({ open: false });
  const [incidentDialog, setIncidentDialog] = useState({ open: false });
  const [createDialog, setCreateDialog] = useState({ open: false });
  const [formLoading, setFormLoading] = useState(false);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);

  const [assignForm, setAssignForm] = useState({
    personalAsignado: [''],
    vehiculoCustodia: '',
    rutaCustodia: '',
  });

  const [incidentForm, setIncidentForm] = useState({
    descripcion: '',
    gravedad: 'leve' as 'leve' | 'moderada' | 'grave',
  });

  const [createForm, setCreateForm] = useState({
    orderId: '',
    logisticsId: '',
    personalAsignado: [''],
    vehiculoCustodia: '',
    rutaCustodia: '',
    observaciones: '',
  });

  const [selectedOrderForCreate, setSelectedOrderForCreate] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await custodyService.listCustody();
      const data = (response as any)?.data ?? response ?? [];
      setItems(data);
    } catch (err) {
      setError('Error cargando datos de custodia');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadAvailableOrders = async () => {
    try {
      console.log('Cargando órdenes disponibles...');
      const response = await custodyService.getOrdersForCustody();
      console.log('Respuesta de órdenes:', response);
      const data = (response as any)?.data ?? response ?? [];
      console.log('Órdenes procesadas:', data);
      setAvailableOrders(data);
    } catch (err) {
      console.error('Error cargando órdenes disponibles:', err);
      setError('No se pudieron cargar las órdenes disponibles');
      setAvailableOrders([]);
    }
  };

  // Handlers para tracking
  const handleStartCustodyTracking = async () => {
    try {
      await startTracking();
    } catch (err: any) {
      console.error('Error iniciando tracking:', err);
    }
  };

  const handleStopCustodyTracking = async () => {
    try {
      await stopTracking();
    } catch (err: any) {
      console.error('Error deteniendo tracking:', err);
    }
  };

  const handleJoinCustodyTracking = async () => {
    try {
      await joinAsSpectator();
    } catch (err: any) {
      console.error('Error uniéndose como espectador:', err);
    }
  };

  const handleOpenCreateDialog = async () => {
    try {
      console.log('Abriendo diálogo de crear custodia');
      await loadAvailableOrders();
      console.log('Órdenes cargadas, abriendo diálogo...');
      setCreateDialog({ open: true });
      console.log('Diálogo abierto - createDialog:', { open: true });
    } catch (err) {
      console.error('Error al abrir diálogo:', err);
      setError('Error al abrir el diálogo de custodia');
    }
  };

  const handleCreateCustody = async () => {
    if (!createForm.orderId || !createForm.logisticsId) {
      setError('Selecciona una orden');
      return;
    }

    setFormLoading(true);
    setError(null);
    try {
      await custodyService.createCustody({
        orderId: Number(createForm.orderId),
        logisticsId: Number(createForm.logisticsId),
        personalAsignado: createForm.personalAsignado.filter(p => p.trim()),
        vehiculoCustodia: createForm.vehiculoCustodia,
        rutaCustodia: createForm.rutaCustodia,
        observaciones: createForm.observaciones,
      });
      
      setCreateDialog({ open: false });
      setCreateForm({
        orderId: '',
        logisticsId: '',
        personalAsignado: [''],
        vehiculoCustodia: '',
        rutaCustodia: '',
        observaciones: '',
      });
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Error al crear custodia');
    } finally {
      setFormLoading(false);
    }
  };

  const handleAssignPersonnel = async () => {
    if (!selectedCustody) return;
    if (assignForm.personalAsignado.filter(p => p.trim()).length === 0) {
      setError('Agrega al menos un personal de custodia');
      return;
    }

    setFormLoading(true);
    setError(null);
    try {
      const result = await custodyService.assignPersonnel(selectedCustody.id, {
        personalAsignado: assignForm.personalAsignado.filter(p => p.trim()),
        vehiculoCustodia: assignForm.vehiculoCustodia,
        rutaCustodia: assignForm.rutaCustodia,
      });
      console.log('Personal asignado, resultado:', result);
      setAssignDialog({ open: false });
      // Actualizar selectedCustody inmediatamente con la respuesta
      setSelectedCustody(result);
      // También recargar datos
      await loadData();
    } catch (err: any) {
      console.error('Error al asignar personal:', err);
      setError(err?.message || 'Error al asignar personal');
    } finally {
      setFormLoading(false);
    }
  };

  const handleAddIncident = async () => {
    if (!selectedCustody || !incidentForm.descripcion) {
      setError('Ingresa una descripción del incidente');
      return;
    }

    setFormLoading(true);
    setError(null);
    try {
      await custodyService.addIncident(selectedCustody.id, {
        descripcion: incidentForm.descripcion,
        gravedad: incidentForm.gravedad,
        responsable: localStorage.getItem('userName') || 'Usuario',
      });
      setIncidentDialog({ open: false });
      setIncidentForm({ descripcion: '', gravedad: 'leve' });
      await loadData();
      if (selectedCustody) {
        const updated = await custodyService.getCustody(selectedCustody.id);
        setSelectedCustody(updated);
      }
    } catch (err: any) {
      setError(err?.message || 'Error al agregar incidente');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCompleteCustody = async () => {
    if (!selectedCustody) return;
    setFormLoading(true);
    try {
      await custodyService.completeCustody(selectedCustody.id, {
        observacionesFinales: 'Custodia completada sin incidentes mayores',
      });
      await loadData();
      const updated = await custodyService.getCustody(selectedCustody.id);
      setSelectedCustody(updated);
    } catch (err: any) {
      setError(err?.message || 'Error al completar custodia');
    } finally {
      setFormLoading(false);
    }
  };

  const addPersonalField = () => {
    setAssignForm(prev => ({
      ...prev,
      personalAsignado: [...prev.personalAsignado, '']
    }));
  };

  const removePersonalField = (index: number) => {
    setAssignForm(prev => ({
      ...prev,
      personalAsignado: prev.personalAsignado.filter((_, i) => i !== index)
    }));
  };

  const updatePersonalField = (index: number, value: string) => {
    setAssignForm(prev => ({
      ...prev,
      personalAsignado: prev.personalAsignado.map((p, i) => i === index ? value : p)
    }));
  };

  // Calcular ETA basado en distancia
  const calculateETA = (distance: number): Date | null => {
    if (!distance || distance <= 0) return null;
    // Velocidad promedio de transporte: 60 km/h
    const avgSpeed = 60;
    const hours = distance / avgSpeed;
    const minutesFromNow = Math.round(hours * 60);
    const eta = new Date();
    eta.setMinutes(eta.getMinutes() + minutesFromNow);
    return eta;
  };

  // Calcular distancia entre dos puntos (Haversine formula)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  };

  // Solicitar permiso de ubicación
  const requestLocationPermission = async () => {
    if (!navigator.geolocation) {
      setError('Geolocalización no disponible en este navegador');
      return false;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Ubicación obtenida:', position.coords);
          resolve(true);
        },
        (error) => {
          console.error('Error de ubicación:', error);
          setError('No se pudo obtener permiso de ubicación. La custodia iniciará sin GPS.');
          resolve(false);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    });
  };

  // Iniciar custodia con GPS
  const handleStartCustodyWithGPS = async () => {
    if (!selectedCustody) return;
    setFormLoading(true);
    try {
      await requestLocationPermission();
      await custodyService.startCustody(selectedCustody.id, {
        observaciones: 'Custodia iniciada con GPS activo'
      });
      await loadData();
      const updated = await custodyService.getCustody(selectedCustody.id);
      setSelectedCustody(updated);
    } catch (err: any) {
      setError(err?.message || 'Error al iniciar custodia');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Módulo de Custodia y Acompañamiento</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
        >
          Crear Custodia
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
        <Box sx={{ flex: selectedCustody ? 1 : 2 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell><strong>Orden</strong></TableCell>
                    <TableCell><strong>Estado</strong></TableCell>
                    <TableCell><strong>Personal</strong></TableCell>
                    <TableCell><strong>Vehículo Custodia</strong></TableCell>
                    <TableCell><strong>Incidentes</strong></TableCell>
                    <TableCell><strong>Acciones</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((custody) => (
                    <TableRow
                      key={custody.id}
                      onClick={() => setSelectedCustody(custody)}
                      sx={{
                        cursor: 'pointer',
                        backgroundColor: selectedCustody?.id === custody.id ? '#f0f0f0' : 'inherit',
                        '&:hover': { backgroundColor: '#fafafa' },
                      }}
                    >
                      <TableCell>{custody.order?.codigo}</TableCell>
                      <TableCell>
                        <Chip
                          label={custody.estado}
                          color={estadoColor(custody.estado) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {Array.isArray(custody.personalAsignado) ? custody.personalAsignado.length : 0} 
                        {' '} persona(s)
                      </TableCell>
                      <TableCell>{custody.vehiculoCustodia || '-'}</TableCell>
                      <TableCell>
                        {Array.isArray(custody.incidentes) && custody.incidentes.length > 0 ? (
                          <Chip 
                            label={custody.incidentes.length} 
                            color="warning" 
                            size="small"
                            icon={<WarningIcon />}
                          />
                        ) : (
                          <Chip 
                            label="0" 
                            color="success" 
                            size="small"
                            icon={<CheckCircleIcon />}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustody(custody);
                          }}
                        >
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>

        {selectedCustody && (
          <Box sx={{ flex: 1 }}>
            <Card sx={{ position: 'sticky', top: 20 }}>
              <CardHeader
                title={`Custodia - Orden ${selectedCustody.order?.codigo}`}
                action={
                  <IconButton onClick={() => setSelectedCustody(null)} size="small">
                    <CloseIcon />
                  </IconButton>
                }
              />
              <CardContent>
                <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
                  <Tab label="Información" />
                  <Tab label="Personal" />
                  <Tab label="Horarios" />
                  <Tab label="Bitácora" />
                  <Tab label="Tracking" />
                </Tabs>

                {/* Tab 0: Información */}
                <TabPanel value={tabValue} index={0}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2">Estado</Typography>
                      <Chip label={selectedCustody.estado} color={estadoColor(selectedCustody.estado) as any} />
                    </Box>

                    <TextField
                      label="Vehículo de Custodia"
                      fullWidth
                      value={selectedCustody.vehiculoCustodia || ''}
                      disabled
                      size="small"
                    />

                    <TextField
                      label="Ruta de Custodia"
                      fullWidth
                      value={selectedCustody.rutaCustodia || ''}
                      disabled
                      size="small"
                      multiline
                      minRows={2}
                    />

                    <TextField
                      label="Observaciones"
                      fullWidth
                      value={selectedCustody.observaciones || ''}
                      disabled
                      size="small"
                      multiline
                      minRows={2}
                    />

                    {selectedCustody.estado === EstadoCustodia.ASIGNADO && (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleStartCustodyWithGPS}
                        disabled={formLoading}
                      >
                        {formLoading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : '▶'} Iniciar Custodia
                      </Button>
                    )}

                    {selectedCustody.estado === EstadoCustodia.EN_CUSTODIA && (
                      <Button
                        variant="contained"
                        color="success"
                        onClick={handleCompleteCustody}
                        disabled={formLoading}
                      >
                        Completar Custodia
                      </Button>
                    )}
                  </Stack>
                </TabPanel>

                {/* Tab 1: Personal */}
                <TabPanel value={tabValue} index={1}>
                  <Stack spacing={2}>
                    <Typography variant="h6">Personal Asignado</Typography>
                    {Array.isArray(selectedCustody.personalAsignado) && selectedCustody.personalAsignado.length > 0 ? (
                      <List>
                        {selectedCustody.personalAsignado.map((persona: string, index: number) => (
                          <ListItem key={index}>
                            <ListItemText primary={persona} />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Alert severity="info">No hay personal asignado todavía</Alert>
                    )}

                    {selectedCustody.estado === EstadoCustodia.PENDIENTE && (
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => {
                          setAssignForm({
                            personalAsignado: Array.isArray(selectedCustody.personalAsignado) && selectedCustody.personalAsignado.length > 0 
                              ? selectedCustody.personalAsignado 
                              : [''],
                            vehiculoCustodia: selectedCustody.vehiculoCustodia || '',
                            rutaCustodia: selectedCustody.rutaCustodia || '',
                          });
                          setAssignDialog({ open: true });
                        }}
                      >
                        Modificar Personal
                      </Button>
                    )}
                  </Stack>
                </TabPanel>

                {/* Tab 2: Horarios */}
                <TabPanel value={tabValue} index={2}>
                  <Stack spacing={2}>
                    <Typography variant="h6" gutterBottom>
                      <ScheduleIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                      Horarios de Operación
                    </Typography>

                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" color="primary" gutterBottom>
                          Horario de Pesca
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Hora Estimada: {selectedCustody.order?.fechaTentativaCosecha 
                            ? new Date(selectedCustody.order.fechaTentativaCosecha).toLocaleString('es-EC', {
                                dateStyle: 'medium',
                                timeStyle: 'short'
                              })
                            : 'No definido'}
                        </Typography>
                      </CardContent>
                    </Card>

                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" color="primary" gutterBottom>
                          Llegada Estimada
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          📍 {selectedCustody.logistics?.ubicacionDestino || 'Muelle / Camaronera'}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {selectedCustody.estado === EstadoCustodia.EN_CUSTODIA && selectedCustody.logistics?.origenLat && selectedCustody.logistics?.origenLng && selectedCustody.logistics?.ubicacionActualLat && selectedCustody.logistics?.ubicacionActualLng
                            ? (() => {
                                const distance = calculateDistance(
                                  selectedCustody.logistics.ubicacionActualLat,
                                  selectedCustody.logistics.ubicacionActualLng,
                                  selectedCustody.logistics.destinoLat || selectedCustody.logistics.origenLat,
                                  selectedCustody.logistics.destinoLng || selectedCustody.logistics.origenLng
                                );
                                const eta = calculateETA(distance);
                                return (
                                  <>
                                    <Typography variant="caption" color="textSecondary" display="block">
                                      Distancia: {distance.toFixed(2)} km
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary" display="block">
                                      ETA: {eta ? eta.toLocaleString('es-EC', {
                                        dateStyle: 'short',
                                        timeStyle: 'short'
                                      }) : 'Calculando...'}
                                    </Typography>
                                  </>
                                );
                              })()
                            : <Typography variant="caption" color="textSecondary">ETA: {selectedCustody.order?.fechaEntregaEstimada 
                                ? new Date(selectedCustody.order.fechaEntregaEstimada).toLocaleString('es-EC', {
                                    dateStyle: 'medium',
                                    timeStyle: 'short'
                                  })
                                : 'Inicia custodia para ver ETA en tiempo real'}\n                              </Typography>
                          }
                        </Typography>
                      </CardContent>
                    </Card>

                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          Tiempos Registrados
                        </Typography>
                        <Stack spacing={1}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Inicio Custodia:
                            </Typography>
                            <Typography variant="body2">
                              {selectedCustody.fechaInicio 
                                ? new Date(selectedCustody.fechaInicio).toLocaleString('es-EC')
                                : 'Pendiente'}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Finalización:
                            </Typography>
                            <Typography variant="body2">
                              {selectedCustody.fechaFinalizacion 
                                ? new Date(selectedCustody.fechaFinalizacion).toLocaleString('es-EC')
                                : 'En progreso'}
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Stack>
                </TabPanel>

                {/* Tab 3: Bitácora de Incidentes */}
                <TabPanel value={tabValue} index={3}>
                  <Stack spacing={2}>
                    <Typography variant="h6">Bitácora de Ruta</Typography>
                    
                    {selectedCustody.estado === EstadoCustodia.EN_CUSTODIA && (
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setIncidentDialog({ open: true })}
                      >
                        Registrar Incidente
                      </Button>
                    )}

                    {Array.isArray(selectedCustody.incidentes) && selectedCustody.incidentes.length > 0 ? (
                      <List>
                        {selectedCustody.incidentes.map((incident: Incident, index: number) => (
                          <Box key={index}>
                            <ListItem>
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip 
                                      label={incident.gravedad} 
                                      color={
                                        incident.gravedad === 'grave' ? 'error' :
                                        incident.gravedad === 'moderada' ? 'warning' : 'info'
                                      }
                                      size="small"
                                    />
                                    <Typography variant="body1">{incident.descripcion}</Typography>
                                  </Box>
                                }
                                secondary={
                                  <Box sx={{ mt: 1 }}>
                                    <Typography variant="caption" color="text.secondary">
                                      {new Date(incident.fecha).toLocaleString('es-EC')}
                                      {incident.responsable && ` - Reportado por: ${incident.responsable}`}
                                    </Typography>
                                  </Box>
                                }
                              />
                            </ListItem>
                            {index < (selectedCustody.incidentes?.length ?? 0) - 1 && <Divider />}
                          </Box>
                        ))}
                      </List>
                    ) : (
                      <Alert severity="success" icon={<CheckCircleIcon />}>
                        No se han registrado incidentes durante la ruta
                      </Alert>
                    )}
                  </Stack>
                </TabPanel>

                {/* Tab 4: Tracking GPS */}
                <TabPanel value={tabValue} index={4}>
                  <Stack spacing={2}>
                    <Typography variant="h6">Seguimiento en Tiempo Real</Typography>
                    
                    {selectedCustody.logistics && 
                     selectedCustody.logistics.origenLat && 
                     selectedCustody.logistics.origenLng &&
                     selectedCustody.logistics.destinoLat && 
                     selectedCustody.logistics.destinoLng ? (
                      <Box>
                        {trackingError && (
                          <Alert severity="warning" sx={{ mb: 2 }}>
                            {trackingError}
                          </Alert>
                        )}

                        {selectedCustody.estado === EstadoCustodia.EN_CUSTODIA && (
                          <TrackingControlPanel
                            isTracking={isTracking}
                            isConnected={isConnected}
                            canStop={isTrackingOwner}
                            spectatorCount={spectatorCount}
                            error={trackingError}
                            trackerName={isTrackingOwner ? (user?.name || 'Custodia') : (trackerName || 'Custodia')}
                            trackerEmail={isTrackingOwner ? (user?.email || '') : (trackerEmail || '')}
                            onStart={handleStartCustodyTracking}
                            onStop={handleStopCustodyTracking}
                            onJoin={handleJoinCustodyTracking}
                          />
                        )}

                        <RealTimeMap
                          origin={{
                            lat: selectedCustody.logistics.origenLat,
                            lng: selectedCustody.logistics.origenLng,
                            name: selectedCustody.logistics.ubicacionOrigen || 'Origen'
                          }}
                          currentLocation={(() => {
                            // Priorizar ubicación del tracking de custodia
                            if (custodyCurrentLocation) {
                              return { lat: custodyCurrentLocation.lat, lng: custodyCurrentLocation.lng };
                            }
                            // Fallback a ubicación de logística
                            if (selectedCustody.logistics.ubicacionActualLat && selectedCustody.logistics.ubicacionActualLng) {
                              return {
                                lat: selectedCustody.logistics.ubicacionActualLat,
                                lng: selectedCustody.logistics.ubicacionActualLng
                              };
                            }
                            return null;
                          })()}
                          trackerInfo={(() => {
                            // Si hay tracking de logística activo, mostrarlo
                            if (selectedCustody.logistics.trackingActivo && 
                                selectedCustody.logistics.ubicacionActualLat && 
                                selectedCustody.logistics.ubicacionActualLng) {
                              return {
                                name: 'Logística',
                                lat: selectedCustody.logistics.ubicacionActualLat,
                                lng: selectedCustody.logistics.ubicacionActualLng
                              };
                            }
                            return null;
                          })()}
                          custodyInfo={(() => {
                            // Mostrar vehículo de custodia si tiene ubicación
                            const lat = custodyCurrentLocation?.lat ?? selectedCustody.ubicacionActualLat;
                            const lng = custodyCurrentLocation?.lng ?? selectedCustody.ubicacionActualLng;
                            if (!lat || !lng) return null;
                            return {
                              name: 'Custodia',
                              lat,
                              lng
                            };
                          })()}
                          destinations={[{
                            id: selectedCustody.logistics.id,
                            name: selectedCustody.logistics.ubicacionDestino || 'Destino',
                            lat: selectedCustody.logistics.destinoLat,
                            lng: selectedCustody.logistics.destinoLng
                          }]}
                          spectatorCount={spectatorCount}
                          isTracking={isTracking}
                        />
                      </Box>
                    ) : (
                      <Alert severity="info">
                        El tracking GPS estará disponible cuando la logística esté en ruta
                      </Alert>
                    )}
                  </Stack>
                </TabPanel>
              </CardContent>
            </Card>
          </Box>
        )}
      </Box>

      {/* Dialog: Asignar Personal */}
      <Dialog open={assignDialog.open} onClose={() => setAssignDialog({ open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Asignar Personal de Custodia</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="subtitle2">Personal de Custodia</Typography>
            {assignForm.personalAsignado.map((persona, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  label={`Persona ${index + 1}`}
                  value={persona}
                  onChange={(e) => updatePersonalField(index, e.target.value)}
                  size="small"
                />
                {assignForm.personalAsignado.length > 1 && (
                  <IconButton onClick={() => removePersonalField(index)} color="error">
                    <CloseIcon />
                  </IconButton>
                )}
              </Box>
            ))}
            <Button startIcon={<AddIcon />} onClick={addPersonalField} variant="outlined" size="small">
              Agregar Personal
            </Button>

            <TextField
              label="Vehículo de Custodia"
              fullWidth
              value={assignForm.vehiculoCustodia}
              onChange={(e) => setAssignForm({ ...assignForm, vehiculoCustodia: e.target.value })}
              size="small"
            />

            <TextField
              label="Ruta de Custodia"
              fullWidth
              value={assignForm.rutaCustodia}
              onChange={(e) => setAssignForm({ ...assignForm, rutaCustodia: e.target.value })}
              multiline
              minRows={2}
              size="small"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialog({ open: false })}>Cancelar</Button>
          <Button onClick={handleAssignPersonnel} variant="contained" disabled={formLoading}>
            {formLoading ? <CircularProgress size={24} /> : 'Asignar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Registrar Incidente */}
      <Dialog open={incidentDialog.open} onClose={() => setIncidentDialog({ open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar Incidente</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Descripción del Incidente"
              fullWidth
              value={incidentForm.descripcion}
              onChange={(e) => setIncidentForm({ ...incidentForm, descripcion: e.target.value })}
              multiline
              minRows={3}
              size="small"
            />

            <FormControl fullWidth size="small">
              <InputLabel>Gravedad</InputLabel>
              <Select
                value={incidentForm.gravedad}
                onChange={(e) => setIncidentForm({ ...incidentForm, gravedad: e.target.value as any })}
                label="Gravedad"
              >
                <MenuItem value="leve">Leve</MenuItem>
                <MenuItem value="moderada">Moderada</MenuItem>
                <MenuItem value="grave">Grave</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIncidentDialog({ open: false })}>Cancelar</Button>
          <Button onClick={handleAddIncident} variant="contained" disabled={formLoading}>
            {formLoading ? <CircularProgress size={24} /> : 'Registrar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Crear Custodia */}
      <Dialog open={createDialog.open} onClose={() => setCreateDialog({ open: false })} maxWidth="md" fullWidth>
        <DialogTitle>Crear Nueva Custodia</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {availableOrders.length === 0 ? (
              <Alert severity="info">
                Cargando órdenes disponibles...
              </Alert>
            ) : (
              <>
                <FormControl fullWidth size="small">
                  <InputLabel>Orden con Logística</InputLabel>
                  <Select
                    value={createForm.orderId}
                    onChange={(e) => {
                      const selectedOrder = availableOrders.find(o => o.id === Number(e.target.value));
                      setSelectedOrderForCreate(selectedOrder);
                      setCreateForm({ 
                        ...createForm, 
                        orderId: e.target.value,
                        logisticsId: selectedOrder?.logistica?.id?.toString() || '',
                        vehiculoCustodia: selectedOrder?.logistica?.vehiculoAsignado || '',
                        rutaCustodia: selectedOrder?.logistica?.rutaPlanificada || ''
                      });
                    }}
                    label="Orden con Logística"
                  >
                    {availableOrders.map((order) => (
                      <MenuItem key={order.id} value={order.id}>
                        {order.codigo} - {order.provider?.name} - {order.logistica?.vehiculoAsignado || 'Sin vehículo'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {selectedOrderForCreate && selectedOrderForCreate.logistica && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      📍 Mapa de Ruta de Logística
                    </Typography>
                    {selectedOrderForCreate.logistica.origenLat && 
                     selectedOrderForCreate.logistica.origenLng &&
                     selectedOrderForCreate.logistica.destinoLat && 
                     selectedOrderForCreate.logistica.destinoLng ? (
                      <RealTimeMap
                        origin={{
                          lat: selectedOrderForCreate.logistica.origenLat,
                          lng: selectedOrderForCreate.logistica.origenLng,
                          name: selectedOrderForCreate.logistica.ubicacionOrigen || 'Origen'
                        }}
                        currentLocation={
                          selectedOrderForCreate.logistica.ubicacionActualLat && selectedOrderForCreate.logistica.ubicacionActualLng
                            ? {
                                lat: selectedOrderForCreate.logistica.ubicacionActualLat,
                                lng: selectedOrderForCreate.logistica.ubicacionActualLng
                              }
                            : null
                        }
                        destinations={[{
                          id: selectedOrderForCreate.logistica.id,
                          name: selectedOrderForCreate.logistica.ubicacionDestino || 'Destino',
                          lat: selectedOrderForCreate.logistica.destinoLat,
                          lng: selectedOrderForCreate.logistica.destinoLng
                        }]}
                        isTracking={false}
                      />
                    ) : (
                      <Alert severity="info">
                        No hay coordenadas disponibles para esta ruta
                      </Alert>
                    )}
                    
                    <Box sx={{ mt: 2, p: 1, bgcolor: 'white', borderRadius: 0.5 }}>
                      <Typography variant="caption" color="textSecondary">
                        <strong>Origen:</strong> {selectedOrderForCreate.logistica.ubicacionOrigen || 'No especificado'}
                      </Typography>
                      <br />
                      <Typography variant="caption" color="textSecondary">
                        <strong>Destino:</strong> {selectedOrderForCreate.logistica.ubicacionDestino || 'No especificado'}
                      </Typography>
                      <br />
                      <Typography variant="caption" color="textSecondary">
                        <strong>Ruta Planificada:</strong> {selectedOrderForCreate.logistica.rutaPlanificada || 'No especificada'}
                      </Typography>
                    </Box>
                  </Box>
                )}

                <Divider />

                <Typography variant="subtitle2">Personal de Custodia</Typography>
                {createForm.personalAsignado.map((persona, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      label={`Persona ${index + 1}`}
                      value={persona}
                      onChange={(e) => {
                        const newPersonal = [...createForm.personalAsignado];
                        newPersonal[index] = e.target.value;
                        setCreateForm({ ...createForm, personalAsignado: newPersonal });
                      }}
                      size="small"
                    />
                    {createForm.personalAsignado.length > 1 && (
                      <IconButton 
                        onClick={() => {
                          setCreateForm({
                            ...createForm,
                            personalAsignado: createForm.personalAsignado.filter((_, i) => i !== index)
                          });
                        }} 
                        color="error"
                      >
                        <CloseIcon />
                      </IconButton>
                    )}
                  </Box>
                ))}
                <Button 
                  startIcon={<AddIcon />} 
                  onClick={() => {
                    setCreateForm({
                      ...createForm,
                      personalAsignado: [...createForm.personalAsignado, '']
                    });
                  }} 
                  variant="outlined" 
                  size="small"
                >
                  Agregar Personal
                </Button>

                <TextField
                  label="Vehículo de Custodia"
                  fullWidth
                  value={createForm.vehiculoCustodia}
                  onChange={(e) => setCreateForm({ ...createForm, vehiculoCustodia: e.target.value })}
                  size="small"
                  placeholder="Ej: Patrulla #123"
                />

                <TextField
                  label="Ruta de Custodia"
                  fullWidth
                  value={createForm.rutaCustodia}
                  onChange={(e) => setCreateForm({ ...createForm, rutaCustodia: e.target.value })}
                  multiline
                  minRows={2}
                  size="small"
                  placeholder="Describe la ruta que seguirá el personal de custodia"
                />

                <TextField
                  label="Observaciones"
                  fullWidth
                  value={createForm.observaciones}
                  onChange={(e) => setCreateForm({ ...createForm, observaciones: e.target.value })}
                  multiline
                  minRows={2}
                  size="small"
                />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog({ open: false })}>Cancelar</Button>
          <Button 
            onClick={handleCreateCustody} 
            variant="contained" 
            disabled={formLoading || !createForm.orderId || availableOrders.length === 0}
          >
            {formLoading ? <CircularProgress size={24} /> : 'Crear Custodia'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
