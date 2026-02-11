import React from 'react';
import './TrackingControlPanel.css';

interface TrackingControlPanelProps {
  isTracking: boolean;
  isConnected: boolean;
  canStop: boolean;
  spectatorCount: number;
  error?: string | null;
  trackerName?: string;
  trackerEmail?: string;
  onStart: () => void;
  onStop: () => void;
  onJoin: () => void;
}

export const TrackingControlPanel: React.FC<TrackingControlPanelProps> = ({
  isTracking,
  isConnected,
  canStop,
  spectatorCount,
  error,
  trackerName,
  trackerEmail,
  onStart,
  onStop,
  onJoin
}) => {
  return (
    <div className="tracking-control-panel">
      {/* Header */}
      <div className="tcp-header">
        <h3>Control de Rastreo en Tiempo Real</h3>
        <div className="tcp-status-indicator">
          <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
          <span className="status-text">
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="tcp-error-banner">
          {error}
        </div>
      )}

      {/* Info Section */}
      <div className="tcp-info-section">
        {isTracking && (
          <>
            <div className="tcp-info-item">
              <label>Estado</label>
              <span className="tcp-badge active">Rastreando</span>
            </div>

            <div className="tcp-info-item">
              <label>Espectadores</label>
              <span className="tcp-badge spectators">
                {spectatorCount}
              </span>
            </div>

            {(trackerName || trackerEmail) && (
              <div className="tcp-info-item">
                <label>Rastreador</label>
                <span className="tcp-tracker-name">
                  {trackerName || 'Usuario'}{trackerEmail ? ` - ${trackerEmail}` : ''}
                </span>
              </div>
            )}
          </>
        )}

        {!isTracking && (
          <div className="tcp-info-item">
            <label>Estado</label>
            <span className="tcp-badge inactive">No rastreando</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="tcp-controls">
        {!isTracking ? (
          <>
            <button
              className="tcp-btn tcp-btn-primary"
              onClick={onStart}
              disabled={!isConnected}
              title={!isConnected ? 'Esperando conexión...' : 'Iniciar rastreo en tiempo real'}
            >
              Iniciar Rastreo
            </button>

            <button
              className="tcp-btn tcp-btn-secondary"
              onClick={onJoin}
              disabled={!isConnected}
              title={!isConnected ? 'Esperando conexión...' : 'Ver como espectador'}
            >
              Ver Rastreo
            </button>
          </>
        ) : (
          canStop ? (
            <button
              className="tcp-btn tcp-btn-danger"
              onClick={onStop}
              title="Detener rastreo en tiempo real"
            >
              Detener Rastreo
            </button>
          ) : (
            <button
              className="tcp-btn tcp-btn-secondary"
              disabled
              title="Rastreo activo por otro usuario"
            >
              Rastreo Activo
            </button>
          )
        )}
      </div>

      {/* Footer Info */}
      <div className="tcp-footer-info">
        <p>
          {isTracking
            ? (canStop ? 'Compartiendo ubicación en tiempo real' : 'Rastreo activo por otro usuario')
            : 'Activa el rastreo para que otros vean tu ubicación en el mapa'}
        </p>
      </div>
    </div>
  );
};
