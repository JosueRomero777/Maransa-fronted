import { useEffect, useState } from 'react';
import { providerService } from '../services/provider.service';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Chip,
  Grid,
  Container,
  Paper,
  InputAdornment,
  Pagination,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  IconButton,
  Collapse,
  Stack,
  Divider,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import { useSelectedProvider } from '../contexts/SelectedProviderContext';

// Enum for provider types (matching backend)
export enum TipoProveedor {
  PEQUENA_CAMARONERA = 'PEQUENA_CAMARONERA',
  MEDIANA_CAMARONERA = 'MEDIANA_CAMARONERA', 
  GRAN_CAMARONERA = 'GRAN_CAMARONERA'
}

// Helper function to get friendly names
const getTipoProveedorLabel = (tipo?: string): string => {
  switch (tipo) {
    case TipoProveedor.PEQUENA_CAMARONERA:
      return 'Pequeña Camaronera';
    case TipoProveedor.MEDIANA_CAMARONERA:
      return 'Mediana Camaronera';
    case TipoProveedor.GRAN_CAMARONERA:
      return 'Gran Camaronera';
    default:
      return tipo || '';
  }
};

// Options for the type filter
const tipoProveedorFilterOptions = [
  { value: '', label: 'Todos los tipos' },
  { value: TipoProveedor.PEQUENA_CAMARONERA, label: 'Pequeña Camaronera' },
  { value: TipoProveedor.MEDIANA_CAMARONERA, label: 'Mediana Camaronera' },
  { value: TipoProveedor.GRAN_CAMARONERA, label: 'Gran Camaronera' }
];

type Provider = {
  id: number;
  name: string;
  type?: string;
  location?: string;
  capacity?: number;
  contact_whatsapp?: string;
  contact_email?: string;
  contact_phone?: string;
  notes?: string;
  active?: boolean;
};

const StyledCard = styled(Card)(({ theme, selected }: { theme?: any; selected: boolean }) => ({
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  border: selected ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
  backgroundColor: selected ? alpha(theme.palette.primary.main, 0.05) : 'white',
  '&:hover': {
    boxShadow: theme.shadows[8],
    transform: 'translateY(-2px)',
  },
}));

const SearchTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: theme.palette.background.paper,
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.04),
    },
    '&.Mui-focused': {
      backgroundColor: alpha(theme.palette.primary.main, 0.08),
    },
  },
}));

