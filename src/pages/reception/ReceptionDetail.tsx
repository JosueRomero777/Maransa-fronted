import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import dayjs from 'dayjs';
import { receptionService } from '../../services/reception.service';
import type { Reception } from '../../types/reception.types';

interface ReceptionDetailProps {
  reception: Reception;
  onEdit: (reception: Reception) => void;
  onBack: () => void;
  onUpdate: (reception: Reception) => void;
  onDelete: (id: number) => void;
}

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

const ReceptionDetail: React.FC<ReceptionDetailProps> = ({
  reception,
  onEdit,
  onBack,
  onDelete
}) => {
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const formatCurrency = (amount?: number) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(amount);
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await receptionService.deleteReception(reception.id);
      onDelete(reception.id);
    } catch (error: any) {
      console.error('Error eliminando recepción:', error);
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <Grid item p={3}>
      <Grid item display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Grid item display="flex" alignItems="center" gap={2}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
          >
            Volver
          </Button>
          <Typography variant="h4">
            Detalle de Recepción
          </Typography>
        </Grid>
        <Grid item display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => onEdit(reception)}
          >
            Editar
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteDialogOpen(true)}
          >
            Eliminar
          </Button>
        </Grid>
      </Grid>

      <Grid item sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {/* Información General */}
        <Grid item sx={{ width: { xs: '100%', md: '50%' } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Información General
              </Typography>
              <Grid item sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Grid item sx={{ width: '100%' }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    ID de Recepción:
                  </Typography>
                  <Typography variant="body1">
                    {reception.id}
                  </Typography>
                </Grid>
                <Grid item sx={{ width: '100%' }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Fecha y Hora de Llegada:
                  </Typography>
                  <Typography variant="body1">
                    {dayjs(reception.fechaLlegada).format('DD/MM/YYYY')} - {reception.horaLlegada}
                  </Typography>
                </Grid>
                <Grid item sx={{ width: '50%', display: 'inline-block', verticalAlign: 'top' }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Estado del Lote:
                  </Typography>
                  <Chip
                    label={
                      reception.loteAceptado 
                        ? (reception.calidadValidada ? 'Aceptado y Validado' : 'Aceptado - Pendiente validación')
                        : 'Rechazado'
                    }
                    color={getStatusColor(reception.loteAceptado, reception.calidadValidada)}
                    size="small"
                  />
                </Grid>
                <Grid item sx={{ width: '50%', display: 'inline-block', verticalAlign: 'top' }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Clasificación:
                  </Typography>
                  {reception.clasificacionFinal ? (
                    <Chip
                      label={reception.clasificacionFinal}
                      color={getClassificationColor(reception.clasificacionFinal)}
                      size="small"
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Sin clasificar
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Información de la Orden */}
        {reception.order && (
          <Grid item sx={{ width: { xs: '100%', md: '50%' } }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Información de la Orden
                </Typography>
                <Grid item sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Grid item sx={{ width: '100%' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Código de Orden:
                    </Typography>
                    <Typography variant="body1">
                      {reception.order.codigo}
                    </Typography>
                  </Grid>
                  <Grid item sx={{ width: '100%' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Proveedor:
                    </Typography>
                    <Typography variant="body1">
                      {reception.order.provider.name} - {reception.order.provider.location}
                    </Typography>
                  </Grid>
                  <Grid item sx={{ width: '50%', display: 'inline-block', verticalAlign: 'top' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Cantidad Estimada:
                    </Typography>
                    <Typography variant="body1">
                      {reception.order.cantidadEstimada} kg
                    </Typography>
                  </Grid>
                  <Grid item sx={{ width: '50%', display: 'inline-block', verticalAlign: 'top' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Precio Estimado:
                    </Typography>
                    <Typography variant="body1">
                      {formatCurrency(reception.order.precioEstimadoCompra)}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Información de Recepción */}
        <Grid item sx={{ width: { xs: '100%', md: '50%' } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Datos de Recepción
              </Typography>
              <Grid item sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Grid item sx={{ width: '50%' }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Peso Recibido:
                  </Typography>
                  <Typography variant="body1">
                    {reception.pesoRecibido || 'N/A'} kg
                  </Typography>
                </Grid>
                <Grid item sx={{ width: '50%' }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Precio Final:
                  </Typography>
                  <Typography variant="body1">
                    {formatCurrency(reception.precioFinalVenta)}
                  </Typography>
                </Grid>
                {reception.condicionesVenta && (
                  <Grid item sx={{ width: '100%' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Condiciones de Venta:
                    </Typography>
                    <Typography variant="body1">
                      {reception.condicionesVenta}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Motivo de Rechazo */}
        {!reception.loteAceptado && reception.motivoRechazo && (
          <Grid item sx={{ width: { xs: '100%', md: '50%' } }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="error">
                  Motivo de Rechazo
                </Typography>
                <Typography variant="body1">
                  {reception.motivoRechazo}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Observaciones */}
        {reception.observaciones && (
          <Grid item sx={{ width: '100%' }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Observaciones
                </Typography>
                <Typography variant="body1">
                  {reception.observaciones}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Análisis de Comparación */}
        {reception.order && reception.pesoRecibido && reception.precioFinalVenta && (
          <Grid item sx={{ width: '100%' }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Análisis Comparativo
                </Typography>
                <Grid item sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  <Grid item sx={{ width: { xs: '100%', md: '25%' } }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Diferencia de Peso:
                    </Typography>
                    <Typography 
                      variant="h6"
                      color={
                        reception.pesoRecibido >= reception.order.cantidadEstimada 
                          ? 'success.main' 
                          : 'error.main'
                      }
                    >
                      {(reception.pesoRecibido - reception.order.cantidadEstimada).toFixed(2)} kg
                    </Typography>
                  </Grid>
                  <Grid item sx={{ width: { xs: '100%', md: '25%' } }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Diferencia de Precio:
                    </Typography>
                    <Typography 
                      variant="h6"
                      color={
                        reception.precioFinalVenta >= reception.order.precioEstimadoCompra 
                          ? 'success.main' 
                          : 'error.main'
                      }
                    >
                      {formatCurrency(reception.precioFinalVenta - reception.order.precioEstimadoCompra)}
                    </Typography>
                  </Grid>
                  <Grid item sx={{ width: { xs: '100%', md: '25%' } }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Valor Estimado:
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(reception.order.cantidadEstimada * reception.order.precioEstimadoCompra)}
                    </Typography>
                  </Grid>
                  <Grid item sx={{ width: { xs: '100%', md: '25%' } }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Valor Final:
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(reception.pesoRecibido * reception.precioFinalVenta)}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Dialog de confirmación para eliminar */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea eliminar esta recepción? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <LoadingButton
            onClick={handleDelete}
            loading={loading}
            color="error"
            variant="contained"
          >
            Eliminar
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default ReceptionDetail;
