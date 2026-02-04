import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Grid,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  useTheme,
  alpha,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Stack,
  TextField,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  TrendingUp as TrendingIcon,
  CompareArrows as CompareIcon,
  Assessment as AssessmentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { statisticsService } from '../services/statistics.service';
import dayjs from 'dayjs';

interface ComparisonData {
  calibre: string;
  averageRealPrice: number;
  averagePredictedPrice: number;
  difference: number;
  percentageDifference: number;
  receptionCount: number;
  predictionCount: number;
}

interface Metrics {
  totalMatches: number;
  totalReceptions: number;
  totalPredictions: number;
  averageDifference: number;
  maxDifference: number;
  minDifference: number;
  accuracy: number;
}

const StatisticsPage: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [presentacion, setPresentacion] = useState<string>('');
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(
    dayjs().subtract(30, 'days')
  );
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(dayjs());

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener comparación de predicciones vs recepciones
      const comparisonRes = await statisticsService.getPredictionsVsReceptions(
        undefined,
        presentacion || undefined,
        startDate ? startDate.format('YYYY-MM-DD') : undefined,
        endDate ? endDate.format('YYYY-MM-DD') : undefined
      );
      
      if (comparisonRes.summary && Array.isArray(comparisonRes.summary)) {
        setComparisonData(comparisonRes.summary);
        
        // Calcular métricas agregadas
        if (comparisonRes.summary.length > 0) {
          const avgAccuracy = comparisonRes.summary.reduce((sum, c) => sum + (c.averageAccuracy || 0), 0) / comparisonRes.summary.length;
          const avgDiff = comparisonRes.summary.reduce((sum, c) => sum + (c.difference || 0), 0) / comparisonRes.summary.length;
          const maxDiff = Math.max(...comparisonRes.summary.map(c => c.difference || 0));
          const minDiff = Math.min(...comparisonRes.summary.map(c => c.difference || 0));
          const totalMatches = comparisonRes.totalMatches || 0;
          
          setMetrics({
            totalMatches,
            totalReceptions: comparisonRes.totalReceptions || 0,
            totalPredictions: 0,
            averageDifference: avgDiff,
            maxDifference: maxDiff,
            minDifference: minDiff,
            accuracy: avgAccuracy,
          });
        }
      }
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
      setError('No se pudieron cargar las estadísticas. Intenta más tarde.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [presentacion, startDate, endDate]);

  const getAccuracyColor = (accuracy: number | undefined): 'success' | 'warning' | 'error' => {
    if (!accuracy) return 'error';
    if (accuracy >= 85) return 'success';
    if (accuracy >= 70) return 'warning';
    return 'error';
  };

  const getPriceVarianceColor = (percentageDiff: number): string => {
    if (percentageDiff <= 5) return theme.palette.success.main;
    if (percentageDiff <= 15) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          <AssessmentIcon sx={{ fontSize: 32 }} />
          Estadísticas de Predicciones
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Análisis de precisión: Comparativa entre precios predichos y precios reales de recepciones
        </Typography>
      </Box>

      {/* Filtros */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3,
          border: `1px solid ${theme.palette.divider}`,
          background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.02)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: 2,
          alignItems: 'flex-end'
        }}
      >
        <Box>
            <FormControl fullWidth size="small">
              <InputLabel>Presentación</InputLabel>
              <Select
                value={presentacion}
                label="Presentación"
                onChange={(e) => setPresentacion(e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="HEADLESS">Sin Cabeza</MenuItem>
                <MenuItem value="WHOLE">Entero con Cabeza</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box>
            <DatePicker
              label="Fecha Desde"
              value={startDate}
              onChange={(newValue) => setStartDate(newValue)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small',
                  sx: { 
                    '& input': {
                      cursor: 'pointer',
                      caretColor: 'transparent'
                    }
                  },
                  onKeyDown: (e) => e.preventDefault(),
                  inputProps: {
                    readOnly: true,
                    style: { cursor: 'pointer' }
                  }
                }
              }}
            />
          </Box>
          <Box>
            <DatePicker
              label="Fecha Hasta"
              value={endDate}
              onChange={(newValue) => setEndDate(newValue)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small',
                  sx: { 
                    '& input': {
                      cursor: 'pointer',
                      caretColor: 'transparent'
                    }
                  },
                  onKeyDown: (e) => e.preventDefault(),
                  inputProps: {
                    readOnly: true,
                    style: { cursor: 'pointer' }
                  }
                }
              }}
            />
          </Box>
        </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Métricas principales */}
          {metrics && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 4 }}>
              <Card
                  elevation={0}
                  sx={{
                    background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.success.main, 0.15)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                  }}
                >
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Precisión General
                    </Typography>
                    <Typography variant="h3" sx={{ color: theme.palette.success.main, fontWeight: 700 }}>
                      {metrics.accuracy.toFixed(1)}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(metrics.accuracy, 100)}
                      sx={{ mt: 1 }}
                    />
                  </CardContent>
                </Card>

              <Card
                elevation={0}
                sx={{
                  background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.05)} 0%, ${alpha(theme.palette.info.main, 0.15)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                }}
              >
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Diferencia Promedio
                    </Typography>
                    <Typography variant="h3" sx={{ color: theme.palette.info.main, fontWeight: 700 }}>
                      ${metrics.averageDifference.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      por libra
                    </Typography>
                  </CardContent>
                </Card>

                <Card
                  elevation={0}
                  sx={{
                    background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.05)} 0%, ${alpha(theme.palette.warning.main, 0.15)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                  }}
                >
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Coincidencias
                    </Typography>
                    <Typography variant="h3" sx={{ color: theme.palette.warning.main, fontWeight: 700 }}>
                      {metrics.totalMatches}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      predicciones vs recepciones
                    </Typography>
                  </CardContent>
                </Card>

                <Card
                  elevation={0}
                  sx={{
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.15)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  }}
                >
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Desviación Máxima
                    </Typography>
                    <Typography variant="h3" sx={{ color: theme.palette.primary.main, fontWeight: 700 }}>
                      ${metrics.maxDifference.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      máxima observada
                    </Typography>
                  </CardContent>
                </Card>
            </Box>
          )}

          {/* Tabla de comparativos por calibre */}
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardHeader
              title="Comparativa por Calibre (últimos 30 días)"
              avatar={<CompareIcon sx={{ color: theme.palette.primary.main }} />}
              titleTypographyProps={{ variant: 'h6' }}
            />
            <CardContent>
              {comparisonData.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  No hay datos de comparación disponibles para los filtros seleccionados
                </Typography>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                        <TableCell sx={{ fontWeight: 600 }}>Calibre</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          Precio Real Promedio
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          Precio Predicho Promedio
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          Diferencia
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>
                          Variación %
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>
                          Datos
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {comparisonData.map((row) => (
                        <TableRow
                          key={row.calibre}
                          sx={{
                            '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.02) },
                          }}
                        >
                          <TableCell sx={{ fontWeight: 600 }}>{row.calibre}</TableCell>
                          <TableCell align="right">${row.averageRealPrice.toFixed(3)}</TableCell>
                          <TableCell align="right">${row.averagePredictedPrice.toFixed(3)}</TableCell>
                          <TableCell align="right">${row.difference.toFixed(3)}</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`${row.percentageDifference.toFixed(2)}%`}
                              size="small"
                              sx={{
                                backgroundColor: getPriceVarianceColor(row.percentageDifference),
                                color: 'white',
                                fontWeight: 600,
                              }}
                              icon={
                                row.percentageDifference <= 5 ? (
                                  <CheckCircleIcon />
                                ) : (
                                  <WarningIcon />
                                )
                              }
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="caption" color="text.secondary">
                              {row.receptionCount} recepciones / {row.predictionCount} predicciones
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>

          {/* Interpretación */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              mt: 3,
              border: `1px solid ${theme.palette.divider}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.02)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              📊 Interpretación
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              <strong>Variación % ≤ 5%:</strong> Excelente precisión del modelo
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              <strong>Variación % 5-15%:</strong> Buena precisión, ajustes menores recomendados
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Variación % &gt; 15%:</strong> Se recomienda revisar factores externos y
              calibrar el modelo
            </Typography>
          </Paper>
        </>
      )}
    </Container>
  );
};

export default StatisticsPage;
