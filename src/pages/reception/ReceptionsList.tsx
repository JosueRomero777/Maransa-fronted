import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Box,
  Grid,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { styled } from '@mui/material/styles';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { receptionService } from '../../services/reception.service';
import type { Reception, ReceptionFilter } from '../../types/reception.types';
import ReceptionForm from './ReceptionForm';
import ReceptionDetail from './ReceptionDetail';

// Configurar dayjs en español
dayjs.locale('es');

const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    elevation: 8,
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[8]
  }
}));

const getStatusColor = (loteAceptado?: boolean, calidadValidada?: boolean) => {
  if (loteAceptado && calidadValidada) return 'success';
  if (loteAceptado === false) return 'error';
  if (calidadValidada) return 'info';
  return 'default';
};

const getClassificationColor = (classification?: string) => {
  switch (classification) {
    case 'PREMIUM':
      return 'success';
    case 'EXTRA':
      return 'info';
    case 'PRIMERA':
      return 'primary';
    case 'SEGUNDA':
      return 'warning';
    case 'TERCERA':
      return 'secondary';
    case 'RECHAZO':
      return 'error';
    default:
      return 'default';
  }
};

const ReceptionsList: React.FC = () => {
  const [receptions, setReceptions] = useState<Reception[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [selectedReception, setSelectedReception] = useState<Reception | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [editingReception, setEditingReception] = useState<Reception | null>(null);
  const [classifications, setClassifications] = useState<string[]>([]);

  // Filtros
  const [filters, setFilters] = useState<ReceptionFilter>({
    page: 1,
    limit: 12
  });

  useEffect(() => {
    fetchReceptions();
    fetchDropdownData();
  }, [filters]);

  const fetchDropdownData = async () => {
    try {
      const classificationData = await receptionService.getClassifications();
      setClassifications(classificationData);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const fetchReceptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await receptionService.getReceptions(filters);
      setReceptions(response.data);
      setTotalPages(response.totalPages);
      setTotal(response.total);
      setCurrentPage(response.page);
    } catch (error: any) {
      setError('Error fetching receptions: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: keyof ReceptionFilter, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: field === 'page' ? value : 1
    }));
  };

  const handleReceptionCreated = (newReception: Reception) => {
    setReceptions(prev => [newReception, ...prev]);
    setShowForm(false);
    setTotal(prev => prev + 1);
  };

  const handleReceptionUpdated = (updatedReception: Reception) => {
    setReceptions(prev => 
      prev.map(r => r.id === updatedReception.id ? updatedReception : r)
    );
    setEditingReception(null);
    setShowDetail(false);
  };

  const handleReceptionDeleted = (deletedId: number) => {
    setReceptions(prev => prev.filter(r => r.id !== deletedId));
    setShowDetail(false);
    setSelectedReception(null);
    setTotal(prev => prev - 1);
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(amount);
  };

  if (showForm) {
    return (
      <ReceptionForm
        onSuccess={handleReceptionCreated}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  if (showDetail && selectedReception) {
    return (
      <ReceptionDetail
        reception={selectedReception}
        onEdit={setEditingReception}
        onBack={() => {
          setShowDetail(false);
          setSelectedReception(null);
        }}
        onUpdate={handleReceptionUpdated}
        onDelete={handleReceptionDeleted}
      />
    );
  }

  if (editingReception) {
    return (
      <ReceptionForm
        reception={editingReception}
        onSuccess={handleReceptionUpdated}
        onCancel={() => setEditingReception(null)}
      />
    );
  }

  return (
    <Grid item p={3}>
      <Grid item display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Recepciones en Empacadora
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setShowForm(true)}
          size="large"
        >
          Nueva Recepción
        </Button>
      </Grid>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filtros
          </Typography>
          <Grid item sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'start' }}>
            <Grid item sx={{ minWidth: 200, flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(25% - 12px)' } }}>
              <TextField
                label="Buscar"
                fullWidth
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Buscar por orden, proveedor..."
              />
            </Grid>
            <Grid item sx={{ minWidth: 200, flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(25% - 12px)' } }}>
              <FormControl fullWidth>
                <InputLabel>Clasificación</InputLabel>
                <Select
                  value={filters.clasificacionFinal || ''}
                  label="Clasificación"
                  onChange={(e) => handleFilterChange('clasificacionFinal', e.target.value)}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {classifications.map(classification => (
                    <MenuItem key={classification} value={classification}>
                      {classification}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item sx={{ minWidth: 200, flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(25% - 12px)' } }}>
              <DatePicker
                label="Fecha desde"
                value={filters.fechaLlegadaDesde ? dayjs(filters.fechaLlegadaDesde) : null}
                onChange={(date) => handleFilterChange('fechaLlegadaDesde', date?.format('YYYY-MM-DD'))}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    InputProps: {
                      readOnly: true,
                    },
                  }
                }}
              />
            </Grid>
            <Grid item sx={{ minWidth: 200, flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(25% - 12px)' } }}>
              <DatePicker
                label="Fecha hasta"
                value={filters.fechaLlegadaHasta ? dayjs(filters.fechaLlegadaHasta) : null}
                onChange={(date) => handleFilterChange('fechaLlegadaHasta', date?.format('YYYY-MM-DD'))}
                minDate={filters.fechaLlegadaDesde ? dayjs(filters.fechaLlegadaDesde) : undefined}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    InputProps: {
                      readOnly: true,
                    },
                  }
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Grid item display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Grid>
      ) : (
        <>
          <Typography variant="h6" gutterBottom>
            {total} recepciones encontradas
          </Typography>
          
          <Grid item sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {receptions.map((reception) => (
              <Grid item key={reception.id} sx={{ width: { xs: '100%', md: '50%', lg: '33.33%' } }}>
                <StyledCard
                  onClick={() => {
                    setSelectedReception(reception);
                    setShowDetail(true);
                  }}
                >
                  <CardContent>
                    <Grid item display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Typography variant="h6" component="h3">
                        {reception.order?.codigo || `Orden #${reception.orderId}`}
                      </Typography>
                      <Chip
                        label={
                          reception.loteAceptado 
                            ? (reception.calidadValidada ? 'Aceptado' : 'Pendiente validación')
                            : 'Rechazado'
                        }
                        color={getStatusColor(reception.loteAceptado, reception.calidadValidada)}
                        size="small"
                      />
                    </Grid>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {reception.order?.provider?.name} - {reception.order?.provider?.location}
                    </Typography>
                    
                    {reception.clasificacionFinal && (
                      <Chip
                        label={reception.clasificacionFinal}
                        color={getClassificationColor(reception.clasificacionFinal)}
                        size="small"
                        sx={{ mb: 1 }}
                      />
                    )}
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <Grid item sx={{ display: 'flex', gap: 1 }}>
                      <Grid item sx={{ width: '50%' }}>
                        <Typography variant="caption" color="text.secondary">
                          Peso Recibido:
                        </Typography>
                        <Typography variant="body2">
                          {reception.pesoRecibido || 'N/A'} kg
                        </Typography>
                      </Grid>
                      <Grid item sx={{ width: '50%' }}>
                        <Typography variant="caption" color="text.secondary">
                          Precio Final:
                        </Typography>
                        <Typography variant="body2">
                          {formatCurrency(reception.precioFinalVenta)}
                        </Typography>
                      </Grid>
                    </Grid>
                    
                    <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                      {dayjs(reception.fechaLlegada).format('DD/MM/YYYY')} - {reception.horaLlegada}
                    </Typography>
                  </CardContent>
                </StyledCard>
              </Grid>
            ))}
          </Grid>

          {/* Paginación */}
          {totalPages > 1 && (
            <Grid item display="flex" justifyContent="center" mt={3}>
              <Grid item display="flex" gap={1}>
                <Button
                  disabled={currentPage === 1}
                  onClick={() => handleFilterChange('page', currentPage - 1)}
                >
                  Anterior
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={page === currentPage ? 'contained' : 'outlined'}
                    onClick={() => handleFilterChange('page', page)}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  disabled={currentPage === totalPages}
                  onClick={() => handleFilterChange('page', currentPage + 1)}
                >
                  Siguiente
                </Button>
              </Grid>
            </Grid>
          )}
        </>
      )}
    </Grid>
  );
};

export default ReceptionsList;
