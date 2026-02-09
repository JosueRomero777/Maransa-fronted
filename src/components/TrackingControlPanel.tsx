import React from 'react';
import './TrackingControlPanel.css';

interface TrackingControlPanelProps {
  isTracking: boolean;
  isConnected: boolean;
  spectatorCount: number;
  error?: string | null;
  trackerName?: string;
  sessionId?: string | null;
  onStart: () => void;
  onStop: () => void;
  onJoin: () => void;
}

export const TrackingControlPanel: React.FC<TrackingControlPanelProps> = ({
  isTracking,
  isConnected,
  spectatorCount,
  error,
  trackerName,
  sessionId,
  onStart,
  onStop,
  onJoin
}) => {
  return (
    <div className="tracking-control-panel">
      {/* Header */}
      <div className="tcp-header">
        <h3>📍 Control de Rastreo en Tiempo Real</h3>
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
          ⚠️ {error}
        </div>
      )}

      {/* Info Section */}
      <div className="tcp-info-section">
        {isTracking && (
          <>
            <div className="tcp-info-item">
              <label>Estado</label>
              <span className="tcp-badge active">🔴 Rastreando</span>
            </div>

            {sessionId && (
              <div className="tcp-info-item">
                <label>ID de Sesión</label>
                <span className="tcp-session-id">{sessionId.substring(0, 8)}...</span>
              </div>
            )}

            <div className="tcp-info-item">
              <label>Espectadores Conectados</label>
              <span className="tcp-badge spectators">
                👥 {spectatorCount}
              </span>
            </div>

            {trackerName && (
              <div className="tcp-info-item">
                <label>Rastreador Activo</label>
                <span className="tcp-tracker-name">{trackerName}</span>
              </div>
            )}
          </>
        )}

        {!isTracking && (
          <div className="tcp-info-item">
            <label>Estado</label>
            <span className="tcp-badge inactive">⚪ No rastreando</span>
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
              🚀 Iniciar Rastreo
            </button>

            <button
              className="tcp-btn tcp-btn-secondary"
              onClick={onJoin}
              disabled={!isConnected}
              title={!isConnected ? 'Esperando conexión...' : 'Unírete como espectador'}
            >
              👁️ Ver Rastreo
            </button>
          </>
        ) : (
          <button
            className="tcp-btn tcp-btn-danger"
            onClick={onStop}
            title="Detener rastreo en tiempo real"
          >
            ⏹️ Detener Rastreo
          </button>
        )}
      </div>

      {/* Footer Info */}
      <div className="tcp-footer-info">
        <p>
          {isTracking
            ? `📡 Compartiendo ubicación en tiempo real...`
            : `Activa el rastreo para que otros vean tu ubicación en el mapa.`}
        </p>
      </div>
    </div>
  );
};
