// src/pages/Operativo/OperativoPrincipal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  FaTruck,
  FaUser,
  FaClipboardList,
  FaSync,
  FaCheckCircle,
  FaTimesCircle,
  FaMapMarkerAlt,
  FaWeight,
  FaDollarSign,
  FaClock,
  FaSignOutAlt,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../services/api';

// ─── Types ──────────────────────────────────────────────────────────────────

interface OrdenPendiente {
  id: number;
  numero_orden: string;
  nombre_cliente: string;
  origen: string;
  destino: string;
  tipo_mercancia: string;
  peso_estimado: number;
  costo: number;
}

interface Vehiculo {
  id: number;
  placa: string;
  estado: string;
  tarifario_id: number;
}

interface Piloto {
  id: number;
  nombre: string;
  nit: string;
  email: string;
  telefono: string;
}

interface AsignacionForm {
  vehiculo_id: number | '';
  piloto_id: number | '';
  peso_estimado: number | '';
  tiempo_estimado: number | '';
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatMoney = (amount: number) =>
  new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(amount);

const authHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ─── Component ──────────────────────────────────────────────────────────────

const OperativoPrincipal: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const [ordenes, setOrdenes] = useState<OrdenPendiente[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [pilotos, setPilotos] = useState<Piloto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal de asignación
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenPendiente | null>(null);
  const [form, setForm] = useState<AsignacionForm>({
    vehiculo_id: '',
    piloto_id: '',
    peso_estimado: '',
    tiempo_estimado: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const userName =
    user?.nombres && user?.apellidos
      ? `${user.nombres} ${user.apellidos}`
      : user?.email?.split('@')[0] || 'Agente Operativo';

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchAll = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [resOrdenes, resVehiculos, resPilotos] = await Promise.all([
        fetch(`${API_BASE_URL}/orden/pendiente`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/orden/vehiculos`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/orden/pilotos`, { headers: authHeaders() }),
      ]);
      const [dOrdenes, dVehiculos, dPilotos] = await Promise.all([
        resOrdenes.json(),
        resVehiculos.json(),
        resPilotos.json(),
      ]);
      if (dOrdenes.ok) setOrdenes(dOrdenes.data);
      if (dVehiculos.ok) setVehiculos(dVehiculos.data);
      if (dPilotos.ok) setPilotos(dPilotos.data);
    } catch (e) {
      console.error('Error cargando datos operativos:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Modal handlers ─────────────────────────────────────────────────────────

  const abrirModal = (orden: OrdenPendiente) => {
    setOrdenSeleccionada(orden);
    setForm({
      vehiculo_id: '',
      piloto_id: '',
      peso_estimado: orden.peso_estimado,
      tiempo_estimado: '',
    });
  };

  const cerrarModal = () => {
    setOrdenSeleccionada(null);
  };

  const handleAsignar = async () => {
    if (!ordenSeleccionada) return;
    if (!form.vehiculo_id || !form.piloto_id || !form.peso_estimado || !form.tiempo_estimado) {
      showToast('Completa todos los campos antes de asignar.', false);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/orden/${ordenSeleccionada.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          vehiculo_id: Number(form.vehiculo_id),
          piloto_id: Number(form.piloto_id),
          peso_estimado: Number(form.peso_estimado),
          tiempo_estimado: Number(form.tiempo_estimado),
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        showToast('Orden asignada correctamente.', true);
        cerrarModal();
        fetchAll(true);
      } else {
        showToast(data.mensaje || 'Error al asignar la orden.', false);
      }
    } catch (e) {
      showToast('Error de conexión.', false);
    } finally {
      setSubmitting(false);
    }
  };

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center">
              <FaClipboardList className="text-white w-4 h-4" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">Panel Operativo</h1>
              <p className="text-xs text-gray-500">Asignación de recursos</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => fetchAll(true)}
              disabled={refreshing}
              className="flex items-center space-x-1.5 text-sm text-gray-600 hover:text-orange-600 transition-colors"
            >
              <FaSync className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <FaUser className="text-orange-600 w-3.5 h-3.5" />
              </div>
              <span className="text-sm font-medium text-gray-700">{userName}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 text-sm text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              <FaSignOutAlt className="w-3.5 h-3.5" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard
            icon={FaClipboardList}
            title="Órdenes Pendientes"
            value={ordenes.length}
            color="bg-orange-500"
          />
          <StatCard
            icon={FaTruck}
            title="Vehículos Disponibles"
            value={vehiculos.filter(v => v.estado === 'DISPONIBLE').length}
            color="bg-emerald-500"
          />
          <StatCard
            icon={FaUser}
            title="Pilotos Registrados"
            value={pilotos.length}
            color="bg-blue-500"
          />
        </div>

        {/* Main table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Órdenes Pendientes de Asignación</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {ordenes.length} {ordenes.length === 1 ? 'orden requiere' : 'órdenes requieren'} asignación de recursos
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center text-gray-400">
              <FaSync className="w-8 h-8 animate-spin mb-3 text-orange-400" />
              <p className="text-sm">Cargando órdenes...</p>
            </div>
          ) : ordenes.length === 0 ? (
            <div className="py-20 flex flex-col items-center text-gray-400">
              <FaCheckCircle className="w-12 h-12 mb-3 text-emerald-300" />
              <p className="font-medium text-gray-600">No hay órdenes pendientes</p>
              <p className="text-sm mt-1">Todas las órdenes han sido procesadas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    {['# Orden', 'Cliente', 'Ruta', 'Mercancía', 'Peso', 'Costo', 'Acción'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ordenes.map(orden => (
                    <tr key={orden.id} className="hover:bg-orange-50/40 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-800">{orden.numero_orden}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-gray-700">{orden.nombre_cliente}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center space-x-1 text-xs text-gray-600">
                          <FaMapMarkerAlt className="text-orange-400 flex-shrink-0" />
                          <span>{orden.origen}</span>
                          <span className="text-gray-300 mx-1">→</span>
                          <span>{orden.destino}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-gray-600">{orden.tipo_mercancia}</span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1 text-sm text-gray-700">
                          <FaWeight className="text-gray-400 w-3 h-3" />
                          <span>{orden.peso_estimado} ton</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-800">{formatMoney(orden.costo)}</span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <button
                          onClick={() => abrirModal(orden)}
                          className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                          Asignar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ── Modal de asignación ── */}
      {ordenSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            {/* Modal header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Asignar Recursos</h3>
                <p className="text-xs text-gray-500 mt-0.5">{ordenSeleccionada.numero_orden}</p>
              </div>
              <button onClick={cerrarModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <FaTimesCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Orden info */}
            <div className="px-6 py-4 bg-orange-50/60 border-b border-orange-100">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Cliente</span>
                  <p className="font-medium text-gray-800 mt-0.5">{ordenSeleccionada.nombre_cliente}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Ruta</span>
                  <p className="font-medium text-gray-800 mt-0.5">{ordenSeleccionada.origen} → {ordenSeleccionada.destino}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Mercancía</span>
                  <p className="font-medium text-gray-800 mt-0.5">{ordenSeleccionada.tipo_mercancia}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Costo</span>
                  <p className="font-medium text-orange-600 mt-0.5">{formatMoney(ordenSeleccionada.costo)}</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="px-6 py-5 space-y-4">
              {/* Vehículo */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                  <FaTruck className="inline mr-1.5 text-orange-400" />Vehículo
                </label>
                <select
                  value={form.vehiculo_id}
                  onChange={e => setForm(f => ({ ...f, vehiculo_id: e.target.value === '' ? '' : Number(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition bg-white"
                >
                  <option value="">Seleccionar vehículo...</option>
                  {vehiculos.filter(v => v.estado === 'DISPONIBLE').map(v => (
                    <option key={v.id} value={v.id}>
                      {v.placa} — {v.estado}
                    </option>
                  ))}
                </select>
                {vehiculos.filter(v => v.estado === 'DISPONIBLE').length === 0 && (
                  <p className="text-xs text-red-500 mt-1">No hay vehículos disponibles</p>
                )}
              </div>

              {/* Piloto */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                  <FaUser className="inline mr-1.5 text-orange-400" />Piloto
                </label>
                <select
                  value={form.piloto_id}
                  onChange={e => setForm(f => ({ ...f, piloto_id: e.target.value === '' ? '' : Number(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition bg-white"
                >
                  <option value="">Seleccionar piloto...</option>
                  {pilotos.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} — {p.telefono}
                    </option>
                  ))}
                </select>
              </div>

              {/* Peso y tiempo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                    <FaWeight className="inline mr-1.5 text-orange-400" />Peso (ton)
                  </label>
                  <input
                    type="number"
                    value={form.peso_estimado}
                    readOnly
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-500 bg-gray-50 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                    <FaClock className="inline mr-1.5 text-orange-400" />Tiempo est. (min)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.tiempo_estimado}
                    onChange={e => setForm(f => ({ ...f, tiempo_estimado: e.target.value === '' ? '' : Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition"
                    placeholder="Ej. 100"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex items-center justify-end space-x-3">
              <button
                onClick={cerrarModal}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAsignar}
                disabled={submitting}
                className="px-5 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors flex items-center space-x-2"
              >
                {submitting ? (
                  <FaSync className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FaCheckCircle className="w-3.5 h-3.5" />
                )}
                <span>{submitting ? 'Asignando...' : 'Confirmar Asignación'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[60] flex items-center space-x-2.5 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all ${
            toast.ok ? 'bg-emerald-500' : 'bg-red-500'
          }`}
        >
          {toast.ok ? <FaCheckCircle className="w-4 h-4" /> : <FaTimesCircle className="w-4 h-4" />}
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
};

// ─── StatCard ────────────────────────────────────────────────────────────────

const StatCard = ({ icon: Icon, title, value, color }: {
  icon: React.ComponentType<any>;
  title: string;
  value: number;
  color: string;
}) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center space-x-4">
    <div className={`w-11 h-11 ${color} rounded-lg flex items-center justify-center flex-shrink-0`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  </div>
);

export default OperativoPrincipal;