export default function ProvidersList() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filtros
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    location: '',
    minCapacity: '',
  });
  const [activeOnly, setActiveOnly] = useState(true);
  
  // Paginación
  const [page, setPage] = useState(1);
  const [pageSize] = useState(6);
  
  // Modal de confirmación
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingName, setDeletingName] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { selected, setSelected } = useSelectedProvider();
  const { user } = useAuth();

  // Permisos basados en roles
  const canCreate = user?.role === 'ADMIN' || user?.role === 'COMPRAS';
  const canEdit = user?.role === 'ADMIN' || user?.role === 'COMPRAS';
  const canDelete = user?.role === 'ADMIN';

  useEffect(() => {
    setLoading(true);
    providerService
      .listProviders()
      .then((data) => setProviders(data || []))
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  // Filtrado y paginación
  const filteredProviders = providers.filter((p) => {
    if (activeOnly && !p.active) return false;
    if (filters.search) {
      const s = filters.search.toLowerCase();
      const searchFields = [p.name, p.type, p.location].filter(Boolean);
      if (!searchFields.some(field => field!.toLowerCase().includes(s))) return false;
    }
    if (filters.type && p.type !== filters.type) return false;
    if (filters.location && !(p.location || '').toLowerCase().includes(filters.location.toLowerCase())) return false;
    if (filters.minCapacity) {
      const min = Number(filters.minCapacity);
      if (!Number.isNaN(min) && (p.capacity ?? 0) < min) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredProviders.length / pageSize));
  const paginatedProviders = filteredProviders.slice((page - 1) * pageSize, page * pageSize);

  const askDelete = (id: number, name?: string) => {
    setDeletingId(id);
    setDeletingName(name || null);
    setActionError(null);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await providerService.deleteProvider(deletingId);
      setProviders((p) => p.filter((x) => x.id !== deletingId));
      if (selected && selected.id === deletingId) setSelected(null);
      setConfirmOpen(false);
      setDeletingId(null);
      setDeletingName(null);
    } catch (err) {
      console.error('[ProvidersList] delete error', err);
      setActionError(String(err));
    }
  };

  const clearFilters = () => {
    setFilters({ search: '', type: '', location: '', minCapacity: '' });
    setActiveOnly(true);
    setPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(Boolean) || !activeOnly;

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: 'text.primary' }}>
          Proveedores
        </Typography>
        {canCreate && (
          <Button
            component={Link}
            to="/providers/new"
            variant="contained"
            startIcon={<AddIcon />}
            size="large"
            onClick={() => setSelected(null)}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
            }}
          >
            Nuevo Proveedor
          </Button>
        )}
      </Box>

      {/* Barra de búsqueda y filtros */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <SearchTextField
              fullWidth
              placeholder="Buscar por nombre, tipo o ubicación..."
              value={filters.search}
              onChange={(e) => {
                setFilters({ ...filters, search: e.target.value });
                setPage(1);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1 }}
            />
            <Button
              variant={showFilters ? "contained" : "outlined"}
              startIcon={<FilterIcon />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{ minWidth: 120 }}
            >
              Filtros
            </Button>
            {hasActiveFilters && (
              <IconButton
                onClick={clearFilters}
                color="primary"
                sx={{ 
                  backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                  '&:hover': {
                    backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.2),
                  }
                }}
              >
                <ClearIcon />
              </IconButton>
            )}
          </Box>

          <Collapse in={showFilters}>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={filters.type}
                    label="Tipo"
                    onChange={(e) => {
                      setFilters({ ...filters, type: e.target.value });
                      setPage(1);
                    }}
                  >
                    {tipoProveedorFilterOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Ubicación"
                  placeholder="Ej: Lima"
                  value={filters.location}
                  onChange={(e) => {
                    setFilters({ ...filters, location: e.target.value });
                    setPage(1);
                  }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Capacidad mínima"
                  placeholder="Ej: 1000"
                  type="number"
                  value={filters.minCapacity}
                  onChange={(e) => {
                    setFilters({ ...filters, minCapacity: e.target.value });
                    setPage(1);
                  }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={activeOnly}
                      onChange={(e) => {
                        setActiveOnly(e.target.checked);
                        setPage(1);
                      }}
                      color="primary"
                    />
                  }
                  label="Solo activos"
                />
              </Grid>
            </Grid>
          </Collapse>
        </Stack>
      </Paper>

      {/* Loading y Error */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={40} />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Error al cargar proveedores: {error}
        </Alert>
      )}

      {/* Lista de proveedores */}
      {!loading && !error && (
        <>
          {paginatedProviders.length === 0 ? (
            <Paper 
              elevation={1} 
              sx={{ 
                p: 6, 
                textAlign: 'center', 
                backgroundColor: 'grey.50',
                borderRadius: 2 
              }}
            >
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No se encontraron proveedores
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Intenta ajustar los filtros o crear un nuevo proveedor
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {paginatedProviders.map((provider) => {
                const isSelected = Boolean(selected && selected.id === provider.id);
                return (
                  <Grid item xs={12} sm={6} md={4} key={provider.id}>
                    <StyledCard
                      elevation={isSelected ? 8 : 2}
                      selected={isSelected}
                      onClick={() => setSelected(provider)}
                    >
                      <CardContent sx={{ pb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="h6" component="h2" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                            {provider.name}
                          </Typography>
                          <Chip
                            label={provider.active ? 'Activo' : 'Inactivo'}
                            color={provider.active ? 'success' : 'default'}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                        
                        <Stack spacing={1}>
                          {provider.type && (
                            <Typography variant="body2" color="text.secondary">
                              📋 {getTipoProveedorLabel(provider.type)}
                            </Typography>
                          )}
                          {provider.location && (
                            <Typography variant="body2" color="text.secondary">
                              📍 {provider.location}
                            </Typography>
                          )}
                          {provider.capacity && (
                            <Typography variant="body2" color="text.secondary">
                              📦 {provider.capacity.toLocaleString()} lbs
                            </Typography>
                          )}
                        </Stack>
                      </CardContent>
                      
                      <CardActions sx={{ px: 2, pb: 2, justifyContent: 'flex-end' }}>
                        {canEdit && (
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/providers/${provider.id}/edit`);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        )}
                        {canDelete && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              askDelete(provider.id, provider.name);
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </CardActions>
                    </StyledCard>
                  </Grid>
                );
              })}
            </Grid>
          )}

          {/* Paginación */}
          {filteredProviders.length > pageSize && (
            <Paper elevation={1} sx={{ p: 2, mt: 3, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Mostrando {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filteredProviders.length)} de {filteredProviders.length} resultados
                </Typography>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, newPage) => setPage(newPage)}
                  color="primary"
                  shape="rounded"
                />
              </Box>
            </Paper>
          )}
        </>
      )}

      {/* Modal de confirmación de eliminación */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            Confirmar eliminación
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            ¿Está seguro que desea eliminar el proveedor{' '}
            <Typography component="span" sx={{ fontWeight: 600 }}>
              {deletingName}
            </Typography>
            ?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Esta acción no se puede deshacer.
          </Typography>
          {actionError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {actionError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setConfirmOpen(false)}
            variant="outlined"
            sx={{ textTransform: 'none' }}
          >
            Cancelar
          </Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            color="error"
            sx={{ textTransform: 'none' }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
