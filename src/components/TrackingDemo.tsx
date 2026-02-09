import React, { useState, useEffect } from 'react';
import { useRealTimeTracking } from '../hooks/useRealTimeTracking';
import { RealTimeMap } from '../components/RealTimeMap';
import { TrackingControlPanel } from '../components/TrackingControlPanel';
import { TrackingStats, formatDistance, formatDuration } from '../utils/tracking-utils';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Paper,
  Typography,
  Divider
} from '@mui/material';

/**
 * Componente de ejemplo: Cómo usar el sistema de rastreo en tiempo real
 * 
 * Este componente demuestra:
 * 1. Cómo usar el hook useRealTimeTracking
 * 2. Cómo integrar RealTimeMap
 * 3. Cómo mostrar TrackingControlPanel
 * 4. Cómo usar las utilidades de tracking (TrackingStats)
 * 
 * ADVERTENCIA: Este es un componente de EJEMPLO. 
 * Para integrar en LogisticsPage, ver TRACKING_INTEGRATION_GUIDE.md
 */

interface TrackingDemoProps {
  logisticsId: number;
  userId: number;
  destination?: {
    name: string;
    lat: number;
    lng: number;
  };
}

export const TrackingDemo: React.FC<TrackingDemoProps> = ({
  logisticsId,
  userId,
  destination
}) => {
  // Hook que maneja todo: WebSocket, geolocalización, eventos
  const {
    isTracking,
    isConnected,
    currentLocation,
    spectatorCount,
    error,
    sessionId,
    startTracking,
    stopTracking,
    joinAsSpectator,
    getCurrentLocation
  } = useRealTimeTracking(logisticsId, userId);

  // Estadísticas locales
  const [stats] = useState(() => new TrackingStats());
  const [displayStats, setDisplayStats] = useState({
    distance: '--',
    duration: '--',
    speed: '--'
  });

  // Actualizar estadísticas cuando hay nueva ubicación
  useEffect(() => {
    if (currentLocation && isTracking) {
      stats.addPoint(currentLocation.lat, currentLocation.lng, currentLocation.timestamp);

      setDisplayStats({
        distance: formatDistance(stats.getTotalDistance()),
        duration: formatDuration(stats.getDuration()),
        speed: stats.getAverageSpeed().toFixed(1) + ' km/h'
      });
    }
  }, [currentLocation, isTracking, stats]);

  // Limpiar estadísticas cuando se detiene el tracking
  useEffect(() => {
    if (!isTracking) {
      stats.clear();
      setDisplayStats({
        distance: '--',
        duration: '--',
        speed: '--'
      });
    }
  }, [isTracking, stats]);

  const handleStartTracking = async () => {
    try {
      await startTracking();
    } catch (err) {
      console.error('Error iniciando tracking:', err);
    }
  };

  const handleStopTracking = async () => {
    try {
      await stopTracking();
    } catch (err) {
      console.error('Error deteniendo tracking:', err);
    }
  };

  const handleJoinTracking = async () => {
    try {
      await joinAsSpectator();
    } catch (err) {
      console.error('Error uniéndose como espectador:', err);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Panel de Control */}
      <TrackingControlPanel
        isTracking={isTracking}
        isConnected={isConnected}
        spectatorCount={spectatorCount}
        error={error}
        trackerName={localStorage.getItem('userName') || 'Usuario'}
        sessionId={sessionId}
        onStart={handleStartTracking}
        onStop={handleStopTracking}
        onJoin={handleJoinTracking}
      />

      <Grid container spacing={2}>
        {/* Mapa */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader title="📍 Mapa en Tiempo Real" />
            <CardContent>
              <RealTimeMap
                currentLocation={currentLocation}
                trackerInfo={
                  isTracking && currentLocation
                    ? {
                        name: localStorage.getItem('userName') || 'Usuario',
                        lat: currentLocation.lat,
                        lng: currentLocation.lng
                      }
                    : undefined
                }
                destinations={
                  destination
                    ? [
                        {
                          id: logisticsId,
                          name: destination.name,
                          lat: destination.lat,
                          lng: destination.lng
                        }
                      ]
                    : []
                }
                spectatorCount={spectatorCount}
                isTracking={isTracking}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Estadísticas */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="📊 Estadísticas" />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Distancia */}
                <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                  <Typography variant="caption" color="textSecondary">
                    DISTANCIA RECORRIDA
                  </Typography>
                  <Typography variant="h5" sx={{ mt: 1, fontWeight: 'bold', color: '#667eea' }}>
                    {displayStats.distance}
                  </Typography>
                </Paper>

                {/* Duración */}
                <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                  <Typography variant="caption" color="textSecondary">
                    TIEMPO TRANSCURRIDO
                  </Typography>
                  <Typography variant="h5" sx={{ mt: 1, fontWeight: 'bold', color: '#f5576c' }}>
                    {displayStats.duration}
                  </Typography>
                </Paper>

                {/* Velocidad Promedio */}
                <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                  <Typography variant="caption" color="textSecondary">
                    VELOCIDAD PROMEDIO
                  </Typography>
                  <Typography variant="h5" sx={{ mt: 1, fontWeight: 'bold', color: '#00d4ff' }}>
                    {displayStats.speed}
                  </Typography>
                </Paper>

                <Divider sx={{ my: 2 }} />

                {/* Info del Tracking */}
                <Paper sx={{ p: 2, bgcolor: '#f0f0f0' }}>
                  <Typography variant="caption" color="textSecondary">
                    INFO DEL RASTREO
                  </Typography>
                  <Box sx={{ mt: 2, fontSize: '0.875rem' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <span>Estado:</span>
                      <strong>{isTracking ? '🔴 Activo' : '⚪ Inactivo'}</strong>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <span>WebSocket:</span>
                      <strong>{isConnected ? '✅ Conectado' : '❌ Desconectado'}</strong>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <span>Espectadores:</span>
                      <strong>👥 {spectatorCount}</strong>
                    </Box>
                    {sessionId && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Sesión:</span>
                        <strong sx={{ fontFamily: 'monospace' }}>
                          {sessionId.substring(0, 8)}...
                        </strong>
                      </Box>
                    )}
                  </Box>
                </Paper>

                {error && (
                  <Paper sx={{ p: 2, bgcolor: '#ffe8e8', borderLeft: '4px solid #c72828' }}>
                    <Typography variant="caption" color="error">
                      ⚠️ {error}
                    </Typography>
                  </Paper>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Info del Desarrollo */}
      <Card sx={{ mt: 3 }}>
        <CardHeader title="ℹ️ Información" />
        <CardContent>
          <Typography variant="body2" color="textSecondary">
            Este es un componente de ejemplo que demuestra cómo usar el sistema de
            rastreo en tiempo real. Para ver cómo integrar esto en LogisticsPage,
            consulta: <strong>TRACKING_INTEGRATION_GUIDE.md</strong>
          </Typography>

          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            Características:
          </Typography>
          <ul>
            <li>✅ Rastreo en tiempo real vía WebSocket</li>
            <li>✅ Modo espectador para múltiples usuarios</li>
            <li>✅ Geolocalización automática cada 5 segundos</li>
            <li>✅ Estadísticas de distancia, tiempo y velocidad</li>
            <li>✅ Mapa interactivo con Leaflet</li>
            <li>✅ Panel de control visual</li>
            <li>✅ Manejo automático de errores y reconexión</li>
          </ul>

          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            Props Requeridas:
          </Typography>
          <ul>
            <li><code>logisticsId: number</code> - ID de la logística a rastrear</li>
            <li><code>userId: number</code> - ID del usuario actual</li>
            <li><code>destination?: object</code> - Ubicación del destino (opcional)</li>
          </ul>

          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 2 }}>
            Para más información sobre la implementación, ver:
            <br />
            - TRACKING_INTEGRATION_GUIDE.md
            <br />
            - IMPLEMENTATION_STATUS.md
            <br />
            - src/hooks/useRealTimeTracking.ts
            <br />
            - src/utils/tracking-utils.ts
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TrackingDemo;
