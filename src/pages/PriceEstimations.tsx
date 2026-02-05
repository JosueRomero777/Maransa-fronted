import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface PriceEstimation {
  id: number;
  precioEstimadoCompra?: number;
  precioEstimadoVenta?: number;
  confiabilidad?: number;
  margenEstimado?: number;
  fechaEstimacion: string;
  talla?: string;
  cantidad?: number;
  temporada?: string;
  order?: {
    id: number;
    codigo: string;
    provider: {
      name: string;
    };
    packager?: {
      name: string;
    };
  };
  formula: {
    nombre: string;
    tipo: string;
  };
}

interface MarketFactor {
  id: number;
  nombre: string;
  descripcion?: string;
  categoria: string;
  valor: number;
  unidad?: string;
  fecha: string;
  peso?: number;
}

interface EstimationAccuracy {
  precision: number;
  desviacionPromedio: number;
  totalEstimaciones: number;
}

const PriceEstimationsPage: React.FC = () => {
  const { token } = useAuth();
  const [estimations, setEstimations] = useState<PriceEstimation[]>([]);
  const [marketFactors, setMarketFactors] = useState<MarketFactor[]>([]);
  const [accuracy, setAccuracy] = useState<EstimationAccuracy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'estimations' | 'factors' | 'accuracy'>('estimations');

  // Estado para crear nueva estimación
  const [showNewEstimation, setShowNewEstimation] = useState(false);
  const [newEstimation, setNewEstimation] = useState({
    providerId: '',
    talla: '',
    cantidad: '',
    temporada: 'verano',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Verificar que tenemos un token válido
      if (!token) {
        setError('No hay sesión activa. Por favor inicia sesión.');
        return;
      }

      await Promise.all([
        fetchEstimations(),
        fetchMarketFactors(),
        fetchAccuracy(),
      ]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error cargando datos de estimaciones';
      setError(errorMessage);
      console.error('Error in fetchData:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEstimations = async () => {
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const response = await fetch(`${API_BASE_URL}/price-estimations`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', response.status, errorText);
      throw new Error(`Error fetching estimations: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    setEstimations(data.estimations || []);
  };

  const fetchMarketFactors = async () => {
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const response = await fetch(`${API_BASE_URL}/price-estimations/market-factors`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', response.status, errorText);
      throw new Error(`Error fetching market factors: ${response.status}`);
    }

    const data = await response.json();
    setMarketFactors(data);
  };

  const fetchAccuracy = async () => {
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const response = await fetch(`${API_BASE_URL}/price-estimations/accuracy`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', response.status, errorText);
      throw new Error(`Error fetching accuracy: ${response.status}`);
    }

    const data = await response.json();
    setAccuracy(data);
  };

  const handleCreateEstimation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/price-estimations/quick-estimate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerId: newEstimation.providerId ? parseInt(newEstimation.providerId) : undefined,
          talla: newEstimation.talla || undefined,
          cantidad: newEstimation.cantidad ? parseFloat(newEstimation.cantidad) : undefined,
          temporada: newEstimation.temporada,
        }),
      });

      if (!response.ok) {
        throw new Error('Error creating estimation');
      }

      setShowNewEstimation(false);
      setNewEstimation({ providerId: '', talla: '', cantidad: '', temporada: 'verano' });
      await fetchEstimations();
    } catch (err) {
      setError('Error creando estimación');
      console.error(err);
    }
  };

  const updateMarketFactor = async (id: number, valor: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/price-estimations/market-factors/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ valor }),
      });

      if (!response.ok) {
        throw new Error('Error updating market factor');
      }

      await fetchMarketFactors();
    } catch (err) {
      setError('Error actualizando factor de mercado');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Módulo Inteligente - Estimaciones de Precios
        </h1>
        <p className="text-gray-600">
          Sistema de estimaciones automáticas basado en inteligencia artificial y análisis de datos históricos
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('estimations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'estimations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Estimaciones Activas
          </button>
          <button
            onClick={() => setActiveTab('factors')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'factors'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Factores de Mercado
          </button>
          <button
            onClick={() => setActiveTab('accuracy')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'accuracy'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Precisión del Sistema
          </button>
        </nav>
      </div>

      {/* Tab: Estimaciones */}
      {activeTab === 'estimations' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Estimaciones de Precios</h2>
            <button
              onClick={() => setShowNewEstimation(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Nueva Estimación
            </button>
          </div>

          {/* Modal para nueva estimación */}
          {showNewEstimation && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">Crear Nueva Estimación</h3>
                <form onSubmit={handleCreateEstimation}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ID del Proveedor (opcional)
                    </label>
                    <input
                      type="number"
                      value={newEstimation.providerId}
                      onChange={(e) => setNewEstimation({...newEstimation, providerId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Talla</label>
                    <select
                      value={newEstimation.talla}
                      onChange={(e) => setNewEstimation({...newEstimation, talla: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Seleccionar talla</option>
                      <option value="U10">U10</option>
                      <option value="U12">U12</option>
                      <option value="U15">U15</option>
                      <option value="U20">U20</option>
                      <option value="U30">U30</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cantidad (libras)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newEstimation.cantidad}
                      onChange={(e) => setNewEstimation({...newEstimation, cantidad: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Temporada</label>
                    <select
                      value={newEstimation.temporada}
                      onChange={(e) => setNewEstimation({...newEstimation, temporada: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="verano">Verano</option>
                      <option value="invierno">Invierno</option>
                    </select>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowNewEstimation(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      Crear Estimación
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Lista de estimaciones */}
          <div className="grid gap-6">
            {estimations.map((estimation) => (
              <div key={estimation.id} className="bg-white rounded-lg shadow border p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {estimation.order ? `Pedido ${estimation.order.codigo}` : `Estimación #${estimation.id}`}
                    </h3>
                    <p className="text-gray-600">
                      {estimation.order?.provider.name} | Talla: {estimation.talla} | 
                      {estimation.cantidad} lbs | {estimation.temporada}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      {new Date(estimation.fechaEstimacion).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-green-50 p-4 rounded">
                    <div className="text-sm font-medium text-green-800">Precio Compra</div>
                    <div className="text-2xl font-bold text-green-900">
                      ${estimation.precioEstimadoCompra?.toFixed(2) || 'N/A'}
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded">
                    <div className="text-sm font-medium text-blue-800">Precio Venta</div>
                    <div className="text-2xl font-bold text-blue-900">
                      ${estimation.precioEstimadoVenta?.toFixed(2) || 'N/A'}
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded">
                    <div className="text-sm font-medium text-purple-800">Confiabilidad</div>
                    <div className="text-2xl font-bold text-purple-900">
                      {estimation.confiabilidad?.toFixed(0) || '0'}%
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded">
                    <div className="text-sm font-medium text-yellow-800">Margen</div>
                    <div className="text-2xl font-bold text-yellow-900">
                      {estimation.margenEstimado?.toFixed(1) || '0'}%
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-sm text-gray-600">
                  Fórmula: {estimation.formula.nombre} ({estimation.formula.tipo})
                </div>
              </div>
            ))}
          </div>

          {estimations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay estimaciones disponibles. Crea una nueva estimación para comenzar.
            </div>
          )}
        </div>
      )}

      {/* Tab: Factores de Mercado */}
      {activeTab === 'factors' && (
        <div>
          <h2 className="text-xl font-semibold mb-6">Factores de Mercado</h2>
          <div className="grid gap-4">
            {marketFactors.map((factor) => (
              <div key={factor.id} className="bg-white rounded-lg shadow border p-4">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <h3 className="font-semibold">{factor.nombre}</h3>
                    <p className="text-gray-600 text-sm">{factor.descripcion}</p>
                    <div className="text-xs text-gray-500 mt-1">
                      Categoría: {factor.categoria} | Peso: {factor.peso} | 
                      Actualizado: {new Date(factor.fecha).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={factor.valor}
                      className="w-20 px-2 py-1 border rounded text-center"
                      onBlur={(e) => {
                        const newValue = parseFloat(e.target.value);
                        if (newValue !== factor.valor) {
                          updateMarketFactor(factor.id, newValue);
                        }
                      }}
                    />
                    <span className="text-sm text-gray-500">{factor.unidad}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Precisión */}
      {activeTab === 'accuracy' && (
        <div>
          <h2 className="text-xl font-semibold mb-6">Precisión del Sistema</h2>
          {accuracy && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow border p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {accuracy.precision.toFixed(1)}%
                </div>
                <div className="text-gray-600">Precisión General</div>
              </div>
              
              <div className="bg-white rounded-lg shadow border p-6 text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {accuracy.desviacionPromedio.toFixed(1)}%
                </div>
                <div className="text-gray-600">Desviación Promedio</div>
              </div>
              
              <div className="bg-white rounded-lg shadow border p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {accuracy.totalEstimaciones}
                </div>
                <div className="text-gray-600">Estimaciones Analizadas</div>
              </div>
            </div>
          )}
          
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">¿Cómo se calcula la precisión?</h3>
            <p className="text-blue-800 text-sm">
              La precisión se calcula comparando los precios estimados con los precios reales obtenidos 
              en las transacciones. Un porcentaje más alto indica mayor exactitud del sistema de estimación.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceEstimationsPage;
