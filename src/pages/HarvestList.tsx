import { useEffect, useState } from 'react';
import { harvestService, Harvest, EstadoCosecha, HarvestFilterDto } from '../services/harvest.service';
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
  Agriculture as AgricultureIcon,
  CheckCircle as CheckCircleIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
  Eco as EcoIcon,
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

const HarvestList = () => {
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [harvestToDelete, setHarvestToDelete] = useState<Harvest | null>(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(12);
  
  // Filters
  const [filters, setFilters] = useState<HarvestFilterDto>({});
  const [searchTerm, setSearchTerm] = useState('');
  
  const { user } = useAuth();
  const navigate = useNavigate();

  const hasPermissionToCreate = ['ADMIN', 'COMPRAS', 'LABORATORIO'].includes(user?.role || '');
  const hasPermissionToEdit = ['ADMIN', 'COMPRAS', 'LABORATORIO'].includes(user?.role || '');
  const hasPermissionToDelete = ['ADMIN'].includes(user?.role || '');

  useEffect(() => {
    fetchHarvests();
  }, [filters]);

  const fetchHarvests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await harvestService.listHarvests(filters);
      setHarvests(data);
    } catch (err) {
      setError('Error al cargar las definiciones de cosecha');
      console.error('Error fetching harvests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof HarvestFilterDto, value: any) => {
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

  const getEstadoColor = (estado: EstadoCosecha) => {
    switch (estado) {
      case EstadoCosecha.PENDIENTE:
        return 'default';
      case EstadoCosecha.EN_DEFINICION:
        return 'info';
      case EstadoCosecha.DEFINIDA:
        return 'warning';
      case EstadoCosecha.APROBADA:
        return 'success';
      case EstadoCosecha.RECHAZADA:
        return 'error';
      default:
        return 'default';
    }
  };

  const getEstadoIcon = (estado: EstadoCosecha) => {
    switch (estado) {
      case EstadoCosecha.PENDIENTE:
        return <ScheduleIcon fontSize="small" />;
      case EstadoCosecha.EN_DEFINICION:
        return <AssignmentIcon fontSize="small" />;
      case EstadoCosecha.DEFINIDA:
        return <EcoIcon fontSize="small" />;
      case EstadoCosecha.APROBADA:
        return <CheckCircleIcon fontSize="small" />;
      case EstadoCosecha.RECHAZADA:
        return <CancelIcon fontSize="small" />;
      default:
        return <ScheduleIcon fontSize="small" />;
    }
  };

  const handleDeleteClick = (harvest: Harvest) => {
    setHarvestToDelete(harvest);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!harvestToDelete) return;
    
    try {
      await harvestService.deleteHarvest(harvestToDelete.id);
      await fetchHarvests();
      setDeleteDialogOpen(false);
      setHarvestToDelete(null);
    } catch (err) {
      setError('Error al eliminar la definición de cosecha');
      console.error('Error deleting harvest:', err);
    }
  };

  // Filter harvests based on search term
  const filteredHarvests = harvests.filter(harvest =>
    harvest.order.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    harvest.order.provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (harvest.assignedUser?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginated harvests
  const paginatedHarvests = filteredHarvests.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const totalPages = Math.ceil(filteredHarvests.length / itemsPerPage);

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
            Definición de Cosechas
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestiona las cantidades finales y fechas de cosecha
          </Typography>
        </Box>
        
        {hasPermissionToCreate && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            component={Link}
            to="/harvest/new"
            sx={{ ml: 2 }}
          >
            Nueva Definición
          </Button>
        )}
      </Box>

      {/* Search and Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <SearchField
              fullWidth
              placeholder="Buscar por código, proveedor, responsable..."
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
                  {Object.values(EstadoCosecha).map(estado => (
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

      {/* Harvest Cards */}
      <Grid container spacing={3}>
        {paginatedHarvests.map((harvest) => (
          <Grid item xs={12} sm={6} md={4} key={harvest.id}>
            <StyledCard>
              <CardContent>
                <Stack spacing={2}>
                  {/* Header */}
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Typography variant="h6" component="h2" noWrap>
                      {harvest.order.codigo}
                    </Typography>
                    <Chip
                      icon={getEstadoIcon(harvest.estado)}
                      label={harvest.estado}
                      color={getEstadoColor(harvest.estado)}
                      size="small"
                    />
                  </Box>

                  {/* Provider */}
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Proveedor
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {harvest.order.provider.name}
                    </Typography>
                  </Box>

                  {/* Assigned User */}
                  {harvest.assignedUser && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Responsable Asignado
                      </Typography>
                      <Typography variant="body1">
                        {harvest.assignedUser.name}
                      </Typography>
                    </Box>
                  )}

                  {/* Quantities */}
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Cantidad Estimada
                    </Typography>
                    <Typography variant="body1">
                      {harvest.cantidadEstimada || harvest.order.cantidadEstimada} libras
                    </Typography>
                  </Box>

                  {harvest.cantidadFinal && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Cantidad Final
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {harvest.cantidadFinal} libras
                      </Typography>
                    </Box>
                  )}

                  {/* Dates */}
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Fecha de Asignación
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(harvest.fechaAsignacion)}
                    </Typography>
                  </Box>

                  {harvest.fechaDefinitiva && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Fecha Definitiva
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {formatDate(harvest.fechaDefinitiva)}
                      </Typography>
                    </Box>
                  )}

                  {/* Quality */}
                  {harvest.calidadEsperada && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Calidad Esperada
                      </Typography>
                      <Chip
                        size="small"
                        label={harvest.calidadEsperada}
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                  )}
                </Stack>
              </CardContent>
              
              <CardActions sx={{ px: 2, pb: 2 }}>
                <Button
                  size="small"
                  component={Link}
                  to={`/harvest/${harvest.id}`}
                  startIcon={<AgricultureIcon />}
                >
                  Ver Detalle
                </Button>
                
                {hasPermissionToEdit && (
                  <Button
                    size="small"
                    component={Link}
                    to={`/harvest/${harvest.id}/edit`}
                    startIcon={<EditIcon />}
                  >
                    Editar
                  </Button>
                )}
                
                {hasPermissionToDelete && (
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteClick(harvest)}
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
      {filteredHarvests.length === 0 && !loading && (
        <Box textAlign="center" py={8}>
          <AgricultureIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No se encontraron definiciones de cosecha
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            {searchTerm || Object.keys(filters).length > 0
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Crea la primera definición de cosecha'
            }
          </Typography>
          {hasPermissionToCreate && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              component={Link}
              to="/harvest/new"
            >
              Nueva Definición
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
            ¿Estás seguro de que deseas eliminar la definición de cosecha del pedido{' '}
            <strong>{harvestToDelete?.order.codigo}</strong>?
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

export default HarvestList;
