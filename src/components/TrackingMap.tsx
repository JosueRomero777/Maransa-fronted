import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L, { type LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Typography, CircularProgress } from '@mui/material';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Icono personalizado para el camión
const truckIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

// Icono para origen
const originIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
});

// Icono para destino
const destinationIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684889.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
});

// Icono para custodia/escolta
const custodyIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/747/747376.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

type Location = {
  lat: number;
  lng: number;
  address: string;
};

type TrackingMapProps = {
  origin: Location;
  destination: Location;
  currentPosition: { lat: number; lng: number } | null;
  trackingPath: { lat: number; lng: number }[];
  custodyPosition?: { lat: number; lng: number } | null;
  isCustodyActive?: boolean;
};

function MapBounds({ origin, destination, currentPosition, custodyPosition }: { 
  origin: Location; 
  destination: Location;
  currentPosition: { lat: number; lng: number } | null;
  custodyPosition?: { lat: number; lng: number } | null;
}) {
  const map = useMap();

  useEffect(() => {
    const bounds = L.latLngBounds([
      [origin.lat, origin.lng],
      [destination.lat, destination.lng],
      ...(currentPosition ? [[currentPosition.lat, currentPosition.lng] as [number, number]] : []),
      ...(custodyPosition ? [[custodyPosition.lat, custodyPosition.lng] as [number, number]] : [])
    ] as LatLngExpression[]);
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [map, origin, destination, currentPosition, custodyPosition]);

  return null;
}

export function TrackingMap({ origin, destination, currentPosition, trackingPath, custodyPosition, isCustodyActive }: TrackingMapProps) {
  const [idealRoute, setIdealRoute] = useState<LatLngExpression[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoute = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
        );

        if (!response.ok) {
          throw new Error('Error al obtener la ruta');
        }

        const data = await response.json();

        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
          throw new Error('No se pudo calcular la ruta');
        }

        const coordinates = data.routes[0].geometry.coordinates;
        const latLngs = coordinates.map((coord: [number, number]) => [coord[1], coord[0]] as LatLngExpression);
        setIdealRoute(latLngs);
      } catch (err: any) {
        console.error('Error fetching route:', err);
        setError(err.message || 'Error al cargar la ruta');
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, [origin, destination]);

  if (loading) {
    return (
      <Box
        sx={{
          height: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#f5f5f5',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          height: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#f5f5f5',
        }}
      >
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const center: LatLngExpression = currentPosition 
    ? [currentPosition.lat, currentPosition.lng]
    : [(origin.lat + destination.lat) / 2, (origin.lng + destination.lng) / 2];

  return (
    <Box sx={{ height: 500, position: 'relative' }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBounds origin={origin} destination={destination} currentPosition={currentPosition} custodyPosition={custodyPosition} />

        {/* Ruta ideal (azul) */}
        {idealRoute.length > 0 && (
          <Polyline
            positions={idealRoute}
            color="#2196F3"
            weight={4}
            opacity={0.7}
            dashArray="10, 10"
          />
        )}

        {/* Ruta real recorrida (naranja) */}
        {trackingPath.length > 1 && (
          <Polyline
            positions={trackingPath.map(p => [p.lat, p.lng] as LatLngExpression)}
            color="#FF9800"
            weight={4}
            opacity={0.9}
          />
        )}

        {/* Marcador de origen */}
        <Marker position={[origin.lat, origin.lng]} icon={originIcon}>
          <Popup>
            <strong>Origen</strong>
            <br />
            {origin.address}
          </Popup>
        </Marker>

        {/* Marcador de destino */}
        <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
          <Popup>
            <strong>Destino</strong>
            <br />
            {destination.address}
          </Popup>
        </Marker>

        {/* Marcador del camión (posición actual - Logística) */}
        {currentPosition && (
          <Marker position={[currentPosition.lat, currentPosition.lng]} icon={truckIcon}>
            <Popup>
              <strong>🚛 Logística - Posición Actual</strong>
              <br />
              Lat: {currentPosition.lat.toFixed(6)}
              <br />
              Lng: {currentPosition.lng.toFixed(6)}
            </Popup>
          </Marker>
        )}

        {/* Marcador de custodia */}
        {isCustodyActive && custodyPosition && (
          <Marker position={[custodyPosition.lat, custodyPosition.lng]} icon={custodyIcon}>
            <Popup>
              <strong>🛡️ Custodia - Posición Actual</strong>
              <br />
              Lat: {custodyPosition.lat.toFixed(6)}
              <br />
              Lng: {custodyPosition.lng.toFixed(6)}
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Leyenda */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          bgcolor: 'white',
          p: 2,
          borderRadius: 1,
          boxShadow: 2,
          zIndex: 1000,
        }}
      >
        <Typography variant="subtitle2" gutterBottom>
          Leyenda
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          <Box
            sx={{
              width: 20,
              height: 3,
              bgcolor: '#2196F3',
              mr: 1,
              border: '1px dashed #2196F3',
            }}
          />
          <Typography variant="caption">Ruta Ideal</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          <Box
            sx={{
              width: 20,
              height: 3,
              bgcolor: '#FF9800',
              mr: 1,
            }}
          />
          <Typography variant="caption">Ruta Real</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          <Typography variant="caption">🚛</Typography>
          <Typography variant="caption" sx={{ ml: 1 }}>Logística</Typography>
        </Box>
        {isCustodyActive && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="caption">🛡️</Typography>
            <Typography variant="caption" sx={{ ml: 1 }}>Custodia</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
