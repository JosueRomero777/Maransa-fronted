import { useEffect, useState } from 'react';
import { custodyService, Custody, EstadoCustodia, CustodyFilterDto } from '../services/custody.service';
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
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  Shield as ShieldIcon,
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

const CustodyList = () => {
  const [custodies, setCustodies] = useState<Custody[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [custodyToDelete, setCustodyToDelete] = useState<Custody | null>(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(12);
  
  // Filters
  const [filters, setFilters] = useState<CustodyFilterDto>({});
  const [searchTerm, setSearchTerm] = useState('');
  
  const { user } = useAuth();
  const navigate = useNavigate();

  const hasPermissionToCreate = ['ADMIN', 'CUSTODIA', 'LOGISTICA'].includes(user?.role || '');
  const hasPermissionToEdit = ['ADMIN', 'CUSTODIA'].includes(user?.role || '');
  const hasPermissionToDelete = ['ADMIN'].includes(user?.role || '');

  useEffect(() => {
    fetchCustodies();
  }, [filters]);

  const fetchCustodies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await custodyService.listCustodies(filters);
      setCustodies(data);
    } catch (err) {
      setError('Error al cargar los registros de custodia');
      console.error('Error fetching custodies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof CustodyFilterDto, value: any) => {
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

  const getEstadoColor = (estado: EstadoCustodia) => {
    switch (estado) {
      case EstadoCustodia.PENDIENTE:
        return 'default';
      case EstadoCustodia.ASIGNADO:
        return 'info';
      case EstadoCustodia.EN_CUSTODIA:
        return 'warning';
      case EstadoCustodia.COMPLETADO:
        return 'success';
      default:
        return 'default';
    }
  };

  const getEstadoIcon = (estado: EstadoCustodia) => {
    switch (estado) {
      case EstadoCustodia.PENDIENTE:
        return <ScheduleIcon fontSize="small" />;
      case EstadoCustodia.ASIGNADO:
        return <AssignmentIcon fontSize="small" />;
      case EstadoCustodia.EN_CUSTODIA:
        return <SecurityIcon fontSize="small" />;
      case EstadoCustodia.COMPLETADO:
        return <CheckCircleIcon fontSize="small" />;
      default:
        return <ScheduleIcon fontSize="small" />;
    }
  };

  const handleDeleteClick = (custody: Custody) => {
    setCustodyToDelete(custody);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!custodyToDelete) return;
    
    try {
      await custodyService.deleteCustody(custodyToDelete.id);
      await fetchCustodies();
      setDeleteDialogOpen(false);
      setCustodyToDelete(null);
    } catch (err) {
      setError('Error al eliminar el registro de custodia');
      console.error('Error deleting custody:', err);
    }
  };

  // Filter custodies based on search term
  const filteredCustodies = custodies.filter(custody =>
    custody.order.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    custody.order.provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (custody.vehiculoCustodia || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (custody.assignedUser?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginated custodies
  const paginatedCustodies = filteredCustodies.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const totalPages = Math.ceil(filteredCustodies.length / itemsPerPage);

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
            Gestión de Custodia
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Administra la custodia y seguridad de los envíos
          </Typography>
        </Box>
        
        {hasPermissionToCreate && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            component={Link}
            to="/custody/new"
            sx={{ ml: 2 }}
          >
            Nueva Custodia
          </Button>
        )}
      </Box>

      {/* Search and Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <SearchField
              fullWidth
              placeholder="Buscar por código, proveedor, vehículo..."
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
                  {Object.values(EstadoCustodia).map(estado => (
                    <MenuItem key={estado} value={estado}>{estado}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Vehículo"
                value={filters.vehiculoCustodia || ''}
                onChange={(e) => handleFilterChange('vehiculoCustodia', e.target.value)}
              />
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

      {/* Custody Cards */}
      <Grid container spacing={3}>
        {paginatedCustodies.map((custody) => (
          <Grid item xs={12} sm={6} md={4} key={custody.id}>
            <StyledCard>
              <CardContent>
                <Stack spacing={2}>
                  {/* Header */}
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Typography variant="h6" component="h2" noWrap>
                      {custody.order.codigo}
                    </Typography>
                    <Chip
                      icon={getEstadoIcon(custody.estado)}
                      label={custody.estado}
                      color={getEstadoColor(custody.estado)}
                      size="small"
                    />
                  </Box>

                  {/* Provider */}
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Proveedor
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {custody.order.provider.name}
                    </Typography>
                  </Box>

                  {/* Vehicle */}
                  {custody.vehiculoCustodia && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Vehículo de Custodia
                      </Typography>
                      <Typography variant="body1">
                        {custody.vehiculoCustodia}
                      </Typography>
                    </Box>
                  )}

                  {/* Assigned Personnel */}
                  {custody.personalAsignado && custody.personalAsignado.length > 0 && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Personal Asignado
                      </Typography>
                      <Typography variant="body2">
                        {custody.personalAsignado.join(', ')}
                      </Typography>
                    </Box>
                  )}

                  {/* Assigned User */}
                  {custody.assignedUser && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Responsable Asignado
                      </Typography>
                      <Typography variant="body1">
                        {custody.assignedUser.name}
                      </Typography>
                    </Box>
                  )}

                  {/* Dates */}
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Fecha de Asignación
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(custody.fechaAsignacion)}
                    </Typography>
                  </Box>

                  {/* Incidents */}
                  {custody.incidentes && custody.incidentes.length > 0 && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Incidentes
                      </Typography>
                      <Chip
                        size="small"
                        label={`${custody.incidentes.length} incidente(s)`}
                        color="warning"
                      />
                    </Box>
                  )}

                  {/* Quantity */}
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Cantidad
                    </Typography>
                    <Typography variant="body1">
                      {custody.order.cantidadEstimada} libras
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
              
              <CardActions sx={{ px: 2, pb: 2 }}>
                <Button
                  size="small"
                  component={Link}
                  to={`/custody/${custody.id}`}
                  startIcon={<ShieldIcon />}
                >
                  Ver Detalle
                </Button>
                
                {hasPermissionToEdit && (
                  <Button
                    size="small"
                    component={Link}
                    to={`/custody/${custody.id}/edit`}
                    startIcon={<EditIcon />}
                  >
                    Editar
                  </Button>
                )}
                
                {hasPermissionToDelete && (
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteClick(custody)}
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
      {filteredCustodies.length === 0 && !loading && (
        <Box textAlign="center" py={8}>
          <SecurityIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No se encontraron registros de custodia
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            {searchTerm || Object.keys(filters).length > 0
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Crea el primer registro de custodia'
            }
          </Typography>
          {hasPermissionToCreate && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              component={Link}
              to="/custody/new"
            >
              Nueva Custodia
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
            ¿Estás seguro de que deseas eliminar el registro de custodia del pedido{' '}
            <strong>{custodyToDelete?.order.codigo}</strong>?
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

export default CustodyList;
