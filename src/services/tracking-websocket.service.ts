import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config/api.config';

class TrackingWebSocketService {
  private socket: Socket | null = null;
  private token: string = '';
  private userId: number = 0;

  connect(userId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const token = localStorage.getItem('token');
      if (!token) {
        reject(new Error('No authentication token found'));
        return;
      }

      // Obtener URL base sin /api
      const baseUrl = API_BASE_URL.replace('/api', '');

      this.socket = io(baseUrl, {
        namespace: '/tracking',
        auth: {
          token,
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      });

      this.token = token;
      this.userId = userId;

      this.socket.on('connect', () => {
        console.log('✓ Conectado a WebSocket de tracking');
        resolve();
      });

      this.socket.on('connect_error', (error: any) => {
        console.error('✗ Error de conexión:', error);
        reject(error);
      });

      this.socket.on('disconnect', () => {
        console.log('Desconectado de WebSocket');
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Inicia sesión de tracking
   */
  startTracking(logisticsId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      this.socket.emit('start_tracking', {
        logisticsId,
        userId: this.userId,
        token: this.token
      }, (response: any) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error || 'Error iniciando tracking'));
        }
      });
    });
  }

  /**
   * Detiene sesión de tracking
   */
  stopTracking(logisticsId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      this.socket.emit('stop_tracking', {
        logisticsId,
        userId: this.userId
      }, (response: any) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error || 'Error deteniendo tracking'));
        }
      });
    });
  }

  /**
   * Actualiza ubicación en tiempo real
   */
  updateLocation(logisticsId: number, lat: number, lng: number, accuracy?: number): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      this.socket.emit('update_location', {
        logisticsId,
        lat,
        lng,
        accuracy
      }, (response: any) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error || 'Error actualizando ubicación'));
        }
      });
    });
  }

  /**
   * Se une como espectador
   */
  joinTracking(logisticsId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      this.socket.emit('join_tracking', {
        logisticsId,
        userId: this.userId
      }, (response: any) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error || 'Error uniéndose como espectador'));
        }
      });
    });
  }

  /**
   * Obtiene ubicación actual
   */
  getCurrentLocation(logisticsId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      this.socket.emit('get_current_location', {
        logisticsId
      }, (response: any) => {
        resolve(response);
      });
    });
  }

  /**
   * Escucha eventos de actualización de ubicación
   */
  onLocationUpdate(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('location_updated', callback);
    }
  }

  /**
   * Escucha inicio de tracking
   */
  onTrackingStarted(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('tracking_started', callback);
    }
  }

  /**
   * Escucha detención de tracking
   */
  onTrackingStopped(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('tracking_stopped', callback);
      this.socket.on('tracking_stopped_by_system', callback);
    }
  }

  /**
   * Escucha ubicación actual
   */
  onCurrentLocation(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('current_location', callback);
    }
  }

  /**
   * Escucha errores
   */
  onTrackingError(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('tracking_error', callback);
    }
  }

  /**
   * Escucha cuando el track empezó
   */
  onTrackingStartedAck(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('tracking_started_ack', callback);
    }
  }

  /**
   * Escucha cuando alguien se une como espectador
   */
  onSpectatorJoined(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('spectator_joined', callback);
    }
  }

  /**
   * Remover listener
   */
  off(event: string): void {
    if (this.socket) {
      this.socket.off(event);
    }
  }
}

export const trackingWebSocketService = new TrackingWebSocketService();
