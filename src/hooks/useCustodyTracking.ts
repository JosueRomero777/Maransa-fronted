import { useCallback, useEffect, useRef, useState } from 'react';
import { custodyWebSocketService } from '../services/custody-websocket.service';

interface LocationData {
  lat: number;
  lng: number;
  timestamp: number;
  accuracy?: number;
}

interface CustodyTrackingState {
  isTracking: boolean;
  isConnected: boolean;
  currentLocation: LocationData | null;
  spectatorCount: number;
  error: string | null;
  sessionId: string | null;
  isOwner: boolean;
  trackerUserId: number | null;
  trackerName: string | null;
  trackerEmail: string | null;
}

export const useCustodyTracking = (custodyId: number, userId: number, autoJoin: boolean = false) => {
  const [state, setState] = useState<CustodyTrackingState>({
    isTracking: false,
    isConnected: false,
    currentLocation: null,
    spectatorCount: 0,
    error: null,
    sessionId: null,
    isOwner: false,
    trackerUserId: null,
    trackerName: null,
    trackerEmail: null
  });

  const locationUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocationRef = useRef<LocationData | null>(null);

  useEffect(() => {
    if (!custodyId || !userId) return;

    const connect = async () => {
      try {
        await custodyWebSocketService.connect(userId);
        setState(prev => ({ ...prev, isConnected: true }));

        custodyWebSocketService.onLocationUpdate((data: any) => {
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

        custodyWebSocketService.onTrackingStartedAck((data: any) => {
          setState(prev => ({
            ...prev,
            isTracking: true,
            sessionId: data.sessionId,
            isOwner: true,
            trackerUserId: userId,
            trackerName: prev.trackerName,
            trackerEmail: prev.trackerEmail
          }));
        });

        custodyWebSocketService.onTrackingStopped(() => {
          setState(prev => ({
            ...prev,
            isTracking: false,
            sessionId: null,
            isOwner: false,
            trackerUserId: null,
            trackerName: null,
            trackerEmail: null
          }));
          stopGeolocation();
        });

        custodyWebSocketService.onTrackingError((data: any) => {
          setState(prev => ({
            ...prev,
            error: data.message
          }));
        });

        custodyWebSocketService.onSpectatorJoined((data: any) => {
          setState(prev => ({
            ...prev,
            spectatorCount: data.totalSpectators
          }));
        });

        custodyWebSocketService.onSpectatorJoinedAck((data: any) => {
          setState(prev => ({
            ...prev,
            sessionId: data.sessionId ?? null,
            isTracking: true,
            isOwner: data.activeTracker === userId,
            trackerUserId: data.activeTracker ?? null,
            trackerName: data.activeTrackerUser?.name ?? null,
            trackerEmail: data.activeTrackerUser?.email ?? null,
            spectatorCount: data.totalSpectators ?? prev.spectatorCount,
            currentLocation: data.currentLocation ? {
              lat: data.currentLocation.lat,
              lng: data.currentLocation.lng,
              timestamp: data.currentLocation.timestamp,
              accuracy: data.currentLocation.accuracy
            } : prev.currentLocation
          }));
        });

        custodyWebSocketService.onCurrentLocation((data: any) => {
          setState(prev => ({
            ...prev,
            isTracking: !!data.activeTracker,
            isOwner: data.activeTracker === userId,
            trackerUserId: data.activeTracker ?? prev.trackerUserId,
            trackerName: data.activeTrackerUser?.name ?? prev.trackerName,
            trackerEmail: data.activeTrackerUser?.email ?? prev.trackerEmail,
            spectatorCount: typeof data.spectators === 'number' ? data.spectators : prev.spectatorCount,
            currentLocation: data.currentLocation ? {
              lat: data.currentLocation.lat,
              lng: data.currentLocation.lng,
              timestamp: data.currentLocation.timestamp,
              accuracy: data.currentLocation.accuracy
            } : prev.currentLocation
          }));
        });

        if (autoJoin) {
          try {
            await custodyWebSocketService.joinTracking(custodyId);
          } catch (error) {
            console.log('No hay tracking activo para auto-join de custodia');
          }
        }
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
      custodyWebSocketService.disconnect();
    };
  }, [custodyId, userId, autoJoin]);

  const startGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: 'Geolocalizacion no soportada' }));
      return;
    }

    locationUpdateIntervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;

          if (!lastLocationRef.current ||
            Math.sqrt(
              Math.pow(latitude - lastLocationRef.current.lat, 2) +
              Math.pow(longitude - lastLocationRef.current.lng, 2)
            ) > 0.0001
          ) {
            lastLocationRef.current = {
              lat: latitude,
              lng: longitude,
              timestamp: Date.now(),
              accuracy
            };

            custodyWebSocketService.updateLocation(
              custodyId,
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
            error: `Error de geolocalizacion: ${error.message}`
          }));
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    }, 5000);
  }, [custodyId]);

  const stopGeolocation = useCallback(() => {
    if (locationUpdateIntervalRef.current) {
      clearInterval(locationUpdateIntervalRef.current);
      locationUpdateIntervalRef.current = null;
    }
  }, []);

  const startTracking = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await custodyWebSocketService.startTracking(custodyId);
      startGeolocation();
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
    }
  }, [custodyId, startGeolocation]);

  const stopTracking = useCallback(async () => {
    try {
      stopGeolocation();
      await custodyWebSocketService.stopTracking(custodyId);
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
    }
  }, [custodyId, stopGeolocation]);

  const joinAsSpectator = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await custodyWebSocketService.joinTracking(custodyId);
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
    }
  }, [custodyId]);

  const getCurrentLocation = useCallback(async () => {
    try {
      const location = await custodyWebSocketService.getCurrentLocation(custodyId);
      return location;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      return null;
    }
  }, [custodyId]);

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
