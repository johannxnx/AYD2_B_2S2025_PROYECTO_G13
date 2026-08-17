// src/pages/logistico/ContratoDetail.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaPlus, FaTrash } from 'react-icons/fa';
import { useContratos } from '../../services/Logistico/hooks/useContratos';
import { formatMoney, formatDate, getContratoEstadoInfo } from '../../services/Logistico/Logistico';
import LogisticHeader from '../../components/logistico/LogisticHeader';
import LogisticMenu from '../../components/logistico/LogisticMenu';
import { useAuth } from '../../context/AuthContext';

interface DescuentoForm {
  tipo_unidad: string;
  porcentaje_descuento: number;
  observacion: string;
}

interface RutaForm {
  origen: string;
  destino: string;
  distancia_km: number;
  tipo_carga: string;
}

const ContratoDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { contratoActual, obtenerContrato, agregarDescuento, agregarRuta, loading, error, limpiarError } = useContratos();
  
  const [showDescuentoForm, setShowDescuentoForm] = useState(false);
  const [showRutaForm, setShowRutaForm] = useState(false);
  
  const [descuentoData, setDescuentoData] = useState<DescuentoForm>({
    tipo_unidad: '',
    porcentaje_descuento: 0,
    observacion: ''
  });
  
  const [rutaData, setRutaData] = useState<RutaForm>({
    origen: '',
    destino: '',
    distancia_km: 0,
    tipo_carga: ''
  });

  const userName = user?.nombres && user?.apellidos 
    ? `${user.nombres} ${user.apellidos}`
    : user?.email?.split('@')[0] || 'Operador Logístico';

  useEffect(() => {
    if (id) {
      obtenerContrato(parseInt(id));
    }
  }, [id]);

  const handleAgregarDescuento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (id && descuentoData.tipo_unidad && descuentoData.porcentaje_descuento > 0) {
      await agregarDescuento(
        parseInt(id),
        descuentoData.tipo_unidad,
        descuentoData.porcentaje_descuento,
        descuentoData.observacion
      );
      setShowDescuentoForm(false);
      setDescuentoData({ tipo_unidad: '', porcentaje_descuento: 0, observacion: '' });
      // Recargar contrato
      obtenerContrato(parseInt(id));
    }
  };

  const handleAgregarRuta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (id && rutaData.origen && rutaData.destino) {
      await agregarRuta(
        parseInt(id),
        rutaData.origen,
        rutaData.destino,
        rutaData.distancia_km || undefined,
        rutaData.tipo_carga || undefined
      );
      setShowRutaForm(false);
      setRutaData({ origen: '', destino: '', distancia_km: 0, tipo_carga: '' });
      obtenerContrato(parseInt(id));
    }
  };

  if (loading && !contratoActual) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!contratoActual) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LogisticHeader userName={userName} userRole="Detalle Contrato" />
        <LogisticMenu />
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <p className="text-gray-500">Contrato no encontrado</p>
          <button
            onClick={() => navigate('/logistico/contratos')}
            className="mt-4 text-orange-600 hover:text-orange-800"
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

  return (
    <div className="min-h-screen bg-gray-50">
      <LogisticHeader 
        userName={userName}
        userRole="Detalle de Contrato"
      />
      <LogisticMenu />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/logistico/contratos')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <FaArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{contratoActual.numero_contrato}</h1>
              <p className="text-gray-600 mt-1">Cliente: {contratoActual.cliente_nombre}</p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/logistico/contratos/${id}/editar`)}
            className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            <FaEdit className="h-4 w-4 mr-2" />
            Editar
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={limpiarError} className="text-red-700 hover:text-red-900">
              ×
            </button>
          </div>
        )}

        {/* Información General */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información General</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-500">NIT Cliente</p>
              <p className="font-medium">{contratoActual.cliente_nit || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Vigencia</p>
              <p className="font-medium">{formatDate(contratoActual.fecha_inicio)} - {formatDate(contratoActual.fecha_fin)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Plazo de Pago</p>
              <p className="font-medium">{contratoActual.plazo_pago} días</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Estado</p>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${estadoInfo.bg} ${estadoInfo.color}`}>
                {estadoInfo.label}
              </span>
            </div>
          </div>
        </div>

        {/* Crédito */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Crédito Disponible</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600">Límite de Crédito</p>
              <p className="text-2xl font-bold text-blue-700">{formatMoney(contratoActual.limite_credito)}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-sm text-yellow-600">Saldo Usado</p>
              <p className="text-2xl font-bold text-yellow-700">{formatMoney(saldoUsado)}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600">Crédito Disponible</p>
              <p className="text-2xl font-bold text-green-700">{formatMoney(creditoDisponible)}</p>
            </div>
          </div>
        </div>

        {/* Tarifas Negociadas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tarifas Negociadas</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Tipo Unidad</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Costo por km</th>
                </tr>
              </thead>
              <tbody>
                {contratoActual.tarifas_negociadas?.map((tarifa, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-4 py-2">{tarifa.tipo_unidad}</td>
                    <td className="px-4 py-2">{formatMoney(tarifa.costo_km_negociado)}/km</td>
                  </tr>
                ))}
                {(!contratoActual.tarifas_negociadas || contratoActual.tarifas_negociadas.length === 0) && (
                  <tr>
                    <td colSpan={2} className="px-4 py-4 text-center text-gray-500">
                      No hay tarifas negociadas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Descuentos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Descuentos Aplicados</h2>
            <button
              onClick={() => setShowDescuentoForm(!showDescuentoForm)}
              className="text-orange-600 hover:text-orange-800 flex items-center text-sm"
            >
              <FaPlus className="h-3 w-3 mr-1" />
              Agregar Descuento
            </button>
          </div>
          
          {showDescuentoForm && (
            <form onSubmit={handleAgregarDescuento} className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Unidad</label>
                  <select
                    value={descuentoData.tipo_unidad}
                    onChange={(e) => setDescuentoData({ ...descuentoData, tipo_unidad: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Seleccionar</option>
                    <option value="Moto">Moto</option>
                    <option value="Auto">Auto</option>
                    <option value="Camión">Camión</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Porcentaje Descuento (%)</label>
                  <input
                    type="number"
                    value={descuentoData.porcentaje_descuento}
                    onChange={(e) => setDescuentoData({ ...descuentoData, porcentaje_descuento: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observación</label>
                  <input
                    type="text"
                    value={descuentoData.observacion}
                    onChange={(e) => setDescuentoData({ ...descuentoData, observacion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="mt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowDescuentoForm(false)}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                >
                  Guardar
                </button>
              </div>
            </form>
          )}
          
          {contratoActual.descuentos && contratoActual.descuentos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Tipo Unidad</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Descuento</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Observación</th>
                  </tr>
                </thead>
                <tbody>
                  {contratoActual.descuentos.map((desc, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-4 py-2">{desc.tipo_unidad}</td>
                      <td className="px-4 py-2 text-green-600">{desc.porcentaje_descuento}%</td>
                      <td className="px-4 py-2 text-gray-500">{desc.observacion || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No hay descuentos aplicados</p>
          )}
        </div>

        {/* Rutas Autorizadas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Rutas Autorizadas</h2>
            <button
              onClick={() => setShowRutaForm(!showRutaForm)}
              className="text-orange-600 hover:text-orange-800 flex items-center text-sm"
            >
              <FaPlus className="h-3 w-3 mr-1" />
              Agregar Ruta
            </button>
          </div>
          
          {showRutaForm && (
            <form onSubmit={handleAgregarRuta} className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Origen *</label>
                  <input
                    type="text"
                    value={rutaData.origen}
                    onChange={(e) => setRutaData({ ...rutaData, origen: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Destino *</label>
                  <input
                    type="text"
                    value={rutaData.destino}
                    onChange={(e) => setRutaData({ ...rutaData, destino: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Distancia (km)</label>
                  <input
                    type="number"
                    value={rutaData.distancia_km}
                    onChange={(e) => setRutaData({ ...rutaData, distancia_km: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Carga</label>
                  <input
                    type="text"
                    value={rutaData.tipo_carga}
                    onChange={(e) => setRutaData({ ...rutaData, tipo_carga: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="mt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowRutaForm(false)}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                >
                  Guardar
                </button>
              </div>
            </form>
          )}
          
          {contratoActual.rutas_autorizadas && contratoActual.rutas_autorizadas.length > 0 ? (
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
          ) : (
            <p className="text-gray-500 text-center py-4">No hay rutas autorizadas</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContratoDetail;