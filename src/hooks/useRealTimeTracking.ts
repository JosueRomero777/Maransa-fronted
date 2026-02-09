import { useEffect, useState, useRef, useCallback } from 'react';
import { trackingWebSocketService } from '../services/tracking-websocket.service';

interface LocationData {
  lat: number;
  lng: number;
  timestamp: number;
  accuracy?: number;
}

interface TrackingState {
  isTracking: boolean;
  isConnected: boolean;
  currentLocation: LocationData | null;
  spectatorCount: number;
  error: string | null;
  sessionId: string | null;
}

export const useRealTimeTracking = (logisticsId: number, userId: number) => {
  const [state, setState] = useState<TrackingState>({
    isTracking: false,
    isConnected: false,
    currentLocation: null,
    spectatorCount: 0,
    error: null,
    sessionId: null
  });

  const watchIdRef = useRef<number | null>(null);
  const locationUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocationRef = useRef<LocationData | null>(null);

  // Conectar WebSocket
  useEffect(() => {
    const connect = async () => {
      try {
        await trackingWebSocketService.connect(userId);
        setState(prev => ({ ...prev, isConnected: true }));

        // Listeners
        trackingWebSocketService.onLocationUpdate((data: any) => {
          setState(prev => ({
            ...prev,
            currentLocation: {
              lat: data.lat,
              lng: data.lng,
              timestamp: data.timestamp,
              accuracy: data.accuracy
            }
          }));
        });

        trackingWebSocketService.onTrackingStartedAck((data: any) => {
          setState(prev => ({
            ...prev,
            isTracking: true,
            sessionId: data.sessionId
          }));
        });

        trackingWebSocketService.onTrackingStopped(() => {
          setState(prev => ({
            ...prev,
            isTracking: false,
            currentLocation: null,
            sessionId: null
          }));
          stopGeolocation();
        });

        trackingWebSocketService.onTrackingError((data: any) => {
          setState(prev => ({
            ...prev,
            error: data.message
          }));
        });

        trackingWebSocketService.onSpectatorJoined((data: any) => {
          setState(prev => ({
            ...prev,
            spectatorCount: data.totalSpectators
          }));
        });

      } catch (error: any) {
        setState(prev => ({
          ...prev,
          error: error.message,
          isConnected: false
        }));
      }
    };

    connect();

    return () => {
      trackingWebSocketService.disconnect();
    };
  }, [userId]);

  // Obtener geolocalización
  const startGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: 'Geolocalización no soportada' }));
      return;
    }

    // Actualizar cada 5 segundos
    locationUpdateIntervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;

          // Solo enviar si cambió significativamente (> 10 metros)
          if (!lastLocationRef.current ||
            Math.sqrt(
              Math.pow(latitude - lastLocationRef.current.lat, 2) +
              Math.pow(longitude - lastLocationRef.current.lng, 2)
            ) > 0.0001 // ~10 metros
          ) {
            lastLocationRef.current = {
              lat: latitude,
              lng: longitude,
              timestamp: Date.now(),
              accuracy
            };

            trackingWebSocketService.updateLocation(
              logisticsId,
              latitude,
              longitude,
              accuracy
            ).catch(err => {
              setState(prev => ({ ...prev, error: err.message }));
            });
          }
        },
        (error) => {
          setState(prev => ({
            ...prev,
            error: `Error de geolocalización: ${error.message}`
          }));
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    }, 5000);
  }, [logisticsId]);

  const stopGeolocation = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (locationUpdateIntervalRef.current) {
      clearInterval(locationUpdateIntervalRef.current);
      locationUpdateIntervalRef.current = null;
    }
  }, []);

  // Iniciar tracking
  const startTracking = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await trackingWebSocketService.startTracking(logisticsId);
      startGeolocation();
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message
      }));
    }
  }, [logisticsId, startGeolocation]);

  // Detener tracking
  const stopTracking = useCallback(async () => {
    try {
      stopGeolocation();
      await trackingWebSocketService.stopTracking(logisticsId);
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message
      }));
    }
  }, [logisticsId, stopGeolocation]);

  // Unirse como espectador
  const joinAsSpectator = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await trackingWebSocketService.joinTracking(logisticsId);
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message
      }));
    }
  }, [logisticsId]);

  // Obtener ubicación actual
  const getCurrentLocation = useCallback(async () => {
    try {
      const location = await trackingWebSocketService.getCurrentLocation(logisticsId);
      return location;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message
      }));
      return null;
    }
  }, [logisticsId]);

  // Limpiar
  useEffect(() => {
    return () => {
      stopGeolocation();
    };
  }, [stopGeolocation]);

  return {
    ...state,
    startTracking,
    stopTracking,
    joinAsSpectator,
    getCurrentLocation
  };
};
