/**
 * Utilidades para el sistema de rastreo en tiempo real
 */

/**
 * Calcula la distancia en metros entre dos coordenadas (Fórmula de Haversine)
 */
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371000; // Radio de la tierra en metros
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Formatea la distancia en metros o kilómetros
 */
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
};

/**
 * Calcula la velocidad en km/h entre dos puntos con timestamp
 */
export const calculateSpeed = (
  lat1: number,
  lng1: number,
  time1: number,
  lat2: number,
  lng2: number,
  time2: number
): number => {
  const distance = calculateDistance(lat1, lng1, lat2, lng2); // en metros
  const timeSeconds = (time2 - time1) / 1000; // convertir ms a segundos
  
  if (timeSeconds === 0) return 0;
  
  const speedMs = distance / timeSeconds; // metros por segundo
  return speedMs * 3.6; // convertir a km/h
};

/**
 * Formatea la velocidad en km/h
 */
export const formatSpeed = (kmh: number): string => {
  return `${kmh.toFixed(1)} km/h`;
};

/**
 * Formatea el tiempo en formato legible (ej: 2h 35m 22s)
 */
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
};

/**
 * Calcula la ruta total en metros desde un array de puntos
 */
export const calculateTotalDistance = (
  points: Array<{ lat: number; lng: number }>
): number => {
  if (points.length < 2) return 0;

  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    total += calculateDistance(curr.lat, curr.lng, next.lat, next.lng);
  }
  return total;
};

/**
 * Verifica si una ubicación está dentro de un radio (en metros)
 */
export const isWithinRadius = (
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number,
  radiusMeters: number
): boolean => {
  const distance = calculateDistance(lat, lng, centerLat, centerLng);
  return distance <= radiusMeters;
};

/**
 * Obtiene el ícono marca para Leaflet basado en el tipo
 */
export const getMarkerIcon = (type: 'tracker' | 'destination' | 'waypoint') => {
  const iconUrls: Record<string, string> = {
    tracker: '/repartidor-icon.png',
    destination: '/destination-icon.png',
    waypoint: '/waypoint-icon.png'
  };

  const sizes: Record<string, [number, number]> = {
    tracker: [32, 32],
    destination: [24, 24],
    waypoint: [20, 20]
  };

  const anchorSizes: Record<string, [number, number]> = {
    tracker: [16, 16],
    destination: [12, 12],
    waypoint: [10, 10]
  };

  // Aquí iría la importación real de L de leaflet:
  // import L from 'leaflet';
  // return L.icon({...})
  
  return {
    iconUrl: iconUrls[type],
    iconSize: sizes[type],
    iconAnchor: anchorSizes[type],
    popupAnchor: [0, -anchorSizes[type][1]]
  };
};

/**
 * Convierte un timestamp a formato legible
 */
export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

/**
 * Calcula la precisión GPS basada en el valor de accuracy
 */
export const getGPSAccuracy = (accuracy: number): 'excelente' | 'buena' | 'regular' | 'pobre' => {
  if (accuracy < 5) return 'excelente';
  if (accuracy < 10) return 'buena';
  if (accuracy < 20) return 'regular';
  return 'pobre';
};

/**
 * Generaliza coordenadas para privacidad (redondea a 4 decimales = ~10m)
 */
export const anonymizeCoordinates = (lat: number, lng: number): [number, number] => {
  return [Math.round(lat * 10000) / 10000, Math.round(lng * 10000) / 10000];
};

/**
 * Interpola coordenadas entre dos puntos para visualización suave
 */
export const interpolateCoordinates = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  fraction: number
): { lat: number; lng: number } => {
  return {
    lat: lat1 + (lat2 - lat1) * fraction,
    lng: lng1 + (lng2 - lng1) * fraction
  };
};

/**
 * Exporta tracking data a CSV
 */
export const exportTrackingToCSV = (
  tracks: Array<{
    timestamp: number;
    lat: number;
    lng: number;
    accuracy?: number;
    speed?: number;
  }>,
  filename: string = 'tracking.csv'
): void => {
  const csv = [
    ['Timestamp', 'Hora', 'Latitud', 'Longitud', 'Precisión (m)', 'Velocidad (km/h)'].join(','),
    ...tracks.map(t =>
      [
        t.timestamp,
        new Date(t.timestamp).toISOString(),
        t.lat.toFixed(6),
        t.lng.toFixed(6),
        (t.accuracy || 0).toFixed(1),
        (t.speed || 0).toFixed(1)
      ].join(',')
    )
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Valida si una coordenada es válida
 */
export const isValidCoordinate = (lat: number, lng: number): boolean => {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

/**
 * Obtiene las coordenadas del centro entre múltiples puntos
 */
export const getCenterCoordinates = (
  points: Array<{ lat: number; lng: number }>
): { lat: number; lng: number } => {
  if (points.length === 0) {
    return { lat: -17.3895, lng: -66.1568 }; // La Paz, Bolivia por defecto
  }

  const avgLat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
  const avgLng = points.reduce((sum, p) => sum + p.lng, 0) / points.length;

  return { lat: avgLat, lng: avgLng };
};

/**
 * Obtiene los bounds (límites) para múltiples puntos
 */
export const getBounds = (
  points: Array<{ lat: number; lng: number }>
): { north: number; south: number; east: number; west: number } => {
  if (points.length === 0) {
    return { north: -17.3895, south: -17.3895, east: -66.1568, west: -66.1568 };
  }

  const lats = points.map(p => p.lat);
  const lngs = points.map(p => p.lng);

  return {
    north: Math.max(...lats),
    south: Math.min(...lats),
    east: Math.max(...lngs),
    west: Math.min(...lngs)
  };
};

/**
 * Clase para rastrear estadísticas de tracking
 */
export class TrackingStats {
  private points: Array<{ lat: number; lng: number; timestamp: number }> = [];

  addPoint(lat: number, lng: number, timestamp: number = Date.now()): void {
    this.points.push({ lat, lng, timestamp });
  }

  getTotalDistance(): number {
    return calculateTotalDistance(this.points);
  }

  getDuration(): number {
    if (this.points.length < 2) return 0;
    return (
      this.points[this.points.length - 1].timestamp - this.points[0].timestamp
    ) / 1000; // en segundos
  }

  getAverageSpeed(): number {
    const distance = this.getTotalDistance(); // en metros
    const duration = this.getDuration(); // en segundos

    if (duration === 0) return 0;

    const speedMs = distance / duration;
    return speedMs * 3.6; // convertir a km/h
  }

  getMaxSpeed(): number {
    if (this.points.length < 2) return 0;

    let maxSpeed = 0;
    for (let i = 1; i < this.points.length; i++) {
      const prev = this.points[i - 1];
      const curr = this.points[i];

      const speed = calculateSpeed(
        prev.lat,
        prev.lng,
        prev.timestamp,
        curr.lat,
        curr.lng,
        curr.timestamp
      );

      maxSpeed = Math.max(maxSpeed, speed);
    }

    return maxSpeed;
  }

  getSummary() {
    return {
      pointsCount: this.points.length,
      totalDistance: formatDistance(this.getTotalDistance()),
      duration: formatDuration(this.getDuration()),
      averageSpeed: formatSpeed(this.getAverageSpeed()),
      maxSpeed: formatSpeed(this.getMaxSpeed()),
      startTime: this.points.length > 0 ? formatTime(this.points[0].timestamp) : '-',
      endTime: this.points.length > 0 ? formatTime(this.points[this.points.length - 1].timestamp) : '-'
    };
  }

  clear(): void {
    this.points = [];
  }

  getPoints() {
    return this.points;
  }
}
