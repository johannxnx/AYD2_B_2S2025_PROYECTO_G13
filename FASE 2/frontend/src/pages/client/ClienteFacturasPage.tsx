// src/pages/client/ClienteFacturasPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { FaFileInvoiceDollar, FaCheckCircle, FaClock, FaTimesCircle, FaEye } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import ClientHeader from '../../components/client/ClientHeader';
import ClientMenu from '../../components/client/ClientMenu';
import { getFacturasByCliente } from '../../services/facturacion/facturacion';
import { formatMoney, formatDate } from '../../services/client/client';

// ── Tipos ──────────────────────────────────────────────
interface Factura {
  id: number;
  numero_factura: string;
  fecha_emision: string;
  fecha_vencimiento?: string;
  monto_total: number;
  estado: 'BORRADOR' | 'CERTIFICADA' | 'PAGADA' | 'VENCIDA' | 'ANULADA';
  uuid_autorizacion?: string;
  orden_id?: number;
  contrato_numero?: string;
}

// ── Utilidades de estado ───────────────────────────────
const getEstadoInfo = (estado: string) => {
  const map: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    BORRADOR:   { label: 'Borrador',   color: 'text-gray-700',   bg: 'bg-gray-100',   icon: <FaClock className="w-3 h-3" /> },
    CERTIFICADA:{ label: 'Certificada',color: 'text-blue-700',   bg: 'bg-blue-100',   icon: <FaCheckCircle className="w-3 h-3" /> },
    PAGADA:     { label: 'Pagada',     color: 'text-green-700',  bg: 'bg-green-100',  icon: <FaCheckCircle className="w-3 h-3" /> },
    VENCIDA:    { label: 'Vencida',    color: 'text-red-700',    bg: 'bg-red-100',    icon: <FaTimesCircle className="w-3 h-3" /> },
    ANULADA:    { label: 'Anulada',    color: 'text-gray-500',   bg: 'bg-gray-100',   icon: <FaTimesCircle className="w-3 h-3" /> },
  };
  return map[estado] || { label: estado, color: 'text-gray-700', bg: 'bg-gray-100', icon: null };
};

// ── Modal detalle ──────────────────────────────────────
const ModalDetalle: React.FC<{ factura: Factura; onClose: () => void }> = ({ factura, onClose }) => {
  const estadoInfo = getEstadoInfo(factura.estado);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Factura {factura.numero_factura}</h2>
            <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-xs font-semibold rounded-full ${estadoInfo.bg} ${estadoInfo.color}`}>
              {estadoInfo.icon} {estadoInfo.label}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Fecha de emisión</span>
            <span className="font-medium text-gray-900">{formatDate(factura.fecha_emision)}</span>
          </div>
          {factura.fecha_vencimiento && (
            <div className="flex justify-between">
              <span className="text-gray-500">Vencimiento</span>
              <span className="font-medium text-gray-900">{formatDate(factura.fecha_vencimiento)}</span>
            </div>
          )}
          {factura.contrato_numero && (
            <div className="flex justify-between">
              <span className="text-gray-500">Contrato</span>
              <span className="font-medium text-gray-900">{factura.contrato_numero}</span>
            </div>
          )}
          {factura.uuid_autorizacion && (
            <div className="flex flex-col gap-1">
              <span className="text-gray-500">UUID Autorización (FEL)</span>
              <span className="font-mono text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1 break-all text-gray-800">
                {factura.uuid_autorizacion}
              </span>
            </div>
          )}
          <div className="flex justify-between border-t border-gray-200 pt-3 mt-3">
            <span className="text-gray-700 font-semibold">Total</span>
            <span className="text-xl font-bold text-gray-900">{formatMoney(factura.monto_total)}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

// ── Componente principal ───────────────────────────────
const ClienteFacturasPage: React.FC = () => {
  const { user } = useAuth();
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');

  const userName = user?.nombres && user?.apellidos
    ? `${user.nombres} ${user.apellidos}`
    : user?.email?.split('@')[0] || 'Cliente';
  const companyName = user?.empresa || 'Mi Empresa';
  const userId = user?.id;

  const cargarFacturas = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getFacturasByCliente(userId);
      if (response?.ok) {
        setFacturas(response.data || []);
      } else {
        setError(response?.mensaje || 'Error al cargar facturas');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar facturas');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { cargarFacturas(); }, [cargarFacturas]);

  // Estadísticas rápidas
  const totalFacturas   = facturas.length;
  const pendientes      = facturas.filter(f => f.estado === 'CERTIFICADA').length;
  const pagadas         = facturas.filter(f => f.estado === 'PAGADA').length;
  const montoPendiente  = facturas
    .filter(f => f.estado === 'CERTIFICADA' || f.estado === 'VENCIDA')
    .reduce((s, f) => s + f.monto_total, 0);

  const facturasFiltradas = filtroEstado === 'TODOS'
    ? facturas
    : facturas.filter(f => f.estado === filtroEstado);

  if (loading && facturas.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ClientHeader companyName={companyName} userName={userName} />
        <ClientMenu />
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientHeader companyName={companyName} userName={userName} />
      <ClientMenu />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Título */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Mis Facturas</h1>
          <p className="text-gray-600 mt-1">Historial de facturación y estado de tus documentos</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900 font-bold">×</button>
          </div>
        )}

        {/* Tarjetas resumen */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Facturas</p>
                <p className="text-2xl font-bold text-gray-900">{totalFacturas}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <FaFileInvoiceDollar className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Por Pagar</p>
                <p className="text-2xl font-bold text-yellow-600">{pendientes}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                <FaClock className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Pagadas</p>
                <p className="text-2xl font-bold text-green-600">{pagadas}</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <FaCheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Monto Pendiente</p>
                <p className="text-xl font-bold text-red-600">{formatMoney(montoPendiente)}</p>
              </div>
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                <FaFileInvoiceDollar className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Historial de Facturas</h3>
              <p className="text-sm text-gray-500 mt-0.5">Consulta y gestiona tus documentos fiscales</p>
            </div>
            {/* Filtro */}
            <select
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="TODOS">Todos los estados</option>
              <option value="BORRADOR">Borrador</option>
              <option value="CERTIFICADA">Certificada</option>
              <option value="PAGADA">Pagada</option>
              <option value="VENCIDA">Vencida</option>
              <option value="ANULADA">Anulada</option>
            </select>
          </div>

          {facturasFiltradas.length === 0 ? (
            <div className="text-center py-16">
              <FaFileInvoiceDollar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500">No hay facturas que mostrar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Factura</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Emisión</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimiento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {facturasFiltradas.map(factura => {
                    const estadoInfo = getEstadoInfo(factura.estado);
                    return (
                      <tr key={factura.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {factura.numero_factura}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(factura.fecha_emision)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {factura.fecha_vencimiento ? formatDate(factura.fecha_vencimiento) : '—'}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {formatMoney(factura.monto_total)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${estadoInfo.bg} ${estadoInfo.color}`}>
                            {estadoInfo.icon} {estadoInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setFacturaSeleccionada(factura)}
                            className="text-orange-600 hover:text-orange-900 transition-colors"
                            title="Ver detalle"
                          >
                            <FaEye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {facturaSeleccionada && (
        <ModalDetalle
          factura={facturaSeleccionada}
          onClose={() => setFacturaSeleccionada(null)}
        />
      )}
    </div>
  );
};

export default ClienteFacturasPage;