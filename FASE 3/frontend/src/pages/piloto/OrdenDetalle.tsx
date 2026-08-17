// src/pages/piloto/OrdenDetalle.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaTruck, FaMapMarkerAlt, FaWeight, FaCalendarAlt, FaArrowLeft, FaPlay, FaFlagCheckered, FaExclamationTriangle } from 'react-icons/fa';
import PilotoHeader from '../../components/piloto/PilotoHeader';
import PilotoMenu from '../../components/piloto/PilotoMenu';
import { useAuth } from '../../context/AuthContext';
import { pilotoApi } from '../../services/piloto/pilotoApi';
import type { OrdenAsignada } from '../../services/piloto/pilotoApi'; // Importar como tipo

const OrdenDetalle: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orden, setOrden] = useState<OrdenAsignada | null>(null);

  const pilotoNombre = user?.nombres && user?.apellidos 
    ? `${user.nombres} ${user.apellidos}`
    : user?.email?.split('@')[0] || 'Piloto';

  useEffect(() => {
    cargarDetalleOrden();
  }, [id]);

  const cargarDetalleOrden = async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    try {
      const ordenes = await pilotoApi.getMisOrdenes(user?.id || 0);
      const ordenEncontrada = ordenes.find(o => o.id === parseInt(id));
      
      if (!ordenEncontrada) {
        throw new Error('Orden no encontrada');
      }
      
      setOrden(ordenEncontrada);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los detalles de la orden');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado: string) => {
    const estados: Record<string, string> = {
      'PLANIFICADA': 'bg-blue-100 text-blue-800',
      'LISTO_DESPACHO': 'bg-yellow-100 text-yellow-800',
      'EN_TRANSITO': 'bg-purple-100 text-purple-800',
      'ENTREGADA': 'bg-green-100 text-green-800',
      'CERRADA': 'bg-gray-100 text-gray-800'
    };
    return estados[estado] || 'bg-gray-100 text-gray-800';
  };

  const getEstadoTexto = (estado: string) => {
    const estados: Record<string, string> = {
      'PLANIFICADA': 'Planificada',
      'LISTO_DESPACHO': 'Listo para Despacho',
      'EN_TRANSITO': 'En Tránsito',
      'ENTREGADA': 'Entregada',
      'CERRADA': 'Completada'
    };
    return estados[estado] || estado;
  };

  const puedeIniciarViaje = orden?.estado === 'PLANIFICADA' || orden?.estado === 'LISTO_DESPACHO';
  const puedeFinalizar = orden?.estado === 'EN_TRANSITO';
  const puedeReportarEvento = orden?.estado === 'EN_TRANSITO';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PilotoHeader pilotoNombre={pilotoNombre} />
        <PilotoMenu />
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !orden) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PilotoHeader pilotoNombre={pilotoNombre} />
        <PilotoMenu />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <FaExclamationTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {error || 'Orden no encontrada'}
            </h3>
            <button
              onClick={() => navigate('/piloto/dashboard')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PilotoHeader pilotoNombre={pilotoNombre} />
      <PilotoMenu />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/piloto/dashboard')}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <FaArrowLeft className="h-4 w-4" />
          Volver al Dashboard
        </button>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Orden #{orden.numero_orden}
                </h1>
                <p className="text-blue-100 mt-1">
                  {orden.tipo_mercancia || 'Mercancía general'}
                </p>
              </div>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getEstadoColor(orden.estado)}`}>
                {getEstadoTexto(orden.estado)}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Ruta */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <FaMapMarkerAlt className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Origen</p>
                  <p className="font-medium text-gray-900">{orden.origen}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <FaMapMarkerAlt className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Destino</p>
                  <p className="font-medium text-gray-900">{orden.destino}</p>
                </div>
              </div>
            </div>

            {/* Detalles de carga */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <FaWeight className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-500">Peso Estimado</p>
                  <p className="font-medium text-gray-900">{orden.peso_estimado} kg</p>
                  {orden.peso_real && (
                    <p className="text-sm text-gray-500 mt-1">
                      Peso Real: {orden.peso_real} kg
                    </p>
                  )}
                </div>
              </div>
              {orden.tiempo_estimado && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <FaCalendarAlt className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-500">Tiempo Estimado</p>
                    <p className="font-medium text-gray-900">{orden.tiempo_estimado} horas</p>
                  </div>
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                {puedeIniciarViaje && (
                  <button
                    onClick={() => navigate(`/piloto/orden/${orden.id}/iniciar-viaje`)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <FaPlay className="h-4 w-4" />
                    Iniciar Viaje
                  </button>
                )}
                
                {puedeReportarEvento && (
                  <button
                    onClick={() => navigate(`/piloto/orden/${orden.id}/evento`)}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <FaExclamationTriangle className="h-4 w-4" />
                    Reportar Evento
                  </button>
                )}
                
                {puedeFinalizar && (
                  <button
                    onClick={() => navigate(`/piloto/orden/${orden.id}/finalizar`)}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <FaFlagCheckered className="h-4 w-4" />
                    Finalizar Entrega
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdenDetalle;