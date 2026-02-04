import { useEffect, useState } from 'react';
import { packagerService } from '../services/packager.service';
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
import type { Packager } from '../types/packager.types';
import { useSelectedPackager } from '../contexts/SelectedPackagerContext';

const StyledCard = styled(Card)(({ theme, selected }: { theme?: any; selected: boolean }) => ({
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  border: selected ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
  backgroundColor: selected ? alpha(theme.palette.primary.main, 0.05) : 'white',
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  minHeight: '240px',
  maxHeight: '240px',
  '& .MuiCardContent-root': {
    flexGrow: 1,
    overflow: 'hidden',
  },
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

export default function PackagersList() {
  const [packagers, setPackagers] = useState<Packager[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filtros
  const [filters, setFilters] = useState({
    search: '',
    location: '',
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
  const { selected, setSelected } = useSelectedPackager();
  const { user } = useAuth();

  // Permisos basados en roles
  const canCreate = user?.role === 'ADMIN' || user?.role === 'EMPACADORA';
  const canEdit = user?.role === 'ADMIN' || user?.role === 'EMPACADORA';
  const canDelete = user?.role === 'ADMIN';

  useEffect(() => {
    setLoading(true);
    packagerService
      .listPackagers()
      .then((data) => {
        // Asegurar que siempre sea un array
        if (Array.isArray(data)) {
          setPackagers(data);
        } else if (data && Array.isArray(data.data)) {
          setPackagers(data.data);
        } else {
          setPackagers([]);
        }
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  // Filtrado y paginación
  const filteredPackagers = Array.isArray(packagers) ? packagers.filter((p) => {
    if (activeOnly && !p.active) return false;
    if (filters.search) {
      const s = filters.search.toLowerCase();
      const searchFields = [p.name, p.location, p.ruc].filter(Boolean);
      if (!searchFields.some(field => field!.toLowerCase().includes(s))) return false;
    }
    if (filters.location && !(p.location || '').toLowerCase().includes(filters.location.toLowerCase())) return false;
    return true;
  }) : [];

  const totalPages = Math.max(1, Math.ceil(filteredPackagers.length / pageSize));
  const paginatedPackagers = filteredPackagers.slice((page - 1) * pageSize, page * pageSize);

  const askDelete = (id: number, name: string) => {
    setDeletingId(id);
    setDeletingName(name);
    setActionError(null);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await packagerService.deletePackager(deletingId);
      setPackagers((p) => p.filter((x) => x.id !== deletingId));
      if (selected && selected.id === deletingId) setSelected(null);
      setConfirmOpen(false);
      setDeletingId(null);
      setDeletingName(null);
    } catch (err) {
      console.error('[PackagersList] delete error', err);
      setActionError(String(err));
    }
  };

  const clearFilters = () => {
    setFilters({ search: '', location: '' });
    setActiveOnly(true);
    setPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(Boolean) || !activeOnly;

  return (
    <Container maxWidth={false} sx={{ py: 3, px: { xs: 1, sm: 2, md: 2 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, mb: 3, flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 0 } }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: 'text.primary', fontSize: { xs: '1.5rem', md: '2rem' } }}>
          Empacadoras
        </Typography>
        {canCreate && (
          <Button
            component={Link}
            to="/packagers/new"
            variant="contained"
            startIcon={<AddIcon />}
            size={window.innerWidth < 600 ? 'medium' : 'large'}
            onClick={() => setSelected(null)}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              px: { xs: 2, md: 3 },
              width: { xs: '100%', md: 'auto' }
            }}
          >
            Nueva Empacadora
          </Button>
        )}
      </Box>

      {/* Barra de búsqueda y filtros */}
      <Paper elevation={2} sx={{ p: { xs: 2, md: 3 }, mb: 3, borderRadius: 2 }}>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexDirection: { xs: 'column', sm: 'row' } }}>
            <SearchTextField
              fullWidth
              placeholder="Buscar por nombre, RUC o ubicación..."
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
              size="small"
              sx={{ flexGrow: 1, width: { xs: '100%', sm: 'auto' } }}
            />
            <Button
              variant={showFilters ? "contained" : "outlined"}
              startIcon={<FilterIcon />}
              onClick={() => setShowFilters(!showFilters)}
              size="small"
              sx={{ minWidth: 100, width: { xs: '100%', sm: 'auto' } }}
            >
              Filtros
            </Button>
            {hasActiveFilters && (
              <IconButton
                onClick={clearFilters}
                color="primary"
                size="small"
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
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr' },
              gap: 2,
              alignItems: 'center'
            }}>
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
                sx={{ whiteSpace: 'nowrap', width: '100%' }}
              />
            </Box>
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
          Error al cargar empacadoras: {error}
        </Alert>
      )}

      {/* Lista de proveedores */}
      {!loading && !error && (
        <>
          {paginatedPackagers.length === 0 ? (
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
                No se encontraron empacadoras
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Intenta ajustar los filtros o crear una nueva empacadora
              </Typography>
            </Paper>
          ) : (
            <Grid 
              container 
              spacing={{ xs: 0, sm: 0, md: 1 }}
              sx={{ 
                width: '100%', 
                justifyContent: 'center',
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                gap: { xs: '16px', sm: '8px', md: '8px' },
                px: { xs: 0, md: 0 },
                mx: { xs: 0 }
              }}
            >
              {paginatedPackagers.map((packager) => {
                const isSelected = Boolean(selected && selected.id === packager.id);
                return (
                  <Grid 
                    item 
                    xs={12} 
                    sm={6} 
                    md={4} 
                    lg={4} 
                    xl={4} 
                    key={packager.id}
                    sx={{
                      padding: { xs: '0 !important', sm: undefined }
                    }}
                  >
                    <StyledCard
                      elevation={isSelected ? 8 : 2}
                      selected={isSelected}
                      onClick={() => setSelected(packager)}
                    >
                      <CardContent sx={{ pb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
                          <Box sx={{ flexGrow: 1, minWidth: 0, width: '100%' }}>
                            <Typography
                              variant="h6"
                              component="h2"
                              sx={{
                                display: 'block',
                                width: '100%',
                                maxWidth: '200px',
                                fontWeight: 600,
                                fontSize: '1.1rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {packager.name}
                            </Typography>
                          </Box>
                          <Chip
                            label={packager.active ? 'Activo' : 'Inactivo'}
                            color={packager.active ? 'success' : 'default'}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                        
                        <Stack spacing={1}>
                          {packager.location && (
                            <Typography variant="body2" color="text.secondary">
                              📍 {packager.location}
                            </Typography>
                          )}
                          {packager.ruc && (
                            <Typography variant="body2" color="text.secondary">
                              📋 RUC: {packager.ruc}
                            </Typography>
                          )}
                          {packager.contact_whatsapp && (
                            <Typography variant="body2" color="text.secondary">
                              📱 {packager.contact_whatsapp}
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
                              navigate(`/packagers/${packager.id}/edit`);
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
                              askDelete(packager.id, packager.name);
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
          {filteredPackagers.length > pageSize && (
            <Paper elevation={1} sx={{ p: 2, mt: 3, borderRadius: 2, overflow: 'auto' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Mostrando {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filteredPackagers.length)} de {filteredPackagers.length} resultados
                </Typography>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, newPage) => setPage(newPage)}
                  color="primary"
                  shape="rounded"
                  size="small"
                  sx={{ '& .MuiPagination-ul': { justifyContent: 'center' } }}
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
            ¿Está seguro que desea eliminar la empacadora{' '}
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
