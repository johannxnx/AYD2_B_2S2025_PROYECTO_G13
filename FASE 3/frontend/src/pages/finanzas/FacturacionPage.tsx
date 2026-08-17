// src/pages/finanzas/FacturacionPage.tsx
// Reemplaza el archivo existente
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import FinanzasHeader from "../../components/finanzas/FinanzasHeader";
import FinanzasMenu from "../../components/finanzas/FinanzasMenu";
import FacturaBadge from "../../components/finanzas/FacturaBadge";
import FacturaModal from "../../components/finanzas/FacturaModal";
import PagoModal from "../../components/finanzas/PagoModal";
import { useMonedas } from "../../services/monedas/hooks/useMonedas";
import {
  getFacturas,
  validarFactura,
  certificarFactura,
  getCobros,
  registrarPago,
} from "../../services/facturacion/facturacion";
type Factura = any;
type CuentaPorCobrar = any;
type RegistrarPagoPayload = any;
import "../finanzas/finanzas.css";

import { conectarSocketFacturacion } from "../../services/facturacion/socketFacturacion";

const fmt = (n: number) =>
  `Q ${(n ?? 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`;
const fmtDate = (s?: string) => (s ? new Date(s).toLocaleDateString("es-GT") : "—");

const FacturacionPage: React.FC = () => {
  const navigate = useNavigate();
  const { obtenerSimboloMoneda } = useMonedas();

  /* ── Estado ── */
  const [facturas,    setFacturas]    = useState<Factura[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [success,     setSuccess]     = useState<string | null>(null);
  const [cargando,    setCargando]    = useState(false);

  /* Filtros */
  const [filtroEstado,    setFiltroEstado]    = useState("");
  const [filtroFechaDesde, setFiltroFechaDesde] = useState("");
  const [filtroFechaHasta, setFiltroFechaHasta] = useState("");

  /* Modales */
  const [facturaDetalle, setFacturaDetalle] = useState<Factura | null>(null);
  const [facturaPago,    setFacturaPago]    = useState<Factura | null>(null);
  const [cxcPago,        setCxcPago]        = useState<CuentaPorCobrar | null>(null);

  /* ── Carga ── */
  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getFacturas({
        estado:      filtroEstado      || undefined,
        fecha_desde: filtroFechaDesde  || undefined,
        fecha_hasta: filtroFechaHasta  || undefined,
        limit:       100,
      });
      setFacturas(res.data?.facturas ?? res.data ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cargar facturas");
    } finally {
      setLoading(false);
    }
  }, [filtroEstado, filtroFechaDesde, filtroFechaHasta]);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    const desconectar = conectarSocketFacturacion((payload) => {

      // Solo insertar si el filtro de estado permite ver BORRADOR
      // (si el filtro está vacío = "Todos", también se inserta)
      const filtroPermite =
        filtroEstado === "" || filtroEstado === "BORRADOR";

      if (filtroPermite) {
        setFacturas((prev) => {
          // Evitar duplicados si el GET inicial ya trajo esta factura
          const yaExiste = prev.some((f) => f.id === payload.borrador.id);
          if (yaExiste) return prev;
          return [payload.borrador, ...prev];
        });
      }

      // El mensaje de éxito siempre aparece, independiente del filtro
      msgOk(payload.mensaje);
    });

    return desconectar;
  // filtroEstado va en las dependencias para que el closure tenga el valor actual
  }, [filtroEstado]);

  /* ── Acciones ── */
  const msgOk = (m: string) => {
    setSuccess(m);
    setTimeout(() => setSuccess(null), 5000);
  };

  const handleValidar = async (f: Factura) => {
    setCargando(true);
    setError(null);
    try {
      const res = await validarFactura(f.id);
      if (res.data?.resultado?.aprobada) {
        msgOk(`Factura ${f.numero_factura} validada. Lista para certificación.`);
      } else {
        setError(`Validación rechazada: ${res.data?.resultado?.errores?.join(", ")}`);
      }
      setFacturaDetalle(null);
      cargar();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al validar");
    } finally {
      setCargando(false);
    }
  };

  const handleCertificar = async (f: Factura) => {
    if (!window.confirm(`¿Certificar la factura ${f.numero_factura} ante la SAT?`)) return;
    setCargando(true);
    setError(null);
    try {
      await certificarFactura(f.id);
      msgOk(`Factura ${f.numero_factura} certificada exitosamente. UUID generado.`);
      setFacturaDetalle(null);
      cargar();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al certificar");
    } finally {
      setCargando(false);
    }
  };

  const handleAbrirPago = async (f: Factura) => {
    // Buscar la CXC asociada
    try {
      const res = await getCobros({ cliente_id: f.cliente_id });
      const cuentas: CuentaPorCobrar[] = res.data?.cuentas ?? res.data ?? [];
      const cxc = cuentas.find((c) => c.factura_id === f.id && c.estado_cobro !== "PAGADA");
      if (!cxc) {
        setError("No se encontró cuenta por cobrar pendiente para esta factura.");
        return;
      }
      setFacturaPago(f);
      setCxcPago(cxc);
      setFacturaDetalle(null);
    } catch {
      setError("Error al obtener la cuenta por cobrar.");
    }
  };

  const handleRegistrarPago = async (payload: RegistrarPagoPayload) => {
    if (!facturaPago) return;
    setCargando(true);
    setError(null);
    try {
      await registrarPago(facturaPago.id, payload);
      msgOk(`Pago de ${fmt(payload.monto_pagado)} registrado. Crédito del cliente liberado.`);
      setFacturaPago(null);
      setCxcPago(null);
      cargar();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al registrar pago");
    } finally {
      setCargando(false);
    }
  };

  /* ── Totales para stats ── */
  const borradores  = facturas.filter((f) => f.estado === "BORRADOR").length;
  const validadas   = facturas.filter((f) => f.estado === "VALIDADA").length;
  const certificadas = facturas.filter((f) => f.estado === "CERTIFICADA").length;
  const totalCert   = facturas
    .filter((f) => f.estado === "CERTIFICADA")
    .reduce((s, f) => s + f.total_factura, 0);

  return (
    <div className="fn-page">
      <FinanzasHeader />
      <FinanzasMenu />

      <div className="fn-container">
        <div className="fn-page-header">
          <h1>Facturación Electrónica (FEL)</h1>
          <p>Ciclo completo: borrador → validación → certificación SAT</p>
        </div>

        {success && <div className="fn-alert fn-alert-success">✓ {success}</div>}
        {error   && <div className="fn-alert fn-alert-error">✕ {error}</div>}

        {/* ── Stats ── */}
        <div className="fn-stats-grid">
          <div className="fn-stat-card fn-stat-amarillo">
            <p className="stat-label">Borradores</p>
            <p className="stat-value">{borradores}</p>
          </div>
          <div className="fn-stat-card fn-stat-azul">
            <p className="stat-label">Validadas</p>
            <p className="stat-value">{validadas}</p>
          </div>
          <div className="fn-stat-card fn-stat-verde">
            <p className="stat-label">Certificadas</p>
            <p className="stat-value">{certificadas}</p>
          </div>
          <div className="fn-stat-card fn-stat-azul">
            <p className="stat-label">Total certificado</p>
            <p className="stat-value" style={{ fontSize: "1.2rem" }}>{fmt(totalCert)}</p>
          </div>
        </div>

        {/* ── Ayuda: generar borrador desde orden ── */}
        <div className="fn-alert fn-alert-info" style={{ alignItems: "center" }}>
          ℹ️ Para generar un borrador desde una orden entregada, ingresa el ID de la orden:{"  "}
          <GenerarBorradorInline onSuccess={(msg) => { msgOk(msg); cargar(); }} onError={setError} />
        </div>

        {/* ── Filtros ── */}
        <div className="fn-filtros">
          <div className="fn-field">
            <label>Estado</label>
            <select className="fn-select" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
              <option value="">Todos</option>
              <option value="BORRADOR">Borrador</option>
              <option value="VALIDADA">Validada</option>
              <option value="CERTIFICADA">Certificada</option>
              <option value="ANULADA">Anulada</option>
            </select>
          </div>
          <div className="fn-field">
            <label>Desde</label>
            <input className="fn-input" type="date" value={filtroFechaDesde} onChange={(e) => setFiltroFechaDesde(e.target.value)} />
          </div>
          <div className="fn-field">
            <label>Hasta</label>
            <input className="fn-input" type="date" value={filtroFechaHasta} onChange={(e) => setFiltroFechaHasta(e.target.value)} />
          </div>
          <button className="fn-btn fn-btn-ghost fn-btn-sm" onClick={cargar}>
            Actualizar
          </button>
          <button
            className="fn-btn fn-btn-outline fn-btn-sm"
            style={{ marginLeft: "auto" }}
            onClick={() => navigate("/finanzas/cobros")}
          >
            Ver cobros →
          </button>
        </div>

        {/* ── Tabla ── */}
        <div className="fn-panel">
          {loading ? (
            <div className="fn-spinner" />
          ) : facturas.length === 0 ? (
            <div className="fn-empty">
              <span className="empty-icon">🧾</span>
              <p>No hay facturas con los filtros seleccionados</p>
            </div>
          ) : (
            <div className="fn-table-wrap">
              <table className="fn-table">
                <thead>
                  <tr>
                    <th>N° Factura</th>
                    <th>Cliente</th>
                    <th>NIT</th>
                    <th>Orden #</th>
                    <th>Subtotal</th>
                    <th>IVA</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Emitida</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {facturas.map((f) => (
                    <tr key={f.id}>
                      <td className="mono">{f.numero_factura}</td>
                      <td>{f.cliente_nombre ?? f.nombre_cliente_facturacion}</td>
                      <td className="mono">{f.nit_cliente}</td>
                      <td>#{f.orden_id}</td>
                      <td>{fmt(f.subtotal)}</td>
                      <td>{fmt(f.iva)}</td>
                      <td><strong>{fmt(f.total_factura)}</strong></td>
                      <td><FacturaBadge estado={f.estado} /></td>
                      <td>{fmtDate(f.fecha_emision)}</td>
                      <td>
                        <div className="fn-row-actions">
                          <button
                            className="fn-btn fn-btn-ghost fn-btn-xs"
                            onClick={() => setFacturaDetalle(f)}
                          >
                            Ver
                          </button>
                          {f.estado === "BORRADOR" && (
                            <button
                              className="fn-btn fn-btn-outline fn-btn-xs"
                              onClick={() => handleValidar(f)}
                              disabled={cargando}
                            >
                              Validar
                            </button>
                          )}
                          {f.estado === "VALIDADA" && (
                            <button
                              className="fn-btn fn-btn-success fn-btn-xs"
                              onClick={() => handleCertificar(f)}
                              disabled={cargando}
                            >
                              Certificar FEL
                            </button>
                          )}
                          {f.estado === "CERTIFICADA" && (
                            <button
                              className="fn-btn fn-btn-primary fn-btn-xs"
                              onClick={() => handleAbrirPago(f)}
                            >
                              Pago
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      {facturaDetalle && (
        <FacturaModal
          factura={facturaDetalle}
          onClose={() => setFacturaDetalle(null)}
          onValidar={handleValidar}
          onCertificar={handleCertificar}
          onPagar={handleAbrirPago}
          cargando={cargando}
        />
      )}

      {facturaPago && cxcPago && (
        <PagoModal
          factura={facturaPago}
          cxc={cxcPago}
          onClose={() => { setFacturaPago(null); setCxcPago(null); }}
          onConfirm={handleRegistrarPago}
          cargando={cargando}
        />
      )}
    </div>
  );
};

/* ── Subcomponente inline: generar borrador desde ID de orden ── */
const GenerarBorradorInline: React.FC<{
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}> = ({ onSuccess, onError }) => {
  const [ordenId, setOrdenId] = useState("");
  const [busy,    setBusy]    = useState(false);

  // importación dinámica para no circular
  const handleGenerar = async () => {
    if (!ordenId) return;
    setBusy(true);
    try {
      const { generarBorrador } = await import("../../services/facturacion/facturacion");
      const res = await generarBorrador(parseInt(ordenId));
      onSuccess(
        res.data?.yaExistia
          ? `Ya existía borrador para orden #${ordenId}.`
          : `Borrador generado para orden #${ordenId} — ${res.data?.borrador?.numero_factura}`
      );
      setOrdenId("");
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : "Error al generar borrador");
    } finally {
      setBusy(false);
    }
  };

  return (
    <span style={{ display: "inline-flex", gap: 6, alignItems: "center", marginLeft: 8 }}>
      <input
        className="fn-input"
        type="number"
        placeholder="ID orden"
        value={ordenId}
        onChange={(e) => setOrdenId(e.target.value)}
        style={{ width: 110 }}
      />
      <button
        className="fn-btn fn-btn-primary fn-btn-xs"
        onClick={handleGenerar}
        disabled={busy || !ordenId}
      >
        {busy ? "…" : "Generar borrador"}
      </button>
    </span>
  );
};

export default FacturacionPage;