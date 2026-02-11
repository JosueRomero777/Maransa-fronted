import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api.config';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  Grid,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
  Stack,
  Divider,
} from '@mui/material';
import { Add, Visibility, Edit, AttachMoney, CheckCircle, Settings, Download, FileDownload, Clear } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { alpha } from '@mui/material/styles';
import type { Invoice } from '../types/invoicing';

const estadoColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'> = {
  BORRADOR: 'default',
  EMITIDA: 'info',
  AUTORIZADA_SRI: 'success',
  PAGADA: 'success',
  ANULADA: 'error',
  VENCIDA: 'warning',
};

export default function InvoicesList() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<number | null>(null); // ID de factura en procesamiento

  // Filtros
  const [packagerId, setPackagerId] = useState('');
  const [estado, setEstado] = useState('');
  const [desde, setDesde] = useState<dayjs.Dayjs | null>(null);
  const [hasta, setHasta] = useState<dayjs.Dayjs | null>(null);

  const [packagers, setPackagers] = useState<any[]>([]);

  useEffect(() => {
    loadPackagers();
    loadInvoices();
  }, [packagerId, estado, desde, hasta]);

  const loadPackagers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/packagers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Error al cargar empacadoras');

      const data = await response.json();
      setPackagers(data);
    } catch (err: any) {
      console.error('Error loading packagers:', err);
    }
  };

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (packagerId) params.append('packagerId', packagerId);
      if (estado) params.append('estado', estado);
      if (desde) params.append('desde', desde.format('YYYY-MM-DD'));
      if (hasta) params.append('hasta', hasta.format('YYYY-MM-DD'));

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/invoicing/invoices?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Error al cargar facturas');

      const data = await response.json();
      setInvoices(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = async (invoice: Invoice) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/invoicing/invoices/${invoice.id}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Error al obtener PDF');

      const pdfBlob = await buildPdfBlob(response);
      const url = window.URL.createObjectURL(pdfBlob);
      
      // Abrir en nueva pestaña
      const newWindow = window.open(url, '_blank');
      if (!newWindow) {
        throw new Error('El navegador bloqueó la ventana del PDF. Intenta permitir popups.');
      }
      
      // Limpiar después de un tiempo
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEditInvoice = (id: number) => {
    navigate(`/invoices/${id}/edit`);
  };

  const handleRegisterPayment = (id: number) => {
    navigate(`/invoices/${id}/payment`);
  };

  const handleEmitInvoice = async (id: number) => {
    try {
      setProcessing(id);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/invoicing/invoices/${id}/emit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al emitir factura');
      }

      await loadInvoices();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleSignAndAuthorize = async (id: number) => {
    try {
      setProcessing(id);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/invoicing/invoices/${id}/sign-and-authorize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al firmar y autorizar factura');
      }

      await loadInvoices();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleDownloadPdf = async (id: number, numeroFactura: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/invoicing/invoices/${id}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Error al descargar PDF');

      const pdfBlob = await buildPdfBlob(response);
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factura_${numeroFactura}.pdf`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatAutorizacion = (value?: string) => {
    if (!value) return '-';
    if (value.length <= 10) return value;
    return `${value.slice(0, 10)}...`;
  };

  const buildPdfBlob = async (response: Response) => {
    const buffer = await response.arrayBuffer();
    const headerBytes = new Uint8Array(buffer.slice(0, 4));
    const headerText = String.fromCharCode(...headerBytes);

    if (headerText === '%PDF') {
      return new Blob([buffer], { type: 'application/pdf' });
    }

    const text = new TextDecoder().decode(buffer);
    let decodedString: string | null = null;

    if (text.trim().startsWith('"')) {
      try {
        decodedString = JSON.parse(text);
      } catch {
        decodedString = null;
      }
    }

    if (decodedString && decodedString.startsWith('%PDF')) {
      const byteArray = new Uint8Array(decodedString.length);
      for (let i = 0; i < decodedString.length; i += 1) {
        byteArray[i] = decodedString.charCodeAt(i) & 0xff;
      }
      return new Blob([byteArray], { type: 'application/pdf' });
    }

    const preview = (decodedString || text || '').slice(0, 200);
    throw new Error(`Respuesta no es PDF: ${preview || 'sin detalle'}`);
  };

  const copyAutorizacion = async (value?: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch (err) {
      console.error('No se pudo copiar el numero de autorizacion', err);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-EC');
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 } }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        mb: 3,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1.5, sm: 0 }
      }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>Facturas</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' }, width: { xs: '100%', sm: 'auto' } }}>
          <Button
            variant="outlined"
            startIcon={<Settings />}
            onClick={() => navigate('/invoices/config')}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Configuración
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/invoices/new')}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Nueva Factura
          </Button>
        </Box>
      </Box>

      {/* Filtros */}
      <Paper sx={{ p: { xs: 1.5, sm: 2, md: 3 }, mb: 3 }}>
        <Stack 
          spacing={2}
          direction={{ xs: 'column', md: 'row' }}
          sx={{ 
            alignItems: { xs: 'stretch', md: 'flex-end' },
            justifyContent: (packagerId || estado || desde || hasta) ? 'flex-start' : 'stretch'
          }}
        >
          <Box sx={{ minWidth: { xs: '100%', md: 240 }, flex: 1 }}>
            <TextField
              fullWidth
              select
              label="Empacadora"
              value={packagerId}
              onChange={(e) => setPackagerId(e.target.value)}
            >
              <MenuItem value="">Todas</MenuItem>
              {packagers.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Box sx={{ minWidth: 200, flex: 1 }}>
            <TextField
              fullWidth
              select
              label="Estado"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="BORRADOR">Borrador</MenuItem>
              <MenuItem value="EMITIDA">Emitida</MenuItem>
              <MenuItem value="AUTORIZADA_SRI">Autorizada SRI</MenuItem>
              <MenuItem value="PAGADA">Pagada</MenuItem>
              <MenuItem value="ANULADA">Anulada</MenuItem>
            </TextField>
          </Box>

          <Box sx={{ minWidth: 220, flex: 1 }}>
            <DatePicker
              label="Fecha Desde"
              value={desde}
              onChange={(newValue) => setDesde(newValue)}
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
          </Box>

          <Box sx={{ minWidth: 220, flex: 1 }}>
            <DatePicker
              label="Fecha Hasta"
              value={hasta}
              onChange={(newValue) => setHasta(newValue)}
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
          </Box>

          {(packagerId || estado || desde || hasta) && (
            <IconButton
              onClick={() => {
                setPackagerId('');
                setEstado('');
                setDesde(null);
                setHasta(null);
              }}
              color="primary"
              sx={{ 
                alignSelf: 'center',
                backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.2),
                }
              }}
            >
              <Clear />
            </IconButton>
          )}
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {processing && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Procesando factura... Esto puede tardar hasta 1 minuto. Por favor espere.
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : isMobile ? (
        // Vista en cards para móvil
        <Stack spacing={2}>
          {invoices.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography>No hay facturas</Typography>
            </Paper>
          ) : (
            invoices.map((invoice) => (
              <Paper key={invoice.id} sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    #{invoice.numeroFactura}
                  </Typography>
                  <Chip 
                    label={invoice.estado} 
                    color={estadoColors[invoice.estado] || 'default'} 
                    size="small"
                  />
                </Box>
                {invoice.numeroAutorizacion && (
                  <Tooltip title="Copiar autorizacion">
                    <Typography
                      variant="caption"
                      display="block"
                      color="text.secondary"
                      sx={{ cursor: 'pointer' }}
                      onClick={() => copyAutorizacion(invoice.numeroAutorizacion)}
                    >
                      Autorizacion: {formatAutorizacion(invoice.numeroAutorizacion)}
                    </Typography>
                  </Tooltip>
                )}
                <Typography variant="caption" color="text.secondary">
                  {formatDate(invoice.fechaEmision)}
                </Typography>
                <Typography variant="caption" display="block" color="text.secondary">
                  {invoice.packager?.name || 'N/A'}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">Total</Typography>
                  <Typography variant="h6">{formatCurrency(invoice.total)}</Typography>
                </Box>
                <Stack spacing={1} direction="row" sx={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <Tooltip title="Ver">
                    <IconButton 
                      size="small" 
                      onClick={() => handleViewInvoice(invoice)}
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {invoice.estado === 'BORRADOR' && (
                    <>
                      <Tooltip title="Editar">
                        <IconButton 
                          size="small" 
                          onClick={() => handleEditInvoice(invoice.id)}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Emitir">
                        <IconButton 
                          size="small" 
                          onClick={() => handleEmitInvoice(invoice.id)}
                        >
                          <CheckCircle fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                  <Tooltip title="Descargar PDF">
                    <IconButton 
                      size="small" 
                      onClick={() => handleDownloadPDF(invoice)}
                    >
                      <FileDownload fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Paper>
            ))
          )}
        </Stack>
      ) : (
        // Vista de tabla para desktop
        <TableContainer component={Paper}>
          <Table sx={{ '& th, & td': { fontSize: { xs: '0.75rem', sm: '0.875rem' } } }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.05) }}>
                <TableCell sx={{ fontWeight: 600 }}>Número</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Autorizacion</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Empacadora</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Subtotal</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>IVA</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Total</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                    No hay facturas
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => (
                  <TableRow key={invoice.id} sx={{ '&:hover': { backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.02) } }}>
                    <TableCell>{invoice.numeroFactura}</TableCell>
                    <TableCell>
                      {invoice.numeroAutorizacion ? (
                        <Tooltip title="Copiar autorizacion">
                          <Typography
                            variant="body2"
                            sx={{ cursor: 'pointer' }}
                            onClick={() => copyAutorizacion(invoice.numeroAutorizacion)}
                          >
                            {formatAutorizacion(invoice.numeroAutorizacion)}
                          </Typography>
                        </Tooltip>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{formatDate(invoice.fechaEmision)}</TableCell>
                    <TableCell>{invoice.packager?.name || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={invoice.estado}
                        color={estadoColors[invoice.estado]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">{formatCurrency(invoice.subtotalSinImpuestos)}</TableCell>
                    <TableCell align="right">{formatCurrency(invoice.iva)}</TableCell>
                    <TableCell align="right">{formatCurrency(invoice.total)}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Ver PDF">
                        <IconButton size="small" onClick={() => handleViewInvoice(invoice)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>

                      {invoice.estado === 'BORRADOR' && (
                        <>
                          <Tooltip title="Editar">
                            <IconButton size="small" onClick={() => handleEditInvoice(invoice.id)}>
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Emitir">
                            <IconButton 
                              size="small" 
                              color="success" 
                              onClick={() => handleEmitInvoice(invoice.id)}
                              disabled={processing === invoice.id}
                            >
                              {processing === invoice.id ? <CircularProgress size={20} /> : <CheckCircle />}
                            </IconButton>
                          </Tooltip>
                        </>
                      )}

                      {invoice.estado === 'EMITIDA' && (
                        <>
                          <Tooltip title="Firmar y Autorizar con SRI">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleSignAndAuthorize(invoice.id)}
                              disabled={processing === invoice.id}
                            >
                              {processing === invoice.id ? <CircularProgress size={20} /> : <CheckCircle />}
                            </IconButton>
                          </Tooltip>
                        </>
                      )}

                      {invoice.estado === 'AUTORIZADA_SRI' && (
                        <>
                          <Tooltip title="Descargar PDF">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => handleDownloadPdf(invoice.id, invoice.numeroFactura)}
                            >
                              <Download />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
