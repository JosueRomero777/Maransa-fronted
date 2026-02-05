import React, { useEffect, useState } from 'react'
import { API_BASE_URL } from '../config/api.config'
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@mui/material'
import {
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  CheckCircle as ApproveIcon,
  Block as RejectIcon,
  Refresh as ReevaluateIcon,
  Edit as EditIcon,
  Upload as UploadIcon,
  CameraAlt as CameraIcon,
} from '@mui/icons-material'
import { laboratoryService, type Laboratory, EstadoLaboratorio } from '../services/laboratory.service'
import { apiService } from '../services/api.service'
import CameraCapture from '../components/CameraCapture'

interface OrderOption {
  id: number
  codigo: string
  providerName?: string
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`lab-tabpanel-${index}`}
      aria-labelledby={`lab-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  )
}

type EstadoVisual = EstadoLaboratorio | 'DESCARTADO'

const estadoColor = (estado: EstadoVisual) => {
  switch (estado) {
    case EstadoLaboratorio.PENDIENTE:
      return 'default'
    case EstadoLaboratorio.APROBADO:
      return 'success'
    case EstadoLaboratorio.RECHAZADO:
      return 'error'
    case EstadoLaboratorio.EN_ESPERA:
      return 'warning'
    case 'DESCARTADO':
      return 'default'
    default:
      return 'default'
  }
}

type FiltroEstado = EstadoLaboratorio | 'DESCARTADO' | ''

const LaboratoryPage: React.FC = () => {
  const [items, setItems] = useState<Laboratory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterEstado, setFilterEstado] = useState<FiltroEstado>('')
  const [selectedLab, setSelectedLab] = useState<Laboratory | null>(null)
  const [tabValue, setTabValue] = useState(0)
  const [previewFile, setPreviewFile] = useState<{ file: string; labId: number; blob?: string } | null>(null)

  useEffect(() => {
    if (previewFile && !previewFile.blob) {
      const loadFile = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${API_BASE_URL}/laboratory/${previewFile.labId}/files/${previewFile.file}`, {
            headers: {
              ...(token && { 'Authorization': `Bearer ${token}` }),
            },
          });
          if (response.ok) {
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            setPreviewFile({ ...previewFile, blob: blobUrl });
          }
        } catch (error) {
          console.error('Error cargando archivo:', error);
        }
      };
      loadFile();
    }
  }, [previewFile]);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean
    action?: 'approve' | 'reject' | 'reevaluate' | 'discard'
    lab?: Laboratory
  }>({ open: false })

  // Formularios de acciones
  const [approveForm, setApproveForm] = useState({ observaciones: '' })
  const [rejectForm, setRejectForm] = useState({ motivoRechazo: '', observaciones: '' })
  const [reevaluateForm, setReevaluateForm] = useState({
    nuevasObservaciones: '',
    nuevosParametros: '',
    files: null as FileList | null,
  })
  const [discardForm, setDiscardForm] = useState({ justificacion: '' })
  const [actionLoading, setActionLoading] = useState(false)

  // Formularios para editar y añadir archivos
  const [editDialog, setEditDialog] = useState({ open: false })
  const [editForm, setEditForm] = useState({
    olor: '',
    sabor: '',
    textura: '',
    apariencia: '',
    parametrosQuimicos: '',
    resultadoGeneral: '',
    observaciones: '',
  })
  const [addFilesDialog, setAddFilesDialog] = useState({ open: false })
  const [newFiles, setNewFiles] = useState<FileList | null>(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [capturedFiles, setCapturedFiles] = useState<File[]>([])

  // Formulario para crear/actualizar informe
  const [formDialog, setFormDialog] = useState({ open: false })
  const [ordersOptions, setOrdersOptions] = useState<OrderOption[]>([])
  const [formLoading, setFormLoading] = useState(false)
  const [reportForm, setReportForm] = useState({
    orderId: '' as number | '',
    olor: '',
    sabor: '',
    textura: '',
    apariencia: '',
    parametrosQuimicos: '',
    resultadoGeneral: '',
    observaciones: '',
    files: null as FileList | null,
  })

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await laboratoryService.listLaboratories(
        filterEstado && filterEstado !== 'DESCARTADO' ? { estado: filterEstado as EstadoLaboratorio } : undefined
      )

      let cleaned = list

      if (filterEstado === 'DESCARTADO') {
        cleaned = list.filter((lab) => lab.order?.estado === 'CANCELADO')
      } else {
        cleaned = list.filter((lab) => lab.order?.estado !== 'CANCELADO')
      }
      setItems(cleaned)
      // Si el seleccionado ya no está en la lista (ej. descartado), limpiarlo
      if (selectedLab && !cleaned.find((l) => l.id === selectedLab.id)) {
        setSelectedLab(null)
      }
    } catch (err: any) {
      setError(err?.message || 'Error al cargar laboratorio')
    } finally {
      setLoading(false)
    }
  }

  const loadOrders = async () => {
    try {
      const response = await apiService.get<any>('/orders?limit=100&page=1')
      const ordersData = Array.isArray(response?.orders)
        ? response.orders
        : Array.isArray(response?.data)
          ? response.data
          : []

      const allowedOrders = ordersData.filter((o: any) => o.estado === 'CREADO')

      setOrdersOptions(
        allowedOrders.map((o: any) => ({
          id: o.id,
          codigo: o.codigo,
          providerName: o.provider?.name,
        }))
      )
    } catch (err) {
      console.error('Error cargando órdenes', err)
    }
  }

  useEffect(() => {
    loadData()
  }, [filterEstado])

  useEffect(() => {
    loadOrders()
  }, [])

  const handleCreateNew = () => {
    setReportForm({
      orderId: '',
      olor: '',
      sabor: '',
      textura: '',
      apariencia: '',
      parametrosQuimicos: '',
      resultadoGeneral: '',
      observaciones: '',
      files: null,
    })
    setFormDialog({ open: true })
  }

  const handleSubmitReport = async () => {
    if (reportForm.orderId === '') {
      setError('Selecciona una orden')
      return
    }

    setFormLoading(true)
    setError(null)
    try {
      const dto = {
        orderId: Number(reportForm.orderId),
        olor: reportForm.olor || undefined,
        sabor: reportForm.sabor || undefined,
        textura: reportForm.textura || undefined,
        apariencia: reportForm.apariencia || undefined,
        parametrosQuimicos: reportForm.parametrosQuimicos || undefined,
        resultadoGeneral: reportForm.resultadoGeneral || undefined,
        observaciones: reportForm.observaciones || undefined,
      }

      await laboratoryService.createLaboratory(dto, reportForm.files)
      setFormDialog({ open: false })
      setReportForm({
        orderId: '',
        olor: '',
        sabor: '',
        textura: '',
        apariencia: '',
        parametrosQuimicos: '',
        resultadoGeneral: '',
        observaciones: '',
        files: null,
      })
      await loadData()
    } catch (err: any) {
      setError(err?.message || 'Error al crear informe')
    } finally {
      setFormLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!selectedLab) return
    
    // Validar que tenga archivos adjuntos
    if (!selectedLab.archivosAdjuntos || selectedLab.archivosAdjuntos.length === 0) {
      setError('Debe adjuntar al menos un archivo antes de aprobar el análisis')
      return
    }
    
    setActionLoading(true)
    setError(null)
    try {
      await laboratoryService.approve(selectedLab.id, approveForm.observaciones)
      setActionDialog({ open: false })
      setApproveForm({ observaciones: '' })
      await loadData()
      setSelectedLab(null)
    } catch (err: any) {
      setError(err?.message || 'Error al aprobar')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!selectedLab) return
    
    // Validar que tenga archivos adjuntos
    if (!selectedLab.archivosAdjuntos || selectedLab.archivosAdjuntos.length === 0) {
      setError('Debe adjuntar al menos un archivo antes de rechazar el análisis')
      return
    }
    
    setActionLoading(true)
    setError(null)
    try {
      await laboratoryService.reject(selectedLab.id, rejectForm.motivoRechazo, rejectForm.observaciones)
      setActionDialog({ open: false })
      setRejectForm({ motivoRechazo: '', observaciones: '' })
      await loadData()
      setSelectedLab(null)
    } catch (err: any) {
      setError(err?.message || 'Error al rechazar')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReevaluate = async () => {
    if (!selectedLab) return
    setActionLoading(true)
    setError(null)
    try {
      // Parsear nuevosParametros como JSON si es válido
      let nuevosParametros: any = undefined
      if (reevaluateForm.nuevosParametros.trim()) {
        try {
          nuevosParametros = JSON.parse(reevaluateForm.nuevosParametros)
        } catch {
          // Si no es JSON válido, intentar como objeto simple
          nuevosParametros = { valor: reevaluateForm.nuevosParametros }
        }
      }

      const dto = {
        nuevasObservaciones: reevaluateForm.nuevasObservaciones,
        nuevosParametros,
      }
      await laboratoryService.requestReevaluation(selectedLab.id, dto, reevaluateForm.files)
      setActionDialog({ open: false })
      setReevaluateForm({ nuevasObservaciones: '', nuevosParametros: '', files: null })
      await loadData()
      setSelectedLab(null)
    } catch (err: any) {
      setError(err?.message || 'Error al solicitar reevaluación')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDiscard = async () => {
    if (!selectedLab) return
    setActionLoading(true)
    setError(null)
    try {
      await laboratoryService.discardOrder(selectedLab.id, discardForm.justificacion)
      setActionDialog({ open: false })
      setDiscardForm({ justificacion: '' })
      await loadData()
      setSelectedLab(null)
    } catch (err: any) {
      setError(err?.message || 'Error al descartar pedido')
    } finally {
      setActionLoading(false)
    }
  }

  const handleEditOpen = () => {
    if (!selectedLab) return
    setEditForm({
      olor: selectedLab.olor || '',
      sabor: selectedLab.sabor || '',
      textura: selectedLab.textura || '',
      apariencia: selectedLab.apariencia || '',
      parametrosQuimicos: selectedLab.parametrosQuimicos || '',
      resultadoGeneral: selectedLab.resultadoGeneral || '',
      observaciones: selectedLab.observaciones || '',
    })
    setEditDialog({ open: true })
  }

  const handleSaveEdit = async () => {
    if (!selectedLab) return
    setActionLoading(true)
    setError(null)
    try {
      await laboratoryService.updateLaboratory(selectedLab.id, editForm)
      setEditDialog({ open: false })
      await loadData()
      // Actualizar el laboratorio seleccionado
      const updated = await laboratoryService.getById(selectedLab.id)
      setSelectedLab(updated)
    } catch (err: any) {
      setError(err?.message || 'Error al actualizar informe')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddFilesOpen = () => {
    if (!selectedLab) return
    setNewFiles(null)
    setCapturedFiles([])
    setAddFilesDialog({ open: true })
  }

  const handleAddFiles = async () => {
    if (!selectedLab) return
    
    // Combinar archivos capturados con archivos subidos
    const allFiles: File[] = [...capturedFiles]
    if (newFiles) {
      allFiles.push(...Array.from(newFiles))
    }

    if (allFiles.length === 0) {
      setError('Debe seleccionar o capturar al menos un archivo')
      return
    }
    
    setActionLoading(true)
    setError(null)
    try {
      // Convertir array de Files a FileList
      const dataTransfer = new DataTransfer()
      allFiles.forEach(file => dataTransfer.items.add(file))
      const fileList = dataTransfer.files
      
      await laboratoryService.addFilesToLaboratory(selectedLab.id, fileList)
      setAddFilesDialog({ open: false })
      setNewFiles(null)
      setCapturedFiles([])
      await loadData()
      // Actualizar el laboratorio seleccionado
      const updated = await laboratoryService.getById(selectedLab.id)
      setSelectedLab(updated)
    } catch (err: any) {
      setError(err?.message || 'Error al agregar archivos')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCameraCapture = (file: File) => {
    setCapturedFiles(prev => [...prev, file])
  }

  const handleRemoveCapturedFile = (index: number) => {
    setCapturedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const canReevaluate = selectedLab && selectedLab.estado === EstadoLaboratorio.RECHAZADO
  const canApprove = selectedLab && [EstadoLaboratorio.PENDIENTE, EstadoLaboratorio.EN_ESPERA].includes(selectedLab.estado as any)
  const canReject = selectedLab && [EstadoLaboratorio.PENDIENTE, EstadoLaboratorio.EN_ESPERA].includes(selectedLab.estado as any)
  const canDiscard = selectedLab && [EstadoLaboratorio.RECHAZADO, EstadoLaboratorio.EN_ESPERA].includes(selectedLab.estado as any)
  const canEdit = selectedLab && [EstadoLaboratorio.PENDIENTE, EstadoLaboratorio.EN_ESPERA].includes(selectedLab.estado as any)

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Módulo de Informes de Laboratorio
        </Typography>
        <Button variant="contained" onClick={handleCreateNew}>
          Nuevo Informe
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Estado</InputLabel>
            <Select
              value={filterEstado}
              label="Estado"
              onChange={(e) => setFilterEstado(e.target.value as FiltroEstado)}
            >
              <MenuItem value="">Todos</MenuItem>
              {Object.values(EstadoLaboratorio).map((st) => (
                <MenuItem key={st} value={st}>
                  {st.replace(/_/g, ' ')}
                </MenuItem>
              ))}
              <MenuItem value="DESCARTADO">Descartados</MenuItem>
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* Lista de informes */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={selectedLab ? 6 : 12}>
          {loading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2}>
              {items.map((lab) => {
                const visualEstado: EstadoVisual = lab.order?.estado === 'CANCELADO' ? 'DESCARTADO' : lab.estado
                return (
                <Grid item xs={12} sm={selectedLab ? 12 : 6} md={selectedLab ? 12 : 6} lg={selectedLab ? 6 : 4} key={lab.id}>
                  <Card
                    onClick={() => setSelectedLab(lab)}
                    sx={{
                      cursor: 'pointer',
                      border: selectedLab?.id === lab.id ? '2px solid' : '1px solid #e0e0e0',
                      borderColor: selectedLab?.id === lab.id ? 'primary.main' : 'inherit',
                      backgroundColor: selectedLab?.id === lab.id ? 'action.selected' : 'inherit',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: 2,
                      }
                    }}
                  >
                    <CardHeader
                      title={`Orden ${lab.order?.codigo || lab.orderId}`}
                      subheader={lab.order?.provider?.name}
                      action={<Chip label={visualEstado} color={estadoColor(visualEstado) as any} />}
                    />
                    <CardContent>
                      <Stack spacing={1}>
                        <Typography variant="body2">
                          <strong>Olor:</strong> {lab.olor || '-'}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Sabor:</strong> {lab.sabor || '-'}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Textura:</strong> {lab.textura || '-'}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Apariencia:</strong> {lab.apariencia || '-'}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Archivos:</strong> {lab.archivosAdjuntos?.length || 0}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
                )
              })}
              {!items.length && (
                <Grid item xs={12}>
                  <Alert severity="info">No hay informes de laboratorio</Alert>
                </Grid>
              )}
            </Grid>
          )}
        </Grid>

        {/* Detalle de informe seleccionado */}
        {selectedLab && (
          <Grid item xs={12} md={6}>
            <Card sx={{ position: 'sticky', top: 20 }}>
              <CardHeader
                title={`Detalle - Orden ${selectedLab.order?.codigo}`}
                action={
                  <IconButton size="small" onClick={() => setSelectedLab(null)}>
                    <CloseIcon />
                  </IconButton>
                }
              />
              <Divider />
              <CardContent>
                <Tabs
                  value={tabValue}
                  onChange={(_, newValue) => setTabValue(newValue)}
                  variant="fullWidth"
                  sx={{ mb: 2 }}
                >
                  <Tab label="Información" id="lab-tab-0" />
                  <Tab label="Observaciones" id="lab-tab-1" />
                  <Tab label="Archivos" id="lab-tab-2" />
                  <Tab label="Acciones" id="lab-tab-3" />
                </Tabs>

                {/* Tab 0: Información */}
                <TabPanel value={tabValue} index={0}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2">Estado</Typography>
                      {(() => {
                        const visualEstado: EstadoVisual = selectedLab.order?.estado === 'CANCELADO' ? 'DESCARTADO' : selectedLab.estado
                        return <Chip label={visualEstado} color={estadoColor(visualEstado) as any} />
                      })()}
                    </Box>
                    <Box>
                      <Typography variant="subtitle2">Proveedor</Typography>
                      <Typography variant="body2">{selectedLab.order?.provider?.name}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2">Características Sensoriales</Typography>
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell>Olor</TableCell>
                            <TableCell>{selectedLab.olor || '-'}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Sabor</TableCell>
                            <TableCell>{selectedLab.sabor || '-'}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Textura</TableCell>
                            <TableCell>{selectedLab.textura || '-'}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Apariencia</TableCell>
                            <TableCell>{selectedLab.apariencia || '-'}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2">Parámetros Químicos</Typography>
                      <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', backgroundColor: '#f5f5f5', p: 1, borderRadius: 1 }}>
                        {typeof selectedLab.parametrosQuimicos === 'object'
                          ? JSON.stringify(selectedLab.parametrosQuimicos, null, 2)
                          : selectedLab.parametrosQuimicos || '-'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2">Resultado General</Typography>
                      <Typography variant="body2">{selectedLab.resultadoGeneral || '-'}</Typography>
                    </Box>
                    {canEdit && (
                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="outlined"
                          color="primary"
                          startIcon={<EditIcon />}
                          onClick={handleEditOpen}
                        >
                          Editar Informe
                        </Button>
                      </Box>
                    )}
                  </Stack>
                </TabPanel>

                {/* Tab 1: Observaciones */}
                <TabPanel value={tabValue} index={1}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2">Observaciones Técnicas</Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', backgroundColor: '#f5f5f5', p: 1, borderRadius: 1 }}>
                        {selectedLab.observaciones || 'Sin observaciones'}
                      </Typography>
                    </Box>
                    {selectedLab.estado === EstadoLaboratorio.RECHAZADO && (
                      <Box sx={{ backgroundColor: '#ffebee', p: 2, borderRadius: 1 }}>
                        <Typography variant="subtitle2" sx={{ color: '#c62828' }}>
                          Motivo de Rechazo
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#c62828', whiteSpace: 'pre-wrap' }}>
                          {selectedLab.motivoRechazo || '-'}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </TabPanel>

                {/* Tab 2: Archivos */}
                <TabPanel value={tabValue} index={2}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Archivos Adjuntos ({selectedLab.archivosAdjuntos?.length || 0})
                      </Typography>
                      {selectedLab.archivosAdjuntos && selectedLab.archivosAdjuntos.length > 0 ? (
                        <List>
                          {selectedLab.archivosAdjuntos.map((file, idx) => {
                            // Extraer solo el nombre del archivo, manejando tanto / como \
                            const fileName = file.includes('/') 
                              ? file.split('/').pop() 
                              : file.includes('\\') 
                                ? file.split('\\').pop() 
                                : file;
                            console.log('Archivo original:', file, 'Nombre extraído:', fileName);
                            const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName || '');
                            const isPdf = /\.pdf$/i.test(fileName || '');
                            return (
                              <ListItem key={idx} sx={{ py: 0.5 }}>
                                <ListItemText
                                  primary={fileName}
                                  primaryTypographyProps={{ variant: 'body2' }}
                                />
                                <Tooltip title={isImage || isPdf ? "Vista previa" : "Descargar"}>
                                  <IconButton 
                                    size="small" 
                                    color="primary"
                                    onClick={() => {
                                      if (isImage || isPdf) {
                                        setPreviewFile({ file: fileName || '', labId: selectedLab.id });
                                      } else {
                                        window.open(`${API_BASE_URL}/laboratory/${selectedLab.id}/files/${fileName}`, '_blank');
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
                          Sin archivos
                        </Typography>
                      )}
                    </Box>
                    {selectedLab.estado === EstadoLaboratorio.APROBADO && selectedLab.evidenciasAprobacion && selectedLab.evidenciasAprobacion.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Evidencias de Aprobación ({selectedLab.evidenciasAprobacion.length})
                        </Typography>
                        <List>
                          {selectedLab.evidenciasAprobacion.map((file, idx) => (
                            <ListItem key={idx} sx={{ py: 0.5 }}>
                              <ListItemText
                                primary={file.split('/').pop()}
                                primaryTypographyProps={{ variant: 'body2' }}
                              />
                              <Tooltip title="Descargar">
                                <IconButton size="small" color="primary">
                                  <DownloadIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </Stack>
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<UploadIcon />}
                      onClick={handleAddFilesOpen}
                    >
                      Agregar Archivos
                    </Button>
                  </Box>
                </TabPanel>

                {/* Tab 3: Acciones */}
                <TabPanel value={tabValue} index={3}>
                  <Stack spacing={2}>
                    {canApprove && (
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<ApproveIcon />}
                        onClick={() => setActionDialog({ open: true, action: 'approve', lab: selectedLab })}
                      >
                        Aprobar Muestra
                      </Button>
                    )}
                    {canReject && (
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<RejectIcon />}
                        onClick={() => setActionDialog({ open: true, action: 'reject', lab: selectedLab })}
                      >
                        Rechazar Muestra
                      </Button>
                    )}
                    {canReevaluate && (
                      <Button
                        variant="outlined"
                        color="warning"
                        startIcon={<ReevaluateIcon />}
                        onClick={() => setActionDialog({ open: true, action: 'reevaluate', lab: selectedLab })}
                      >
                        Solicitar Reevaluación
                      </Button>
                    )}
                    {canDiscard && (
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => setActionDialog({ open: true, action: 'discard', lab: selectedLab })}
                      >
                        Descartar Pedido
                      </Button>
                    )}
                    {!canApprove && !canReject && !canReevaluate && !canDiscard && (
                      <Alert severity="info">
                        No hay acciones disponibles para este estado
                      </Alert>
                    )}
                  </Stack>
                </TabPanel>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Dialog: Crear nuevo informe */}
      <Dialog open={formDialog.open} onClose={() => setFormDialog({ open: false })} maxWidth="md" fullWidth>
        <DialogTitle>Nuevo Informe de Laboratorio</DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
          <Grid container spacing={2} mt={1}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Orden</InputLabel>
                <Select
                  label="Orden"
                  value={reportForm.orderId === '' ? '' : reportForm.orderId}
                  onChange={(e) =>
                    setReportForm((prev) => ({
                      ...prev,
                      orderId: e.target.value === '' ? '' : Number(e.target.value),
                    }))
                  }
                >
                  <MenuItem value="">Selecciona una orden</MenuItem>
                  {ordersOptions.map((o) => (
                    <MenuItem key={o.id} value={o.id}>
                      {o.codigo} - {o.providerName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Olor"
                fullWidth
                value={reportForm.olor}
                onChange={(e) => setReportForm((prev) => ({ ...prev, olor: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Sabor"
                fullWidth
                value={reportForm.sabor}
                onChange={(e) => setReportForm((prev) => ({ ...prev, sabor: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Textura"
                fullWidth
                value={reportForm.textura}
                onChange={(e) => setReportForm((prev) => ({ ...prev, textura: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Apariencia"
                fullWidth
                value={reportForm.apariencia}
                onChange={(e) => setReportForm((prev) => ({ ...prev, apariencia: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Parámetros Químicos (JSON o texto)"
                fullWidth
                multiline
                minRows={3}
                value={reportForm.parametrosQuimicos}
                onChange={(e) => setReportForm((prev) => ({ ...prev, parametrosQuimicos: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Resultado General"
                fullWidth
                multiline
                minRows={2}
                value={reportForm.resultadoGeneral}
                onChange={(e) => setReportForm((prev) => ({ ...prev, resultadoGeneral: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Observaciones Técnicas"
                fullWidth
                multiline
                minRows={3}
                value={reportForm.observaciones}
                onChange={(e) => setReportForm((prev) => ({ ...prev, observaciones: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Adjuntar Archivos (PDFs, imágenes)
              </Typography>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.gif"
                onChange={(e) => setReportForm((prev) => ({ ...prev, files: e.target.files }))}
                style={{ width: '100%' }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormDialog({ open: false })} disabled={formLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmitReport}
            variant="contained"
            disabled={reportForm.orderId === '' || formLoading}
            startIcon={formLoading ? <CircularProgress size={18} /> : undefined}
          >
            Crear Informe
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Acciones */}
      <Dialog
        open={actionDialog.open}
        onClose={() => setActionDialog({ open: false })}
        maxWidth="sm"
        fullWidth
      >
        {actionDialog.action === 'approve' && (
          <>
            <DialogTitle>Aprobar Muestra</DialogTitle>
            <DialogContent dividers>
              {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
              <TextField
                label="Observaciones (opcional)"
                fullWidth
                multiline
                minRows={3}
                value={approveForm.observaciones}
                onChange={(e) => setApproveForm({ observaciones: e.target.value })}
                sx={{ mt: 1 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setActionDialog({ open: false })} disabled={actionLoading}>
                Cancelar
              </Button>
              <Button
                onClick={handleApprove}
                variant="contained"
                color="success"
                disabled={actionLoading}
                startIcon={actionLoading ? <CircularProgress size={18} /> : undefined}
              >
                Aprobar
              </Button>
            </DialogActions>
          </>
        )}

        {actionDialog.action === 'reject' && (
          <>
            <DialogTitle>Rechazar Muestra</DialogTitle>
            <DialogContent dividers>
              {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
              <TextField
                label="Motivo del Rechazo"
                fullWidth
                multiline
                minRows={3}
                value={rejectForm.motivoRechazo}
                onChange={(e) => setRejectForm((prev) => ({ ...prev, motivoRechazo: e.target.value }))}
                sx={{ mt: 1, mb: 2 }}
                required
              />
              <TextField
                label="Observaciones (opcional)"
                fullWidth
                multiline
                minRows={2}
                value={rejectForm.observaciones}
                onChange={(e) => setRejectForm((prev) => ({ ...prev, observaciones: e.target.value }))}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setActionDialog({ open: false })} disabled={actionLoading}>
                Cancelar
              </Button>
              <Button
                onClick={handleReject}
                variant="contained"
                color="error"
                disabled={!rejectForm.motivoRechazo || actionLoading}
                startIcon={actionLoading ? <CircularProgress size={18} /> : undefined}
              >
                Rechazar
              </Button>
            </DialogActions>
          </>
        )}

        {actionDialog.action === 'reevaluate' && (
          <>
            <DialogTitle>Solicitar Reevaluación</DialogTitle>
            <DialogContent dividers>
              {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
              <Alert severity="info" sx={{ mb: 2 }}>
                Puedes subir nuevos resultados y parámetros para reevaluar esta muestra.
              </Alert>
              <TextField
                label="Nuevas Observaciones"
                fullWidth
                multiline
                minRows={2}
                value={reevaluateForm.nuevasObservaciones}
                onChange={(e) => setReevaluateForm((prev) => ({ ...prev, nuevasObservaciones: e.target.value }))}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Nuevos Parámetros Químicos (JSON o texto libre)"
                fullWidth
                multiline
                minRows={3}
                value={reevaluateForm.nuevosParametros}
                onChange={(e) => setReevaluateForm((prev) => ({ ...prev, nuevosParametros: e.target.value }))}
                sx={{ mb: 2 }}
                helperText='Ej: {"pH": 7.5, "temperatura": 25} o texto libre'
              />
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Adjuntar Nuevos Archivos
              </Typography>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.gif"
                onChange={(e) => setReevaluateForm((prev) => ({ ...prev, files: e.target.files }))}
                style={{ width: '100%' }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setActionDialog({ open: false })} disabled={actionLoading}>
                Cancelar
              </Button>
              <Button
                onClick={handleReevaluate}
                variant="contained"
                color="warning"
                disabled={actionLoading}
                startIcon={actionLoading ? <CircularProgress size={18} /> : undefined}
              >
                Solicitar Reevaluación
              </Button>
            </DialogActions>
          </>
        )}

        {actionDialog.action === 'discard' && (
          <>
            <DialogTitle>Descartar Pedido</DialogTitle>
            <DialogContent dividers>
              {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
              <Alert severity="error" sx={{ mb: 2 }}>
                Esta acción cierra el tracking de este pedido de forma definitiva. Requiere justificación documentada.
              </Alert>
              <TextField
                label="Justificación para descartar"
                fullWidth
                multiline
                minRows={4}
                value={discardForm.justificacion}
                onChange={(e) => setDiscardForm({ justificacion: e.target.value })}
                required
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setActionDialog({ open: false })} disabled={actionLoading}>
                Cancelar
              </Button>
              <Button
                onClick={handleDiscard}
                variant="contained"
                color="error"
                disabled={!discardForm.justificacion || actionLoading}
                startIcon={actionLoading ? <CircularProgress size={18} /> : undefined}
              >
                Descartar Definitivamente
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Dialog: Editar informe */}
      <Dialog
        open={editDialog.open}
        onClose={() => setEditDialog({ open: false })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Editar Informe de Laboratorio</DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Olor"
                fullWidth
                value={editForm.olor}
                onChange={(e) => setEditForm((prev) => ({ ...prev, olor: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Sabor"
                fullWidth
                value={editForm.sabor}
                onChange={(e) => setEditForm((prev) => ({ ...prev, sabor: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Textura"
                fullWidth
                value={editForm.textura}
                onChange={(e) => setEditForm((prev) => ({ ...prev, textura: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Apariencia"
                fullWidth
                value={editForm.apariencia}
                onChange={(e) => setEditForm((prev) => ({ ...prev, apariencia: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Parámetros Químicos"
                fullWidth
                multiline
                minRows={3}
                value={editForm.parametrosQuimicos}
                onChange={(e) => setEditForm((prev) => ({ ...prev, parametrosQuimicos: e.target.value }))}
                helperText="Puede usar JSON para datos estructurados"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Resultado General"
                fullWidth
                multiline
                minRows={2}
                value={editForm.resultadoGeneral}
                onChange={(e) => setEditForm((prev) => ({ ...prev, resultadoGeneral: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Observaciones"
                fullWidth
                multiline
                minRows={3}
                value={editForm.observaciones}
                onChange={(e) => setEditForm((prev) => ({ ...prev, observaciones: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false })} disabled={actionLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={18} /> : undefined}
          >
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Agregar archivos */}
      <Dialog
        open={addFilesDialog.open}
        onClose={() => setAddFilesDialog({ open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Agregar Archivos al Informe</DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
          <Alert severity="info" sx={{ mb: 2 }}>
            Puede agregar archivos adicionales a este informe. Los nuevos archivos se sumarán a los existentes.
          </Alert>
          
          <Stack spacing={2}>
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
                accept=".pdf,.jpg,.jpeg,.png,.gif"
                onChange={(e) => setNewFiles(e.target.files)}
                style={{ width: '100%' }}
              />
              {newFiles && newFiles.length > 0 && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {newFiles.length} archivo(s) seleccionado(s)
                </Typography>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setAddFilesDialog({ open: false });
            setCapturedFiles([]);
          }} disabled={actionLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleAddFiles}
            variant="contained"
            disabled={capturedFiles.length === 0 && (!newFiles || newFiles.length === 0) || actionLoading}
            startIcon={actionLoading ? <CircularProgress size={18} /> : undefined}
          >
            Agregar Archivos
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Preview de archivos */}
      <Dialog 
        open={!!previewFile} 
        onClose={() => setPreviewFile(null)} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>Previsualización: {previewFile?.file}</DialogTitle>
        <DialogContent dividers sx={{ minHeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {previewFile && (
            <>
              {!previewFile.blob ? (
                <CircularProgress />
              ) : /\.pdf$/i.test(previewFile.file) ? (
                <Box sx={{ height: '100%', width: '100%', minHeight: 500 }}>
                  <iframe
                    src={previewFile.blob}
                    style={{ width: '100%', height: '100%', border: 'none', minHeight: 500 }}
                    title="PDF Preview"
                  />
                </Box>
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
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            if (previewFile?.blob) {
              URL.revokeObjectURL(previewFile.blob);
            }
            setPreviewFile(null);
          }}>Cerrar</Button>
          {previewFile?.blob && (
            <Button 
              variant="contained" 
              onClick={() => {
                const a = document.createElement('a');
                a.href = previewFile.blob!;
                a.download = previewFile.file;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }}
            >
              Descargar
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog: Cámara */}
      <CameraCapture
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </Box>
  )
}

export default LaboratoryPage
