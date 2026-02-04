import { useEffect, useState } from 'react';
import { laboratoryService, Laboratory, EstadoLaboratorio, LaboratoryFilterDto } from '../services/laboratory.service';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  TextField,
  Chip,
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
  Science as ScienceIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const SearchField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: alpha(theme.palette.common.white, 0.8),
    borderRadius: theme.shape.borderRadius * 2,
    '&:hover': {
      backgroundColor: theme.palette.common.white,
    },
    '&.Mui-focused': {
      backgroundColor: theme.palette.common.white,
    },
  },
}));

const LaboratoryList = () => {
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [laboratoryToDelete, setLaboratoryToDelete] = useState<Laboratory | null>(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(12);
  
  // Filters
  const [filters, setFilters] = useState<LaboratoryFilterDto>({});
  const [searchTerm, setSearchTerm] = useState('');
  
  const { user } = useAuth();
  const navigate = useNavigate();

  const hasPermissionToCreate = ['ADMIN', 'LABORATORIO', 'COMPRAS'].includes(user?.role || '');
  const hasPermissionToEdit = ['ADMIN', 'LABORATORIO'].includes(user?.role || '');
  const hasPermissionToDelete = ['ADMIN'].includes(user?.role || '');

  useEffect(() => {
    fetchLaboratories();
  }, [filters]);

  const fetchLaboratories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await laboratoryService.listLaboratories(filters);
      setLaboratories(data);
    } catch (err) {
      setError('Error al cargar los análisis de laboratorio');
      console.error('Error fetching laboratories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof LaboratoryFilterDto, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setPage(1);
  };

  const getEstadoColor = (estado: EstadoLaboratorio) => {
    switch (estado) {
      case EstadoLaboratorio.PENDIENTE:
        return 'default';
      case EstadoLaboratorio.EN_ANALISIS:
        return 'info';
      case EstadoLaboratorio.APROBADO:
        return 'success';
      case EstadoLaboratorio.RECHAZADO:
        return 'error';
      case EstadoLaboratorio.EN_ESPERA:
        return 'warning';
      default:
        return 'default';
    }
  };

  const getEstadoIcon = (estado: EstadoLaboratorio) => {
    switch (estado) {
      case EstadoLaboratorio.PENDIENTE:
        return <ScheduleIcon fontSize="small" />;
      case EstadoLaboratorio.EN_ANALISIS:
        return <ScienceIcon fontSize="small" />;
      case EstadoLaboratorio.APROBADO:
        return <CheckCircleIcon fontSize="small" />;
      case EstadoLaboratorio.RECHAZADO:
        return <CancelIcon fontSize="small" />;
      case EstadoLaboratorio.EN_ESPERA:
        return <WarningIcon fontSize="small" />;
      default:
        return <ScheduleIcon fontSize="small" />;
    }
  };

  const handleDeleteClick = (laboratory: Laboratory) => {
    setLaboratoryToDelete(laboratory);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!laboratoryToDelete) return;
    
    try {
      await laboratoryService.deleteLaboratory(laboratoryToDelete.id);
      await fetchLaboratories();
      setDeleteDialogOpen(false);
      setLaboratoryToDelete(null);
    } catch (err) {
      setError('Error al eliminar el análisis de laboratorio');
      console.error('Error deleting laboratory:', err);
    }
  };

  // Filter laboratories based on search term
  const filteredLaboratories = laboratories.filter(lab =>
    lab.order.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lab.order.provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lab.assignedUser?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginated laboratories
  const paginatedLaboratories = filteredLaboratories.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const totalPages = Math.ceil(filteredLaboratories.length / itemsPerPage);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Análisis de Laboratorio
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestiona los análisis y resultados de laboratorio de los pedidos
          </Typography>
        </Box>
        
        {hasPermissionToCreate && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            component={Link}
            to="/laboratory/new"
            sx={{ ml: 2 }}
          >
            Nuevo Análisis
          </Button>
        )}
      </Box>

      {/* Search and Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <SearchField
              fullWidth
              placeholder="Buscar por código de pedido, proveedor o analista..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setShowFilters(!showFilters)}
              >
                Filtros
              </Button>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={clearFilters}
              >
                Limpiar
              </Button>
            </Box>
          </Grid>
        </Grid>

        {/* Advanced Filters */}
        <Collapse in={showFilters}>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filters.estado || ''}
                  label="Estado"
                  onChange={(e) => handleFilterChange('estado', e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {Object.values(EstadoLaboratorio).map(estado => (
                    <MenuItem key={estado} value={estado}>{estado}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Fecha Desde"
                type="date"
                value={filters.fechaDesde || ''}
                onChange={(e) => handleFilterChange('fechaDesde', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Fecha Hasta"
                type="date"
                value={filters.fechaHasta || ''}
                onChange={(e) => handleFilterChange('fechaHasta', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </Collapse>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Laboratory Cards */}
      <Grid container spacing={3}>
        {paginatedLaboratories.map((laboratory) => (
          <Grid item xs={12} sm={6} md={4} key={laboratory.id}>
            <StyledCard>
              <CardContent>
                <Stack spacing={2}>
                  {/* Header */}
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Typography variant="h6" component="h2" noWrap>
                      {laboratory.order.codigo}
                    </Typography>
                    <Chip
                      icon={getEstadoIcon(laboratory.estado)}
                      label={laboratory.estado}
                      color={getEstadoColor(laboratory.estado)}
                      size="small"
                    />
                  </Box>

                  {/* Provider */}
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Proveedor
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {laboratory.order.provider.name}
                    </Typography>
                  </Box>

                  {/* Assigned User */}
                  {laboratory.assignedUser && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Analista Asignado
                      </Typography>
                      <Typography variant="body1">
                        {laboratory.assignedUser.name}
                      </Typography>
                    </Box>
                  )}

                  {/* Dates */}
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Fecha de Asignación
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(laboratory.fechaAsignacion)}
                    </Typography>
                  </Box>

                  {laboratory.fechaAnalisis && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Fecha de Análisis
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(laboratory.fechaAnalisis)}
                      </Typography>
                    </Box>
                  )}

                  {/* Quantity */}
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Cantidad
                    </Typography>
                    <Typography variant="body1">
                      {laboratory.order.cantidadEstimada} libras
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
              
              <CardActions sx={{ px: 2, pb: 2 }}>
                <Button
                  size="small"
                  component={Link}
                  to={`/laboratory/${laboratory.id}`}
                  startIcon={<ScienceIcon />}
                >
                  Ver Detalle
                </Button>
                
                {hasPermissionToEdit && (
                  <Button
                    size="small"
                    component={Link}
                    to={`/laboratory/${laboratory.id}/edit`}
                    startIcon={<EditIcon />}
                  >
                    Editar
                  </Button>
                )}
                
                {hasPermissionToDelete && (
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteClick(laboratory)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </CardActions>
            </StyledCard>
          </Grid>
        ))}
      </Grid>

      {/* Empty State */}
      {filteredLaboratories.length === 0 && !loading && (
        <Box textAlign="center" py={8}>
          <ScienceIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No se encontraron análisis de laboratorio
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            {searchTerm || Object.keys(filters).length > 0
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Crea el primer análisis de laboratorio'
            }
          </Typography>
          {hasPermissionToCreate && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              component={Link}
              to="/laboratory/new"
            >
              Nuevo Análisis
            </Button>
          )}
        </Box>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            color="primary"
            size="large"
          />
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar el análisis de laboratorio del pedido{' '}
            <strong>{laboratoryToDelete?.order.codigo}</strong>?
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LaboratoryList;

