import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  Grid,
  Button,
  IconButton,
  Collapse,
  TablePagination,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { logsService, type EventLog, type LogsFilter } from '../services/logs.service';

const LogsPage: React.FC = () => {
  const [logs, setLogs] = useState<EventLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalLogs, setTotalLogs] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<LogsFilter>({
    orderId: undefined,
    userName: undefined,
    accion: '',
    fechaDesde: '',
    fechaHasta: '',
  });

  const [fechaDesde, setFechaDesde] = useState<Dayjs | null>(null);
  const [fechaHasta, setFechaHasta] = useState<Dayjs | null>(null);

  useEffect(() => {
    loadLogs();
  }, [page, rowsPerPage]);

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const filterParams: LogsFilter = {
        ...filters,
        fechaDesde: fechaDesde ? fechaDesde.format('YYYY-MM-DD') : '',
        fechaHasta: fechaHasta ? fechaHasta.format('YYYY-MM-DD') : '',
        page: page + 1,
        limit: rowsPerPage,
      };
      
      // Remover filtros vacíos
      Object.keys(filterParams).forEach((key) => {
        const value = filterParams[key as keyof LogsFilter];
        if (value === '' || value === undefined) {
          delete filterParams[key as keyof LogsFilter];
        }
      });
      
      const response = await logsService.getLogs(filterParams);
      setLogs(response.data);
      setTotalLogs(response.total);
    } catch (err: any) {
      setError(err?.message || 'Error al cargar logs del sistema');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setPage(0);
    loadLogs();
  };

  const handleClearFilters = () => {
    setFilters({
      orderId: undefined,
      userId: undefined,
      accion: '',
      fechaDesde: '',
      fechaHasta: '',
    });
    setFechaDesde(null);
    setFechaHasta(null);
    setPage(0);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const toggleRowExpansion = (logId: number) => {
    setExpandedRow(expandedRow === logId ? null : logId);
  };

  const getAccionColor = (accion: string): 'default' | 'primary' | 'success' | 'error' | 'warning' | 'info' => {
    if (accion.includes('creado')) return 'success';
    if (accion.includes('editado') || accion.includes('actualizado')) return 'primary';
    if (accion.includes('eliminado') || accion.includes('descartado') || accion.includes('rechazado')) return 'error';
    if (accion.includes('aprobado')) return 'success';
    if (accion.includes('reevaluacion')) return 'warning';
    return 'default';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Logs del Sistema
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </Button>
        </Box>
      </Box>

      {/* Filtros */}
      <Collapse in={showFilters}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' },
              gap: 2
            }}>
              <TextField
                label="ID de Pedido"
                type="number"
                fullWidth
                value={filters.orderId || ''}
                onChange={(e) => setFilters({ ...filters, orderId: e.target.value ? parseInt(e.target.value) : undefined })}
              />
              <TextField
                label="Nombre de Usuario"
                type="text"
                fullWidth
                value={filters.userName || ''}
                onChange={(e) => setFilters({ ...filters, userName: e.target.value || undefined })}
              />
              <DatePicker
                label="Fecha Desde"
                value={fechaDesde}
                onChange={(newValue) => setFechaDesde(newValue)}
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
              <DatePicker
                label="Fecha Hasta"
                value={fechaHasta}
                onChange={(newValue) => setFechaHasta(newValue)}
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
              <FormControl fullWidth>
                <InputLabel>Acción</InputLabel>
                <Select
                  value={filters.accion || ''}
                  label="Acción"
                  onChange={(e) => setFilters({ ...filters, accion: e.target.value })}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxHeight: 300,
                      },
                    },
                    anchorOrigin: {
                      vertical: 'bottom',
                      horizontal: 'left',
                    },
                    transformOrigin: {
                      vertical: 'top',
                      horizontal: 'left',
                    },
                  }}
                >
                  <MenuItem value="">Todas</MenuItem>
                  <MenuItem value="laboratorio_creado">Laboratorio Creado</MenuItem>
                  <MenuItem value="laboratorio_aprobado">Laboratorio Aprobado</MenuItem>
                  <MenuItem value="laboratorio_rechazado">Laboratorio Rechazado</MenuItem>
                  <MenuItem value="laboratorio_editado">Laboratorio Editado</MenuItem>
                  <MenuItem value="archivos_agregados">Archivos Agregados</MenuItem>
                  <MenuItem value="laboratorio_reevaluacion">Reevaluación Solicitada</MenuItem>
                  <MenuItem value="pedido_descartado">Pedido Descartado</MenuItem>
                  <MenuItem value="logistica_creada">Logística Creada</MenuItem>
                  <MenuItem value="vehiculo_asignado">Vehículo Asignado</MenuItem>
                  <MenuItem value="ruta_iniciada">Ruta Iniciada</MenuItem>
                  <MenuItem value="ruta_completada">Ruta Completada</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box display="flex" gap={2} justifyContent="flex-end" sx={{ mt: 2 }}>
              <Button variant="outlined" onClick={handleClearFilters}>
                Limpiar Filtros
              </Button>
              <Button variant="contained" onClick={handleApplyFilters}>
                Aplicar Filtros
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Collapse>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <CircularProgress />
        </Box>
      )}

      {/* Tabla de Logs - Vista Desktop */}
      {!loading && (
        <Card sx={{ display: { xs: 'none', md: 'block' } }}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                  <TableCell width={50}></TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Acción</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Descripción</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Usuario</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Pedido</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Proveedor</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Alert severity="info">No hay logs registrados</Alert>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <React.Fragment key={log.id}>
                      <TableRow hover>
                        <TableCell>
                          {log.details && log.details.length > 0 && (
                            <IconButton size="small" onClick={() => toggleRowExpansion(log.id)}>
                              {expandedRow === log.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                          )}
                        </TableCell>
                        <TableCell>{log.id}</TableCell>
                        <TableCell>{formatDate(log.fechaEvento)}</TableCell>
                        <TableCell>
                          <Chip
                            label={log.accion.replace(/_/g, ' ').toUpperCase()}
                            color={getAccionColor(log.accion)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{log.descripcion}</TableCell>
                        <TableCell>
                          {log.user ? (
                            <>
                              <Typography variant="body2">{log.user.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {log.user.email}
                              </Typography>
                            </>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {log.order ? `#${log.order.codigo}` : '-'}
                        </TableCell>
                        <TableCell>
                          {log.order?.provider?.name || '-'}
                        </TableCell>
                      </TableRow>
                      
                      {/* Detalles expandibles */}
                      {log.details && log.details.length > 0 && (
                        <TableRow>
                          <TableCell colSpan={8} sx={{ py: 0 }}>
                            <Collapse in={expandedRow === log.id} timeout="auto" unmountOnExit>
                              <Box sx={{ p: 2, backgroundColor: '#f8fafc' }}>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                  Detalles del Cambio:
                                </Typography>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 600 }}>Campo</TableCell>
                                      <TableCell sx={{ fontWeight: 600 }}>Valor Anterior</TableCell>
                                      <TableCell sx={{ fontWeight: 600 }}>Valor Nuevo</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {log.details.map((detail) => (
                                      <TableRow key={detail.id}>
                                        <TableCell>{detail.clave}</TableCell>
                                        <TableCell>
                                          <Typography
                                            variant="body2"
                                            sx={{
                                              textDecoration: 'line-through',
                                              color: 'error.main',
                                            }}
                                          >
                                            {detail.valorAnterior || '-'}
                                          </Typography>
                                        </TableCell>
                                        <TableCell>
                                          <Typography
                                            variant="body2"
                                            sx={{
                                              fontWeight: 600,
                                              color: 'success.main',
                                            }}
                                          >
                                            {detail.valorNuevo || '-'}
                                          </Typography>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Paginación */}
          <TablePagination
            component="div"
            count={totalLogs}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </Card>
      )}

      {/* Vista Móvil - Cards */}
      {!loading && (
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          <Stack spacing={2}>
            {logs.length === 0 ? (
              <Alert severity="info">No hay logs registrados</Alert>
            ) : (
              logs.map((log) => (
                <Card key={log.id} elevation={2}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          ID: {log.id}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                          {formatDate(log.fechaEvento)}
                        </Typography>
                      </Box>
                      <Chip
                        label={log.accion.replace(/_/g, ' ').toUpperCase()}
                        color={getAccionColor(log.accion)}
                        size="small"
                      />
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    <Stack spacing={1.5}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Descripción
                        </Typography>
                        <Typography variant="body2">
                          {log.descripcion}
                        </Typography>
                      </Box>

                      {log.user && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Usuario
                          </Typography>
                          <Typography variant="body2">
                            {log.user.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {log.user.email}
                          </Typography>
                        </Box>
                      )}

                      {log.order && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Pedido
                          </Typography>
                          <Typography variant="body2">
                            #{log.order.codigo}
                          </Typography>
                        </Box>
                      )}

                      {log.order?.provider && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Proveedor
                          </Typography>
                          <Typography variant="body2">
                            {log.order.provider.name}
                          </Typography>
                        </Box>
                      )}

                      {log.details && log.details.length > 0 && (
                        <Box>
                          <Button
                            size="small"
                            startIcon={expandedRow === log.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            onClick={() => toggleRowExpansion(log.id)}
                            sx={{ mt: 1 }}
                          >
                            {expandedRow === log.id ? 'Ocultar' : 'Ver'} Detalles
                          </Button>
                          <Collapse in={expandedRow === log.id}>
                            <Box sx={{ mt: 1, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                              <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                                Detalles del cambio:
                              </Typography>
                              {log.details.map((detail: any, index: number) => (
                                <Box key={index} sx={{ mb: 1 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    {detail.campo}:
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                                    <span style={{ textDecoration: 'line-through', color: '#666' }}>
                                      {detail.valorAnterior || 'N/A'}
                                    </span>
                                    {' → '}
                                    <strong>{detail.valorNuevo || 'N/A'}</strong>
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          </Collapse>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              ))
            )}
          </Stack>

          {/* Paginación Mobile */}
          <Card sx={{ mt: 2 }}>
            <TablePagination
              component="div"
              count={totalLogs}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[10, 25, 50]}
              labelRowsPerPage="Logs:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              sx={{
                '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                  fontSize: '0.875rem'
                }
              }}
            />
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default LogsPage;
