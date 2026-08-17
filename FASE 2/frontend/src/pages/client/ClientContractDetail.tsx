// src/pages/client/ClientContractDetail.tsx
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaFileContract, FaChartLine, FaCalendarAlt, FaRoute, FaTag } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useContratos } from '../../services/Logistico/hooks/useContratos';
import { formatMoney, formatDate, getContratoEstadoInfo } from '../../services/Logistico/Logistico';
import ClientHeader from '../../components/client/ClientHeader';
import ClientMenu from '../../components/client/ClientMenu';

const ClientContractDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { contratoActual, obtenerContrato, loading, error, limpiarError } = useContratos();

  const userName = user?.nombres && user?.apellidos 
    ? `${user.nombres} ${user.apellidos}`
    : user?.email?.split('@')[0] || 'Cliente';
  
  const companyName = user?.empresa || "Mi Empresa";

  useEffect(() => {
    if (id) {
      obtenerContrato(parseInt(id));
    }
  }, [id]);

  if (loading && !contratoActual) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ClientHeader companyName={companyName} userName={userName} />
        <ClientMenu />
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </div>
    );
  }

  if (!contratoActual) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ClientHeader companyName={companyName} userName={userName} />
        <ClientMenu />
        <div className="text-center py-12">
          <p className="text-gray-500">Contrato no encontrado</p>
          <button onClick={() => navigate('/client/contracts')} className="mt-4 text-orange-600">
            Volver a mis contratos
          </button>
        </div>
      </div>
    );
  }

  const estadoInfo = getContratoEstadoInfo(contratoActual.estado);
  const saldoUsado = contratoActual.saldo_usado || 0;
  const creditoDisponible = contratoActual.limite_credito - saldoUsado;

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientHeader companyName={companyName} userName={userName} />
      <ClientMenu />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/client/contracts')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <FaArrowLeft className="h-4 w-4 mr-2" />
          Volver a mis contratos
        </button>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <span>{error}</span>
            <button onClick={limpiarError} className="float-right">×</button>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{contratoActual.numero_contrato}</h1>
          <p className="text-gray-600 mt-1">Detalles de tu contrato de transporte</p>
        </div>

        {/* Información General */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <FaFileContract className="h-6 w-6 text-orange-600" />
              <h3 className="font-semibold text-gray-900">Vigencia</h3>
            </div>
            <p className="text-gray-700">{formatDate(contratoActual.fecha_inicio)} - {formatDate(contratoActual.fecha_fin)}</p>
            <p className="text-sm text-gray-500 mt-2">Plazo de pago: {contratoActual.plazo_pago} días</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <FaChartLine className="h-6 w-6 text-orange-600" />
              <h3 className="font-semibold text-gray-900">Crédito</h3>
            </div>
            <p className="text-gray-700">Límite: {formatMoney(contratoActual.limite_credito)}</p>
            <p className="text-gray-700">Usado: {formatMoney(saldoUsado)}</p>
            <p className="text-green-600 font-medium">Disponible: {formatMoney(creditoDisponible)}</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <FaCalendarAlt className="h-6 w-6 text-orange-600" />
              <h3 className="font-semibold text-gray-900">Estado</h3>
            </div>
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${estadoInfo.bg} ${estadoInfo.color}`}>
              {estadoInfo.label}
            </span>
          </div>
        </div>

        {/* Tarifas Negociadas */}
        {contratoActual.tarifas_negociadas && contratoActual.tarifas_negociadas.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <FaTag className="h-5 w-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">Tarifas Negociadas</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Tipo de Unidad</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Costo por km</th>
                  </tr>
                </thead>
                <tbody>
                  {contratoActual.tarifas_negociadas.map((tarifa, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-4 py-2">{tarifa.tipo_unidad}</td>
                      <td className="px-4 py-2">{formatMoney(tarifa.costo_km_negociado)}/km</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Rutas Autorizadas */}
        {contratoActual.rutas_autorizadas && contratoActual.rutas_autorizadas.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <FaRoute className="h-5 w-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">Rutas Autorizadas</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Origen</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Destino</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Distancia</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Tipo Carga</th>
                  </tr>
                </thead>
                <tbody>
                  {contratoActual.rutas_autorizadas.map((ruta, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-4 py-2">{ruta.origen}</td>
                      <td className="px-4 py-2">{ruta.destino}</td>
                      <td className="px-4 py-2">{ruta.distancia_km ? `${ruta.distancia_km} km` : '-'}</td>
                      <td className="px-4 py-2">{ruta.tipo_carga || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientContractDetail;