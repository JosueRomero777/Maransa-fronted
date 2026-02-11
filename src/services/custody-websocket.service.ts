import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config/api.config';

class CustodyWebSocketService {
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

      const wsBaseUrl = import.meta.env.VITE_WS_URL || API_BASE_URL.replace('/api', '');
      const socketUrl = `${wsBaseUrl}/custody-tracking`;

      this.socket = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      });

      this.token = token;
      this.userId = userId;

      this.socket.on('connect', () => resolve());
      this.socket.on('connect_error', (error: any) => reject(error));
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  startTracking(custodyId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      this.socket.emit('start_custody_tracking', {
        custodyId,
        userId: this.userId,
        token: this.token
      }, (response: any) => {
        if (response.success) resolve(response);
        else reject(new Error(response.error || 'Error iniciando custodia tracking'));
      });
    });
  }

  stopTracking(custodyId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      this.socket.emit('stop_custody_tracking', {
        custodyId,
        userId: this.userId
      }, (response: any) => {
        if (response.success) resolve(response);
        else reject(new Error(response.error || 'Error deteniendo custodia tracking'));
      });
    });
  }

  updateLocation(custodyId: number, lat: number, lng: number, accuracy?: number): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      this.socket.emit('update_custody_location', {
        custodyId,
        lat,
        lng,
        accuracy
      }, (response: any) => {
        if (response.success) resolve(response);
        else reject(new Error(response.error || 'Error actualizando ubicacion'));
      });
    });
  }

  joinTracking(custodyId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      this.socket.emit('join_custody_tracking', {
        custodyId,
        userId: this.userId
      }, (response: any) => {
        if (response.success) resolve(response);
        else reject(new Error(response.error || 'Error uniendose a custodia tracking'));
      });
    });
  }

  getCurrentLocation(custodyId: number): Promise<any> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, error: 'WebSocket not connected' });
        return;
      }

      this.socket.emit('get_custody_current_location', { custodyId }, (response: any) => {
        resolve(response);
      });
    });
  }

  onLocationUpdate(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('custody_location_updated', callback);
    }
  }

  onTrackingStopped(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('custody_tracking_stopped', callback);
      this.socket.on('custody_tracking_stopped_by_system', callback);
    }
  }

  onTrackingError(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('custody_tracking_error', callback);
    }
  }

  onTrackingStartedAck(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('custody_tracking_started_ack', callback);
    }
  }

  onSpectatorJoined(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('custody_spectator_joined', callback);
    }
  }

  onSpectatorJoinedAck(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('custody_spectator_joined_ack', callback);
    }
  }

  onCurrentLocation(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('custody_current_location', callback);
    }
  }

  off(event: string): void {
    if (this.socket) {
      this.socket.off(event);
    }
  }
}

export const custodyWebSocketService = new CustodyWebSocketService();
