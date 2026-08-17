// src/components/client/ClientContractCard.tsx
import React from 'react';
import { FaFileContract, FaCalendarAlt, FaMoneyBillWave, FaCreditCard } from 'react-icons/fa';
import { formatMoney, formatDate, getContratoEstadoInfo } from '../../services/Logistico/Logistico';

interface ContractCardProps {
  contract: any;
  onViewDetails: (id: number) => void;
}

const ClientContractCard: React.FC<ContractCardProps> = ({ contract, onViewDetails }) => {
  const estadoInfo = getContratoEstadoInfo(contract.estado);
  const saldoUsado = contract.saldo_usado || 0;
  const creditoDisponible = contract.limite_credito - saldoUsado;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <FaFileContract className="h-5 w-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">{contract.numero_contrato}</h3>
            </div>
            <p className="text-sm text-gray-500 mt-1">Contrato de servicios de transporte</p>
          </div>
          <span className={`px-3 py-1 text-sm font-semibold rounded-full ${estadoInfo.bg} ${estadoInfo.color}`}>
            {estadoInfo.label}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="flex items-center gap-3">
            <FaCalendarAlt className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Vigencia</p>
              <p className="text-sm font-medium">
                {formatDate(contract.fecha_inicio)} - {formatDate(contract.fecha_fin)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <FaMoneyBillWave className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Plazo de Pago</p>
              <p className="text-sm font-medium">{contract.plazo_pago} días</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <FaCreditCard className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Crédito Disponible</p>
              <p className="text-sm font-medium text-green-600">{formatMoney(creditoDisponible)}</p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
          <div className="text-sm">
            <span className="text-gray-500">Límite de crédito: </span>
            <span className="font-medium">{formatMoney(contract.limite_credito)}</span>
            <span className="text-gray-500 ml-4">Usado: </span>
            <span className="font-medium text-yellow-600">{formatMoney(saldoUsado)}</span>
          </div>
          <button
            onClick={() => onViewDetails(contract.id)}
            className="px-4 py-2 text-orange-600 hover:text-orange-800 font-medium text-sm"
          >
            Ver detalles →
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientContractCard;