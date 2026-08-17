// src/components/finanzas/PagoModal.tsx
import React, { useState } from "react";
type Factura = any;
type CuentaPorCobrar = any;
type RegistrarPagoPayload = any;

interface Props {
  factura: Factura;
  cxc: CuentaPorCobrar;
  onClose: () => void;
  onConfirm: (payload: RegistrarPagoPayload) => Promise<void>;
  cargando?: boolean;
}

const PagoModal: React.FC<Props> = ({ factura, cxc, onClose, onConfirm, cargando }) => {
  const [form, setForm] = useState<RegistrarPagoPayload>({
    cuenta_por_cobrar_id:         cxc.id,
    forma_pago:                   "TRANSFERENCIA",
    monto_pagado:                 cxc.saldo_pendiente,
    fecha_hora_pago:              new Date().toISOString().slice(0, 16),
    banco_origen:                 "",
    cuenta_origen:                "",
    numero_autorizacion_bancaria: "",
    observacion:                  "",
  });

  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof RegistrarPagoPayload, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.banco_origen.trim())  return setError("Ingresa el banco de origen.");
    if (!form.cuenta_origen.trim()) return setError("Ingresa la cuenta de origen.");
    if (!form.numero_autorizacion_bancaria.trim())
      return setError("Ingresa el número de autorización bancaria.");
    if (form.monto_pagado <= 0)
      return setError("El monto pagado debe ser mayor a cero.");
    if (form.monto_pagado > cxc.saldo_pendiente)
      return setError(`El monto no puede superar el saldo pendiente (Q ${cxc.saldo_pendiente}).`);

    await onConfirm({
      ...form,
      fecha_hora_pago: new Date(form.fecha_hora_pago).toISOString(),
    });
  };

  return (
    <div className="fn-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="fn-modal" style={{ maxWidth: 580 }}>
        <div className="fn-modal-header">
          <h3>Registrar Pago — {factura.numero_factura}</h3>
          <button className="fn-modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="fn-modal-body">
            {/* Info de la factura */}
            <div
              style={{
                background: "var(--fn-azul-light)",
                borderRadius: "var(--fn-radio-sm)",
                padding: "10px 14px",
                marginBottom: 16,
                fontSize: "0.85rem",
              }}
            >
              <strong>Saldo pendiente:</strong> Q {cxc.saldo_pendiente.toLocaleString("es-GT", { minimumFractionDigits: 2 })}
              {"  ·  "}
              <strong>Vence:</strong> {new Date(cxc.fecha_vencimiento).toLocaleDateString("es-GT")}
            </div>

            {error && <div className="fn-alert fn-alert-error">{error}</div>}

            <div className="fn-form-grid">
              {/* Forma de pago */}
              <div className="fn-form-field">
                <label>Forma de pago *</label>
                <select
                  className="fn-select"
                  value={form.forma_pago}
                  onChange={(e) => set("forma_pago", e.target.value as "CHEQUE" | "TRANSFERENCIA")}
                >
                  <option value="TRANSFERENCIA">Transferencia</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              {/* Monto */}
              <div className="fn-form-field">
                <label>Monto pagado (Q) *</label>
                <input
                  className="fn-input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={cxc.saldo_pendiente}
                  value={form.monto_pagado}
                  onChange={(e) => set("monto_pagado", parseFloat(e.target.value))}
                  required
                />
              </div>

              {/* Fecha y hora */}
              <div className="fn-form-field">
                <label>Fecha y hora del pago *</label>
                <input
                  className="fn-input"
                  type="datetime-local"
                  value={form.fecha_hora_pago}
                  onChange={(e) => set("fecha_hora_pago", e.target.value)}
                  required
                />
              </div>

              {/* Banco origen */}
              <div className="fn-form-field">
                <label>Banco de origen *</label>
                <input
                  className="fn-input"
                  type="text"
                  placeholder="Ej: Banco Industrial"
                  value={form.banco_origen}
                  onChange={(e) => set("banco_origen", e.target.value)}
                  required
                />
              </div>

              {/* Cuenta origen */}
              <div className="fn-form-field">
                <label>Cuenta de origen *</label>
                <input
                  className="fn-input"
                  type="text"
                  placeholder="Ej: 012-345678-9"
                  value={form.cuenta_origen}
                  onChange={(e) => set("cuenta_origen", e.target.value)}
                  required
                />
              </div>

              {/* Número de autorización bancaria */}
              <div className="fn-form-field">
                <label>N° Autorización bancaria *</label>
                <input
                  className="fn-input"
                  type="text"
                  placeholder="Ej: BI-2026-00789456"
                  value={form.numero_autorizacion_bancaria}
                  onChange={(e) => set("numero_autorizacion_bancaria", e.target.value)}
                  required
                />
                <span className="fn-hint">Número de autorización generado por la entidad bancaria</span>
              </div>
            </div>

            {/* Observación */}
            <div className="fn-form-field" style={{ marginTop: 12 }}>
              <label>Observación (opcional)</label>
              <input
                className="fn-input"
                type="text"
                placeholder="Nota adicional..."
                value={form.observacion}
                onChange={(e) => set("observacion", e.target.value)}
              />
            </div>
          </div>

          <div className="fn-modal-footer">
            <button type="button" className="fn-btn fn-btn-ghost fn-btn-sm" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="fn-btn fn-btn-primary fn-btn-sm" disabled={cargando}>
              {cargando ? "Registrando…" : "Registrar Pago"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PagoModal;