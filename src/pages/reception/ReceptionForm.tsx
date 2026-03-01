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
  Alert,
  CircularProgress,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { TimeField } from '@mui/x-date-pickers/TimeField'
import dayjs, { Dayjs } from 'dayjs'
import { receptionService } from '../../services/reception.service'
import { CLASSIFICATION_OPTIONS, type Reception, type CreateReceptionData, type UpdateReceptionData, type OrderForSelection, type PackagerForSelection } from '../../types/reception.types'

interface Props {
  reception?: Reception
  onSuccess: (reception: Reception) => void
  onCancel: () => void
}

const ReceptionForm: React.FC<Props> = ({ reception, onSuccess, onCancel }) => {
  const isEdit = Boolean(reception)
  const [orders, setOrders] = useState<OrderForSelection[]>([])
  const [packagers, setPackagers] = useState<PackagerForSelection[]>([])
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
  const [selectedPackagerId, setSelectedPackagerId] = useState<number | ''>('')

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === orderId),
    [orders, orderId],
  )

  const orderPackagerId = selectedOrder?.packager?.id
  const effectivePackagerId = orderPackagerId || (selectedPackagerId !== '' ? Number(selectedPackagerId) : undefined)

  const minFechaLlegada = useMemo(() => {
    const fechaFinalizacionLogistica = selectedOrder?.logistica?.fechaFinalizacion
    if (!fechaFinalizacionLogistica) return null
    const parsed = dayjs(fechaFinalizacionLogistica)
    return parsed.isValid() ? parsed.startOf('day') : null
  }, [selectedOrder])

  const canSubmit = useMemo(() => {
    const hasOrder = orderId > 0
    const hasFecha = Boolean(fechaLlegada)
    const hasHora = Boolean(horaLlegada)
    const hasPeso = pesoRecibido !== '' && Number(pesoRecibido) > 0
    const hasClasificacion = clasificacionFinal.trim().length > 0
    const hasPrecio = precioFinalVenta !== '' && Number(precioFinalVenta) > 0
    const hasMotivoRechazo = loteAceptado || motivoRechazo.trim().length > 0
    const hasPackager = isEdit || Boolean(effectivePackagerId)

    return hasOrder && hasFecha && hasHora && hasPeso && hasClasificacion && hasPrecio && hasMotivoRechazo && hasPackager
  }, [
    orderId,
    fechaLlegada,
    horaLlegada,
    pesoRecibido,
    clasificacionFinal,
    precioFinalVenta,
    loteAceptado,
    motivoRechazo,
    isEdit,
    effectivePackagerId,
  ])

  useEffect(() => {
    const loadData = async () => {
      try {
        const [ordersData, packagersData] = await Promise.all([
          receptionService.getOrdersWithoutReception(),
          receptionService.getPackagers(),
        ])
        setOrders(ordersData)
        setPackagers(packagersData)
      } catch (err: any) {
        setError(err?.message || 'Error cargando datos')
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    if (fechaLlegada && minFechaLlegada && fechaLlegada.isBefore(minFechaLlegada, 'day')) {
      setFechaLlegada(minFechaLlegada)
    }
  }, [fechaLlegada, minFechaLlegada])

  const handleSubmit = async () => {
    if (!canSubmit || !fechaLlegada || !horaLlegada) {
      setError('Completa todos los campos obligatorios del formulario')
      return
    }

    if (minFechaLlegada && fechaLlegada.isBefore(minFechaLlegada, 'day')) {
      setError('La fecha de llegada no puede ser anterior a la fecha de finalización de logística')
      return
    }

    if (!isEdit && !effectivePackagerId) {
      setError('Debes seleccionar una empacadora para crear la recepción')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const payload: CreateReceptionData | UpdateReceptionData = {
        orderId,
        packagerId: !isEdit && !orderPackagerId && effectivePackagerId ? Number(effectivePackagerId) : undefined,
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
     
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
            gap: 2,
          }}
        >
          {!isEdit && (
            <Box>
              <FormControl fullWidth required>
                <InputLabel>Orden</InputLabel>
                <Select
                  label="Orden"
                  value={orderId || ''}
                  onChange={(e) => {
                    setOrderId(Number(e.target.value))
                    setSelectedPackagerId('')
                  }}
                >
                  {orders.map((order) => (
                    <MenuItem key={order.id} value={order.id}>
                      {order.codigo} — {order.provider.name}
                    </MenuItem>
                  ))}
                </Select>
                {orderId === 0 && <FormHelperText>Selecciona una orden</FormHelperText>}
              </FormControl>
            </Box>
          )}

          {!isEdit && orderId > 0 && (
            <Box>
              {selectedOrder?.packager ? (
                <TextField
                  fullWidth
                  label="Empacadora"
                  value={selectedOrder.packager.name}
                  InputProps={{ readOnly: true }}
                  helperText="Empacadora asociada a la orden"
                />
              ) : (
                <FormControl fullWidth required>
                  <InputLabel>Empacadora</InputLabel>
                  <Select
                    label="Empacadora"
                    value={selectedPackagerId}
                    onChange={(e) => setSelectedPackagerId(Number(e.target.value))}
                  >
                    <MenuItem value="" disabled>Selecciona una empacadora</MenuItem>
                    {packagers.map((packager) => (
                      <MenuItem key={packager.id} value={packager.id}>
                        {packager.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>La orden no tiene empacadora asignada. Debes seleccionar una para continuar.</FormHelperText>
                </FormControl>
              )}
            </Box>
          )}

          <Box>
            <DatePicker
              label="Fecha de llegada"
              value={fechaLlegada}
              onChange={(val) => setFechaLlegada(val)}
              minDate={minFechaLlegada || undefined}
              slotProps={{ textField: { fullWidth: true, required: true } }}
            />
          </Box>
          <Box>
            <TimeField
              label="Hora de llegada"
              format="HH:mm"
              value={horaLlegada}
              onChange={(val) => setHoraLlegada(val)}
              fullWidth
              required
            />
          </Box>

          <Box>
            <TextField
              label="Peso recibido (lb)"
              type="number"
              fullWidth
              required
              value={pesoRecibido}
              onChange={(e) => setPesoRecibido(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </Box>

          <Box>
            <FormControl fullWidth required>
              <InputLabel>Clasificación final</InputLabel>
              <Select
                label="Clasificación final"
                value={clasificacionFinal}
                onChange={(e) => setClasificacionFinal(e.target.value)}
              >
                <MenuItem value="" disabled>Selecciona clasificación</MenuItem>
                {CLASSIFICATION_OPTIONS.map((c) => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box>
            <TextField
              label="Precio final de venta"
              type="number"
              fullWidth
              required
              value={precioFinalVenta}
              onChange={(e) => setPrecioFinalVenta(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </Box>

          <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
            <TextField
              label="Condiciones de venta"
              fullWidth
              multiline
              minRows={2}
              value={condicionesVenta}
              onChange={(e) => setCondicionesVenta(e.target.value)}
            />
          </Box>

          <Box>
            <FormControlLabel
              control={<Switch checked={calidadValidada} onChange={(e) => setCalidadValidada(e.target.checked)} />}
              label="Calidad validada"
            />
          </Box>
          <Box>
            <FormControlLabel
              control={<Switch checked={loteAceptado} onChange={(e) => setLoteAceptado(e.target.checked)} />}
              label="Lote aceptado"
              required
            />
          </Box>

          {!loteAceptado && (
            <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
              <TextField
                label="Motivo de rechazo"
                fullWidth
                multiline
                minRows={2}
                required
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
              />
            </Box>
          )}

          <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
            <TextField
              label="Observaciones"
              fullWidth
              multiline
              minRows={3}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </Box>
        </Box>

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

