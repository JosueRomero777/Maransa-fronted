import React, { useState, useEffect } from 'react';
import * as AIService from '../services/ai.service';
import './AIPrediction.css';

interface AIPredictionProps {
  onPredictionComplete?: (prediction: AIService.AIPredictionResponse) => void;
}

interface CalibreInfo {
  calibre: string;
  nombre: string;
  precio_base: number;
  precio_ajustado: number;
  factor_presentacion: number;
  valor_agregado: number;
  rendimiento: number;
  disponible: boolean;
}

const AIPrediction: React.FC<AIPredictionProps> = ({ onPredictionComplete }) => {
  const [formData, setFormData] = useState<AIService.AIPredictionRequest>({
    tipo_producto: '20',
    cantidad_estimada: 100,
    provincia: 'GUAYAS',
    presentacion: 'HEADLESS',
    mercado_destino: 'NACIONAL',
    fecha_prediccion: new Date().toISOString().split('T')[0],
    incluir_factores_externos: true,
  });

  const [prediction, setPrediction] = useState<AIService.AIPredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calibres, setCalibreS] = useState<CalibreInfo[]>([]);
  const [loadingCalibrES, setLoadingCalibreS] = useState(false);

  const presentaciones = [
    { codigo: 'HEADLESS', nombre: 'Sin Cabeza (Headless)', factor: 1.0 },
    { codigo: 'WHOLE', nombre: 'Entero con Cabeza (Whole)', factor: 2.25 },
    { codigo: 'LIVE', nombre: 'Vivo (Live)', factor: 2.5 }
  ];
  const mercados = ['USA', 'CHINA', 'EUROPA', 'VIETNAM', 'COREA_SUR', 'JAPON', 'NACIONAL', 'GUAYAQUIL', 'QUITO'];
  const provincias = ['GUAYAS', 'MANABI', 'EL_ORO', 'SANTA_ELENA', 'ESMERALDAS'];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    }));
  };

  // Cargar calibres cuando cambia la presentación
  useEffect(() => {
    const loadCalibreS = async () => {
      if (!formData.presentacion) return;
      
      setLoadingCalibreS(true);
      try {
        const response = await AIService.aiService.getCalibresByPresentation(formData.presentacion);
        setCalibreS(response.calibres || []);
        
        // Seleccionar el primer calibre disponible por defecto
        if (response.calibres && response.calibres.length > 0) {
          setFormData(prev => ({
            ...prev,
            tipo_producto: response.calibres[0].calibre
          }));
        }
      } catch (err) {
        console.error('Error cargando calibres:', err);
        setCalibreS([]);
      } finally {
        setLoadingCalibreS(false);
      }
    };

    loadCalibreS();
  }, [formData.presentacion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await AIService.aiService.predictPrice(formData);
      setPrediction(result);
      onPredictionComplete?.(result);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Error al generar predicción');
      console.error('Error en predicción:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (decimal: number) => {
    return (decimal * 100).toFixed(1) + '%';
  };

  return (
    <div className="ai-prediction-container">
      <div className="ai-prediction-card">
        <h2 className="ai-prediction-title">
           Predicción de Precios con IA
        </h2>
        
        <form onSubmit={handleSubmit} className="ai-prediction-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="presentacion">Presentación del Camarón *</label>
              <select
                id="presentacion"
                name="presentacion"
                value={formData.presentacion}
                onChange={handleInputChange}
                required
              >
                {presentaciones.map(pres => (
                  <option key={pres.codigo} value={pres.codigo}>
                    {pres.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="tipo_producto">Calibre *</label>
              {loadingCalibreS ? (
                <div style={{ padding: '10px', color: '#666' }}>Cargando calibres...</div>
              ) : (
                <select
                  id="tipo_producto"
                  name="tipo_producto"
                  value={formData.tipo_producto}
                  onChange={handleInputChange}
                  required
                  disabled={calibres.length === 0}
                >
                  {calibres.filter(c => c.disponible).map(calibre => (
                    <option key={calibre.calibre} value={calibre.calibre}>
                      {calibre.nombre}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cantidad_estimada">Cantidad (libras)</label>
              <input
                type="number"
                id="cantidad_estimada"
                name="cantidad_estimada"
                value={formData.cantidad_estimada}
                onChange={handleInputChange}
                min="1"
                max="100000"
              />
            </div>

            <div className="form-group">
              <label htmlFor="provincia">Provincia *</label>
              <select
                id="provincia"
                name="provincia"
                value={formData.provincia}
                onChange={handleInputChange}
                required
              >
                {provincias.map(prov => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="mercado_destino">Mercado Destino *</label>
              <select
                id="mercado_destino"
                name="mercado_destino"
                value={formData.mercado_destino}
                onChange={handleInputChange}
                required
              >
                {mercados.map(mercado => (
                  <option key={mercado} value={mercado}>{mercado}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="fecha_prediccion">Fecha de Predicción *</label>
              <input
                type="date"
                id="fecha_prediccion"
                name="fecha_prediccion"
                value={formData.fecha_prediccion}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="incluir_factores_externos"
                  checked={formData.incluir_factores_externos}
                  onChange={handleInputChange}
                />
                Incluir factores externos (clima, noticias, mercados)
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || calibres.length === 0}
            className={`submit-btn ${loading ? 'loading' : ''}`}
          >
            {loading ? ' Analizando...' : ' Generar Predicción'}
          </button>
        </form>

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {prediction && (
          <div className="prediction-results">
            <h3> Resultado de la Predicción</h3>
            
            {/* Información de Presentación y Calibre */}
            <div className="presentation-info">
              <div className="info-item">
                <span className="info-label">Presentación:</span>
                <span className="info-value">{prediction.presentacion}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Calibre:</span>
                <span className="info-value">{prediction.calibre}</span>
              </div>
            </div>
            
            <div className="prediction-main">
              <div className="price-prediction">
                <div className="predicted-price">
                  <span className="price-label">Precio Predicho:</span>
                  <span className="price-value">
                    {formatCurrency(prediction.precio_predicho || 0)}
                  </span>
                  <span className="price-unit">por libra</span>
                </div>
                
                {prediction.cantidad_estimada && (
                  <div className="total-price">
                    <span className="total-label">Total por {prediction.cantidad_estimada} libras:</span>
                    <span className="total-value">
                      {formatCurrency((prediction.precio_predicho || 0) * prediction.cantidad_estimada)}
                    </span>
                  </div>
                )}
                
                <div className="confidence-interval">
                  <span className="interval-label">
                    Rango de confianza ({formatPercentage(prediction.intervalo_confianza?.confianza || 0.85)}):
                  </span>
                  <span className="interval-range">
                    {formatCurrency(prediction.intervalo_confianza?.min || 0)} - {formatCurrency(prediction.intervalo_confianza?.max || 0)}
                  </span>
                  {prediction.cantidad_estimada && (
                    <span className="interval-total">
                      Total estimado: {formatCurrency((prediction.intervalo_confianza?.min || 0) * prediction.cantidad_estimada)} - {formatCurrency((prediction.intervalo_confianza?.max || 0) * prediction.cantidad_estimada)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="prediction-details">
              <div className="model-info">
                <h4> Información del Modelo</h4>
                <div className="model-stats">
                  <div className="stat">
                    <span className="stat-label">Modelo:</span>
                    <span className="stat-value">{prediction.modelo_usado || 'No disponible'}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Confianza:</span>
                    <span className="stat-value">{formatPercentage(prediction.confianza_modelo || 0.85)}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Fecha:</span>
                    <span className="stat-value">
                      {new Date(prediction.fecha_prediccion || new Date()).toLocaleDateString('es-EC')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="factors-analysis">
                <h4> Factores de Mercado</h4>
                <div className="factors-grid">
                  {Object.entries(prediction.factores_principales || {}).map(([factor, valor]) => {
                    const impacto = valor > 1 ? 'positive' : valor < 1 ? 'negative' : 'neutral';
                    return (
                      <div key={factor} className={`factor-item ${impacto}`}>
                        <span className="factor-name">
                          {factor.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <span className="factor-value">
                          {typeof valor === 'number' ? valor.toFixed(3) : valor}
                        </span>
                        <span className="factor-indicator">
                          {valor > 1 ? '' : valor < 1 ? '' : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="recommendations">
                <h4> Recomendaciones Inteligentes</h4>
                <ul className="recommendations-list">
                  {(prediction.recomendaciones || []).map((recomendacion, index) => (
                    <li key={index} className="recommendation-item">
                      <span className="recommendation-icon">✓</span>
                      {recomendacion}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIPrediction;
