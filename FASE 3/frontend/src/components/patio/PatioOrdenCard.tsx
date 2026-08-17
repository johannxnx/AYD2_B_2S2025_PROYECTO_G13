// src/components/patio/PatioOrdenCard.tsx
import React from 'react';
import { FaTruck, FaMapMarkerAlt, FaWeight, FaClipboardCheck } from 'react-icons/fa';
import type { OrdenPlanificada } from '../../services/patio/patioApi';

interface PatioOrdenCardProps {
  orden: OrdenPlanificada;
  onAutorizarSalida: (orden: OrdenPlanificada) => void;
}

const PatioOrdenCard: React.FC<PatioOrdenCardProps> = ({ orden, onAutorizarSalida }) => {
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden">
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {orden.numero_orden}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {orden.tipo_mercancia || 'Mercancía general'}
            </p>
          </div>
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
            Planificada
          </span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-start gap-2">
            <FaMapMarkerAlt className="h-4 w-4 text-green-600 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Origen</p>
              <p className="text-sm font-medium text-gray-900">{orden.origen}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <FaMapMarkerAlt className="h-4 w-4 text-red-600 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Destino</p>
              <p className="text-sm font-medium text-gray-900">{orden.destino}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FaWeight className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Peso Estimado</p>
              <p className="text-sm font-medium">{orden.peso_estimado} kg</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => onAutorizarSalida(orden)}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
        >
          <FaClipboardCheck className="h-4 w-4" />
          Autorizar Salida
        </button>
      </div>
    </div>
  );
};

export default PatioOrdenCard;