import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api.config';
import {
  Box,
  Button,
  Paper,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { Save, CheckCircle, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface InvoiceConfig {
  id: number;
  ruc: string;
  razonSocial: string;
  nombreComercial?: string;
  direccionMatriz: string;
  direccionEstablecimiento?: string;
  contribuyenteEspecial?: string;
  obligadoContabilidad: boolean;
  codigoEstablecimiento: string;
  codigoPuntoEmision: string;
  ambienteSRI: string;
  tipoEmision: string;
  rutaCertificado?: string;
  claveCertificado?: string;
  urlFirmaService?: string;
  activo: boolean;
}

export default function InvoiceConfigPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [config, setConfig] = useState<InvoiceConfig | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/invoicing/config/active`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError('No hay configuración de facturación. Contacta al administrador.');
          return;
        }
        throw new Error('Error al cargar configuración');
      }

      const data = await response.json();
      setConfig(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/invoicing/config/${config.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) throw new Error('Error al guardar configuración');

      setSuccess('Configuración guardada exitosamente');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!config) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          No hay configuración de facturación electrónica. Contacta al administrador del sistema.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/invoices')}
            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
          >
            Volver
          </Button>
          <Typography variant="h4">Configuración de Facturación Electrónica</Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Información de la Empresa</Typography>
        <Divider sx={{ mb: 2 }} />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            rowGap: 2,
            columnGap: { md: 2 },
          }}
        >
          <Box>
            <TextField
              fullWidth
              required
              label="RUC"
              value={config.ruc}
              onChange={(e) => setConfig({ ...config, ruc: e.target.value })}
              helperText="13 dígitos"
            />
          </Box>

          <Box>
            <TextField
              fullWidth
              required
              label="Razón Social"
              value={config.razonSocial}
              onChange={(e) => setConfig({ ...config, razonSocial: e.target.value })}
            />
          </Box>

          <Box>
            <TextField
              fullWidth
              label="Nombre Comercial"
              value={config.nombreComercial || ''}
              onChange={(e) => setConfig({ ...config, nombreComercial: e.target.value })}
            />
          </Box>

          <Box>
            <TextField
              fullWidth
              label="Contribuyente Especial"
              value={config.contribuyenteEspecial || ''}
              onChange={(e) => setConfig({ ...config, contribuyenteEspecial: e.target.value })}
              helperText="Número de resolución (opcional)"
            />
          </Box>

          <Box sx={{ gridColumn: { md: '1 / -1' } }}>
            <TextField
              fullWidth
              required
              label="Dirección Matriz"
              value={config.direccionMatriz}
              onChange={(e) => setConfig({ ...config, direccionMatriz: e.target.value })}
            />
          </Box>

          <Box sx={{ gridColumn: { md: '1 / -1' } }}>
            <TextField
              fullWidth
              label="Dirección Establecimiento"
              value={config.direccionEstablecimiento || ''}
              onChange={(e) => setConfig({ ...config, direccionEstablecimiento: e.target.value })}
              helperText="Si es diferente a la matriz"
            />
          </Box>

          <Box sx={{ gridColumn: { md: '1 / -1' } }}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.obligadoContabilidad}
                  onChange={(e) => setConfig({ ...config, obligadoContabilidad: e.target.checked })}
                />
              }
              label="Obligado a Llevar Contabilidad"
            />
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Punto de Emisión</Typography>
        <Divider sx={{ mb: 2 }} />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            rowGap: 2,
            columnGap: { md: 2 },
          }}
        >
          <Box>
            <TextField
              fullWidth
              required
              label="Código Establecimiento"
              value={config.codigoEstablecimiento}
              onChange={(e) => setConfig({ ...config, codigoEstablecimiento: e.target.value })}
              helperText="3 dígitos (ej: 001)"
            />
          </Box>

          <Box>
            <TextField
              fullWidth
              required
              label="Código Punto de Emisión"
              value={config.codigoPuntoEmision}
              onChange={(e) => setConfig({ ...config, codigoPuntoEmision: e.target.value })}
              helperText="3 dígitos (ej: 001)"
            />
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Configuración SRI</Typography>
        <Divider sx={{ mb: 2 }} />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            rowGap: 2,
            columnGap: { md: 2 },
          }}
        >
          <Box>
            <TextField
              fullWidth
              select
              label="Ambiente"
              value={config.ambienteSRI}
              onChange={(e) => setConfig({ ...config, ambienteSRI: e.target.value })}
              SelectProps={{ native: true }}
            >
              <option value="PRUEBAS">Pruebas</option>
              <option value="PRODUCCION">Producción</option>
            </TextField>
          </Box>

          <Box>
            <TextField
              fullWidth
              select
              label="Tipo de Emisión"
              value={config.tipoEmision}
              onChange={(e) => setConfig({ ...config, tipoEmision: e.target.value })}
              SelectProps={{ native: true }}
            >
              <option value="NORMAL">Normal</option>
              <option value="CONTINGENCIA">Contingencia</option>
            </TextField>
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Certificado Digital</Typography>
        <Divider sx={{ mb: 2 }} />

        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Configuración de Certificado:</strong> Configura la ruta del certificado digital .p12 
            y su contraseña para firmar electrónicamente las facturas.
          </Typography>
        </Alert>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            rowGap: 2,
            columnGap: { md: 2 },
          }}
        >
          <Box sx={{ gridColumn: { md: '1 / -1' } }}>
            <TextField
              fullWidth
              label="Ruta del Certificado"
              value={config.rutaCertificado || ''}
              onChange={(e) => setConfig({ ...config, rutaCertificado: e.target.value })}
              helperText="Ruta completa al archivo .p12 (ej: certificates/firma.p12)"
              placeholder="certificates/firma.p12"
            />
          </Box>

          <Box>
            <TextField
              fullWidth
              type="password"
              label="Contraseña del Certificado"
              value={config.claveCertificado || ''}
              onChange={(e) => setConfig({ ...config, claveCertificado: e.target.value })}
              helperText="Contraseña del archivo .p12"
            />
          </Box>

          <Box sx={{ gridColumn: { md: '1 / -1' } }}>
            <TextField
              fullWidth
              label="URL Servicio de Firma"
              value={config.urlFirmaService || ''}
              onChange={(e) => setConfig({ ...config, urlFirmaService: e.target.value })}
              helperText="URL del microservicio de firma (ej: http://localhost:8001)"
            />
          </Box>
        </Box>
      </Paper>

      {config.activo && (
        <Alert severity="success" icon={<CheckCircle />}>
          Esta configuración está activa y se usará para generar facturas electrónicas.
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSave}
          disabled={saving}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </Box>
    </Box>
  );
}
