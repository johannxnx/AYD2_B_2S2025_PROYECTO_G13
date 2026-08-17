// src/pages/finanzas/CobrosPage.tsx  — NUEVO ARCHIVO
import React, { useEffect, useState, useCallback } from "react";
import FinanzasHeader from "../../components/finanzas/FinanzasHeader";
import FinanzasMenu from "../../components/finanzas/FinanzasMenu";
import FacturaBadge from "../../components/finanzas/FacturaBadge";
import PagoModal from "../../components/finanzas/FacturaModal";
import {
  getCobros,
  getFacturaById,
  registrarPago,
} from "../../services/facturacion/facturacion";
type Factura = any;
type CuentaPorCobrar = any;
type RegistrarPagoPayload = any;
import "../finanzas/finanzas.css";

const fmt = (n: number) =>
  `Q ${(n ?? 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`;
const fmtDate = (s?: string) => (s ? new Date(s).toLocaleDateString("es-GT") : "—");

const CobrosPage: React.FC = () => {
  const [cobros,       setCobros]       = useState<CuentaPorCobrar[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [success,      setSuccess]      = useState<string | null>(null);
  const [cargando,     setCargando]     = useState(false);

  const [filtroEstado, setFiltroEstado] = useState("");

  /* Pago modal */
  const [cxcSeleccionada, setCxcSeleccionada] = useState<CuentaPorCobrar | null>(null);
  const [facturaActiva,   setFacturaActiva]   = useState<Factura | null>(null);

  /* ── Carga ── */
  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCobros({
        estado_cobro: filtroEstado || undefined,
        limit: 200,
      });
      setCobros(res.data?.cuentas ?? res.data ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cargar cuentas");
    } finally {
      setLoading(false);
    }
  }, [filtroEstado]);

  useEffect(() => { cargar(); }, [cargar]);

  /* ── Abrir pago ── */
  const handleAbrirPago = async (cxc: CuentaPorCobrar) => {
    try {
      const res = await getFacturaById(cxc.factura_id);
      setFacturaActiva(res.data?.factura ?? res.data);
      setCxcSeleccionada(cxc);
    } catch {
      setError("No se pudo cargar la factura asociada.");
    }
  };

  const handleRegistrarPago = async (payload: RegistrarPagoPayload) => {
    if (!facturaActiva || !cxcSeleccionada) return;
    setCargando(true);
    setError(null);
    try {
      await registrarPago(facturaActiva.id, payload);
      setSuccess(`Pago de ${fmt(payload.monto_pagado)} registrado exitosamente.`);
      setCxcSeleccionada(null);
      setFacturaActiva(null);
      cargar();
      setTimeout(() => setSuccess(null), 5000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al registrar pago");
    } finally {
      setCargando(false);
    }
  };

  /* ── Totales ── */
  const totalPendiente = cobros.filter((c) => c.estado_cobro === "PENDIENTE").reduce((s, c) => s + c.saldo_pendiente, 0);
  const totalVencido   = cobros.filter((c) => c.estado_cobro === "VENCIDA").reduce((s, c) => s + c.saldo_pendiente, 0);
  const totalPagado    = cobros.filter((c) => c.estado_cobro === "PAGADA").reduce((s, c) => s + c.monto_original, 0);

  return (
    <div className="fn-page">
      <FinanzasHeader />
      <FinanzasMenu />

      <div className="fn-container">
        <div className="fn-page-header">
          <h1>Cuentas por Cobrar</h1>
          <p>Módulo de cobros — seguimiento y registro de pagos</p>
        </div>

        {success && <div className="fn-alert fn-alert-success">✓ {success}</div>}
        {error   && <div className="fn-alert fn-alert-error">✕ {error}</div>}

        {/* Stats */}
        <div className="fn-stats-grid">
          <div className="fn-stat-card fn-stat-amarillo">
            <p className="stat-label">Por cobrar</p>
            <p className="stat-value" style={{ fontSize: "1.1rem" }}>{fmt(totalPendiente)}</p>
            <p className="stat-sub">{cobros.filter((c) => c.estado_cobro === "PENDIENTE").length} cuentas</p>
          </div>
          <div className="fn-stat-card fn-stat-rojo">
            <p className="stat-label">Vencido</p>
            <p className="stat-value" style={{ fontSize: "1.1rem" }}>{fmt(totalVencido)}</p>
            <p className="stat-sub">{cobros.filter((c) => c.estado_cobro === "VENCIDA").length} cuentas</p>
          </div>
          <div className="fn-stat-card fn-stat-verde">
            <p className="stat-label">Cobrado</p>
            <p className="stat-value" style={{ fontSize: "1.1rem" }}>{fmt(totalPagado)}</p>
            <p className="stat-sub">{cobros.filter((c) => c.estado_cobro === "PAGADA").length} cuentas</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="fn-filtros">
          <div className="fn-field">
            <label>Estado de cobro</label>
            <select className="fn-select" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
              <option value="">Todos</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="VENCIDA">Vencida</option>
              <option value="PAGADA">Pagada</option>
              <option value="ANULADA">Anulada</option>
            </select>
          </div>
          <button className="fn-btn fn-btn-ghost fn-btn-sm" onClick={cargar}>
            Actualizar
          </button>
        </div>

        {/* Tabla */}
        <div className="fn-panel">
          {loading ? (
            <div className="fn-spinner" />
          ) : cobros.length === 0 ? (
            <div className="fn-empty">
              <span className="empty-icon">💳</span>
              <p>No hay cuentas por cobrar con esos filtros</p>
            </div>
          ) : (
            <div className="fn-table-wrap">
              <table className="fn-table">
                <thead>
                  <tr>
                    <th>N° Factura</th>
                    <th>Cliente</th>
                    <th>Contrato</th>
                    <th>Monto original</th>
                    <th>Saldo pendiente</th>
                    <th>Vencimiento</th>
                    <th>Estado</th>
                    <th>Último pago</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cobros.map((c) => {
                    const vencida = c.estado_cobro === "VENCIDA";
                    return (
                      <tr key={c.id} style={vencida ? { background: "#fff8f8" } : undefined}>
                        <td className="mono">{c.numero_factura ?? `ID:${c.factura_id}`}</td>
                        <td>{c.cliente_nombre ?? "—"}</td>
                        <td className="mono">{c.numero_contrato ?? "—"}</td>
                        <td>{fmt(c.monto_original)}</td>
                        <td>
                          <strong style={{ color: c.saldo_pendiente > 0 ? "var(--fn-rojo)" : "var(--fn-verde)" }}>
                            {fmt(c.saldo_pendiente)}
                          </strong>
                        </td>
                        <td style={{ color: vencida ? "var(--fn-rojo)" : undefined }}>
                          {fmtDate(c.fecha_vencimiento)}
                          {vencida && " ⚠️"}
                        </td>
                        <td><FacturaBadge estado={c.estado_cobro} /></td>
                        <td>{fmtDate(c.ultima_fecha_pago)}</td>
                        <td>
                          {(c.estado_cobro === "PENDIENTE" || c.estado_cobro === "VENCIDA") && (
                            <button
                              className="fn-btn fn-btn-primary fn-btn-xs"
                              onClick={() => handleAbrirPago(c)}
                            >
                              Registrar pago
                            </button>
                          )}
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

      {cxcSeleccionada && facturaActiva && (
        <PagoModal
          factura={facturaActiva}
          cxc={cxcSeleccionada}
          onClose={() => { setCxcSeleccionada(null); setFacturaActiva(null); }}
          onConfirm={handleRegistrarPago}
          cargando={cargando}
        />
      )}
    </div>
  );
};

export default CobrosPage;