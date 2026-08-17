// src/components/piloto/PilotoOrdenCard.tsx
import React from 'react';
import { FaMapMarkerAlt, FaWeight, FaTruck, FaPlay, FaFlagCheckered, FaExclamationTriangle } from 'react-icons/fa';
import type { OrdenAsignada } from '../../services/piloto/pilotoApi';

interface PilotoOrdenCardProps {
  orden: OrdenAsignada;
  onIniciarViaje?: (ordenId: number) => void;
  onFinalizarEntrega?: (ordenId: number) => void;
  onReportarEvento?: (ordenId: number) => void;
  onVerDetalle?: (ordenId: number) => void;
}

const PilotoOrdenCard: React.FC<PilotoOrdenCardProps> = ({
  orden,
  onIniciarViaje,
  onFinalizarEntrega,
  onReportarEvento,
  onVerDetalle
}) => {
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

  const puedeIniciarViaje = orden.estado === 'PLANIFICADA' || orden.estado === 'LISTO_DESPACHO';
  const puedeFinalizar = orden.estado === 'EN_TRANSITO';
  const puedeReportarEvento = orden.estado === 'EN_TRANSITO';

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Orden #{orden.numero_orden}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {orden.tipo_mercancia || 'Mercancía general'}
            </p>
          </div>
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getEstadoColor(orden.estado)}`}>
            {getEstadoTexto(orden.estado)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-start space-x-2">
            <FaMapMarkerAlt className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Origen</p>
              <p className="text-sm font-medium text-gray-900">{orden.origen}</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <FaMapMarkerAlt className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Destino</p>
              <p className="text-sm font-medium text-gray-900">{orden.destino}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <FaWeight className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Peso Estimado</p>
              <p className="text-sm font-medium">{orden.peso_estimado} kg</p>
              {orden.peso_real && (
                <p className="text-xs text-gray-400">Real: {orden.peso_real} kg</p>
              )}
            </div>
          </div>
          {orden.tiempo_estimado && (
            <div className="flex items-center space-x-2">
              <FaTruck className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Tiempo Estimado</p>
                <p className="text-sm font-medium">{orden.tiempo_estimado} horas</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <button
            onClick={() => onVerDetalle?.(orden.id)}
            className="flex-1 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Ver Detalles
          </button>
          
          {puedeReportarEvento && onReportarEvento && (
            <button
              onClick={() => onReportarEvento(orden.id)}
              className="flex-1 px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors flex items-center justify-center gap-2"
            >
              <FaExclamationTriangle className="h-3 w-3" />
              Reportar Evento
            </button>
          )}
          
          {puedeIniciarViaje && onIniciarViaje && (
            <button
              onClick={() => onIniciarViaje(orden.id)}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <FaPlay className="h-3 w-3" />
              Iniciar Viaje
            </button>
          )}
          
          {puedeFinalizar && onFinalizarEntrega && (
            <button
              onClick={() => onFinalizarEntrega(orden.id)}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
            >
              <FaFlagCheckered className="h-3 w-3" />
              Finalizar Entrega
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PilotoOrdenCard;