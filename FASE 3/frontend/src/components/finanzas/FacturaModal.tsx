// src/components/finanzas/FacturaModal.tsx
import React from "react";
import FacturaBadge from "./FacturaBadge";
type Factura = any;

interface Props {
  factura: Factura;
  onClose: () => void;
  cxc?: any;
  onValidar?: (f: Factura) => void;
  onCertificar?: (f: Factura) => void;
  onConfirm?: (payload: any) => Promise<void>; 
  onPagar?: (f: Factura) => void;
  cargando?: boolean;
}

const fmt = (n: number) =>
  `Q ${(n ?? 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`;

const fmtDate = (s?: string) =>
  s ? new Date(s).toLocaleDateString("es-GT") : "—";

const FacturaModal: React.FC<Props> = ({
  factura, onClose, onValidar, onCertificar, onPagar, cargando,
}) => (
  <div className="fn-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
    <div className="fn-modal">
      <div className="fn-modal-header">
        <h3>Factura {factura.numero_factura}</h3>
        <button className="fn-modal-close" onClick={onClose}>✕</button>
      </div>

      <div className="fn-modal-body">
        <div style={{ marginBottom: 12 }}>
          <FacturaBadge estado={factura.estado} />
        </div>

        <div className="fn-kv-list">
          <div className="fn-kv-row">
            <span className="kv-label">Cliente</span>
            <span className="kv-value">{factura.cliente_nombre ?? factura.nombre_cliente_facturacion}</span>
          </div>
          <div className="fn-kv-row">
            <span className="kv-label">NIT</span>
            <span className="kv-value mono">{factura.nit_cliente}</span>
          </div>
          <div className="fn-kv-row">
            <span className="kv-label">Orden #</span>
            <span className="kv-value">#{factura.orden_id}</span>
          </div>
          <div className="fn-kv-row">
            <span className="kv-label">Distancia</span>
            <span className="kv-value">{factura.distancia_km} km</span>
          </div>
          <div className="fn-kv-row">
            <span className="kv-label">Tarifa aplicada</span>
            <span className="kv-value">Q {factura.tarifa_aplicada}/km</span>
          </div>

          <hr className="fn-kv-divider" />

          <div className="fn-kv-row">
            <span className="kv-label">Bruto</span>
            <span className="kv-value">{fmt(factura.distancia_km * factura.tarifa_aplicada)}</span>
          </div>
          <div className="fn-kv-row">
            <span className="kv-label">Descuento</span>
            <span className="kv-value" style={{ color: "var(--fn-verde)" }}>
              − {fmt(factura.descuento_aplicado)}
            </span>
          </div>
          <div className="fn-kv-row">
            <span className="kv-label">Subtotal</span>
            <span className="kv-value">{fmt(factura.subtotal)}</span>
          </div>
          <div className="fn-kv-row">
            <span className="kv-label">IVA (12%)</span>
            <span className="kv-value">{fmt(factura.iva)}</span>
          </div>

          <hr className="fn-kv-divider" />

          <div className="fn-kv-row fn-kv-total">
            <span className="kv-label">Total</span>
            <span className="kv-value">{fmt(factura.total_factura)}</span>
          </div>

          <div className="fn-kv-row">
            <span className="kv-label">Emitida</span>
            <span className="kv-value">{fmtDate(factura.fecha_emision)}</span>
          </div>
          {factura.fecha_certificacion && (
            <div className="fn-kv-row">
              <span className="kv-label">Certificada</span>
              <span className="kv-value">{fmtDate(factura.fecha_certificacion)}</span>
            </div>
          )}
          {factura.certificado_por_nombre && (
            <div className="fn-kv-row">
              <span className="kv-label">Certificado por</span>
              <span className="kv-value">{factura.certificado_por_nombre}</span>
            </div>
          )}
        </div>

        {factura.uuid_autorizacion && (
          <div className="fn-uuid-box">
            <div className="uuid-label">UUID de Autorización SAT</div>
            <div className="uuid-value">{factura.uuid_autorizacion}</div>
          </div>
        )}
      </div>

      <div className="fn-modal-footer">
        {factura.estado === "BORRADOR" && onValidar && (
          <button
            className="fn-btn fn-btn-outline fn-btn-sm"
            onClick={() => onValidar(factura)}
            disabled={cargando}
          >
            Validar
          </button>
        )}
        {factura.estado === "VALIDADA" && onCertificar && (
          <button
            className="fn-btn fn-btn-success fn-btn-sm"
            onClick={() => onCertificar(factura)}
            disabled={cargando}
          >
            {cargando ? "Certificando…" : "Certificar FEL"}
          </button>
        )}
        {factura.estado === "CERTIFICADA" && onPagar && (
          <button
            className="fn-btn fn-btn-primary fn-btn-sm"
            onClick={() => onPagar(factura)}
          >
            Registrar Pago
          </button>
        )}
        <button className="fn-btn fn-btn-ghost fn-btn-sm" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  </div>
);

export default FacturaModal;