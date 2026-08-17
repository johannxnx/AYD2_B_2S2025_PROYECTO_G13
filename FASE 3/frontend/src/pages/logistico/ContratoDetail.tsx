// src/pages/logistico/ContratoDetail.tsx
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaCalendarAlt, FaClock, FaShieldAlt, FaDollarSign, FaGift, FaMap } from 'react-icons/fa';
import { useContratos } from '../../services/Logistico/hooks/useContratos';
import { formatMoney, formatDate, getContratoEstadoInfo, type TarifaNegociada } from '../../services/Logistico/Logistico';
import type { RutaAutorizada } from '../../services/api';
import LogisticHeader from '../../components/logistico/LogisticHeader';
import LogisticMenu from '../../components/logistico/LogisticMenu';
import { useAuth } from '../../context/AuthContext';



const ContratoDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { contratoActual, obtenerContrato, loading, error, limpiarError } = useContratos();

  const userName = user?.nombres && user?.apellidos 
    ? `${user.nombres} ${user.apellidos}`
    : user?.email?.split('@')[0] || 'Operador Logístico';

  useEffect(() => {
    if (id) {
      obtenerContrato(parseInt(id));
    }
  }, [id]);

  if (loading && !contratoActual) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!contratoActual) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <LogisticHeader userName={userName} userRole="Detalle Contrato" />
        <LogisticMenu />
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <p className="text-gray-500">Contrato no encontrado</p>
          <button
            onClick={() => navigate('/logistico/contratos')}
            className="mt-4 text-orange-600 hover:text-orange-800 font-semibold"
          >
            Volver al listado
          </button>
        </div>
      </div>
    );
  }

  const estadoInfo = getContratoEstadoInfo(contratoActual.estado);
  const saldoUsado = contratoActual.saldo_usado || 0;
  const creditoDisponible = contratoActual.limite_credito - saldoUsado;

  // Función para obtener el símbolo de la moneda según el moneda_id
  const getSimboloMoneda = (monedaId?: number): string => {
    const simbolosMap: Record<number, string> = {
      1: 'Q',    // GTQ
      2: '$',    // USD
      6: 'L',    // HNL
      7: '₡'     // SVC
    };
    return monedaId ? (simbolosMap[monedaId] || 'Q') : (contratoActual.simbolo_moneda || 'Q');
  };

  // Función para obtener el nombre de la moneda según el moneda_id
  const getNombreMoneda = (monedaId?: number): string => {
    const monedasMap: Record<number, string> = {
      1: 'GTQ',    // Quetzal Guatemalteco
      2: 'USD',    // Dólar Estadounidense
      6: 'HNL',    // Lempira Hondureño
      7: 'SVC'     // Colón Salvadoreño
    };
    return monedaId ? (monedasMap[monedaId] || 'GTQ') : (contratoActual.nombre_moneda || 'GTQ');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <LogisticHeader 
        userName={userName}
        userRole="Detalle de Contrato"
      />
      <LogisticMenu />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Mejorado */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-10 bg-gradient-to-r from-orange-600 to-orange-700 rounded-2xl p-8 text-white shadow-lg">
          <div className="flex items-start space-x-6">
            <button
              onClick={() => navigate('/logistico/contratos')}
              className="flex items-center justify-center h-12 w-12 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg transition-all"
            >
              <FaArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-4xl font-bold">{contratoActual.numero_contrato}</h1>
              <p className="text-orange-100 mt-2 text-lg font-semibold">{contratoActual.cliente_nombre}</p>
              <p className="text-orange-100 text-sm">NIT: {contratoActual.cliente_nit}</p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/logistico/contratos/${id}/editar`)}
            className="flex items-center px-6 py-3 bg-white text-orange-600 rounded-lg hover:bg-orange-50 transition-all font-semibold shadow-md hover:shadow-lg"
          >
            <FaEdit className="h-5 w-5 mr-2" />
            Editar Contrato
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg flex justify-between items-center shadow-md">
            <span>{error}</span>
            <button onClick={limpiarError} className="text-red-500 hover:text-red-700 font-bold">
              <FaArrowLeft className="h-4 w-4 rotate-180" />
            </button>
          </div>
        )}

        {/* Información General Mejorada */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {/* NIT Cliente */}
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-600 uppercase">NIT Cliente</p>
              <FaShieldAlt className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{contratoActual.cliente_nit || 'N/A'}</p>
          </div>
          
          {/* Vigencia */}
          <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-600 uppercase">Vigencia</p>
              <FaCalendarAlt className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-sm font-bold text-gray-900">{formatDate(contratoActual.fecha_inicio)}</p>
            <p className="text-xs text-gray-500 mt-1">→ {formatDate(contratoActual.fecha_fin)}</p>
          </div>
          
          {/* Plazo de Pago */}
          <div className="bg-white rounded-2xl shadow-lg border border-amber-100 p-6 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-600 uppercase">Plazo Pago</p>
              <FaClock className="h-5 w-5 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{contratoActual.plazo_pago}</p>
            <p className="text-xs text-gray-500 mt-1">días</p>
          </div>
          
          {/* Estado */}
          <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-6 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-600 uppercase">Estado</p>
              <span className={`px-3 py-1 text-xs font-bold rounded-full ${estadoInfo.bg} ${estadoInfo.color}`}>
                {estadoInfo.label}
              </span>
            </div>
          </div>
        </div>

        {/* Crédito */}
        <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-8 mb-10">
          <div className="flex items-center mb-8 pb-4 border-b-2 border-orange-100">
            <FaDollarSign className="text-3xl mr-3 text-orange-600" />
            <h2 className="text-2xl font-bold text-gray-900">Crédito Disponible</h2>
            <span className="ml-4 text-sm text-gray-500">({getNombreMoneda(contratoActual.moneda_id)})</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Límite */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <p className="text-sm font-bold text-blue-600 mb-2">Límite de Crédito</p>
              <p className="text-3xl font-bold text-blue-900">{formatMoney(contratoActual.limite_credito, getNombreMoneda(contratoActual.moneda_id))}</p>
            </div>
            
            {/* Usado */}
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
              <p className="text-sm font-bold text-yellow-600 mb-2">Saldo Usado</p>
              <p className="text-3xl font-bold text-yellow-900">{formatMoney(saldoUsado, getNombreMoneda(contratoActual.moneda_id))}</p>
            </div>
            
            {/* Disponible */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <p className="text-sm font-bold text-green-600 mb-2">Crédito Disponible</p>
              <p className="text-3xl font-bold text-green-900">{formatMoney(creditoDisponible, getNombreMoneda(contratoActual.moneda_id))}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-8 bg-gray-100 rounded-full h-3 overflow-hidden border border-gray-200">
            <div 
              className={`h-full transition-all duration-500 ${
                saldoUsado >= contratoActual.limite_credito ? 'bg-red-500' :
                saldoUsado >= contratoActual.limite_credito * 0.8 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${Math.min((saldoUsado / contratoActual.limite_credito) * 100, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 mt-2 text-center">
            {Math.round((saldoUsado / contratoActual.limite_credito) * 100)}% del crédito utilizado
          </p>
        </div>

        {/* Tarifas Negociadas */}
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8 mb-10">
          <div className="flex items-center mb-6 pb-4 border-b-2 border-blue-100">
            <FaDollarSign className="text-3xl mr-3 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Tarifas Negociadas</h2>
            <span className="ml-4 text-sm text-gray-500">({getNombreMoneda(contratoActual.moneda_id)})</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Tipo Unidad</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Costo por km</th>
                </tr>
              </thead>
              <tbody>
                {contratoActual.tarifas?.map((tarifa: TarifaNegociada, idx: number) => (
                  <tr key={idx} className="border-t hover:bg-gray-50 transition">
                    <td className="px-6 py-3 text-sm text-gray-900 font-medium">{tarifa.tipo_unidad}</td>
                    <td className="px-6 py-3 text-sm font-bold text-blue-600">
                      {getSimboloMoneda(contratoActual.moneda_id)} {tarifa.costo_km_negociado.toFixed(2)}/km
                    </td>
                  </tr>
                ))}
                {(!contratoActual.tarifas || contratoActual.tarifas.length === 0) && (
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-center text-gray-500">
                      No hay tarifas negociadas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Descuentos */}
        <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-8 mb-10">
          <div className="flex items-center mb-6 pb-4 border-b-2 border-green-100">
            <FaGift className="text-3xl mr-3 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">Descuentos Aplicados</h2>
          </div>
          
          {contratoActual.descuentos && contratoActual.descuentos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-green-50 to-green-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Tipo Unidad</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Descuento</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Observación</th>
                  </tr>
                </thead>
                <tbody>
                  {contratoActual.descuentos.map((desc, idx) => (
                    <tr key={idx} className="border-t hover:bg-gray-50 transition">
                      <td className="px-6 py-3 text-sm text-gray-900 font-medium">{desc.tipo_unidad}</td>
                      <td className="px-6 py-3 text-sm font-bold text-green-600">{desc.porcentaje_descuento}%</td>
                      <td className="px-6 py-3 text-sm text-gray-500">{desc.observacion || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No hay descuentos aplicados</p>
          )}
        </div>

        {/* Rutas Autorizadas */}
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-8">
          <div className="flex items-center mb-6 pb-4 border-b-2 border-purple-100">
            <FaMap className="text-3xl mr-3 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">Rutas Autorizadas</h2>
          </div>
          
          {contratoActual.rutas && contratoActual.rutas.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-purple-50 to-purple-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Origen</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Destino</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Distancia</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Tipo Carga</th>
                  </tr>
                </thead>
                <tbody>
                  {contratoActual.rutas.map((ruta: RutaAutorizada, idx: number) => (
                    <tr key={idx} className="border-t hover:bg-gray-50 transition">
                      <td className="px-6 py-3 text-sm text-gray-900 font-medium">{ruta.origen}</td>
                      <td className="px-6 py-3 text-sm text-gray-900 font-medium">{ruta.destino}</td>
                      <td className="px-6 py-3 text-sm text-gray-700">{ruta.distancia_km ? `${ruta.distancia_km} km` : '-'}</td>
                      <td className="px-6 py-3 text-sm text-gray-700">{ruta.tipo_carga || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No hay rutas autorizadas</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContratoDetail;