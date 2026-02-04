import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { packagerService } from '../services/packager.service';
import { useAuth } from '../context';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import type { Packager, CreatePackagerData } from '../types/packager.types';

export default function PackagerForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [rucError, setRucError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreatePackagerData>({
    name: '',
    location: '',
    contact_email: '',
    contact_phone: '',
    contact_whatsapp: '',
    ruc: '',
  });

  // Permisos
  const canEdit = user?.role === 'ADMIN' || user?.role === 'EMPACADORA';

  useEffect(() => {
    if (!canEdit) {
      navigate('/packagers');
      return;
    }

    if (isEditing) {
      setLoading(true);
      packagerService
        .getPackager(Number(id))
        .then((data: Packager) => {
          setFormData({
            name: data.name,
            location: data.location,
            contact_email: data.contact_email || '',
            contact_phone: data.contact_phone || '',
            contact_whatsapp: data.contact_whatsapp || '',
            ruc: data.ruc || '',
          });
        })
        .catch((err) => setError(String(err)))
        .finally(() => setLoading(false));
    }
  }, [id, isEditing, canEdit, navigate]);

  const validateName = async (name: string) => {
    if (!name.trim()) {
      setNameError('El nombre es requerido');
      return false;
    }
    try {
      const isDuplicate = await packagerService.checkDuplicateName(name, isEditing ? Number(id) : undefined);
      if (isDuplicate) {
        setNameError('Ya existe una empacadora con este nombre');
        return false;
      }
      setNameError(null);
      return true;
    } catch (err) {
      console.error('Error validating name:', err);
      return true;
    }
  };

  const validateRuc = async (ruc: string) => {
    if (!ruc.trim()) {
      setRucError(null);
      return true;
    }
    try {
      const isDuplicate = await packagerService.checkDuplicateRuc(ruc, isEditing ? Number(id) : undefined);
      if (isDuplicate) {
        setRucError('Ya existe una empacadora con este RUC');
        return false;
      }
      setRucError(null);
      return true;
    } catch (err) {
      console.error('Error validating RUC:', err);
      return true;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    const isNameValid = await validateName(formData.name);
    const isRucValid = await validateRuc(formData.ruc || '');

    if (!isNameValid || !isRucValid) {
      return;
    }

    if (!formData.location.trim()) {
      setError('La ubicación es requerida');
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        await packagerService.updatePackager(Number(id), formData);
      } else {
        await packagerService.createPackager(formData);
      }
      navigate('/packagers');
    } catch (err: any) {
      setError(err.response?.data?.message || String(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<BackIcon />}
            onClick={() => navigate('/packagers')}
            sx={{ borderRadius: 2, display: { xs: 'none', sm: 'flex' } }}
          >
            Volver
          </Button>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            {isEditing ? 'Editar Empacadora' : 'Nueva Empacadora'}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 3 } }}>
            {/* Primera fila: Nombre y RUC */}
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              gap: { xs: 2, sm: 3 }
            }}>
              <TextField
                fullWidth
                required
                label="Nombre"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                onBlur={(e) => validateName(e.target.value)}
                error={Boolean(nameError)}
                helperText={nameError}
              />
              <TextField
                fullWidth
                label="RUC"
                value={formData.ruc}
                onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                onBlur={(e) => validateRuc(e.target.value)}
                error={Boolean(rucError)}
                helperText={rucError}
              />
            </Box>

            {/* Ubicación - ancho completo */}
            <TextField
              fullWidth
              required
              label="Ubicación"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />

            {/* Email y Teléfono */}
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              gap: { xs: 2, sm: 3 }
            }}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              />
              <TextField
                fullWidth
                label="Teléfono"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              />
            </Box>

            {/* WhatsApp - ancho completo */}
            <TextField
              fullWidth
              label="WhatsApp"
              value={formData.contact_whatsapp}
              onChange={(e) => setFormData({ ...formData, contact_whatsapp: e.target.value })}
            />
          </Box>

          <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end', flexDirection: { xs: 'column', sm: 'row' } }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/packagers')}
              disabled={saving}
              sx={{ borderRadius: 2 }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              disabled={saving || Boolean(nameError) || Boolean(rucError)}
              sx={{ borderRadius: 2, minWidth: 120 }}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
}
