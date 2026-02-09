import React, { useEffect, useRef } from 'react';
import L, { Map as LeafletMap } from 'leaflet';

interface RealTimeMapProps {
  currentLocation?: {
    lat: number;
    lng: number;
  } | null;
  trackerInfo?: {
    name: string;
    lat: number;
    lng: number;
  } | null;
  destinations?: Array<{
    id: number;
    name: string;
    lat: number;
    lng: number;
  }>;
  spectatorCount?: number;
  isTracking?: boolean;
  onMapReady?: (map: LeafletMap) => void;
}

export const RealTimeMap: React.FC<RealTimeMapProps> = ({
  currentLocation,
  trackerInfo,
  destinations = [],
  spectatorCount = 0,
  isTracking = false,
  onMapReady
}) => {
  const mapRef = useRef<LeafletMap | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const trackerMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkersRef = useRef<Map<number, L.Marker>>(new Map());
  const polylineRef = useRef<L.Polyline | null>(null);

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      const initialLat = trackerInfo?.lat || currentLocation?.lat || -17.3895;
      const initialLng = trackerInfo?.lng || currentLocation?.lng || -66.1568;

      mapRef.current = L.map(mapContainerRef.current).setView([initialLat, initialLng], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(mapRef.current);

      if (onMapReady) {
        onMapReady(mapRef.current);
      }
    }

    return () => {
      // No destruir el mapa, solo limpiarlo
    };
  }, [onMapReady]);

  // Actualizar ubicación del tracker
  useEffect(() => {
    if (!mapRef.current) return;

    if (trackerInfo || currentLocation) {
      const lat = trackerInfo?.lat || currentLocation?.lat;
      const lng = trackerInfo?.lng || currentLocation?.lng;

      if (lat && lng) {
        // Crear o actualizar marcador
        if (trackerMarkerRef.current) {
          trackerMarkerRef.current.setLatLng([lat, lng]);
        } else {
          const icon = L.icon({
            iconUrl: '/repartidor-icon.png',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16]
          });

          trackerMarkerRef.current = L.marker([lat, lng], { icon })
            .bindPopup(`
              <div>
                <strong>${trackerInfo?.name || 'Repartidor'}</strong><br>
                Espectadores: ${spectatorCount}
              </div>
            `)
            .addTo(mapRef.current!);
        }

        // Centrar mapa en tracker
        mapRef.current.setView([lat, lng], 15);
      }
    }
  }, [trackerInfo, currentLocation, spectatorCount]);

  // Agregar destinos
  useEffect(() => {
    if (!mapRef.current) return;

    destinations.forEach((dest) => {
      if (!destinationMarkersRef.current.has(dest.id)) {
        const icon = L.icon({
          iconUrl: '/destination-icon.png',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
          popupAnchor: [0, -12]
        });

        const marker = L.marker([dest.lat, dest.lng], { icon })
          .bindPopup(dest.name)
          .addTo(mapRef.current!);

        destinationMarkersRef.current.set(dest.id, marker);
      }
    });

    // Remover destinos que ya no existen
    destinationMarkersRef.current.forEach((marker, id) => {
      if (!destinations.find(d => d.id === id)) {
        mapRef.current!.removeLayer(marker);
        destinationMarkersRef.current.delete(id);
      }
    });
  }, [destinations]);

  // Dibujar ruta (opcional)
  useEffect(() => {
    if (!mapRef.current || !isTracking || !trackerInfo) return;

    const waypoints: [number, number][] = [
      [trackerInfo.lat, trackerInfo.lng],
      ...destinations.map(d => [d.lat, d.lng] as [number, number])
    ];

    if (polylineRef.current) {
      mapRef.current.removeLayer(polylineRef.current);
    }

    polylineRef.current = L.polyline(waypoints, {
      color: 'blue',
      weight: 2,
      opacity: 0.7
    }).addTo(mapRef.current);

  }, [trackerInfo, destinations, isTracking]);

  return (
    <div
      ref={mapContainerRef}
      style={{
        width: '100%',
        height: '400px',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}
    />
  );
};
