// src/pages/finanzas/DashboardGerencial.tsx
import React, { useEffect, useState, useCallback } from "react";
import { getCorteDiario, getKPIs, getAlertas } from "../../services/Gerencial/gerencial";
import { FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from "react-router-dom";

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

// ─── Constants ───────────────────────────────────────────────────────────────

const SEDES = [
  { key: "guatemala", label: "Guatemala" },
  { key: "xela", label: "Xela" },
  { key: "puerto_barrios", label: "Puerto Barrios" },
];


  
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
  const [corte, setCorte] = useState<CorteDiario[]>([]);
  const [kpis, setKpis] = useState<KPIs>({});
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [sedeSeleccionada, setSedeSeleccionada] = useState("guatemala");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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
        getCorteDiario(),
        getKPIs({ desde: hace30, hasta: hoy, sede: sedeSeleccionada }),
        getAlertas(),
      ]);

      if (corteRes.status === "fulfilled") {
        const data = corteRes.value.data;
        setCorte(Array.isArray(data) ? data : data ? [data] : []);
      }
      if (kpisRes.status === "fulfilled") {
        setKpis(kpisRes.value.data || {});
      }
      if (alertasRes.status === "fulfilled") {
        const data = alertasRes.value.data;
        setAlertas(Array.isArray(data) ? data : data ? [data] : []);
      }
    } catch {
      setError("Error al cargar el dashboard.");
    } finally {
      setLoading(false);
    }
  }, [sedeSeleccionada, hoy, hace30]);

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
  const corteSede = corte.find((c) => c.sede?.toLowerCase().includes(sedeSeleccionada)) ?? corte[0];

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-900 text-white px-6 py-5 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Tablero de Control Gerencial</h1> 
            <p className="text-blue-200 text-sm mt-1">
              {new Date().toLocaleDateString("es-GT", {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
              })}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {SEDES.map((s) => (
              <button
                key={s.key}
                onClick={() => setSedeSeleccionada(s.key)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                  sedeSeleccionada === s.key
                    ? "bg-white text-blue-900"
                    : "bg-blue-800 text-blue-100 hover:bg-blue-700"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        <button
            onClick={handleLogout}
            className="flex items-center px-3 py-2 text-sm text-white-600 hover:text-red-600 transition-colors"
        >
            <FaSignOutAlt className="h-4 w-4 mr-1" />
            <span className="hidden md:inline">Salir</span>
        </button>          
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {error && (
          <div className="p-4 bg-red-50 border border-red-300 rounded-xl text-red-800 text-sm">{error}</div>
        )}

        {/* ── KPIs de Rentabilidad y Cumplimiento ── */}
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            KPIs — Últimos 30 días · Sede {SEDES.find((s) => s.key === sedeSeleccionada)?.label}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Ingresos */}
            <div className="bg-white rounded-2xl border shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Ingresos</p>
              <p className="text-2xl font-bold text-green-600 mt-2">
                {kpis.ingresos != null
                  ? `Q ${kpis.ingresos.toLocaleString("es-GT", { minimumFractionDigits: 2 })}`
                  : "—"}
              </p>
            </div>
            {/* Costos */}
            <div className="bg-white rounded-2xl border shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Costos operativos</p>
              <p className="text-2xl font-bold text-red-500 mt-2">
                {kpis.costos != null
                  ? `Q ${kpis.costos.toLocaleString("es-GT", { minimumFractionDigits: 2 })}`
                  : "—"}
              </p>
            </div>
            {/* Margen */}
            <div className="bg-white rounded-2xl border shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Margen de rentabilidad</p>
              <p className={`text-2xl font-bold mt-2 ${(margen ?? 0) >= 0 ? "text-green-600" : "text-red-500"}`}>
                {margen != null ? `${margen}%` : "—"}
              </p>
              {margen != null && (
                <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${margen >= 0 ? "bg-green-500" : "bg-red-500"}`}
                    style={{ width: `${Math.min(100, Math.abs(margen))}%` }}
                  />
                </div>
              )}
            </div>
            {/* Cumplimiento */}
            <div className="bg-white rounded-2xl border shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Cumplimiento tiempo</p>
              <p className={`text-2xl font-bold mt-2 ${(cumplimiento ?? 100) >= 80 ? "text-green-600" : "text-yellow-600"}`}>
                {cumplimiento != null ? `${cumplimiento}%` : "—"}
              </p>
              {cumplimiento != null && (
                <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${cumplimiento >= 80 ? "bg-green-500" : "bg-yellow-500"}`}
                    style={{ width: `${cumplimiento}%` }}
                  />
                </div>
              )}
              {kpis.tiempo_promedio_entrega != null && (
                <p className="text-xs text-gray-400 mt-1">
                  Promedio: {kpis.tiempo_promedio_entrega}h vs {kpis.tiempo_pactado}h pactado
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ── Rentabilidad por contrato ── */}
        {contratos.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              Rentabilidad por contrato
            </h2>
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {["Contrato", "Cliente", "Ingresos (Q)", "Costos (Q)", "Ganancia (Q)", "Margen", ""].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {contratos.map((c, i) => {
                      const ganancia = c.ganancia ?? ((c.ingresos ?? 0) - (c.costos ?? 0));
                      const mg = c.margen_porcentaje ?? (c.ingresos ? Math.round((ganancia / c.ingresos) * 100) : null);
                      const barW = Math.min(100, Math.round((Math.abs(ganancia) / maxGanancia) * 100));
                      const positivo = ganancia >= 0;
                      return (
                        <tr key={i} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3 font-mono text-xs text-blue-900 font-semibold">{c.numero_contrato || `#${c.contrato_id}`}</td>
                          <td className="px-4 py-3 text-gray-700">{c.cliente_nombre || "—"}</td>
                          <td className="px-4 py-3 text-green-700 font-semibold">
                            {c.ingresos != null ? `Q ${c.ingresos.toLocaleString("es-GT", { minimumFractionDigits: 2 })}` : "—"}
                          </td>
                          <td className="px-4 py-3 text-red-500 font-semibold">
                            {c.costos != null ? `Q ${c.costos.toLocaleString("es-GT", { minimumFractionDigits: 2 })}` : "—"}
                          </td>
                          <td className={`px-4 py-3 font-bold ${positivo ? "text-green-600" : "text-red-500"}`}>
                            {positivo ? "+" : ""}Q {ganancia.toLocaleString("es-GT", { minimumFractionDigits: 2 })}
                          </td>
                          <td className={`px-4 py-3 font-semibold ${positivo ? "text-green-600" : "text-red-500"}`}>
                            {mg != null ? `${mg}%` : "—"}
                          </td>
                          <td className="px-4 py-3 w-28">
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-2 rounded-full ${positivo ? "bg-green-500" : "bg-red-400"}`} style={{ width: `${barW}%` }} />
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Corte diario */}
          <section className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-800">Corte Diario de Operaciones</h2>
              <span className="text-xs text-gray-400">{hoy}</span>
            </div>
            {!corteSede ? (
              <div className="text-center py-12 text-gray-400 text-sm">Sin datos para hoy</div>
            ) : (
              <div className="px-5 py-4 grid grid-cols-2 gap-4 text-sm">
                <Stat label="Total órdenes" value={corteSede.total_ordenes} />
                <Stat label="Entregadas" value={corteSede.ordenes_entregadas} color="text-green-600" />
                <Stat label="En tránsito" value={corteSede.ordenes_en_transito} color="text-indigo-600" />
                <Stat label="Pendientes" value={corteSede.ordenes_pendientes} color="text-yellow-600" />
                <Stat
                  label="Facturado"
                  value={corteSede.total_facturado != null
                    ? `Q ${corteSede.total_facturado.toLocaleString("es-GT", { minimumFractionDigits: 2 })}`
                    : undefined}
                  color="text-blue-900"
                />
                <Stat
                  label="Cobrado"
                  value={corteSede.total_cobrado != null
                    ? `Q ${corteSede.total_cobrado.toLocaleString("es-GT", { minimumFractionDigits: 2 })}`
                    : undefined}
                  color="text-green-700"
                />
              </div>
            )}
          </section>

          {/* Alertas */}
          <section className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-800">Alertas de Desviación</h2>
              {alertas.length > 0 && (
                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">
                  {alertas.length}
                </span>
              )}
            </div>
            {alertas.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                <span className="text-3xl">✅</span>
                <p className="mt-2">Sin alertas activas</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
                {alertas.map((a, i) => (
                  <div key={i} className="px-5 py-3 flex items-start gap-3">
                    <span className="text-xl mt-0.5">{TIPO_ALERTA_ICON[a.tipo || ""] || "⚠️"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {a.cliente_nombre || a.ruta || "—"}
                        </p>
                        {a.severidad && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${SEVERIDAD_COLORS[a.severidad] || ""}`}>
                            {a.severidad}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{a.mensaje || "—"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Refresh */}
        <div className="flex justify-end">
          <button
            onClick={fetchDashboard}
            className="px-4 py-2 bg-blue-900 text-white rounded-xl text-sm font-semibold hover:bg-blue-800 transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

export default DashboardGerencial;