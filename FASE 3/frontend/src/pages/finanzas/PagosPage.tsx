// src/pages/finanzas/PagosPage.tsx
// Reemplaza el archivo existente
import React, { useEffect, useState, useCallback } from "react";
import FinanzasHeader from "../../components/finanzas/FinanzasHeader";
import FinanzasMenu from "../../components/finanzas/FinanzasMenu";
import FacturaBadge from "../../components/finanzas/FacturaBadge";
import { getFacturas, getPagosByFactura } from "../../services/facturacion/facturacion";
type Factura = any;
type CuentaPorCobrar = any;
type RegistrarPagoPayload = any;
type Pago = any;

import "../finanzas/finanzas.css";

const fmt = (n: number) =>
  `Q ${(n ?? 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`;
const fmtDate = (s?: string) =>
  s ? new Date(s).toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtDateTime = (s?: string) =>
  s ? new Date(s).toLocaleString("es-GT") : "—";

const PagosPage: React.FC = () => {
  /* ── Estado ── */
  const [facturasConPagos, setFacturasConPagos] = useState<{ factura: Factura; pagos: Pago[] }[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [expanded,  setExpanded]  = useState<number | null>(null);
  const [cargandoPagos, setCargandoPagos] = useState<number | null>(null);

  /* ── Cargar facturas certificadas ── */
  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getFacturas({ estado: "CERTIFICADA", limit: 100 });
      const facturas: Factura[] = res.data?.facturas ?? res.data ?? [];
      setFacturasConPagos(facturas.map((f) => ({ factura: f, pagos: [] })));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  /* ── Expandir y cargar pagos de una factura ── */
  const toggleExpandir = async (facturaId: number) => {
    if (expanded === facturaId) {
      setExpanded(null);
      return;
    }
    setExpanded(facturaId);

    // Si ya tiene pagos cargados, no recargar
    const idx = facturasConPagos.findIndex((fp) => fp.factura.id === facturaId);
    if (idx === -1 || facturasConPagos[idx].pagos.length > 0) return;

    setCargandoPagos(facturaId);
    try {
      const res = await getPagosByFactura(facturaId);
      const pagos: Pago[] = res.data?.pagos ?? res.data ?? [];
      setFacturasConPagos((prev) =>
        prev.map((fp) => fp.factura.id === facturaId ? { ...fp, pagos } : fp)
      );
    } catch {
      // Silencioso — los pagos quedan vacíos
    } finally {
      setCargandoPagos(null);
    }
  };

  /* ── Totales ── */
  const totalFacturado = facturasConPagos.reduce((s, fp) => s + fp.factura.total_factura, 0);
  const totalPagado    = facturasConPagos
    .flatMap((fp) => fp.pagos)
    .reduce((s, p) => s + p.monto_pagado, 0);

  return (
    <div className="fn-page">
      <FinanzasHeader />
      <FinanzasMenu />

      <div className="fn-container">
        <div className="fn-page-header">
          <h1>Historial de Pagos</h1>
          <p>Facturas certificadas y sus pagos registrados</p>
        </div>

        {error && <div className="fn-alert fn-alert-error">✕ {error}</div>}

        {/* Stats */}
        <div className="fn-stats-grid">
          <div className="fn-stat-card fn-stat-azul">
            <p className="stat-label">Total facturado</p>
            <p className="stat-value" style={{ fontSize: "1.1rem" }}>{fmt(totalFacturado)}</p>
            <p className="stat-sub">{facturasConPagos.length} facturas certificadas</p>
          </div>
          <div className="fn-stat-card fn-stat-verde">
            <p className="stat-label">Total cobrado</p>
            <p className="stat-value" style={{ fontSize: "1.1rem" }}>{fmt(totalPagado)}</p>
          </div>
          <div className="fn-stat-card fn-stat-amarillo">
            <p className="stat-label">Pendiente de cobro</p>
            <p className="stat-value" style={{ fontSize: "1.1rem" }}>
              {fmt(Math.max(0, totalFacturado - totalPagado))}
            </p>
          </div>
        </div>

        {/* Tabla con expandibles */}
        <div className="fn-panel">
          <div className="fn-panel-header">
            <h2>Facturas certificadas</h2>
            <button className="fn-btn fn-btn-ghost fn-btn-sm" onClick={cargar}>↺ Actualizar</button>
          </div>

          {loading ? (
            <div className="fn-spinner" />
          ) : facturasConPagos.length === 0 ? (
            <div className="fn-empty">
              <span className="empty-icon">💰</span>
              <p>No hay facturas certificadas aún</p>
            </div>
          ) : (
            <div className="fn-table-wrap">
              <table className="fn-table">
                <thead>
                  <tr>
                    <th style={{ width: 32 }}></th>
                    <th>N° Factura</th>
                    <th>Cliente</th>
                    <th>Total factura</th>
                    <th>Estado cobro</th>
                    <th>Certificada</th>
                    <th>UUID SAT</th>
                  </tr>
                </thead>
                <tbody>
                  {facturasConPagos.map(({ factura, pagos }) => (
                    <React.Fragment key={factura.id}>
                      {/* Fila de la factura */}
                      <tr
                        style={{ cursor: "pointer" }}
                        onClick={() => toggleExpandir(factura.id)}
                      >
                        <td style={{ textAlign: "center", color: "var(--fn-azul-mid)", fontWeight: 700 }}>
                          {expanded === factura.id ? "▾" : "▸"}
                        </td>
                        <td className="mono">{factura.numero_factura}</td>
                        <td>{factura.cliente_nombre ?? factura.nombre_cliente_facturacion}</td>
                        <td><strong>{fmt(factura.total_factura)}</strong></td>
                        <td>
                          {/* Estado de cobro derivado de los pagos */}
                          {pagos.length === 0
                            ? <FacturaBadge estado="PENDIENTE" />
                            : pagos.reduce((s, p) => s + p.monto_pagado, 0) >= factura.total_factura
                              ? <FacturaBadge estado="PAGADA" />
                              : <FacturaBadge estado="PENDIENTE" />
                          }
                        </td>
                        <td>{fmtDate(factura.fecha_certificacion)}</td>
                        <td className="mono" style={{ fontSize: "0.72rem", color: "var(--fn-verde)" }}>
                          {factura.uuid_autorizacion
                            ? `✓ ${factura.uuid_autorizacion.slice(0, 20)}…`
                            : "—"}
                        </td>
                      </tr>

                      {/* Fila expandida con pagos */}
                      {expanded === factura.id && (
                        <tr>
                          <td colSpan={7} style={{ padding: 0, background: "#f8fafc" }}>
                            <div style={{ padding: "12px 20px 12px 48px" }}>
                              {cargandoPagos === factura.id ? (
                                <div className="fn-spinner" style={{ padding: 16 }} />
                              ) : pagos.length === 0 ? (
                                <p style={{ fontSize: "0.85rem", color: "var(--fn-texto-suave)", margin: 0 }}>
                                  No hay pagos registrados para esta factura.
                                </p>
                              ) : (
                                <table className="fn-table" style={{ background: "transparent" }}>
                                  <thead>
                                    <tr>
                                      <th>Fecha y hora</th>
                                      <th>Forma de pago</th>
                                      <th>Monto pagado</th>
                                      <th>Banco</th>
                                      <th>Cuenta</th>
                                      <th>N° Autorización bancaria</th>
                                      <th>Registrado por</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {pagos.map((p) => (
                                      <tr key={p.id}>
                                        <td>{fmtDateTime(p.fecha_hora_pago)}</td>
                                        <td><FacturaBadge estado={p.forma_pago} /></td>
                                        <td><strong style={{ color: "var(--fn-verde)" }}>{fmt(p.monto_pagado)}</strong></td>
                                        <td>{p.banco_origen}</td>
                                        <td className="mono">{p.cuenta_origen}</td>
                                        <td className="mono">{p.numero_autorizacion_bancaria}</td>
                                        <td>{p.registrado_por_nombre ?? `ID:${p.registrado_por}`}</td>
                                      </tr>
                                    ))}
                                    <tr>
                                      <td colSpan={2} style={{ fontWeight: 700, paddingTop: 8 }}>Total cobrado</td>
                                      <td style={{ fontWeight: 700, color: "var(--fn-verde)" }}>
                                        {fmt(pagos.reduce((s, p) => s + p.monto_pagado, 0))}
                                      </td>
                                      <td colSpan={4}></td>
                                    </tr>
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PagosPage;