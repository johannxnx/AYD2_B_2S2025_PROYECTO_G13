// src/pages/client/ClientePagosPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { FaCreditCard, FaCheckCircle, FaUniversity, FaMoneyCheckAlt, FaEye } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import ClientHeader from '../../components/client/ClientHeader';
import ClientMenu from '../../components/client/ClientMenu';
import { getPagosByCliente } from '../../services/facturacion/pagos';
import { formatMoney, formatDate } from '../../services/client/client';

// ── Tipos ──────────────────────────────────────────────
interface Pago {
  id: number;
  factura_id: number;
  numero_factura?: string;
  monto: number;
  tipo_pago: 'CHEQUE' | 'TRANSFERENCIA';
  numero_autorizacion: string;
  banco?: string;
  referencia?: string;
  fecha_pago: string;
  estado?: string;
}

// ── Utilidades ─────────────────────────────────────────
const getTipoPagoInfo = (tipo: string) => {
  if (tipo === 'TRANSFERENCIA') {
    return {
      label: 'Transferencia',
      color: 'text-blue-700',
      bg: 'bg-blue-100',
      icon: <FaUniversity className="w-3 h-3" />,
    };
  }
  return {
    label: 'Cheque',
    color: 'text-purple-700',
    bg: 'bg-purple-100',
    icon: <FaMoneyCheckAlt className="w-3 h-3" />,
  };
};

// ── Modal detalle ──────────────────────────────────────
const ModalDetalle: React.FC<{ pago: Pago; onClose: () => void }> = ({ pago, onClose }) => {
  const tipoInfo = getTipoPagoInfo(pago.tipo_pago);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Detalle de Pago</h2>
            <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-xs font-semibold rounded-full ${tipoInfo.bg} ${tipoInfo.color}`}>
              {tipoInfo.icon} {tipoInfo.label}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Fecha de pago</span>
            <span className="font-medium text-gray-900">{formatDate(pago.fecha_pago)}</span>
          </div>
          {pago.numero_factura && (
            <div className="flex justify-between">
              <span className="text-gray-500">Factura asociada</span>
              <span className="font-medium text-gray-900">{pago.numero_factura}</span>
            </div>
          )}
          {pago.banco && (
            <div className="flex justify-between">
              <span className="text-gray-500">Banco</span>
              <span className="font-medium text-gray-900">{pago.banco}</span>
            </div>
          )}
          {pago.referencia && (
            <div className="flex justify-between">
              <span className="text-gray-500">Referencia</span>
              <span className="font-medium text-gray-900">{pago.referencia}</span>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <span className="text-gray-500">N° Autorización</span>
            <span className="font-mono text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1 break-all text-gray-800">
              {pago.numero_autorizacion}
            </span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-3 mt-3">
            <span className="text-gray-700 font-semibold">Monto pagado</span>
            <span className="text-xl font-bold text-green-700">{formatMoney(pago.monto)}</span>
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
const ClientePagosPage: React.FC = () => {
  const { user } = useAuth();
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagoSeleccionado, setPagoSeleccionado] = useState<Pago | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');

  const userName = user?.nombres && user?.apellidos
    ? `${user.nombres} ${user.apellidos}`
    : user?.email?.split('@')[0] || 'Cliente';
  const companyName = user?.empresa || 'Mi Empresa';
  const userId = user?.id;

  const cargarPagos = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getPagosByCliente(userId);
      if (response?.ok) {
        setPagos(response.data || []);
      } else {
        setError(response?.mensaje || 'Error al cargar pagos');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar pagos');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { cargarPagos(); }, [cargarPagos]);

  // Estadísticas
  const totalPagos        = pagos.length;
  const totalPagado       = pagos.reduce((s, p) => s + p.monto, 0);
  const transferencias    = pagos.filter(p => p.tipo_pago === 'TRANSFERENCIA').length;
  const cheques           = pagos.filter(p => p.tipo_pago === 'CHEQUE').length;

  const pagosFiltrados = filtroTipo === 'TODOS'
    ? pagos
    : pagos.filter(p => p.tipo_pago === filtroTipo);

  if (loading && pagos.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">Mis Pagos</h1>
          <p className="text-gray-600 mt-1">Historial de pagos realizados y liberación de crédito</p>
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
                <p className="text-gray-500 text-sm">Total Pagos</p>
                <p className="text-2xl font-bold text-gray-900">{totalPagos}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <FaCreditCard className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Monto Total Pagado</p>
                <p className="text-xl font-bold text-green-600">{formatMoney(totalPagado)}</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <FaCheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Transferencias</p>
                <p className="text-2xl font-bold text-blue-600">{transferencias}</p>
              </div>
              <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center">
                <FaUniversity className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Cheques</p>
                <p className="text-2xl font-bold text-purple-600">{cheques}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                <FaMoneyCheckAlt className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Historial de Pagos</h3>
              <p className="text-sm text-gray-500 mt-0.5">Cada pago libera automáticamente tu límite de crédito</p>
            </div>
            <select
              value={filtroTipo}
              onChange={e => setFiltroTipo(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="TODOS">Todos los tipos</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </div>

          {pagosFiltrados.length === 0 ? (
            <div className="text-center py-16">
              <FaCreditCard className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500">No hay pagos que mostrar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Factura</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Banco</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pagosFiltrados.map(pago => {
                    const tipoInfo = getTipoPagoInfo(pago.tipo_pago);
                    return (
                      <tr key={pago.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(pago.fecha_pago)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {pago.numero_factura || `#${pago.factura_id}`}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${tipoInfo.bg} ${tipoInfo.color}`}>
                            {tipoInfo.icon} {tipoInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {pago.banco || '—'}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-green-700">
                          {formatMoney(pago.monto)}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setPagoSeleccionado(pago)}
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

      {pagoSeleccionado && (
        <ModalDetalle
          pago={pagoSeleccionado}
          onClose={() => setPagoSeleccionado(null)}
        />
      )}
    </div>
  );
};

export default ClientePagosPage;