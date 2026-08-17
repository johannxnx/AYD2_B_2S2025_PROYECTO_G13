// src/components/client/ClientContractCard.tsx
import React from 'react';
import { FaFileContract, FaCalendarAlt, FaMoneyBillWave, FaTruck } from 'react-icons/fa';

interface Contract {
  id: string;
  contractNumber: string;
  startDate: string;
  endDate: string;
  creditLimit: number;
  usedCredit: number;
  availableCredit: number;
  paymentTerms: number;
  rates: {
    light: number;
    heavy: number;
    tractor: number;
  };
  status: 'active' | 'expired' | 'pending';
}

interface ClientContractCardProps {
  contract: Contract;
  onViewDetails?: () => void;
}

const ClientContractCard: React.FC<ClientContractCardProps> = ({ contract, onViewDetails }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'ACTIVO';
      case 'expired':
        return 'EXPIRADO';
      case 'pending':
        return 'PENDIENTE';
      default:
        return 'DESCONOCIDO';
    }
  };

  const calculateCreditPercentage = () => {
    return (contract.usedCredit / contract.creditLimit) * 100;
  };

  const isExpiringSoon = () => {
    const endDate = new Date(contract.endDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <FaFileContract className="h-6 w-6 text-white" />
            <div>
              <h3 className="text-white font-semibold text-lg">{contract.contractNumber}</h3>
              <p className="text-blue-100 text-xs">Contrato de Servicios Logísticos</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(contract.status)}`}>
            {getStatusText(contract.status)}
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-6 pb-4 border-b border-gray-200">
          <div>
            <p className="text-xs text-gray-500 flex items-center mb-1">
              <FaCalendarAlt className="h-3 w-3 mr-1" />
              Fecha de inicio
            </p>
            <p className="text-sm font-medium text-gray-900">
              {new Date(contract.startDate).toLocaleDateString('es-GT')}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 flex items-center mb-1">
              <FaCalendarAlt className="h-3 w-3 mr-1" />
              Fecha de vencimiento
            </p>
            <p className={`text-sm font-medium ${isExpiringSoon() && contract.status === 'active' ? 'text-yellow-600' : 'text-gray-900'}`}>
              {new Date(contract.endDate).toLocaleDateString('es-GT')}
              {isExpiringSoon() && contract.status === 'active' && (
                <span className="ml-2 text-xs text-yellow-600">(Próximo a vencer)</span>
              )}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <FaMoneyBillWave className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600">Crédito disponible</span>
            </div>
            <span className="text-lg font-bold text-green-600">
              Q{contract.availableCredit.toLocaleString()}
            </span>
          </div>
          <div className="relative pt-1">
            <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
              <div
                style={{ width: `${calculateCreditPercentage()}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Usado: Q{contract.usedCredit.toLocaleString()}</span>
              <span>Límite: Q{contract.creditLimit.toLocaleString()}</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Plazo de pago: {contract.paymentTerms} días
          </p>
        </div>

        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <FaTruck className="h-4 w-4 mr-2 text-blue-500" />
            Tarifas por kilómetro
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Vehículo Ligero</p>
              <p className="text-lg font-bold text-gray-900">Q{contract.rates.light}</p>
              <p className="text-xs text-gray-400">por km</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Vehículo Pesado</p>
              <p className="text-lg font-bold text-gray-900">Q{contract.rates.heavy}</p>
              <p className="text-xs text-gray-400">por km</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Cabezal</p>
              <p className="text-lg font-bold text-gray-900">Q{contract.rates.tractor}</p>
              <p className="text-xs text-gray-400">por km</p>
            </div>
          </div>
        </div>

        <button
          onClick={onViewDetails}
          className="w-full py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm"
        >
          Ver detalles del contrato
        </button>
      </div>
    </div>
  );
};

export default ClientContractCard;