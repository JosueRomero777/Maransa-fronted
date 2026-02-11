import React, { useEffect, useRef } from 'react';
import L, { Map as LeafletMap } from 'leaflet';

interface RealTimeMapProps {
  origin?: {
    lat: number;
    lng: number;
    name?: string;
  } | null;
  currentLocation?: {
    lat: number;
    lng: number;
  } | null;
  trackerInfo?: {
    name: string;
    lat: number;
    lng: number;
  } | null;
  custodyInfo?: {
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
  origin,
  currentLocation,
  trackerInfo,
  custodyInfo,
  destinations = [],
  spectatorCount = 0,
  isTracking = false,
  onMapReady
}) => {
  const mapRef = useRef<LeafletMap | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const trackerMarkerRef = useRef<L.Marker | null>(null);
  const custodyMarkerRef = useRef<L.Marker | null>(null);
  const originMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkersRef = useRef<Map<number, L.Marker>>(new Map());
  const polylineRef = useRef<L.Polyline | null>(null);

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      const initialLat = trackerInfo?.lat || custodyInfo?.lat || currentLocation?.lat || origin?.lat || -17.3895;
      const initialLng = trackerInfo?.lng || custodyInfo?.lng || currentLocation?.lng || origin?.lng || -66.1568;

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
            iconUrl: '/repartidor-icon.svg',
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

  // Agregar origen
  useEffect(() => {
    if (!mapRef.current || !origin) return;

    if (originMarkerRef.current) {
      originMarkerRef.current.setLatLng([origin.lat, origin.lng]);
    } else {
      const icon = L.icon({
        iconUrl: '/origin-icon.svg',
        iconSize: [26, 26],
        iconAnchor: [13, 13],
        popupAnchor: [0, -12]
      });

      originMarkerRef.current = L.marker([origin.lat, origin.lng], { icon })
        .bindPopup(origin.name || 'Origen')
        .addTo(mapRef.current!);
    }
  }, [origin]);

  // Agregar destinos
  useEffect(() => {
    if (!mapRef.current) return;

    destinations.forEach((dest) => {
      if (!destinationMarkersRef.current.has(dest.id)) {
        const icon = L.icon({
          iconUrl: '/destination-icon.svg',
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

  // Agregar custodia
  useEffect(() => {
    if (!mapRef.current || !custodyInfo) return;

    if (custodyMarkerRef.current) {
      custodyMarkerRef.current.setLatLng([custodyInfo.lat, custodyInfo.lng]);
    } else {
      const icon = L.icon({
        iconUrl: '/custodia-icon.svg',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -14]
      });

      custodyMarkerRef.current = L.marker([custodyInfo.lat, custodyInfo.lng], { icon })
        .bindPopup(`
          <div>
            <strong>${custodyInfo.name}</strong><br>
            Custodia activa
          </div>
        `)
        .addTo(mapRef.current!);
    }
  }, [custodyInfo]);

  // Dibujar ruta planificada
  useEffect(() => {
    if (!mapRef.current) return;

    // Construir waypoints: origen → posición actual → destinos
    const waypoints: [number, number][] = [];

    // Agregar origen
    if (origin) {
      waypoints.push([origin.lat, origin.lng]);
    }

    // Agregar posición actual del tracker (si existe)
    if (trackerInfo) {
      waypoints.push([trackerInfo.lat, trackerInfo.lng]);
    } else if (currentLocation) {
      waypoints.push([currentLocation.lat, currentLocation.lng]);
    }

    // Agregar destinos
    destinations.forEach(d => {
      waypoints.push([d.lat, d.lng]);
    });

    // Solo dibujar si hay al menos 2 puntos
    if (waypoints.length >= 2) {
      if (polylineRef.current) {
        mapRef.current.removeLayer(polylineRef.current);
      }

      polylineRef.current = L.polyline(waypoints, {
        color: '#1976d2',
        weight: 3,
        opacity: 0.7,
        dashArray: isTracking ? undefined : '5, 10' // Línea punteada si no está tracking activo
      }).addTo(mapRef.current);
    }

  }, [origin, trackerInfo, currentLocation, destinations, isTracking]);

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
