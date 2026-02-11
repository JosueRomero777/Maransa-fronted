import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api.config';
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
  InputLabel,
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
  List,
  ListItem,
  ListItemText,
  Tooltip,
  IconButton,
  Alert,
  Paper,
  MenuItem,
} from '@mui/material';
import { Download as DownloadIcon, Close as CloseIcon, CameraAlt as CameraIcon } from '@mui/icons-material';
import { logisticsService, EstadoLogistica } from '../services/logistics.service';
import type { Logistics } from '../services/logistics.service';
import { apiService } from '../services/api.service';
import { useAuth } from '../context';
import { useRealTimeTracking } from '../hooks/useRealTimeTracking';
import { useCustodyTracking } from '../hooks/useCustodyTracking';
import MapPicker from '../components/MapPicker';
import { RealTimeMap } from '../components/RealTimeMap';
import { TrackingControlPanel } from '../components/TrackingControlPanel';
import RouteMap from '../components/RouteMap';
import CameraCapture from '../components/CameraCapture';

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
    EN_RUTA: 'primary',
    COMPLETADO: 'success',
    DEVUELTO: 'error',
    CANCELADO: 'error',
  };
  return colors[estado] || 'default';
};

export default function LogisticsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Logistics[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLogistics, setSelectedLogistics] = useState<Logistics | null>(null);
  const [selectedCustody, setSelectedCustody] = useState<any | null>(null);
  const [tabValue, setTabValue] = useState(0);

  const [formDialog, setFormDialog] = useState({ open: false });
  const [assignDialog, setAssignDialog] = useState({ open: false });
  const [mediaDialog, setMediaDialog] = useState({ open: false });
  const [evidenceDialog, setEvidenceDialog] = useState({ open: false });
  const [trackingDialog, setTrackingDialog] = useState({ open: false });

  const [ordersOptions, setOrdersOptions] = useState<any[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ file: string; logId: number; blob?: string } | null>(null);

  useEffect(() => {
    if (previewFile && !previewFile.blob) {
      const loadFilePreview = async () => {
        try {
          const token = localStorage.getItem('token');
          console.log('Loading preview for:', { logId: previewFile.logId, file: previewFile.file, hasToken: !!token });
          
          const response = await fetch(`${API_BASE_URL}/logistics/${previewFile.logId}/files/${previewFile.file}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          console.log('Preview fetch response status:', response.status);
          
          if (!response.ok) {
            console.error('Preview fetch error:', response.status, response.statusText);
            throw new Error(`Failed to load file: ${response.statusText}`);
          }
          
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          setPreviewFile({ ...previewFile, blob: blobUrl });
        } catch (err) {
          console.error('Error loading file preview:', err);
        }
      };
      loadFilePreview();
    }
  }, [previewFile]);
  const [routePlanLoading, setRoutePlanLoading] = useState(false);
  const [showRouteMap, setShowRouteMap] = useState(false);

  const currentUserId = user?.id ?? 0;
  const {
    isTracking,
    isConnected,
    currentLocation,
    spectatorCount,
    error: trackingError,
    sessionId,
    isOwner: isTrackingOwner,
    trackerName,
    trackerEmail,
    startTracking,
    stopTracking,
    joinAsSpectator,
  } = useRealTimeTracking(selectedLogistics?.id ?? 0, currentUserId);

  const custodyId = selectedCustody?.id ?? 0;
  const custodyAutoJoin = selectedCustody?.estado === 'EN_CUSTODIA';
  const {
    currentLocation: custodyLocation,
    error: custodyError,
  } = useCustodyTracking(custodyId, currentUserId, custodyAutoJoin);

  const [newLogisticsForm, setNewLogisticsForm] = useState({
    orderId: '',
    ubicacionOrigen: '',
    ubicacionDestino: '',
    rutaPlanificada: '',
    observaciones: '',
    archivos: null as FileList | null,
    origenLat: null as number | null,
    origenLng: null as number | null,
    destinoLat: null as number | null,
    destinoLng: null as number | null,
  });

  const [assignForm, setAssignForm] = useState({
    vehiculoAsignado: '',
    choferAsignado: '',
  });

  const [mediaForm, setMediaForm] = useState({
    recursosUtilizados: '',
  });

  const [evidenceForm, setEvidenceForm] = useState({
    tipo: 'carga',
    archivos: null as FileList | null,
  });

  const [cameraOpen, setCameraOpen] = useState(false);
  const [capturedFiles, setCapturedFiles] = useState<File[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await logisticsService.listLogistics();
      const data = (response as any)?.data ?? response ?? [];
      setItems(data);
    } catch (err) {
      setError('Error cargando datos de logística');
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const response = await apiService.get<any>('/logistics/approved-orders');
      let ordersData = (response as any)?.data ?? response ?? [];

      // Fallback a endpoint de cosechas si viene vacío
      if (!ordersData.length) {
        const altResponse = await apiService.get<any>('/harvest/approved-for-logistics');
        ordersData = (altResponse as any)?.data ?? altResponse ?? [];
      }

      console.log('Orders received:', ordersData); // Debug

      setOrdersOptions(ordersData.map((o: any) => {
        // Detectar si es un objeto de Harvest (tiene order anidado) o un Order directo
        const isHarvest = o.order !== undefined;
        const orderData = isHarvest ? o.order : o;
        
        return {
          id: orderData.id,
          codigo: orderData.codigo,
          providerName: orderData.provider?.name || 'Sin proveedor',
          cosechaFecha: orderData.fechaDefinitivaCosecha,
        };
      }));
    } catch (err) {
      console.error('Error cargando órdenes', err);
      setOrdersOptions([]);
    }
  };

  useEffect(() => {
    loadData();
    loadOrders();
  }, []);


  // Cargar información de custodia cuando se selecciona una logística
  useEffect(() => {
    const loadCustodyInfo = async () => {
      if (selectedLogistics && selectedLogistics.orderId) {
        try {
          const response = await fetch(`${API_BASE_URL}/custody/order/${selectedLogistics.orderId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          if (response.ok) {
            const custody = await response.json();
            setSelectedCustody(custody);
          }
        } catch (err) {
          console.log('No hay custodia para esta orden');
          setSelectedCustody(null);
        }
      }
    };

    loadCustodyInfo();
  }, [selectedLogistics]);

  const handleCreateNew = () => {
    setNewLogisticsForm({
      orderId: '',
      ubicacionOrigen: '',
      ubicacionDestino: '',
      rutaPlanificada: '',
      observaciones: '',
      archivos: null,
      origenLat: null,
      origenLng: null,
      destinoLat: null,
      destinoLng: null,
    });
    setShowRouteMap(false);
    setFormDialog({ open: true });
  };

  const handleGenerateRoutePlan = async () => {
    const hasCoords =
      newLogisticsForm.origenLat !== null &&
      newLogisticsForm.origenLng !== null &&
      newLogisticsForm.destinoLat !== null &&
      newLogisticsForm.destinoLng !== null;

    if (!hasCoords) {
      setError('Selecciona origen y destino en el mapa para generar la ruta ideal');
      return;
    }

    setRoutePlanLoading(true);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${newLogisticsForm.origenLng},${newLogisticsForm.origenLat};${newLogisticsForm.destinoLng},${newLogisticsForm.destinoLat}?overview=simplified&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();

      if (data?.routes?.length) {
        const route = data.routes[0];
        const distanceKm = (route.distance / 1000).toFixed(1);
        const durationMin = Math.round(route.duration / 60);
        const summary = `Ruta ideal: ${distanceKm} km (~${durationMin} min)`;
        setNewLogisticsForm((prev) => ({ ...prev, rutaPlanificada: summary }));
        setShowRouteMap(true);
      } else {
        setError('No se pudo generar la ruta automática');
      }
    } catch (err) {
      console.error('Error generando ruta ideal', err);
      setError('Error generando ruta automática');
    } finally {
      setRoutePlanLoading(false);
    }
  };

  const handleSubmitLogistics = async () => {
    if (newLogisticsForm.orderId === '') {
      setError('Selecciona una orden');
      return;
    }

    setFormLoading(true);
    setError(null);
    try {
      const dto = {
        orderId: Number(newLogisticsForm.orderId),
        ubicacionOrigen: newLogisticsForm.ubicacionOrigen || undefined,
        ubicacionDestino: newLogisticsForm.ubicacionDestino || undefined,
        rutaPlanificada: newLogisticsForm.rutaPlanificada || undefined,
        observaciones: newLogisticsForm.observaciones || undefined,
        origenLat: newLogisticsForm.origenLat ?? undefined,
        origenLng: newLogisticsForm.origenLng ?? undefined,
        destinoLat: newLogisticsForm.destinoLat ?? undefined,
        destinoLng: newLogisticsForm.destinoLng ?? undefined,
      };

      const created = await logisticsService.createLogistics(dto);
      
      // Si hay archivos, subirlos después
      if (newLogisticsForm.archivos) {
        await logisticsService.uploadFiles(created.id, newLogisticsForm.archivos);
      }
      
      setFormDialog({ open: false });
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Error al crear logística');
    } finally {
      setFormLoading(false);
    }
  };

  const handleAssignVehicle = async () => {
    if (!selectedLogistics) return;
    if (!assignForm.vehiculoAsignado || !assignForm.choferAsignado) {
      setError('Completa todos los campos');
      return;
    }

    setFormLoading(true);
    setError(null);
    try {
      await logisticsService.assignVehicle(selectedLogistics.id, assignForm);
      setAssignDialog({ open: false });
      await loadData();
      if (selectedLogistics) {
        const updated = await logisticsService.getLogistics(selectedLogistics.id);
        setSelectedLogistics(updated);
      }
    } catch (err: any) {
      setError(err?.message || 'Error al asignar vehículo');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSaveMedia = async () => {
    if (!selectedLogistics || !mediaForm.recursosUtilizados) {
      setError('Ingresa los medios utilizados');
      return;
    }

    setFormLoading(true);
    setError(null);
    try {
      await logisticsService.updateLogistics(selectedLogistics.id, {
        recursosUtilizados: mediaForm.recursosUtilizados,
      });
      setMediaDialog({ open: false });
      await loadData();
      if (selectedLogistics) {
        const updated = await logisticsService.getLogistics(selectedLogistics.id);
        setSelectedLogistics(updated);
      }
    } catch (err: any) {
      setError(err?.message || 'Error al guardar medios');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUploadEvidence = async () => {
    if (!selectedLogistics) return;
    
    // Combinar archivos capturados con archivos subidos
    const allFiles: File[] = [...capturedFiles];
    if (evidenceForm.archivos) {
      allFiles.push(...Array.from(evidenceForm.archivos));
    }

    if (allFiles.length === 0) {
      setError('Selecciona o captura al menos un archivo');
      return;
    }

    if (!evidenceForm.tipo) {
      setError('Selecciona un tipo de evidencia');
      return;
    }

    setFormLoading(true);
    setError(null);
    try {
      console.log('Uploading evidence with tipo:', evidenceForm.tipo); // Debug log
      
      // Convertir array de Files a FileList
      const dataTransfer = new DataTransfer();
      allFiles.forEach(file => dataTransfer.items.add(file));
      const fileList = dataTransfer.files;
      
      await logisticsService.addEvidence(selectedLogistics.id, evidenceForm.tipo, 'Evidencia adjuntada', fileList);
      setEvidenceDialog({ open: false });
      setEvidenceForm({ tipo: 'carga', archivos: null });
      setCapturedFiles([]);
      await loadData();
      if (selectedLogistics) {
        const updated = await logisticsService.getLogistics(selectedLogistics.id);
        setSelectedLogistics(updated);
      }
    } catch (err: any) {
      setError(err?.message || 'Error al subir evidencias');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCameraCapture = (file: File) => {
    setCapturedFiles(prev => [...prev, file]);
  };

  const handleRemoveCapturedFile = (index: number) => {
    setCapturedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleStartTransport = async () => {
    if (!selectedLogistics) return;
    setError(null); // Limpiar errores previos
    setTrackingDialog({ open: true });
  };

  const handleConfirmTracking = async () => {
    if (!selectedLogistics) return;
    setError(null);
    setFormLoading(true);
    try {
      // Verificar si faltan coordenadas y si es así, mostrar error
      if (!selectedLogistics.origenLat || !selectedLogistics.origenLng || 
          !selectedLogistics.destinoLat || !selectedLogistics.destinoLng) {
        throw new Error('Esta logística no tiene coordenadas definidas. Por favor, crea una nueva logística usando "Generar ruta ideal".');
      }
      await logisticsService.startRoute(selectedLogistics.id);
      await startTracking();

      await loadData();
      const updated = await logisticsService.getLogistics(selectedLogistics.id);
      setSelectedLogistics(updated);

      setTrackingDialog({ open: false });
    } catch (error: any) {
      console.error('Error completo:', error);
      let errorMessage = 'Error al iniciar transporte';
      if (error?.message?.includes('coordenadas')) {
        errorMessage = error.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      console.error('Mensaje de error final:', errorMessage);
      setError(errorMessage);
      setTrackingDialog({ open: false });
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancelTracking = () => {
    setTrackingDialog({ open: false });
  };

  const handleStopTracking = async () => {
    if (!selectedLogistics) return;
    setFormLoading(true);
    try {
      await stopTracking();
      await loadData();
      const updated = await logisticsService.getLogistics(selectedLogistics.id);
      setSelectedLogistics(updated);
    } catch (err: any) {
      setError(err?.message || 'Error al detener seguimiento');
    } finally {
      setFormLoading(false);
    }
  };

  const handleJoinTracking = async () => {
    if (!selectedLogistics) return;
    setFormLoading(true);
    try {
      await joinAsSpectator();
    } catch (err: any) {
      setError(err?.message || 'Error al unirse al seguimiento');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCompleteTransport = async () => {
    if (!selectedLogistics) return;
    setFormLoading(true);
    try {
      await logisticsService.completeRoute(selectedLogistics.id, {
        observaciones: 'Transporte completado',
      });
      await loadData();
      const updated = await logisticsService.getLogistics(selectedLogistics.id);
      setSelectedLogistics(updated);
    } catch (err: any) {
      setError(err?.message || 'Error al completar transporte');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Seguimiento Logístico de Pedidos</Typography>
        <Button variant="contained" onClick={handleCreateNew}>
          Nueva Logística
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
        <Box sx={{ flex: selectedLogistics ? 1 : 2 }}>
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
                    <TableCell><strong>Vehículo</strong></TableCell>
                    <TableCell><strong>Chofer</strong></TableCell>
                    <TableCell><strong>Acciones</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((log) => (
                    <TableRow
                      key={log.id}
                      onClick={() => setSelectedLogistics(log)}
                      sx={{
                        cursor: 'pointer',
                        backgroundColor: selectedLogistics?.id === log.id ? '#f0f0f0' : 'inherit',
                        '&:hover': { backgroundColor: '#fafafa' },
                      }}
                    >
                      <TableCell>{log.order?.codigo}</TableCell>
                      <TableCell>
                        <Chip
                          label={log.estado}
                          color={estadoColor(log.estado) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{log.vehiculoAsignado || '-'}</TableCell>
                      <TableCell>{log.choferAsignado || '-'}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLogistics(log);
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

        {selectedLogistics && (
          <Box sx={{ flex: 1 }}>
            <Card sx={{ position: 'sticky', top: 20 }}>
              <CardHeader
                title={`Detalle - Orden ${selectedLogistics.order?.codigo}`}
                action={
                  <IconButton onClick={() => setSelectedLogistics(null)} size="small">
                    <CloseIcon />
                  </IconButton>
                }
              />
              <CardContent>
                <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
                  <Tab label="Información" />
                  <Tab label="Vehículo" />
                  <Tab label="Medios" />
                  <Tab label="Evidencias" />
                </Tabs>

                {/* Tab 0: Información */}
                <TabPanel value={tabValue} index={0}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2">Estado</Typography>
                      <Chip label={selectedLogistics.estado} color={estadoColor(selectedLogistics.estado) as any} />
                    </Box>
                    <TextField
                      label="Ubicación Origen"
                      fullWidth
                      value={selectedLogistics.ubicacionOrigen || ''}
                      disabled
                      size="small"
                    />
                    <TextField
                      label="Ubicación Destino"
                      fullWidth
                      value={selectedLogistics.ubicacionDestino || ''}
                      disabled
                      size="small"
                    />
                    <TextField
                      label="Ruta Planificada"
                      fullWidth
                      value={selectedLogistics.rutaPlanificada || ''}
                      disabled
                      size="small"
                      multiline
                      minRows={2}
                    />
                    <TextField
                      label="Observaciones"
                      fullWidth
                      value={selectedLogistics.observaciones || ''}
                      disabled
                      size="small"
                      multiline
                      minRows={2}
                    />
                  </Stack>
                </TabPanel>

                {/* Tab 1: Vehículo */}
                <TabPanel value={tabValue} index={1}>
                  <Stack spacing={2}>
                    <TextField
                      label="Vehículo Asignado"
                      fullWidth
                      value={selectedLogistics.vehiculoAsignado || ''}
                      disabled
                      size="small"
                    />
                    <TextField
                      label="Chofer Asignado"
                      fullWidth
                      value={selectedLogistics.choferAsignado || ''}
                      disabled
                      size="small"
                    />
                    {selectedLogistics.estado === EstadoLogistica.PENDIENTE && (
                      <Button
                        variant="contained"
                        onClick={() => {
                          setAssignForm({ vehiculoAsignado: '', choferAsignado: '' });
                          setAssignDialog({ open: true });
                        }}
                      >
                        Asignar Vehículo y Chofer
                      </Button>
                    )}
                    {selectedLogistics.estado === EstadoLogistica.ASIGNADO && (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleStartTransport}
                        disabled={formLoading}
                      >
                        Iniciar Transporte
                      </Button>
                    )}
                    {selectedLogistics.estado === EstadoLogistica.EN_RUTA && (
                      <Button
                        variant="contained"
                        color="success"
                        onClick={handleCompleteTransport}
                        disabled={formLoading}
                      >
                        Completar Transporte
                      </Button>
                    )}

                    {/* Mapa de Seguimiento en Tiempo Real */}
                    {(() => {
                      // Mostrar mapa si está EN_RUTA y tiene coordenadas válidas
                      // No importa si hay errores temporales de GPS, el mapa debe seguir visible
                      const hasValidCoordinates = selectedLogistics.origenLat && 
                                                 selectedLogistics.origenLng &&
                                                 selectedLogistics.destinoLat && 
                                                 selectedLogistics.destinoLng;
                      
                      const shouldShow = selectedLogistics.estado === EstadoLogistica.EN_RUTA && 
                                       hasValidCoordinates;
                      
                      return shouldShow ? (
                        <Box sx={{ mt: 3 }}>
                          <Typography variant="h6" gutterBottom>
                            Seguimiento en Tiempo Real
                          </Typography>

                          {custodyError && (
                            <Alert severity="warning" sx={{ mb: 2 }}>
                              {custodyError}
                            </Alert>
                          )}

                          <TrackingControlPanel
                            isTracking={isTracking}
                            isConnected={isConnected}
                            canStop={isTrackingOwner}
                            spectatorCount={spectatorCount}
                            error={trackingError}
                            trackerName={isTrackingOwner ? (user?.name || 'Usuario') : (trackerName || 'Usuario')}
                            trackerEmail={isTrackingOwner ? (user?.email || '') : (trackerEmail || '')}
                            onStart={handleConfirmTracking}
                            onStop={handleStopTracking}
                            onJoin={handleJoinTracking}
                          />

                          <RealTimeMap
                            origin={
                              selectedLogistics.origenLat && selectedLogistics.origenLng
                                ? {
                                    lat: selectedLogistics.origenLat,
                                    lng: selectedLogistics.origenLng,
                                    name: selectedLogistics.ubicacionOrigen || 'Origen'
                                  }
                                : null
                            }
                            currentLocation={(() => {
                              if (currentLocation) {
                                return { lat: currentLocation.lat, lng: currentLocation.lng };
                              }
                              if (selectedLogistics.ubicacionActualLat && selectedLogistics.ubicacionActualLng) {
                                return {
                                  lat: selectedLogistics.ubicacionActualLat,
                                  lng: selectedLogistics.ubicacionActualLng
                                };
                              }
                              return null;
                            })()}
                            trackerInfo={(() => {
                              const lat = currentLocation?.lat ?? selectedLogistics.ubicacionActualLat;
                              const lng = currentLocation?.lng ?? selectedLogistics.ubicacionActualLng;
                              if (!lat || !lng) return null;
                              return {
                                name: user?.name || 'Usuario',
                                lat,
                                lng
                              };
                            })()}
                            custodyInfo={(() => {
                              const lat = custodyLocation?.lat ?? selectedCustody?.ubicacionActualLat;
                              const lng = custodyLocation?.lng ?? selectedCustody?.ubicacionActualLng;
                              if (!lat || !lng) return null;
                              return {
                                name: 'Custodia',
                                lat,
                                lng
                              };
                            })()}
                            destinations={[
                              {
                                id: selectedLogistics.id,
                                name: selectedLogistics.ubicacionDestino || 'Destino',
                                lat: selectedLogistics.destinoLat ?? 0,
                                lng: selectedLogistics.destinoLng ?? 0
                              }
                            ]}
                            spectatorCount={spectatorCount}
                            isTracking={isTracking}
                          />
                        </Box>
                      ) : null;
                    })()}
                  </Stack>
                </TabPanel>

                {/* Tab 2: Medios */}
                <TabPanel value={tabValue} index={2}>
                  <Stack spacing={2}>
                    <TextField
                      label="Medios Utilizados (vines, tanques, oxígeno, etc.)"
                      fullWidth
                      value={selectedLogistics.recursosUtilizados || ''}
                      disabled
                      size="small"
                      multiline
                      minRows={3}
                    />
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setMediaForm({ recursosUtilizados: selectedLogistics.recursosUtilizados || '' });
                        setMediaDialog({ open: true });
                      }}
                    >
                      Editar Medios
                    </Button>
                  </Stack>
                </TabPanel>

                {/* Tab 3: Evidencias */}
                <TabPanel value={tabValue} index={3}>
                  <Stack spacing={3}>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Evidencias de Carga ({selectedLogistics.evidenciasCarga?.length || 0})
                      </Typography>
                      {selectedLogistics.evidenciasCarga && selectedLogistics.evidenciasCarga.length > 0 ? (
                        <List dense>
                          {selectedLogistics.evidenciasCarga.map((file, idx) => {
                            const isImage = /\.(jpg|jpeg|png|gif)$/i.test(file);
                            const isPdf = /\.pdf$/i.test(file);
                            return (
                              <ListItem key={idx}>
                                <ListItemText
                                  primary={file}
                                  secondary="Evidencia de carga"
                                />
                                <Tooltip title="Ver">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      if (isImage || isPdf) {
                                        setPreviewFile({ file, logId: selectedLogistics.id });
                                      } else {
                                        window.open(`${API_BASE_URL}/logistics/${selectedLogistics.id}/files/${file}`, '_blank');
                                      }
                                    }}
                                  >
                                    <DownloadIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </ListItem>
                            );
                          })}
                        </List>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Sin evidencias de carga
                        </Typography>
                      )}
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Evidencias de Transporte ({selectedLogistics.evidenciasTransporte?.length || 0})
                      </Typography>
                      {selectedLogistics.evidenciasTransporte && selectedLogistics.evidenciasTransporte.length > 0 ? (
                        <List dense>
                          {selectedLogistics.evidenciasTransporte.map((file, idx) => {
                            const isImage = /\.(jpg|jpeg|png|gif)$/i.test(file);
                            const isPdf = /\.pdf$/i.test(file);
                            return (
                              <ListItem key={idx}>
                                <ListItemText
                                  primary={file}
                                  secondary="Evidencia de transporte"
                                />
                                <Tooltip title="Ver">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      if (isImage || isPdf) {
                                        setPreviewFile({ file, logId: selectedLogistics.id });
                                      } else {
                                        window.open(`${API_BASE_URL}/logistics/${selectedLogistics.id}/files/${file}`, '_blank');
                                      }
                                    }}
                                  >
                                    <DownloadIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </ListItem>
                            );
                          })}
                        </List>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Sin evidencias de transporte
                        </Typography>
                      )}
                    </Box>

                    <Button
                      variant="contained"
                      onClick={() => {
                        setEvidenceForm({ tipo: 'carga', archivos: null });
                        setEvidenceDialog({ open: true });
                      }}
                    >
                      Adjuntar Nueva Evidencia
                    </Button>
                  </Stack>
                </TabPanel>
              </CardContent>
            </Card>
          </Box>
        )}
      </Box>

      {/* Dialog: Crear nueva logística */}
      <Dialog
        open={formDialog.open}
        onClose={() => setFormDialog({ open: false })}
        maxWidth="xl"
        fullWidth
        PaperProps={{ sx: { width: '96vw', maxWidth: '96vw', height: '90vh' } }}
      >
        <DialogTitle>Nueva Logística</DialogTitle>
        <DialogContent dividers sx={{ height: '100%' }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Stack spacing={2} mt={1}>
            <FormControl fullWidth required>
              <InputLabel>Orden</InputLabel>
              <Select
                label="Orden"
                value={newLogisticsForm.orderId}
                onChange={(e) => setNewLogisticsForm((prev) => ({ ...prev, orderId: e.target.value }))}
              >
                <MenuItem value="" disabled>
                  {ordersOptions.length === 0 ? 'Sin órdenes aprobadas disponibles' : 'Selecciona una orden'}
                </MenuItem>
                {ordersOptions.map((o) => (
                  <MenuItem key={o.id} value={o.id}>
                    {o.codigo || `Orden #${o.id}`} {o.providerName ? `- ${o.providerName}` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Ubicación de Origen"
              fullWidth
              value={newLogisticsForm.ubicacionOrigen}
              onChange={(e) => setNewLogisticsForm((prev) => ({ ...prev, ubicacionOrigen: e.target.value }))}
              placeholder="Ej: Camaronera X, Machala"
            />
            <MapPicker
              value={
                newLogisticsForm.origenLat && newLogisticsForm.origenLng
                  ? { lat: newLogisticsForm.origenLat, lng: newLogisticsForm.origenLng, address: newLogisticsForm.ubicacionOrigen }
                  : undefined
              }
              onChange={(location) => {
                setNewLogisticsForm((prev) => ({
                  ...prev,
                  origenLat: location.lat,
                  origenLng: location.lng,
                  ubicacionOrigen: location.address || '',
                }));
              }}
            />
            <TextField
              label="Ubicación de Destino"
              fullWidth
              value={newLogisticsForm.ubicacionDestino}
              onChange={(e) => setNewLogisticsForm((prev) => ({ ...prev, ubicacionDestino: e.target.value }))}
              placeholder="Ej: Muelle de Guayaquil"
            />
            <MapPicker
              value={
                newLogisticsForm.destinoLat && newLogisticsForm.destinoLng
                  ? { lat: newLogisticsForm.destinoLat, lng: newLogisticsForm.destinoLng, address: newLogisticsForm.ubicacionDestino }
                  : undefined
              }
              onChange={(location) => {
                setNewLogisticsForm((prev) => ({
                  ...prev,
                  destinoLat: location.lat,
                  destinoLng: location.lng,
                  ubicacionDestino: location.address || '',
                }));
              }}
            />
            <Stack spacing={1}>
              <Typography variant="subtitle2">Ruta Planificada</Typography>
              
              {/* Mostrar mapa de ruta solo cuando se genera la ruta ideal */}
              {showRouteMap && newLogisticsForm.origenLat && newLogisticsForm.origenLng && 
               newLogisticsForm.destinoLat && newLogisticsForm.destinoLng && (
                <Box sx={{ 
                  border: '1px solid #ddd', 
                  borderRadius: 1, 
                  overflow: 'hidden',
                  mb: 2
                }}>
                  <RouteMap
                    origin={{
                      lat: newLogisticsForm.origenLat,
                      lng: newLogisticsForm.origenLng,
                      address: newLogisticsForm.ubicacionOrigen
                    }}
                    destination={{
                      lat: newLogisticsForm.destinoLat,
                      lng: newLogisticsForm.destinoLng,
                      address: newLogisticsForm.ubicacionDestino
                    }}
                  />
                </Box>
              )}

              <TextField
                label="Descripción de la Ruta"
                fullWidth
                multiline
                minRows={2}
                value={newLogisticsForm.rutaPlanificada}
                helperText="El sistema genera una ruta ideal; edítala si necesitas especificaciones adicionales"
                onChange={(e) => setNewLogisticsForm((prev) => ({ ...prev, rutaPlanificada: e.target.value }))}
                placeholder="Ej: Pasar por la ruta 5, evitar vías no pavimentadas, hora máxima de salida 06:00"
              />
              
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  onClick={handleGenerateRoutePlan}
                  disabled={
                    routePlanLoading ||
                    newLogisticsForm.origenLat === null ||
                    newLogisticsForm.origenLng === null ||
                    newLogisticsForm.destinoLat === null ||
                    newLogisticsForm.destinoLng === null
                  }
                >
                  {routePlanLoading ? <CircularProgress size={18} /> : 'Generar ruta ideal'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setNewLogisticsForm((prev) => ({ ...prev, rutaPlanificada: '' }));
                    setShowRouteMap(false);
                  }}
                >
                  Limpiar descripción
                </Button>
              </Stack>
            </Stack>
            <TextField
              label="Observaciones"
              fullWidth
              multiline
              minRows={2}
              value={newLogisticsForm.observaciones}
              onChange={(e) => setNewLogisticsForm((prev) => ({ ...prev, observaciones: e.target.value }))}
            />
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Adjuntar Documentos
              </Typography>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.gif"
                onChange={(e) => setNewLogisticsForm((prev) => ({ ...prev, archivos: e.target.files }))}
                style={{ width: '100%' }}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormDialog({ open: false })} disabled={formLoading}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSubmitLogistics} disabled={formLoading}>
            {formLoading ? <CircularProgress size={20} /> : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Asignar Vehículo */}
      <Dialog open={assignDialog.open} onClose={() => setAssignDialog({ open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Asignar Vehículo y Chofer</DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Stack spacing={2} mt={1}>
            <TextField
              label="Vehículo (Placa, Modelo)"
              fullWidth
              value={assignForm.vehiculoAsignado}
              onChange={(e) => setAssignForm((prev) => ({ ...prev, vehiculoAsignado: e.target.value }))}
              placeholder="Ej: AUX-123, Toyota Hiadce"
            />
            <TextField
              label="Chofer (Nombre, Cédula)"
              fullWidth
              value={assignForm.choferAsignado}
              onChange={(e) => setAssignForm((prev) => ({ ...prev, choferAsignado: e.target.value }))}
              placeholder="Ej: Juan Pérez, 0965432123"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialog({ open: false })} disabled={formLoading}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleAssignVehicle} disabled={formLoading}>
            Asignar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Registrar Medios */}
      <Dialog open={mediaDialog.open} onClose={() => setMediaDialog({ open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar Medios Utilizados</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Medios (vines, tanques, oxígeno, etc.)"
            fullWidth
            multiline
            minRows={4}
            value={mediaForm.recursosUtilizados}
            onChange={(e) => setMediaForm({ recursosUtilizados: e.target.value })}
            sx={{ mt: 2 }}
            placeholder="Ej: 2 tanques de 500L, 3 bombas de oxígeno, 10 redes de contención"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMediaDialog({ open: false })} disabled={formLoading}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSaveMedia} disabled={formLoading}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Adjuntar Evidencias */}
      <Dialog open={evidenceDialog.open} onClose={() => setEvidenceDialog({ open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Adjuntar Evidencias</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} mt={1}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Evidencia</InputLabel>
              <Select
                label="Tipo de Evidencia"
                value={evidenceForm.tipo}
                onChange={(e) => setEvidenceForm((prev) => ({ ...prev, tipo: e.target.value }))}
              >
                <MenuItem value="carga">Carga del Producto</MenuItem>
                <MenuItem value="transporte">Transporte</MenuItem>
                <MenuItem value="condiciones">Condiciones del Transporte</MenuItem>
              </Select>
            </FormControl>
            
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Capturar Foto
              </Typography>
              <Button
                variant="outlined"
                startIcon={<CameraIcon />}
                onClick={() => setCameraOpen(true)}
                fullWidth
              >
                Tomar Foto
              </Button>
            </Box>

            {capturedFiles.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Fotos Capturadas ({capturedFiles.length})
                </Typography>
                <List dense>
                  {capturedFiles.map((file, index) => (
                    <ListItem
                      key={index}
                      secondaryAction={
                        <IconButton edge="end" onClick={() => handleRemoveCapturedFile(index)}>
                          <CloseIcon />
                        </IconButton>
                      }
                    >
                      <ListItemText primary={file.name} secondary={`${(file.size / 1024).toFixed(2)} KB`} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
            
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                O Seleccionar Archivos
              </Typography>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.gif,.mov,.mp4"
                onChange={(e) => setEvidenceForm((prev) => ({ ...prev, archivos: e.target.files }))}
                style={{ width: '100%' }}
              />
              {evidenceForm.archivos && evidenceForm.archivos.length > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {evidenceForm.archivos.length} archivo(s) seleccionado(s)
                </Typography>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setEvidenceDialog({ open: false });
            setCapturedFiles([]);
          }} disabled={formLoading}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleUploadEvidence} disabled={formLoading}>
            Subir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Cámara */}
      <CameraCapture
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCameraCapture}
      />

      {/* Dialog: Preview de archivos */}
      <Dialog
        open={!!previewFile}
        onClose={() => setPreviewFile(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Previsualización: {previewFile?.file}
        </DialogTitle>
        <DialogContent dividers sx={{ minHeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {previewFile && (
            <Box sx={{ width: '100%' }}>
              {!previewFile.blob ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 500 }}>
                  <CircularProgress />
                </Box>
              ) : /\.pdf$/i.test(previewFile.file) ? (
                <iframe
                  src={previewFile.blob}
                  style={{ width: '100%', height: '600px', border: 'none' }}
                  title="PDF Preview"
                />
              ) : /\.(jpg|jpeg|png|gif|webp)$/i.test(previewFile.file) ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                  <img
                    src={previewFile.blob}
                    alt="Preview"
                    style={{ maxWidth: '100%', maxHeight: 600 }}
                  />
                </Box>
              ) : (
                <Typography>Tipo de archivo no soportado para previsualización</Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {previewFile && (
            <>
              <Button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = `${API_BASE_URL}/logistics/${previewFile.logId}/files/${previewFile.file}`;
                  link.download = previewFile.file;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                Descargar
              </Button>
            </>
          )}
          <Button onClick={() => setPreviewFile(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Tracking Confirmation Dialog */}
      <Dialog open={trackingDialog.open} onClose={handleCancelTracking}>
        <DialogTitle>
          Activar Seguimiento de Ubicación
        </DialogTitle>
        <DialogContent>
          {(trackingError || error) && trackingDialog.open && (
            <Alert severity="error" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
              {trackingError || error}
            </Alert>
          )}
          <Typography>
            Para iniciar el transporte, necesitamos activar el seguimiento de tu ubicación en tiempo real.
            Esto nos permitirá monitorear la ruta del camión y comparar con la ruta ideal planificada.
          </Typography>
          <Typography sx={{ mt: 2, color: 'text.secondary' }}>
            ¿Deseas activar el seguimiento de ubicación?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelTracking} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleConfirmTracking} variant="contained" color="primary" disabled={formLoading}>
            {formLoading ? 'Iniciando...' : 'Activar Seguimiento'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}