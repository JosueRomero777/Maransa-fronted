import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Typography, Button, Chip, Stack, Alert } from '@mui/material';
import { MyLocation as MyLocationIcon, Stop as StopIcon } from '@mui/icons-material';

// Iconos personalizados
const originIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const destinationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const currentIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface RouteMapProps {
  origin: { lat: number; lng: number; address?: string };
  destination: { lat: number; lng: number; address?: string };
  onStartTracking?: (watchId: number) => void;
  onStopTracking?: () => void;
  onLocationUpdate?: (position: { lat: number; lng: number; timestamp: number }) => void;
  trackingEnabled?: boolean;
  currentPosition?: { lat: number; lng: number } | null;
  onTrackingStart?: () => void | Promise<void>;
  onTrackingStop?: () => void | Promise<void>;
}

function MapUpdater({ bounds }: { bounds: L.LatLngBounds }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [map, bounds]);
  return null;
}

const RouteMap: React.FC<RouteMapProps> = ({
  origin,
  destination,
  onStartTracking,
  onStopTracking,
  onLocationUpdate,
  trackingEnabled = false,
  currentPosition,
  onTrackingStart,
  onTrackingStop
}) => {
  const [route, setRoute] = useState<[number, number][]>([]);
  const [tracking, setTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const originLatLng: [number, number] = [origin.lat, origin.lng];
  const destLatLng: [number, number] = [destination.lat, destination.lng];

  // Calcular ruta usando OSRM (servicio gratuito de enrutamiento)
  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
        );
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
          const coordinates = data.routes[0].geometry.coordinates.map(
            (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
          );
          setRoute(coordinates);
        }
      } catch (err) {
        console.error('Error obteniendo ruta:', err);
        // Fallback: línea recta
        setRoute([originLatLng, destLatLng]);
      }
    };

    fetchRoute();
  }, [origin, destination]);

  const startTracking = useCallback(async () => {
    if (!('geolocation' in navigator)) {
      setError('Geolocalización no disponible');
      return;
    }

    setError(null);
    
    // Llamar al callback onTrackingStart si existe
    if (onTrackingStart) {
      await onTrackingStart();
    }
    
    setTracking(true);

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const newPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: position.timestamp
        };
        
        if (onLocationUpdate) {
          onLocationUpdate(newPos);
        }
      },
      (error) => {
        console.error('Error de geolocalización:', error);
        setError(`Error: ${error.message}`);
        stopTracking();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    setWatchId(id);
    if (onStartTracking) {
      onStartTracking(id);
    }
  }, [onLocationUpdate, onStartTracking, onTrackingStart]);

  const stopTracking = useCallback(async () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setTracking(false);
    
    if (onTrackingStop) {
      await onTrackingStop();
    }
    
    if (onStopTracking) {
      onStopTracking();
    }
  }, [watchId, onStopTracking, onTrackingStop]);

  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  const bounds = L.latLngBounds([
    originLatLng,
    destLatLng,
    ...(currentPosition ? [[currentPosition.lat, currentPosition.lng] as [number, number]] : [])
  ]);

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center">
        {!tracking ? (
          <Button
            variant="contained"
            color="primary"
            startIcon={<MyLocationIcon />}
            onClick={startTracking}
          >
            Activar Seguimiento en Tiempo Real
          </Button>
        ) : (
          <>
            <Button
              variant="contained"
              color="error"
              startIcon={<StopIcon />}
              onClick={stopTracking}
            >
              Detener Seguimiento
            </Button>
            <Chip label="Seguimiento Activo" color="success" />
          </>
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ height: 500, border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden' }}>
        <MapContainer
          bounds={bounds}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Marcador de Origen */}
          <Marker position={originLatLng} icon={originIcon}>
            <Popup>
              <strong>Origen</strong>
              <br />
              {origin.address || `${origin.lat}, ${origin.lng}`}
            </Popup>
          </Marker>

          {/* Marcador de Destino */}
          <Marker position={destLatLng} icon={destinationIcon}>
            <Popup>
              <strong>Destino</strong>
              <br />
              {destination.address || `${destination.lat}, ${destination.lng}`}
            </Popup>
          </Marker>

          {/* Ruta planificada */}
          {route.length > 0 && (
            <Polyline
              positions={route}
              color="blue"
              weight={4}
              opacity={0.6}
            />
          )}

          {/* Ubicación actual en tiempo real */}
          {currentPosition && (
            <Marker
              position={[currentPosition.lat, currentPosition.lng]}
              icon={currentIcon}
            >
              <Popup>
                <strong>Ubicación Actual</strong>
                <br />
                {currentPosition.lat.toFixed(6)}, {currentPosition.lng.toFixed(6)}
              </Popup>
            </Marker>
          )}

          <MapUpdater bounds={bounds} />
        </MapContainer>
      </Box>

      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 20, height: 3, bgcolor: 'blue', opacity: 0.6 }} />
          <Typography variant="caption">Ruta Planificada</Typography>
        </Box>
        {currentPosition && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#2196f3' }} />
            <Typography variant="caption">Ubicación en Tiempo Real</Typography>
          </Box>
        )}
      </Stack>
    </Box>
  );
};

export default RouteMap;
