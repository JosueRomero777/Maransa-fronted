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
  Snackbar,
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
    // sessionId, // Not used but available from hook
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
  const [trackingDialog, setTrackingDialog] = useState({ open: false });
  const [formLoading, setFormLoading] = useState(false);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);

  const [snackBar, setSnackBar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

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
      const response = await custodyService.getOrdersForCustody();
      const data = (response as any)?.data ?? response ?? [];
      setAvailableOrders(data);
    } catch (err) {
      console.error('Error cargando órdenes disponibles:', err);
      setError('No se pudieron cargar las órdenes disponibles');
      setAvailableOrders([]);
    }
  };

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
      await loadAvailableOrders();
      setCreateDialog({ open: true });
    } catch (err) {
      console.error('Error al abrir diálogo:', err);
      setError('Error al abrir el diálogo de custodia');
    }
  };

  const handleCreateCustody = async () => {
    if (!createForm.orderId || !createForm.logisticsId) {
      setSnackBar({ open: true, message: 'Selecciona una orden', severity: 'error' });
      return;
    }

    const idRegex = /^\d{10}$/;
    const invalidIds = createForm.personalAsignado.filter(id => id.trim() !== '' && !idRegex.test(id));

    if (invalidIds.length > 0) {
      setSnackBar({ open: true, message: 'Cada miembro del personal debe tener una cédula válida de 10 dígitos', severity: 'error' });
      return;
    }

    if (createForm.personalAsignado.some(p => p.trim() === '') || !createForm.vehiculoCustodia || !createForm.rutaCustodia) {
      setSnackBar({ open: true, message: 'Por favor complete todos los campos obligatorios', severity: 'error' });
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
      setSnackBar({ open: true, message: 'Custodia creada exitosamente', severity: 'success' });
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Error al crear custodia');
    } finally {
      setFormLoading(false);
    }
  };

  const handleAssignPersonnel = async () => {
    if (!selectedCustody) return;
    const idRegex = /^\d{10}$/;
    const invalidIds = assignForm.personalAsignado.filter(id => id.trim() !== '' && !idRegex.test(id));

    if (invalidIds.length > 0) {
      setSnackBar({ open: true, message: 'Cada miembro del personal debe tener una cédula válida de 10 dígitos', severity: 'error' });
      return;
    }

    if (assignForm.personalAsignado.some(p => p.trim() === '') || !assignForm.vehiculoCustodia || !assignForm.rutaCustodia) {
      setSnackBar({ open: true, message: 'Por favor complete todos los campos', severity: 'error' });
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
      setAssignDialog({ open: false });
      setSelectedCustody(result);
      await loadData();
      setSnackBar({ open: true, message: 'Personal asignado exitosamente', severity: 'success' });
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
      setSnackBar({ open: true, message: 'Incidente registrado exitosamente', severity: 'success' });
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
      setSnackBar({ open: true, message: 'Custodia completada exitosamente', severity: 'success' });
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
    const sanitizedValue = value.replace(/\D/g, '').substring(0, 10);
    setAssignForm(prev => ({
      ...prev,
      personalAsignado: prev.personalAsignado.map((p, i) => i === index ? sanitizedValue : p)
    }));
  };

  const addPersonalFieldCreate = () => {
    setCreateForm(prev => ({
      ...prev,
      personalAsignado: [...prev.personalAsignado, '']
    }));
  };

  const removePersonalFieldCreate = (index: number) => {
    setCreateForm(prev => ({
      ...prev,
      personalAsignado: prev.personalAsignado.filter((_, i) => i !== index)
    }));
  };

  const updatePersonalFieldCreate = (index: number, value: string) => {
    const sanitizedValue = value.replace(/\D/g, '').substring(0, 10);
    setCreateForm(prev => ({
      ...prev,
      personalAsignado: prev.personalAsignado.map((p, i) => i === index ? sanitizedValue : p)
    }));
  };

  // Unused utility functions removed for code cleanliness.
  // ETA and Distance calculations are now handled by hooks or component-level logic.

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
    setError(null);
    try {
      await requestLocationPermission();

      // Primero iniciamos el rastreo por socket para que el estado cambie rápido
      try {
        await startTracking();
      } catch (trackErr) {
        console.error('Error al iniciar rastreo por socket:', trackErr);
      }

      await custodyService.startCustody(selectedCustody.id, {
        observaciones: 'Custodia iniciada con GPS activo'
      });

      await loadData();
      const updated = await custodyService.getCustody(selectedCustody.id);
      setSelectedCustody(updated);
      setTrackingDialog({ open: false });

      setSnackBar({ open: true, message: 'Custodia iniciada y rastreo activo exitosamente', severity: 'success' });
    } catch (err: any) {
      setError(err?.message || 'Error al iniciar custodia');
      setTrackingDialog({ open: false });
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancelTracking = () => {
    setTrackingDialog({ open: false });
  };

  const handleCloseSnackBar = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackBar({ ...snackBar, open: false });
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
                        {Array.isArray(custody.personalAsignado) ? custody.personalAsignado.length : 0} persona(s)
                      </TableCell>
                      <TableCell>{custody.vehiculoCustodia || '-'}</TableCell>
                      <TableCell>
                        {Array.isArray(custody.incidentes) && custody.incidentes.length > 0 ? (
                          <Chip
                            label={custody.incidentes.length}
                            color="warning"
                            size="small"
                            icon={<WarningIcon fontSize="small" />}
                          />
                        ) : (
                          <Chip
                            label="0"
                            color="success"
                            size="small"
                            icon={<CheckCircleIcon fontSize="small" />}
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
                <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} variant="scrollable" scrollButtons="auto">
                  <Tab label="Info" />
                  <Tab label="Personal" />
                  <Tab label="Horarios" />
                  <Tab label="Bitácora" />
                  <Tab label="Tracking" />
                </Tabs>

                <TabPanel value={tabValue} index={0}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2">Estado</Typography>
                      <Chip label={selectedCustody.estado} color={estadoColor(selectedCustody.estado) as any} />
                    </Box>
                    <TextField label="Vehículo" fullWidth value={selectedCustody.vehiculoCustodia || ''} disabled size="small" />
                    <TextField label="Ruta" fullWidth value={selectedCustody.rutaCustodia || ''} disabled size="small" multiline minRows={2} />
                    <TextField label="Observaciones" fullWidth value={selectedCustody.observaciones || ''} disabled size="small" multiline minRows={2} />
                    {selectedCustody.estado === EstadoCustodia.ASIGNADO && (
                      <Button variant="contained" color="primary" onClick={() => setTrackingDialog({ open: true })} disabled={formLoading}>
                        ▶ Iniciar Custodia
                      </Button>
                    )}
                    {selectedCustody.estado === EstadoCustodia.EN_CUSTODIA && (
                      <Button variant="contained" color="success" onClick={handleCompleteCustody} disabled={formLoading}>
                        Completar Custodia
                      </Button>
                    )}
                  </Stack>
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                  <Stack spacing={2}>
                    <Typography variant="h6">Personal Asignado</Typography>
                    {Array.isArray(selectedCustody.personalAsignado) && selectedCustody.personalAsignado.length > 0 ? (
                      <List dense>
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
                      <Button variant="outlined" startIcon={<AddIcon />} onClick={() => {
                        setAssignForm({
                          personalAsignado: Array.isArray(selectedCustody.personalAsignado) && selectedCustody.personalAsignado.length > 0
                            ? selectedCustody.personalAsignado
                            : [''],
                          vehiculoCustodia: selectedCustody.vehiculoCustodia || '',
                          rutaCustodia: selectedCustody.rutaCustodia || '',
                        });
                        setAssignDialog({ open: true });
                      }}>
                        Modificar Personal
                      </Button>
                    )}
                  </Stack>
                </TabPanel>

                <TabPanel value={tabValue} index={2}>
                  <Stack spacing={2}>
                    <Typography variant="h6"><ScheduleIcon fontSize="small" sx={{ mr: 1 }} />Tiempos</Typography>
                    <Box>
                      <Typography variant="caption" color="textSecondary">Inicio:</Typography>
                      <Typography variant="body2">{selectedCustody.fechaInicio ? new Date(selectedCustody.fechaInicio).toLocaleString() : 'Pendiente'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="textSecondary">Finalización:</Typography>
                      <Typography variant="body2">{selectedCustody.fechaFinalizacion ? new Date(selectedCustody.fechaFinalizacion).toLocaleString() : 'En progreso'}</Typography>
                    </Box>
                  </Stack>
                </TabPanel>

                <TabPanel value={tabValue} index={3}>
                  <Stack spacing={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6">Bitácora</Typography>
                      {selectedCustody.estado === EstadoCustodia.EN_CUSTODIA && (
                        <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => setIncidentDialog({ open: true })}>
                          Incidente
                        </Button>
                      )}
                    </Box>
                    {Array.isArray(selectedCustody.incidentes) && selectedCustody.incidentes.length > 0 ? (
                      <List dense>
                        {selectedCustody.incidentes.map((incident: Incident, index: number) => (
                          <Box key={index}>
                            <ListItem>
                              <ListItemText
                                primary={incident.descripcion}
                                secondary={`${new Date(incident.fecha).toLocaleString()} - ${incident.gravedad}`}
                              />
                            </ListItem>
                            <Divider />
                          </Box>
                        ))}
                      </List>
                    ) : (
                      <Alert severity="success">Sin incidentes</Alert>
                    )}
                  </Stack>
                </TabPanel>

                <TabPanel value={tabValue} index={4}>
                  <Stack spacing={2}>
                    <Typography variant="h6">Tracking GPS</Typography>
                    {selectedCustody.logistics && selectedCustody.logistics.origenLat ? (
                      <Box>
                        {selectedCustody.estado === EstadoCustodia.EN_CUSTODIA && (
                          <TrackingControlPanel
                            isTracking={isTracking}
                            isConnected={isConnected}
                            canStop={isTrackingOwner}
                            spectatorCount={spectatorCount}
                            error={error || trackingError}
                            trackerName={isTrackingOwner ? (user?.name || 'Custodia') : (trackerName || 'Custodia')}
                            trackerEmail={isTrackingOwner ? (user?.email || '') : (trackerEmail || '')}
                            onStart={handleStartCustodyTracking}
                            onStop={handleStopCustodyTracking}
                            onJoin={handleJoinCustodyTracking}
                          />
                        )}
                        <RealTimeMap
                          origin={{
                            lat: selectedCustody.logistics.origenLat || 0,
                            lng: selectedCustody.logistics.origenLng || 0
                          }}
                          currentLocation={custodyCurrentLocation || (selectedCustody.logistics.ubicacionActualLat && selectedCustody.logistics.ubicacionActualLng ? { lat: selectedCustody.logistics.ubicacionActualLat, lng: selectedCustody.logistics.ubicacionActualLng } : null)}
                          destinations={[{
                            id: selectedCustody.logistics.id,
                            name: selectedCustody.logistics.ubicacionDestino || 'Destino',
                            lat: selectedCustody.logistics.destinoLat || 0,
                            lng: selectedCustody.logistics.destinoLng || 0
                          }]}
                          isTracking={isTracking}
                        />
                      </Box>
                    ) : (
                      <Alert severity="info">GPS disponible en ruta</Alert>
                    )}
                  </Stack>
                </TabPanel>
              </CardContent>
            </Card>
          </Box>
        )}
      </Box>

      {/* Snackbar for feedback */}
      <Snackbar open={snackBar.open} autoHideDuration={4000} onClose={handleCloseSnackBar}>
        <Alert onClose={handleCloseSnackBar} severity={snackBar.severity} sx={{ width: '100%' }}>
          {snackBar.message}
        </Alert>
      </Snackbar>

      {/* Dialog: Asignar Personal */}
      <Dialog open={assignDialog.open} onClose={() => setAssignDialog({ open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Asignar Personal</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {assignForm.personalAsignado.map((p, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  label="Cédula"
                  value={p}
                  onChange={(e) => updatePersonalField(index, e.target.value)}
                  placeholder="10 dígitos"
                  size="small"
                  helperText="Exactamente 10 números"
                />
                {assignForm.personalAsignado.length > 1 && (
                  <IconButton onClick={() => removePersonalField(index)} color="error"><CloseIcon /></IconButton>
                )}
              </Box>
            ))}
            <Button startIcon={<AddIcon />} onClick={addPersonalField} variant="outlined" size="small">Agregar</Button>
            <TextField label="Vehículo" fullWidth value={assignForm.vehiculoCustodia} onChange={(e) => setAssignForm({ ...assignForm, vehiculoCustodia: e.target.value })} size="small" />
            <TextField label="Ruta" fullWidth value={assignForm.rutaCustodia} onChange={(e) => setAssignForm({ ...assignForm, rutaCustodia: e.target.value })} size="small" multiline minRows={2} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialog({ open: false })}>Cancelar</Button>
          <Button onClick={handleAssignPersonnel} variant="contained" disabled={formLoading}>Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Incidente */}
      <Dialog open={incidentDialog.open} onClose={() => setIncidentDialog({ open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar Incidente</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField label="Descripción" fullWidth value={incidentForm.descripcion} onChange={(e) => setIncidentForm({ ...incidentForm, descripcion: e.target.value })} multiline minRows={3} />
            <FormControl fullWidth size="small">
              <InputLabel>Gravedad</InputLabel>
              <Select value={incidentForm.gravedad} label="Gravedad" onChange={(e) => setIncidentForm({ ...incidentForm, gravedad: e.target.value as any })}>
                <MenuItem value="leve">Leve</MenuItem>
                <MenuItem value="moderada">Moderada</MenuItem>
                <MenuItem value="grave">Grave</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIncidentDialog({ open: false })}>Cancelar</Button>
          <Button onClick={handleAddIncident} variant="contained" disabled={formLoading}>Registrar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Crear Custodia */}
      <Dialog open={createDialog.open} onClose={() => setCreateDialog({ open: false })} maxWidth="md" fullWidth>
        <DialogTitle>Crear Nueva Custodia</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {availableOrders.length === 0 ? <Alert severity="info">No hay órdenes para custodia</Alert> : (
              <>
                <FormControl fullWidth size="small">
                  <InputLabel>Orden</InputLabel>
                  <Select
                    value={createForm.orderId}
                    label="Orden"
                    onChange={(e) => {
                      const selected = availableOrders.find(o => o.id === Number(e.target.value));
                      setSelectedOrderForCreate(selected);
                      setCreateForm({
                        ...createForm,
                        orderId: e.target.value,
                        logisticsId: selected?.logistica?.id?.toString() || '',
                        vehiculoCustodia: selected?.logistica?.vehiculoAsignado || '',
                        rutaCustodia: selected?.logistica?.rutaPlanificada || ''
                      });
                    }}
                  >
                    {availableOrders.map(o => <MenuItem key={o.id} value={o.id}>{o.codigo} - {o.logistica?.vehiculoAsignado}</MenuItem>)}
                  </Select>
                </FormControl>

                {selectedOrderForCreate?.logistica && (
                  <Box sx={{ mt: 1, height: 200, borderRadius: 1, overflow: 'hidden' }}>
                    <RealTimeMap
                      origin={{
                        lat: selectedOrderForCreate.logistica.origenLat || 0,
                        lng: selectedOrderForCreate.logistica.origenLng || 0
                      }}
                      currentLocation={null}
                      destinations={[{
                        id: selectedOrderForCreate.logistica.id,
                        name: selectedOrderForCreate.logistica.ubicacionDestino || 'Destino',
                        lat: selectedOrderForCreate.logistica.destinoLat || 0,
                        lng: selectedOrderForCreate.logistica.destinoLng || 0
                      }]}
                      isTracking={false}
                    />
                  </Box>
                )}

                <Typography variant="subtitle2">Personal de Custodia</Typography>
                {createForm.personalAsignado.map((p, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      label={`Cédula ${index + 1}`}
                      value={p}
                      onChange={(e) => updatePersonalFieldCreate(index, e.target.value)}
                      placeholder="10 dígitos"
                      size="small"
                      helperText="Exactamente 10 números"
                    />
                    {createForm.personalAsignado.length > 1 && (
                      <IconButton onClick={() => removePersonalFieldCreate(index)} color="error"><CloseIcon /></IconButton>
                    )}
                  </Box>
                ))}
                <Button startIcon={<AddIcon />} onClick={addPersonalFieldCreate} variant="outlined" size="small">Agregar Personal</Button>

                <TextField label="Vehículo" fullWidth value={createForm.vehiculoCustodia} onChange={(e) => setCreateForm({ ...createForm, vehiculoCustodia: e.target.value })} size="small" />
                <TextField label="Ruta" fullWidth value={createForm.rutaCustodia} onChange={(e) => setCreateForm({ ...createForm, rutaCustodia: e.target.value })} size="small" multiline minRows={2} />
                <TextField label="Observaciones" fullWidth value={createForm.observaciones} onChange={(e) => setCreateForm({ ...createForm, observaciones: e.target.value })} size="small" multiline minRows={2} />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog({ open: false })}>Cancelar</Button>
          <Button onClick={handleCreateCustody} variant="contained" disabled={formLoading || !createForm.orderId}>Crear</Button>
        </DialogActions>
      </Dialog>

      {/* Tracking Confirmation Dialog */}
      <Dialog open={trackingDialog.open} onClose={handleCancelTracking}>
        <DialogTitle>
          Activar Seguimiento de Ubicación
        </DialogTitle>
        <DialogContent>
          {error && trackingDialog.open && (
            <Alert severity="error" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
              {error}
            </Alert>
          )}
          <Typography>
            Para iniciar la custodia, necesitamos activar el seguimiento de tu ubicación en tiempo real.
            Esto permitirá al centro de control monitorear la posición del personal de seguridad y el vehículo en todo momento.
          </Typography>
          <Typography sx={{ mt: 2, color: 'text.secondary' }}>
            ¿Deseas activar el seguimiento de ubicación e iniciar la custodia?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelTracking} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleStartCustodyWithGPS} variant="contained" color="primary" disabled={formLoading}>
            {formLoading ? 'Iniciando...' : 'Activar Seguimiento e Iniciar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
