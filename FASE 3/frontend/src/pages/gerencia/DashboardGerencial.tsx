// src/pages/finanzas/DashboardGerencial.tsx
import React, { useEffect, useState, useCallback } from "react";
import { getCorteDiario, getKPIs, getAlertas } from "../../services/Gerencial/gerencial";
import { useMonedas } from "../../services/monedas/hooks/useMonedas";
import { formatMoney } from "../../services/Logistico/Logistico";
import { FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from "react-router-dom";
import { 
  FaChartLine, FaDollarSign, FaPercent, FaCheckCircle, 
  FaBox, FaTruck, FaClock, FaExclamationTriangle, FaCheckDouble,
  FaArrowUp, FaArrowDown 
} from 'react-icons/fa';

// ─── Types ───────────────────────────────────────────────────────────────────

type CorteDiario = {
  sede?: string;
  total_ordenes?: number;
  ordenes_entregadas?: number;
  ordenes_en_transito?: number;
  ordenes_pendientes?: number;
  total_facturado?: number;
  total_cobrado?: number;
};

type KPIs = {
  ingresos?: number;
  costos?: number;
  rentabilidad?: number;
  margen_porcentaje?: number; 
  tiempo_promedio_entrega?: number;
  tiempo_pactado?: number;
  ordenes_a_tiempo?: number;
  total_ordenes?: number;
  // Rentabilidad por contrato (puede venir como array o como objeto)
  contratos?: ContratoRentabilidad[];
};

type ContratoRentabilidad = {
  contrato_id?: number;
  numero_contrato?: string;
  cliente_nombre?: string;
  ingresos?: number;
  costos?: number;
  ganancia?: number;
  margen_porcentaje?: number;
};

type Alerta = {
  id?: number;
  tipo?: string;
  mensaje?: string;
  cliente_nombre?: string;
  ruta?: string;
  severidad?: "ALTA" | "MEDIA" | "BAJA";
};

// ─── Utility Functions ───────────────────────────────────────────────────────

const getCodigoMonedaDesdeId = (moneda_id?: number): string => {
  const monedasMap: Record<number, string> = {
    1: 'GTQ',
    2: 'USD',
    6: 'HNL',
    7: 'SVC'
  };
  return moneda_id ? (monedasMap[moneda_id] || 'GTQ') : 'GTQ';
};

// ─── Constants ───────────────────────────────────────────────────────────────

const SEDES = [
  { key: "guatemala", label: "Guatemala" },
  { key: "xela", label: "Xela" },
  { key: "puerto_barrios", label: "Puerto Barrios" },
];

const MONEDAS = [
  { id: 0, codigo: "TODAS", nombre: "Todas las monedas" },
  { id: 1, codigo: "GTQ", nombre: "Quetzal (GTQ)" },
  { id: 2, codigo: "USD", nombre: "Dólar (USD)" },
  { id: 6, codigo: "HNL", nombre: "Lempira (HNL)" },
  { id: 7, codigo: "SVC", nombre: "Colón (SVC)" },
];

function normalizeSedeKey(value?: string) {
  if (!value) return "";
  return value.toLowerCase().replace(/\s+/g, "_");
}


  
const SEVERIDAD_COLORS: Record<string, string> = {
  ALTA: "bg-red-100 text-red-700 border-red-200",
  MEDIA: "bg-yellow-100 text-yellow-700 border-yellow-200",
  BAJA: "bg-blue-100 text-blue-700 border-blue-200",
};

const TIPO_ALERTA_ICON: Record<string, string> = {
  BAJA_CARGA: "📉",
  EXCESO_CONSUMO: "⚠️",
  CREDITO_EXCEDIDO: "🔴",
};

// ─── Component ───────────────────────────────────────────────────────────────

const DashboardGerencial: React.FC = () => {
  const navigate = useNavigate();
  const { obtenerSimboloMoneda } = useMonedas();
  const [corte, setCorte] = useState<CorteDiario[]>([]);
  const [kpis, setKpis] = useState<KPIs>({});
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [sedeSeleccionada, setSedeSeleccionada] = useState("guatemala");
  const [monedaSeleccionada, setMonedaSeleccionada] = useState(0); // 0 = todas
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    navigate('/login');
  };
  const hoy = new Date().toISOString().split("T")[0];
  const hace30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [corteRes, kpisRes, alertasRes] = await Promise.allSettled([
        getCorteDiario({ moneda_id: monedaSeleccionada === 0 ? null : monedaSeleccionada }),
        getKPIs({ desde: hace30, hasta: hoy, sede: sedeSeleccionada, moneda_id: monedaSeleccionada === 0 ? null : monedaSeleccionada }),
        getAlertas(),
      ]);

      if (corteRes.status === "fulfilled") {
        const payload = corteRes.value.data || {};

        if (Array.isArray(payload)) {
          setCorte(payload);
        } else if (Array.isArray(payload.porSede)) {
          setCorte(
            payload.porSede.map((item: any) => ({
              sede: item.sede,
              total_ordenes: item.totalOrdenes,
              ordenes_entregadas: item.entregadas,
              ordenes_en_transito: item.enTransito,
              ordenes_pendientes: Math.max(0, Number(item.totalOrdenes || 0) - Number(item.entregadas || 0) - Number(item.enTransito || 0) - Number(item.cerradas || 0)),
              total_facturado: item.totalFacturado,
              total_cobrado: 0,
            }))
          );
        } else {
          setCorte([]);
        }
      }

      if (kpisRes.status === "fulfilled") {
        const payload = kpisRes.value.data || {};

        if (Array.isArray(payload)) {
          setKpis(payload[0] || {});
        } else {
          const porSede = Array.isArray(payload.porSede) ? payload.porSede : [];
          const kpiSede = porSede.find((item: any) => normalizeSedeKey(item?.sede) === sedeSeleccionada) || porSede[0] || null;

          setKpis({
            ingresos: kpiSede?.ingresos ?? payload?.resumen?.ingresos,
            costos: kpiSede?.costos ?? payload?.resumen?.costos,
            margen_porcentaje: kpiSede?.rentabilidadPorcentaje ?? payload?.resumen?.rentabilidadPorcentaje,
            tiempo_promedio_entrega: kpiSede?.tiempoRealPromedio,
            tiempo_pactado: kpiSede?.tiempoPactadoPromedio ?? kpiSede?.tiempoPlanificadoPromedio,
            ordenes_a_tiempo: kpiSede?.ordenesATiempo,
            total_ordenes: kpiSede?.ordenesConMedicion,
          });
        }
      }

      if (alertasRes.status === "fulfilled") {
        const payload = alertasRes.value.data || {};

        if (Array.isArray(payload)) {
          setAlertas(payload);
        } else {
          const clientes = Array.isArray(payload.clientesBajaCarga)
            ? payload.clientesBajaCarga.map((item: any) => ({
                tipo: item.tipo,
                mensaje: item.mensaje,
                cliente_nombre: item.cliente,
                severidad: item.severidad,
              }))
            : [];

          const rutas = Array.isArray(payload.rutasExcesoConsumo)
            ? payload.rutasExcesoConsumo.map((item: any) => ({
                tipo: item.tipo,
                mensaje: item.mensaje,
                ruta: item.ruta,
                severidad: item.severidad,
              }))
            : [];

          setAlertas([...clientes, ...rutas]);
        }
      }
    } catch {
      setError("Error al cargar el dashboard.");
    } finally {
      setLoading(false);
    }
  }, [sedeSeleccionada, monedaSeleccionada, hoy, hace30]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Calcular margen si el backend no lo manda
  const margen = kpis.margen_porcentaje ??
    (kpis.ingresos && kpis.ingresos > 0
      ? Math.round(((kpis.ingresos - (kpis.costos ?? 0)) / kpis.ingresos) * 100)
      : null);

  const cumplimiento = kpis.ordenes_a_tiempo && kpis.total_ordenes && kpis.total_ordenes > 0
    ? Math.round((kpis.ordenes_a_tiempo / kpis.total_ordenes) * 100)
    : kpis.tiempo_pactado && kpis.tiempo_promedio_entrega
    ? Math.min(100, Math.round((kpis.tiempo_pactado / kpis.tiempo_promedio_entrega) * 100))
    : null;

  // Datos de rentabilidad por contrato
  const contratos: ContratoRentabilidad[] = kpis.contratos ?? [];
  const maxGanancia = Math.max(...contratos.map((c) => Math.abs(c.ganancia ?? 0)), 1);

  // Corte filtrado por sede seleccionada (si el backend devuelve por sede)
  const corteSede = corte.find((c) => normalizeSedeKey(c.sede) === sedeSeleccionada) ?? corte[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white px-6 py-6 shadow-2xl border-b border-blue-700">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-700 rounded-lg">
                  <FaChartLine className="text-2xl" />
                </div>
                <h1 className="text-3xl font-bold">Control Gerencial</h1>
              </div>
              <p className="text-blue-200 text-sm">
                📅 {new Date().toLocaleDateString("es-GT", {
                  weekday: "long", year: "numeric", month: "long", day: "numeric",
                })}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors"
            >
              <FaSignOutAlt className="h-4 w-4" />
              Salir
            </button>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Sedes */}
            <div className="flex gap-2">
              {SEDES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSedeSeleccionada(s.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    sedeSeleccionada === s.key
                      ? "bg-white text-blue-900 shadow-lg"
                      : "bg-blue-700 text-blue-100 hover:bg-blue-600"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-blue-600"></div>

            {/* Moneda */}
            <select
              value={monedaSeleccionada}
              onChange={(e) => setMonedaSeleccionada(Number(e.target.value))}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-700 text-white hover:bg-blue-600 border border-blue-600 transition cursor-pointer"
            >
              {MONEDAS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>

            <div className="h-6 w-px bg-blue-600"></div>

            {/* Bitácora */}
            <button
              onClick={() => navigate('/Gerencia/bitacora')}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Bitácora
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {error && (
          <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg font-semibold">
            {error}
          </div>
        )}

        {/* ── KPIs de Rentabilidad y Cumplimiento ── */}
        <section>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Desempeño General</h2>
            <p className="text-sm text-gray-500">
              Últimos 30 días · {SEDES.find((s) => s.key === sedeSeleccionada)?.label} · {MONEDAS.find((m) => m.id === monedaSeleccionada)?.codigo}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Ingresos */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200 shadow-sm p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-200 rounded-lg">
                  <FaDollarSign className="text-green-700 text-xl" />
                </div>
                {kpis.ingresos && kpis.costos && kpis.ingresos > kpis.costos && (
                  <FaArrowUp className="text-green-600 text-lg" />
                )}
              </div>
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">Ingresos Totales</p>
              <p className="text-3xl font-bold text-green-900 mb-2">
                {kpis.ingresos != null
                  ? formatMoney(kpis.ingresos, monedaSeleccionada === 0 ? 'GTQ' : getCodigoMonedaDesdeId(monedaSeleccionada))
                  : "—"}
              </p>
              <p className="text-xs text-green-700">Período de reporte</p>
            </div>

            {/* Costos */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl border border-red-200 shadow-sm p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-red-200 rounded-lg">
                  <FaArrowDown className="text-red-700 text-xl" />
                </div>
              </div>
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">Costos Operativos</p>
              <p className="text-3xl font-bold text-red-900 mb-2">
                {kpis.costos != null
                  ? formatMoney(kpis.costos, monedaSeleccionada === 0 ? 'GTQ' : getCodigoMonedaDesdeId(monedaSeleccionada))
                  : "—"}
              </p>
              <p className="text-xs text-red-700">Gastos operacionales</p>
            </div>

            {/* Margen */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 shadow-sm p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-200 rounded-lg">
                  <FaPercent className="text-blue-700 text-xl" />
                </div>
                <span className={`text-lg font-bold ${(margen ?? 0) >= 20 ? "text-green-600" : (margen ?? 0) >= 0 ? "text-yellow-600" : "text-red-600"}`}>
                  {margen}%
                </span>
              </div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Margen Neto</p>
              <div className="h-3 bg-blue-200 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-3 rounded-full ${margen >= 20 ? "bg-green-500" : margen >= 0 ? "bg-yellow-500" : "bg-red-500"}`}
                  style={{ width: `${Math.min(100, Math.max(0, (margen ?? 0) / 100) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-blue-700 font-semibold">Rentabilidad del negocio</p>
            </div>

            {/* Cumplimiento */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200 shadow-sm p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-200 rounded-lg">
                  <FaCheckCircle className="text-purple-700 text-xl" />
                </div>
                <span className={`text-lg font-bold ${(cumplimiento ?? 100) >= 80 ? "text-green-600" : "text-yellow-600"}`}>
                  {cumplimiento}%
                </span>
              </div>
              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-2">Cumplimiento SLA</p>
              <div className="h-3 bg-purple-200 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-3 rounded-full ${cumplimiento >= 80 ? "bg-green-500" : "bg-yellow-500"}`}
                  style={{ width: `${cumplimiento}%` }}
                />
              </div>
              <p className="text-xs text-purple-700 font-semibold">Entregas a tiempo</p>
            </div>
          </div>
        </section>

        {/* ── Rentabilidad por contrato ── */}
        {contratos.length > 0 && (
          <section>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Rentabilidad por Contrato</h2>
              <p className="text-sm text-gray-500">Análisis detallado de cada acuerdo comercial</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">Contrato</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">Cliente</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wide">Ingresos</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wide">Costos</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wide">Ganancia</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wide">Margen</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-wide">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {contratos.map((c, i) => {
                      const ganancia = c.ganancia ?? ((c.ingresos ?? 0) - (c.costos ?? 0));
                      const mg = c.margen_porcentaje ?? (c.ingresos ? Math.round((ganancia / c.ingresos) * 100) : null);
                      const barW = Math.min(100, Math.round((Math.abs(ganancia) / maxGanancia) * 100));
                      const positivo = ganancia >= 0;
                      return (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-mono text-sm font-semibold text-blue-900 bg-blue-50">{c.numero_contrato || `#${c.contrato_id}`}</td>
                          <td className="px-6 py-4 text-sm text-gray-700 font-medium">{c.cliente_nombre || "—"}</td>
                          <td className="px-6 py-4 text-right text-sm font-semibold text-green-700">
                            {c.ingresos != null ? formatMoney(c.ingresos, monedaSeleccionada === 0 ? 'GTQ' : getCodigoMonedaDesdeId(monedaSeleccionada)) : "—"}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-semibold text-red-600">
                            {c.costos != null ? formatMoney(c.costos, monedaSeleccionada === 0 ? 'GTQ' : getCodigoMonedaDesdeId(monedaSeleccionada)) : "—"}
                          </td>
                          <td className={`px-6 py-4 text-right text-sm font-bold ${positivo ? "text-green-600" : "text-red-600"}`}>
                            {positivo ? "+ " : "− "}{formatMoney(Math.abs(ganancia), monedaSeleccionada === 0 ? 'GTQ' : getCodigoMonedaDesdeId(monedaSeleccionada))}
                          </td>
                          <td className={`px-6 py-4 text-right text-sm font-bold ${positivo ? "text-green-600" : "text-red-600"}`}>
                            {mg != null ? `${mg}%` : "—"}
                          </td>
                          <td className="px-6 py-4 w-32">
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-2 rounded-full ${positivo ? "bg-green-500" : "bg-red-500"}`} 
                                style={{ width: `${barW}%` }} 
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ── Corte Diario + Alertas ── */}
        <section>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Estado Actual</h2>
            <p className="text-sm text-gray-500">Situación de hoy, {hoy}</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Corte diario */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FaBox className="text-blue-600 text-lg" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Corte Diario de Operaciones</h3>
                  <p className="text-xs text-gray-500">{hoy}</p>
                </div>
              </div>
              {!corteSede ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                  <FaBox className="mx-auto text-3xl mb-2 opacity-30" />
                  <p>Sin datos para hoy</p>
                </div>
              ) : (
                <div className="px-6 py-6 grid grid-cols-2 gap-6">
                  <StatCard icon={<FaBox className="text-xl" />} label="Total órdenes" value={corteSede.total_ordenes} color="blue" />
                  <StatCard icon={<FaCheckDouble className="text-xl" />} label="Entregadas" value={corteSede.ordenes_entregadas} color="green" />
                  <StatCard icon={<FaTruck className="text-xl" />} label="En tránsito" value={corteSede.ordenes_en_transito} color="purple" />
                  <StatCard icon={<FaClock className="text-xl" />} label="Pendientes" value={corteSede.ordenes_pendientes} color="yellow" />
                  <StatCard 
                    icon={<FaChartLine className="text-xl" />}
                    label="Facturado" 
                    value={corteSede.total_facturado != null ? formatMoney(corteSede.total_facturado, monedaSeleccionada === 0 ? 'GTQ' : getCodigoMonedaDesdeId(monedaSeleccionada)) : undefined}
                    color="cyan"
                  />
                  <StatCard 
                    icon={<FaCheckCircle className="text-xl" />}
                    label="Cobrado" 
                    value={corteSede.total_cobrado != null ? formatMoney(corteSede.total_cobrado, monedaSeleccionada === 0 ? 'GTQ' : getCodigoMonedaDesdeId(monedaSeleccionada)) : undefined}
                    color="emerald"
                  />
                </div>
              )}
            </div>

            {/* Alertas */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <FaExclamationTriangle className="text-red-600 text-lg" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Alertas de Desviación</h3>
                    <p className="text-xs text-gray-500">Eventos críticos y desviaciones</p>
                  </div>
                </div>
                {alertas.length > 0 && (
                  <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full">
                    {alertas.length}
                  </span>
                )}
              </div>
              {alertas.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <span className="text-5xl">✅</span>
                  <p className="mt-3 font-semibold text-gray-600">Sin alertas activas</p>
                  <p className="text-sm text-gray-500 mt-1">Todo está funcionando correctamente</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                  {alertas.map((a, i) => (
                    <div key={i} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-4">
                        <span className="text-2xl mt-1">{TIPO_ALERTA_ICON[a.tipo || ""] || "⚠️"}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-900">{a.cliente_nombre || a.ruta || "Alerta"}</p>
                            {a.severidad && (
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${SEVERIDAD_COLORS[a.severidad]}`}>
                                {a.severidad}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{a.mensaje || "—"}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Refresh */}
        <div className="flex justify-end">
          <button
            onClick={fetchDashboard}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all"
          >
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar datos
          </button>
        </div>
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value?: any; color?: string }> = ({ label, value, color = "text-white-800" }) => (
  <div>
    <p className="text-xs text-gray-400">{label}</p>
    <p className={`font-semibold text-sm ${color}`}>{value ?? "—"}</p>
  </div>
);

const StatCard: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  value?: any; 
  color: "blue" | "green" | "purple" | "yellow" | "cyan" | "emerald" | "red" 
}> = ({ icon, label, value, color }) => {
  const colorMap = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    green: "bg-green-50 border-green-200 text-green-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
    cyan: "bg-cyan-50 border-cyan-200 text-cyan-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    red: "bg-red-50 border-red-200 text-red-700"
  };

  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-2xl font-bold">{value ?? "—"}</p>
    </div>
  );
};

export default DashboardGerencial;