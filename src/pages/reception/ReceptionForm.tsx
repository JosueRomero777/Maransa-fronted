import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { TimeField } from '@mui/x-date-pickers/TimeField'
import dayjs, { Dayjs } from 'dayjs'
import { receptionService } from '../../services/reception.service'
import type { Reception, CreateReceptionData, UpdateReceptionData, OrderForSelection } from '../../types/reception.types'

interface Props {
  reception?: Reception
  onSuccess: (reception: Reception) => void
  onCancel: () => void
}

const ReceptionForm: React.FC<Props> = ({ reception, onSuccess, onCancel }) => {
  const isEdit = Boolean(reception)
  const [orders, setOrders] = useState<OrderForSelection[]>([])
  const [classifications, setClassifications] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [fechaLlegada, setFechaLlegada] = useState<Dayjs | null>(reception ? dayjs(reception.fechaLlegada) : dayjs())
  const [horaLlegada, setHoraLlegada] = useState<Dayjs | null>(reception ? dayjs(reception.horaLlegada, 'HH:mm') : dayjs())
  const [orderId, setOrderId] = useState<number>(reception?.orderId ?? 0)
  const [pesoRecibido, setPesoRecibido] = useState<number | ''>(reception?.pesoRecibido ?? '')
  const [calidadValidada, setCalidadValidada] = useState<boolean>(reception?.calidadValidada ?? false)
  const [loteAceptado, setLoteAceptado] = useState<boolean>(reception?.loteAceptado ?? false)
  const [motivoRechazo, setMotivoRechazo] = useState<string>(reception?.motivoRechazo ?? '')
  const [clasificacionFinal, setClasificacionFinal] = useState<string>(reception?.clasificacionFinal ?? '')
  const [precioFinalVenta, setPrecioFinalVenta] = useState<number | ''>(reception?.precioFinalVenta ?? '')
  const [condicionesVenta, setCondicionesVenta] = useState<string>(reception?.condicionesVenta ?? '')
  const [observaciones, setObservaciones] = useState<string>(reception?.observaciones ?? '')

  const canSubmit = useMemo(() => orderId > 0 && fechaLlegada && horaLlegada, [orderId, fechaLlegada, horaLlegada])

  useEffect(() => {
    const loadData = async () => {
      try {
        const [ordersData, classificationsData] = await Promise.all([
          receptionService.getOrdersWithoutReception(),
          receptionService.getClassifications(),
        ])
        setOrders(ordersData)
        setClassifications(classificationsData)
      } catch (err: any) {
        setError(err?.message || 'Error cargando datos')
      }
    }
    loadData()
  }, [])

  const handleSubmit = async () => {
    if (!canSubmit || !fechaLlegada || !horaLlegada) return
    setLoading(true)
    setError(null)
    try {
      const payload: CreateReceptionData | UpdateReceptionData = {
        orderId,
        fechaLlegada: fechaLlegada.format('YYYY-MM-DD'),
        horaLlegada: horaLlegada.format('HH:mm'),
        pesoRecibido: pesoRecibido === '' ? undefined : Number(pesoRecibido),
        calidadValidada,
        loteAceptado,
        motivoRechazo: motivoRechazo || undefined,
        clasificacionFinal: clasificacionFinal || undefined,
        precioFinalVenta: precioFinalVenta === '' ? undefined : Number(precioFinalVenta),
        condicionesVenta: condicionesVenta || undefined,
        observaciones: observaciones || undefined,
      }

      const saved = isEdit && reception
        ? await receptionService.updateReception(reception.id, payload)
        : await receptionService.createReception(payload as CreateReceptionData)

      onSuccess(saved)
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card sx={{ maxWidth: 900, mx: 'auto', mt: 2 }}>
      <CardHeader
        title={isEdit ? 'Editar Recepción' : 'Nueva Recepción'}
        subheader="Completa la información de la recepción"
      />
      <CardContent>
        <Grid container spacing={2}>
          {!isEdit && (
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Orden</InputLabel>
                <Select
                  label="Orden"
                  value={orderId || ''}
                  onChange={(e) => setOrderId(Number(e.target.value))}
                >
                  {orders.map((order) => (
                    <MenuItem key={order.id} value={order.id}>
                      {order.codigo} — {order.provider.name}
                    </MenuItem>
                  ))}
                </Select>
                {orderId === 0 && <FormHelperText>Selecciona una orden</FormHelperText>}
              </FormControl>
            </Grid>
          )}

          <Grid item xs={12} sm={6}>
            <DatePicker
              label="Fecha de llegada"
              value={fechaLlegada}
              onChange={(val) => setFechaLlegada(val)}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TimeField
              label="Hora de llegada"
              format="HH:mm"
              value={horaLlegada}
              onChange={(val) => setHoraLlegada(val)}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Peso recibido (lb)"
              type="number"
              fullWidth
              value={pesoRecibido}
              onChange={(e) => setPesoRecibido(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Clasificación final</InputLabel>
              <Select
                label="Clasificación final"
                value={clasificacionFinal}
                onChange={(e) => setClasificacionFinal(e.target.value)}
              >
                <MenuItem value="">No asignada</MenuItem>
                {classifications.map((c) => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Precio final de venta"
              type="number"
              fullWidth
              value={precioFinalVenta}
              onChange={(e) => setPrecioFinalVenta(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Condiciones de venta"
              fullWidth
              multiline
              minRows={2}
              value={condicionesVenta}
              onChange={(e) => setCondicionesVenta(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={<Switch checked={calidadValidada} onChange={(e) => setCalidadValidada(e.target.checked)} />}
              label="Calidad validada"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={<Switch checked={loteAceptado} onChange={(e) => setLoteAceptado(e.target.checked)} />}
              label="Lote aceptado"
            />
          </Grid>

          {!loteAceptado && (
            <Grid item xs={12}>
              <TextField
                label="Motivo de rechazo"
                fullWidth
                multiline
                minRows={2}
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
              />
            </Grid>
          )}

          <Grid item xs={12}>
            <TextField
              label="Observaciones"
              fullWidth
              multiline
              minRows={3}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </Grid>
        </Grid>

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

        <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
          <Button onClick={onCancel} color="inherit" disabled={loading}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            startIcon={loading ? <CircularProgress size={18} /> : undefined}
          >
            {isEdit ? 'Actualizar' : 'Crear'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  )
}

export default ReceptionForm

