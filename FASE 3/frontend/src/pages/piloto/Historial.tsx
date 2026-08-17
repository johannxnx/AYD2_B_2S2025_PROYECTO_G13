// src/pages/piloto/Historial.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaArrowLeft, FaTruck, FaCalendarAlt } from 'react-icons/fa';
import PilotoHeader from '../../components/piloto/PilotoHeader';
import PilotoMenu from '../../components/piloto/PilotoMenu';
import { useAuth } from '../../context/AuthContext';
import { pilotoApi } from '../../services/piloto/pilotoApi';
import type { OrdenAsignada } from '../../services/piloto/pilotoApi';

const Historial: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ordenes, setOrdenes] = useState<OrdenAsignada[]>([]);

  const pilotoNombre = user?.nombres && user?.apellidos 
    ? `${user.nombres} ${user.apellidos}`
    : user?.email?.split('@')[0] || 'Piloto';
  
  const pilotoId = user?.id;

  useEffect(() => {
    if (pilotoId) {
      cargarHistorial();
    }
  }, [pilotoId]);

  const cargarHistorial = async () => {
    if (!pilotoId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await pilotoApi.getMisOrdenes(pilotoId);
      const completadas = data.filter(o => o.estado === 'ENTREGADA' || o.estado === 'CERRADA');
      setOrdenes(completadas);
    } catch (err: any) {
      console.error('Error cargando historial:', err);
      setError(err.message || 'Error al cargar el historial');
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalle = (ordenId: number) => {
    navigate(`/piloto/orden/${ordenId}`);
  };

  const getEstadoTexto = (estado: string) => {
    const estados: Record<string, string> = {
      'ENTREGADA': 'Entregada',
      'CERRADA': 'Completada'
    };
    return estados[estado] || estado;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PilotoHeader pilotoNombre={pilotoNombre} />
      <PilotoMenu />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/piloto/dashboard')}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <FaArrowLeft className="h-4 w-4" />
          Volver al Dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FaCheckCircle className="h-6 w-6 text-green-600" />
            Historial de Entregas
          </h1>
          <p className="text-gray-600 mt-1">Órdenes completadas y entregadas</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <span>{error}</span>
            <button 
              onClick={() => setError(null)} 
              className="float-right text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : ordenes.length > 0 ? (
          <div className="space-y-4">
            {ordenes.map((orden) => (
              <div
                key={orden.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleVerDetalle(orden.id)}
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FaTruck className="h-5 w-5 text-gray-400" />
                      <p className="font-semibold text-gray-900">
                        Orden #{orden.numero_orden}
                      </p>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {getEstadoTexto(orden.estado)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {orden.origen} → {orden.destino}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <FaCalendarAlt className="h-3 w-3" />
                        {orden.tipo_mercancia || 'Mercancía general'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Peso: {orden.peso_estimado} kg
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVerDetalle(orden.id);
                    }}
                    className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Ver detalles →
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FaCheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay entregas completadas
            </h3>
            <p className="text-gray-500">
              El historial de tus entregas aparecerá aquí cuando completes tus primeros viajes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Historial;