// src/pages/finanzas/DashboardFinanzas.tsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import FinanzasHeader from "../../components/finanzas/FinanzasHeader";
import FinanzasMenu from "../../components/finanzas/FinanzasMenu";
import FacturaBadge from "../../components/finanzas/FacturaBadge";
import { getFacturas, getCobros } from "../../services/facturacion/facturacion";
type Factura = any;
type CuentaPorCobrar = any;
import "../finanzas/finanzas.css";

//services/facturacion/facturacion

const fmt = (n: number) =>
  `Q ${(n ?? 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`;
const fmtDate = (s: string) => new Date(s).toLocaleDateString("es-GT");

const DashboardFinanzas: React.FC = () => {
  const navigate = useNavigate();

  const [facturas, setFacturas]     = useState<Factura[]>([]);
  const [cobros,   setCobros]       = useState<CuentaPorCobrar[]>([]);
  const [loading,  setLoading]      = useState(true);
  const [error,    setError]        = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rF, rC] = await Promise.all([
        getFacturas({ limit: 200 }),
        getCobros({ limit: 200 }),
      ]);
      setFacturas(rF.data?.facturas ?? rF.data ?? []);
      setCobros(rC.data?.cuentas ?? rC.data ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  /* ── Métricas calculadas ── */
  const totalCertificado = facturas
    .filter((f) => f.estado === "CERTIFICADA")
    .reduce((s, f) => s + f.total_factura, 0);

  const totalBorradores = facturas.filter((f) => f.estado === "BORRADOR").length;
  const totalValidadas  = facturas.filter((f) => f.estado === "VALIDADA").length;
  const totalCertif     = facturas.filter((f) => f.estado === "CERTIFICADA").length;

  const cxcPendiente = cobros
    .filter((c) => c.estado_cobro === "PENDIENTE")
    .reduce((s, c) => s + c.saldo_pendiente, 0);
  const cxcVencida = cobros
    .filter((c) => c.estado_cobro === "VENCIDA")
    .reduce((s, c) => s + c.saldo_pendiente, 0);
  const cxcPagada = cobros
    .filter((c) => c.estado_cobro === "PAGADA")
    .reduce((s, c) => s + c.monto_original, 0);

  /* ── Últimas 5 facturas certificadas ── */
  const ultimasCertif = facturas
    .filter((f) => f.estado === "CERTIFICADA")
    .slice(0, 5);

  /* ── Cuentas vencidas (alerta) ── */
  const cxcVencidas = cobros.filter((c) => c.estado_cobro === "VENCIDA");

  return (
    <div className="fn-page">
      <FinanzasHeader />
      <FinanzasMenu />

      <div className="fn-container">
        <div className="fn-page-header">
          <h1>Dashboard Financiero</h1>
          <p>Resumen general de facturación, cobros y estado de cuentas</p>
        </div>

        {error && <div className="fn-alert fn-alert-error">{error}</div>}

        {loading ? (
          <div className="fn-spinner" />
        ) : (
          <>
            {/* ── KPIs superiores ── */}
            <div className="fn-stats-grid">
              <div className="fn-stat-card fn-stat-azul">
                <p className="stat-label">Total facturado (certificado)</p>
                <p className="stat-value">{fmt(totalCertificado)}</p>
                <p className="stat-sub">{totalCertif} facturas</p>
              </div>
              <div className="fn-stat-card fn-stat-verde">
                <p className="stat-label">Cobrado / Pagado</p>
                <p className="stat-value">{fmt(cxcPagada)}</p>
                <p className="stat-sub">Cuentas saldadas</p>
              </div>
              <div className="fn-stat-card fn-stat-amarillo">
                <p className="stat-label">Por cobrar (pendiente)</p>
                <p className="stat-value">{fmt(cxcPendiente)}</p>
                <p className="stat-sub">
                  {cobros.filter((c) => c.estado_cobro === "PENDIENTE").length} cuentas activas
                </p>
              </div>
              <div className="fn-stat-card fn-stat-rojo">
                <p className="stat-label">Vencido</p>
                <p className="stat-value">{fmt(cxcVencida)}</p>
                <p className="stat-sub">{cxcVencidas.length} cuentas vencidas</p>
              </div>
              <div className="fn-stat-card fn-stat-gris">
                <p className="stat-label">Borradores pendientes</p>
                <p className="stat-value">{totalBorradores + totalValidadas}</p>
                <p className="stat-sub">
                  {totalBorradores} borrador · {totalValidadas} listo para certificar
                </p>
              </div>
            </div>

            {/* ── Alerta de vencidos ── */}
            {cxcVencidas.length > 0 && (
              <div className="fn-alert fn-alert-error">
                ⚠️ Hay {cxcVencidas.length} cuenta(s) vencida(s) por un total de {fmt(cxcVencida)}.{" "}
                <button
                  className="fn-btn fn-btn-danger fn-btn-xs"
                  style={{ marginLeft: 8 }}
                  onClick={() => navigate("/finanzas/cobros")}
                >
                  Ver cobros
                </button>
              </div>
            )}

            <div className="fn-dash-grid">
              {/* ── Accesos rápidos ── */}
              <div className="fn-panel">
                <div className="fn-panel-header">
                  <h2>Acciones rápidas</h2>
                </div>
                <div className="fn-panel-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <button
                    className="fn-btn fn-btn-primary"
                    onClick={() => navigate("/finanzas/facturacion")}
                  >
                    📄 Gestionar facturas
                  </button>
                  <button
                    className="fn-btn fn-btn-outline"
                    onClick={() => navigate("/finanzas/cobros")}
                  >
                    💳 Ver cuentas por cobrar
                  </button>
                  <button
                    className="fn-btn fn-btn-ghost"
                    onClick={() => navigate("/finanzas/pagos")}
                  >
                    🏦 Historial de pagos
                  </button>
                </div>
              </div>

              {/* ── Estado del pipeline ── */}
              <div className="fn-panel">
                <div className="fn-panel-header">
                  <h2>Pipeline de facturación</h2>
                </div>
                <div className="fn-panel-body">
                  {[
                    { label: "Borradores",  n: totalBorradores, badge: "BORRADOR",    desc: "Pendientes de validación" },
                    { label: "Validadas",   n: totalValidadas,  badge: "VALIDADA",    desc: "Listas para certificar" },
                    { label: "Certificadas",n: totalCertif,     badge: "CERTIFICADA", desc: "Con validez legal" },
                  ].map(({ label, n, badge, desc }) => (
                    <div
                      key={badge}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 0",
                        borderBottom: "1px solid var(--fn-borde)",
                      }}
                    >
                      <div>
                        <FacturaBadge estado={badge} />
                        <span style={{ marginLeft: 8, fontSize: "0.8rem", color: "var(--fn-texto-suave)" }}>
                          {desc}
                        </span>
                      </div>
                      <strong style={{ fontSize: "1.2rem", color: "var(--fn-azul)" }}>{n}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Últimas certificadas ── */}
              <div className="fn-panel" style={{ gridColumn: "1 / -1" }}>
                <div className="fn-panel-header">
                  <h2>Últimas facturas certificadas</h2>
                  <button
                    className="fn-btn fn-btn-ghost fn-btn-sm"
                    onClick={() => navigate("/finanzas/facturacion")}
                  >
                    Ver todas
                  </button>
                </div>
                {ultimasCertif.length === 0 ? (
                  <div className="fn-empty">
                    <span className="empty-icon">📋</span>
                    <p>No hay facturas certificadas aún</p>
                  </div>
                ) : (
                  <div className="fn-table-wrap">
                    <table className="fn-table">
                      <thead>
                        <tr>
                          <th>N° Factura</th>
                          <th>Cliente</th>
                          <th>Total</th>
                          <th>Certificada</th>
                          <th>UUID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ultimasCertif.map((f) => (
                          <tr key={f.id}>
                            <td className="mono">{f.numero_factura}</td>
                            <td>{f.cliente_nombre ?? f.nombre_cliente_facturacion}</td>
                            <td><strong>{fmt(f.total_factura)}</strong></td>
                            <td>{fmtDate(f.fecha_certificacion ?? f.fecha_emision)}</td>
                            <td className="mono" style={{ fontSize: "0.72rem", color: "var(--fn-verde)" }}>
                              {f.uuid_autorizacion ? `✓ ${f.uuid_autorizacion.slice(0, 18)}…` : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardFinanzas;