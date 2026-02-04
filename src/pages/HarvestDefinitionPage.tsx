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
  Grid,
  InputLabel,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  Paper,
  MenuItem,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { apiService } from '../services/api.service';

interface Order {
  id: number;
  codigo: string;
  provider: { name: string };
  packager?: { name: string };
  cantidadPedida: number;
  tallaEstimada: string;
  fechaTentativaCosecha?: string;
  fechaDefinitivaCosecha?: string;
  laboratorio?: any;
}

interface Harvest {
  id: number;
  orderId: number;
  estado: string;
  cantidadEstimada?: number;
  cantidadFinal?: number;
  fechaEstimada?: string;
  fechaDefinitiva?: string;
  calidadEsperada?: string;
  condicionesCosecha?: string;
  observaciones?: string;
  order: Order;
}

const estadoColor = (estado: string): 'default' | 'warning' | 'info' | 'success' | 'error' => {
  const colors: Record<string, any> = {
    PENDIENTE: 'warning',
    DEFINIDO: 'info',
    APROBADO: 'success',
    RECHAZADO: 'error',
  };
  return colors[estado] || 'default';
};

export default function HarvestDefinitionPage() {
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [definedHarvests, setDefinedHarvests] = useState<Harvest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createDialog, setCreateDialog] = useState({ open: false, order: null as Order | null });
  const [defineDialog, setDefineDialog] = useState({ open: false, harvest: null as Harvest | null });
  const [viewDialog, setViewDialog] = useState({ open: false, harvest: null as Harvest | null });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: '', harvestId: 0 });
  const [rejectDialog, setRejectDialog] = useState({ open: false, harvestId: 0, motivo: '' });

  const [createForm, setCreateForm] = useState({
    orderId: 0,
    cantidadEstimada: 0,
    fechaEstimada: null as Dayjs | null,
    observaciones: '',
  });

  const [defineForm, setDefineForm] = useState({
    cantidadFinal: 0,
    fechaDefinitiva: null as Dayjs | null,
    calidadEsperada: '',
    condicionesCosecha: '',
    temperaturaOptima: 0,
    tiempoMaximoTransporte: 24,
    requerimientosEspeciales: '',
    observaciones: '',
  });

  const [formLoading, setFormLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pendingRes, pendingHarvestsRes, definedHarvestsRes] = await Promise.all([
        apiService.get<any>('/harvest/pending-definition'),
        apiService.get<any>('/harvest?estado=PENDIENTE'),
        apiService.get<any>('/harvest?estado=DEFINIDO'),
      ]);

      setPendingOrders((pendingRes as any)?.data ?? pendingRes ?? []);
      
      // Combinar ambos estados
      const pendingHarvests = (pendingHarvestsRes as any)?.data ?? pendingHarvestsRes ?? [];
      const definedHarvests = (definedHarvestsRes as any)?.data ?? definedHarvestsRes ?? [];
      setDefinedHarvests([...pendingHarvests, ...definedHarvests]);
    } catch (err: any) {
      setError(err?.message || 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateHarvest = (order: Order) => {
    setCreateForm({
      orderId: order.id,
      cantidadEstimada: order.cantidadPedida,
      fechaEstimada: order.fechaTentativaCosecha ? dayjs(order.fechaTentativaCosecha) : null,
      observaciones: '',
    });
    setCreateDialog({ open: true, order });
  };

  const handleSubmitCreate = async () => {
    if (!createForm.orderId) {
      setError('Selecciona un pedido');
      return;
    }

    setFormLoading(true);
    setError(null);
    try {
      const payload = {
        orderId: createForm.orderId,
        cantidadEstimada: createForm.cantidadEstimada,
        fechaEstimada: createForm.fechaEstimada?.toISOString(),
        observaciones: createForm.observaciones || undefined,
      };

      await apiService.post('/harvest', payload);
      setCreateDialog({ open: false, order: null });
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Error al crear definición de cosecha');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDefineHarvest = (harvest: Harvest) => {
    setDefineForm({
      cantidadFinal: harvest.cantidadEstimada || harvest.order.cantidadPedida,
      fechaDefinitiva: harvest.fechaEstimada
        ? dayjs(harvest.fechaEstimada)
        : harvest.order.fechaTentativaCosecha
        ? dayjs(harvest.order.fechaTentativaCosecha)
        : null,
      calidadEsperada: '',
      condicionesCosecha: '',
      temperaturaOptima: 4,
      tiempoMaximoTransporte: 24,
      requerimientosEspeciales: '',
      observaciones: harvest.observaciones || '',
    });
    setDefineDialog({ open: true, harvest });
  };

  const handleSubmitDefine = async () => {
    if (!defineDialog.harvest) return;

    if (!defineForm.cantidadFinal || !defineForm.fechaDefinitiva) {
      setError('Cantidad y fecha definitiva son obligatorias');
      return;
    }

    setFormLoading(true);
    setError(null);
    try {
      const payload = {
        cantidadFinal: defineForm.cantidadFinal,
        fechaDefinitiva: defineForm.fechaDefinitiva.toISOString(),
        calidadEsperada: defineForm.calidadEsperada || undefined,
        condicionesCosecha: defineForm.condicionesCosecha || undefined,
        temperaturaOptima: defineForm.temperaturaOptima || undefined,
        tiempoMaximoTransporte: defineForm.tiempoMaximoTransporte || undefined,
        requerimientosEspeciales: defineForm.requerimientosEspeciales || undefined,
        observaciones: defineForm.observaciones || undefined,
      };

      await apiService.post(`/harvest/${defineDialog.harvest.id}/define-harvest`, payload);
      setDefineDialog({ open: false, harvest: null });
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Error al definir cosecha');
    } finally {
      setFormLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    setConfirmDialog({ open: true, action: 'approve', harvestId: id });
  };

  const handleApproveConfirm = async () => {
    setFormLoading(true);
    try {
      await apiService.patch(`/harvest/${confirmDialog.harvestId}/approve`, {});
      setConfirmDialog({ open: false, action: '', harvestId: 0 });
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Error al aprobar');
    } finally {
      setFormLoading(false);
    }
  };

  const handleReject = async (id: number) => {
    setRejectDialog({ open: true, harvestId: id, motivo: '' });
  };

  const handleRejectConfirm = async () => {
    if (!rejectDialog.motivo.trim()) {
      setError('El motivo del rechazo es obligatorio');
      return;
    }

    setFormLoading(true);
    try {
      await apiService.patch(`/harvest/${rejectDialog.harvestId}/reject`, { motivo: rejectDialog.motivo });
      setRejectDialog({ open: false, harvestId: 0, motivo: '' });
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Error al rechazar');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">Definición de Cosecha</Typography>
      </Stack>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Pedidos pendientes */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardHeader title="Pedidos sin Definir" />
            <CardContent>
              {loading ? (
                <CircularProgress />
              ) : pendingOrders.length === 0 ? (
                <Typography color="text.secondary">No hay pedidos pendientes</Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Código</TableCell>
                        <TableCell>Proveedor</TableCell>
                        <TableCell>Cantidad</TableCell>
                        <TableCell>Fecha Tentativa</TableCell>
                        <TableCell>Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pendingOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>{order.codigo}</TableCell>
                          <TableCell>{order.provider?.name}</TableCell>
                          <TableCell>{order.cantidadPedida} lb</TableCell>
                          <TableCell>
                            {order.fechaTentativaCosecha
                              ? dayjs(order.fechaTentativaCosecha).format('DD/MM/YYYY')
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <Button size="small" onClick={() => handleCreateHarvest(order)}>
                              Asignar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Cosechas en proceso */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardHeader title="Definiciones en Proceso" />
            <CardContent>
              {loading ? (
                <CircularProgress />
              ) : definedHarvests.length === 0 ? (
                <Typography color="text.secondary">No hay definiciones en proceso</Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Código</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell>Cantidad</TableCell>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {definedHarvests.map((harvest) => (
                        <TableRow key={harvest.id}>
                          <TableCell>{harvest.order.codigo}</TableCell>
                          <TableCell>
                            <Chip label={harvest.estado} color={estadoColor(harvest.estado)} size="small" />
                          </TableCell>
                          <TableCell>
                            {harvest.cantidadFinal || harvest.cantidadEstimada || '-'} lb
                          </TableCell>
                          <TableCell>
                            {harvest.fechaDefinitiva
                              ? dayjs(harvest.fechaDefinitiva).format('DD/MM/YYYY')
                              : harvest.fechaEstimada
                              ? dayjs(harvest.fechaEstimada).format('DD/MM/YYYY')
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              {harvest.estado === 'PENDIENTE' && (
                                <Button size="small" onClick={() => handleDefineHarvest(harvest)}>
                                  Definir
                                </Button>
                              )}
                              {harvest.estado === 'DEFINIDO' && (
                                <>
                                  <Button size="small" color="success" onClick={() => handleApprove(harvest.id)}>
                                    Aprobar
                                  </Button>
                                  <Button size="small" color="error" onClick={() => handleReject(harvest.id)}>
                                    Rechazar
                                  </Button>
                                </>
                              )}
                              <Button size="small" onClick={() => setViewDialog({ open: true, harvest })}>
                                Ver
                              </Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog: Crear definición */}
      <Dialog open={createDialog.open} onClose={() => setCreateDialog({ open: false, order: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Asignar Definición de Cosecha</DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {createDialog.order && (
            <Stack spacing={2} mt={1}>
              <Typography variant="subtitle2">
                Pedido: {createDialog.order.codigo} - {createDialog.order.provider.name}
              </Typography>
              <TextField
                label="Cantidad Estimada (lb)"
                type="number"
                fullWidth
                value={createForm.cantidadEstimada}
                onChange={(e) => setCreateForm({ ...createForm, cantidadEstimada: parseFloat(e.target.value) })}
              />
              <DatePicker
                label="Fecha Estimada de Cosecha"
                value={createForm.fechaEstimada}
                onChange={(date) => setCreateForm({ ...createForm, fechaEstimada: date })}
                slotProps={{ textField: { fullWidth: true } }}
              />
              <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
                Fecha tentativa original: {createDialog.order.fechaTentativaCosecha
                  ? dayjs(createDialog.order.fechaTentativaCosecha).format('DD/MM/YYYY')
                  : 'No definida'}
              </Alert>
              <TextField
                label="Observaciones"
                multiline
                minRows={2}
                fullWidth
                value={createForm.observaciones}
                onChange={(e) => setCreateForm({ ...createForm, observaciones: e.target.value })}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog({ open: false, order: null })} disabled={formLoading}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSubmitCreate} disabled={formLoading}>
            {formLoading ? <CircularProgress size={20} /> : 'Asignar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Definir cosecha */}
      <Dialog open={defineDialog.open} onClose={() => setDefineDialog({ open: false, harvest: null })} maxWidth="md" fullWidth>
        <DialogTitle>Definir Cosecha</DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {defineDialog.harvest && (
            <Stack spacing={2} mt={1}>
              <Typography variant="subtitle2">
                Pedido: {defineDialog.harvest.order.codigo} - {defineDialog.harvest.order.provider.name}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Cantidad Final (lb)"
                    type="number"
                    fullWidth
                    required
                    value={defineForm.cantidadFinal}
                    onChange={(e) => setDefineForm({ ...defineForm, cantidadFinal: parseFloat(e.target.value) })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Fecha Definitiva de Cosecha"
                    value={defineForm.fechaDefinitiva}
                    onChange={(date) => setDefineForm({ ...defineForm, fechaDefinitiva: date })}
                    slotProps={{ textField: { fullWidth: true, required: true } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
                    Fecha estimada original: {defineDialog.harvest.fechaEstimada
                      ? dayjs(defineDialog.harvest.fechaEstimada).format('DD/MM/YYYY')
                      : defineDialog.harvest.order.fechaTentativaCosecha
                      ? dayjs(defineDialog.harvest.order.fechaTentativaCosecha).format('DD/MM/YYYY')
                      : 'No definida'}
                  </Alert>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Temperatura Óptima (°C)"
                    type="number"
                    fullWidth
                    value={defineForm.temperaturaOptima}
                    onChange={(e) => setDefineForm({ ...defineForm, temperaturaOptima: parseFloat(e.target.value) })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Tiempo Máximo Transporte (hrs)"
                    type="number"
                    fullWidth
                    value={defineForm.tiempoMaximoTransporte}
                    onChange={(e) => setDefineForm({ ...defineForm, tiempoMaximoTransporte: parseInt(e.target.value) })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Calidad Esperada"
                    fullWidth
                    value={defineForm.calidadEsperada}
                    onChange={(e) => setDefineForm({ ...defineForm, calidadEsperada: e.target.value })}
                    placeholder="Ej: Producto fresco, sin defectos"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Condiciones de Cosecha"
                    multiline
                    minRows={2}
                    fullWidth
                    value={defineForm.condicionesCosecha}
                    onChange={(e) => setDefineForm({ ...defineForm, condicionesCosecha: e.target.value })}
                    placeholder="Ej: Cosecha en horas de la mañana, evitar altas temperaturas"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Requerimientos Especiales"
                    multiline
                    minRows={2}
                    fullWidth
                    value={defineForm.requerimientosEspeciales}
                    onChange={(e) => setDefineForm({ ...defineForm, requerimientosEspeciales: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Observaciones"
                    multiline
                    minRows={2}
                    fullWidth
                    value={defineForm.observaciones}
                    onChange={(e) => setDefineForm({ ...defineForm, observaciones: e.target.value })}
                  />
                </Grid>
              </Grid>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDefineDialog({ open: false, harvest: null })} disabled={formLoading}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSubmitDefine} disabled={formLoading}>
            {formLoading ? <CircularProgress size={20} /> : 'Definir Cosecha'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Ver detalles */}
      <Dialog open={viewDialog.open} onClose={() => setViewDialog({ open: false, harvest: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Detalles de Cosecha</DialogTitle>
        <DialogContent dividers>
          {viewDialog.harvest && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Pedido</Typography>
                <Typography>{viewDialog.harvest.order.codigo}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Estado</Typography>
                <Chip label={viewDialog.harvest.estado} color={estadoColor(viewDialog.harvest.estado)} size="small" />
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Cantidad</Typography>
                <Typography>
                  {viewDialog.harvest.cantidadFinal
                    ? `${viewDialog.harvest.cantidadFinal} lb (definitiva)`
                    : viewDialog.harvest.cantidadEstimada
                    ? `${viewDialog.harvest.cantidadEstimada} lb (estimada)`
                    : '-'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Fecha</Typography>
                <Typography>
                  {viewDialog.harvest.fechaDefinitiva
                    ? `${dayjs(viewDialog.harvest.fechaDefinitiva).format('DD/MM/YYYY')} (definitiva)`
                    : viewDialog.harvest.fechaEstimada
                    ? `${dayjs(viewDialog.harvest.fechaEstimada).format('DD/MM/YYYY')} (estimada)`
                    : '-'}
                </Typography>
              </Box>
              {viewDialog.harvest.calidadEsperada && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Calidad Esperada</Typography>
                  <Typography>{viewDialog.harvest.calidadEsperada}</Typography>
                </Box>
              )}
              {viewDialog.harvest.condicionesCosecha && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Condiciones</Typography>
                  <Typography>{viewDialog.harvest.condicionesCosecha}</Typography>
                </Box>
              )}
              {viewDialog.harvest.observaciones && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Observaciones</Typography>
                  <Typography>{viewDialog.harvest.observaciones}</Typography>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog({ open: false, harvest: null })}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para confirmar aprobación */}
      <Dialog 
        open={confirmDialog.open} 
        onClose={() => setConfirmDialog({ open: false, action: '', harvestId: 0 })}
      >
        <DialogTitle>Confirmar Aprobación</DialogTitle>
        <DialogContent>
          <Typography>¿Estás seguro de que deseas aprobar esta definición de cosecha?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, action: '', harvestId: 0 })}>
            Cancelar
          </Button>
          <Button 
            onClick={handleApproveConfirm} 
            variant="contained" 
            disabled={formLoading}
          >
            {formLoading ? <CircularProgress size={20} /> : 'Aprobar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para rechazar con motivo */}
      <Dialog 
        open={rejectDialog.open} 
        onClose={() => setRejectDialog({ open: false, harvestId: 0, motivo: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Rechazar Definición de Cosecha</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Motivo del rechazo"
            multiline
            minRows={3}
            value={rejectDialog.motivo}
            onChange={(e) => setRejectDialog({ ...rejectDialog, motivo: e.target.value })}
            placeholder="Explica por qué se rechaza esta definición..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog({ open: false, harvestId: 0, motivo: '' })}>
            Cancelar
          </Button>
          <Button 
            onClick={handleRejectConfirm} 
            variant="contained" 
            color="error"
            disabled={formLoading || !rejectDialog.motivo.trim()}
          >
            {formLoading ? <CircularProgress size={20} /> : 'Rechazar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
