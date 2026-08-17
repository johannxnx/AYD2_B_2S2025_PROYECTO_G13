// src/pages/piloto/MisOrdenes.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTruck, FaArrowLeft } from 'react-icons/fa';
import PilotoHeader from '../../components/piloto/PilotoHeader';
import PilotoMenu from '../../components/piloto/PilotoMenu';
import PilotoOrdenCard from '../../components/piloto/PilotoOrdenCard';
import { useAuth } from '../../context/AuthContext';
import { pilotoApi } from '../../services/piloto/pilotoApi';
import type { OrdenAsignada } from '../../services/piloto/pilotoApi';

const MisOrdenes: React.FC = () => {
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
      cargarOrdenes();
    }
  }, [pilotoId]);

  const cargarOrdenes = async () => {
    if (!pilotoId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await pilotoApi.getMisOrdenes(pilotoId);
      setOrdenes(data);
    } catch (err: any) {
      console.error('Error cargando órdenes:', err);
      setError(err.message || 'Error al cargar las órdenes');
    } finally {
      setLoading(false);
    }
  };

  const handleIniciarViaje = (ordenId: number) => {
    navigate(`/piloto/orden/${ordenId}/iniciar-viaje`);
  };

  const handleFinalizarEntrega = (ordenId: number) => {
    navigate(`/piloto/orden/${ordenId}/finalizar`);
  };

  const handleReportarEvento = (ordenId: number) => {
    navigate(`/piloto/orden/${ordenId}/evento`);
  };

  const handleVerDetalle = (ordenId: number) => {
    navigate(`/piloto/orden/${ordenId}`);
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
          <h1 className="text-2xl font-bold text-gray-900">Mis Órdenes</h1>
          <p className="text-gray-600 mt-1">Todas las órdenes asignadas a ti</p>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {ordenes.map((orden) => (
              <PilotoOrdenCard
                key={orden.id}
                orden={orden}
                onIniciarViaje={handleIniciarViaje}
                onFinalizarEntrega={handleFinalizarEntrega}
                onReportarEvento={handleReportarEvento}
                onVerDetalle={handleVerDetalle}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FaTruck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No tienes órdenes asignadas
            </h3>
            <p className="text-gray-500">
              Las órdenes aparecerán aquí cuando te sean asignadas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MisOrdenes;