// src/pages/piloto/PrincipalPiloto.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTruck, FaClipboardList, FaCheckCircle, FaMapMarkerAlt } from 'react-icons/fa';
import PilotoHeader from '../../components/piloto/PilotoHeader';
import PilotoMenu from '../../components/piloto/PilotoMenu';
import PilotoOrdenCard from '../../components/piloto/PilotoOrdenCard';
import { useAuth } from '../../context/AuthContext';
import { pilotoApi } from '../../services/piloto/pilotoApi';
import type { OrdenAsignada } from '../../services/piloto/pilotoApi';

const PrincipalPiloto: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ordenes, setOrdenes] = useState<OrdenAsignada[]>([]);
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    pendientes: 0,
    enTransito: 0,
    completadas: 0
  });

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
      
      const stats = {
        total: data.length,
        pendientes: data.filter(o => o.estado === 'PLANIFICADA' || o.estado === 'LISTO_DESPACHO').length,
        enTransito: data.filter(o => o.estado === 'EN_TRANSITO').length,
        completadas: data.filter(o => o.estado === 'ENTREGADA' || o.estado === 'CERRADA').length
      };
      setEstadisticas(stats);
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

  const StatCard = ({ icon: Icon, title, value, color, bgColor }: any) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-12 h-12 ${bgColor} rounded-full flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );

  const ordenesActivas = ordenes.filter(
    o => o.estado === 'PLANIFICADA' || o.estado === 'LISTO_DESPACHO' || o.estado === 'EN_TRANSITO'
  );

  const ordenesCompletadas = ordenes
    .filter(o => o.estado === 'ENTREGADA' || o.estado === 'CERRADA')
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      <PilotoHeader 
        pilotoNombre={pilotoNombre}
        pilotoIdentificacion={pilotoId?.toString()}
      />
      <PilotoMenu />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Mi Tablero de Control
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona tus entregas y mantén actualizado el estado de tus viajes
          </p>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={FaClipboardList}
            title="Total Órdenes"
            value={estadisticas.total}
            color="text-blue-600"
            bgColor="bg-blue-100"
          />
          <StatCard
            icon={FaTruck}
            title="Pendientes"
            value={estadisticas.pendientes}
            color="text-yellow-600"
            bgColor="bg-yellow-100"
          />
          <StatCard
            icon={FaMapMarkerAlt}
            title="En Tránsito"
            value={estadisticas.enTransito}
            color="text-purple-600"
            bgColor="bg-purple-100"
          />
          <StatCard
            icon={FaCheckCircle}
            title="Completadas"
            value={estadisticas.completadas}
            color="text-green-600"
            bgColor="bg-green-100"
          />
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <FaTruck className="h-5 w-5 text-blue-600" />
              Mis Entregas Activas
            </h2>
            <button
              onClick={() => navigate('/piloto/ordenes')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Ver todas →
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : ordenesActivas.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {ordenesActivas.map((orden) => (
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
                No tienes entregas activas
              </h3>
              <p className="text-gray-500">
                Tus próximas entregas aparecerán aquí cuando sean asignadas.
              </p>
            </div>
          )}
        </div>

        {ordenesCompletadas.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaCheckCircle className="h-5 w-5 text-green-600" />
              Entregas Recientes
            </h2>
            <div className="space-y-3">
              {ordenesCompletadas.map((orden) => (
                <div
                  key={orden.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleVerDetalle(orden.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">
                        Orden #{orden.numero_orden}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {orden.origen} → {orden.destino}
                      </p>
                    </div>
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {orden.estado === 'CERRADA' ? 'Completada' : 'Entregada'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrincipalPiloto;