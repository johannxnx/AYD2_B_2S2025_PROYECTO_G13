// src/pages/finanzas/tarifas.tsx
import React, { useEffect, useState, useCallback } from "react";
import FinanzasHeader from "../../components/finanzas/FinanzasHeader";
import FinanzasMenu from "../../components/finanzas/FinanzasMenu";
import {
  listarTarifas,
  getReferencia,
  actualizarTarifa,
} from "../../services/facturacion/tarifas";
import "../finanzas/finanzas.css";

/* ── Tipos locales ──────────────────────────────────────── */
type TipoUnidad = "LIGERA" | "PESADA" | "CABEZAL";

interface Tarifa {
  id: number;
  tipo_unidad: TipoUnidad;
  limite_peso_ton: number;
  costo_base_km: number;
  activo: boolean;
  fecha_actualizacion: string;
  actualizado_por_nombre: string;
}

interface Referencia {
  limite_peso_ton_max: number;
  costo_base_km_sugerido: number;
  descripcion: string;
}

interface FormState {
  limite_peso_ton: string;
  costo_base_km: string;
}

/* ── Helpers de formato ─────────────────────────────────── */
const fmt = (n: number) =>
  `Q ${(n ?? 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`;

const fmtDate = (s?: string) =>
  s ? new Date(s).toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const ICONO: Record<TipoUnidad, string> = {
  LIGERA:  "🚐",
  PESADA:  "🚛",
  CABEZAL: "🚚",
};

const ETIQUETA: Record<TipoUnidad, string> = {
  LIGERA:  "Unidad Ligera",
  PESADA:  "Camión Pesado",
  CABEZAL: "Cabezal / Tráiler",
};

/* ════════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
   ════════════════════════════════════════════════════════════ */
const TarifasPage: React.FC = () => {
  /* ── Estado global ── */
  const [tarifas,    setTarifas]    = useState<Tarifa[]>([]);
  const [referencia, setReferencia] = useState<Record<TipoUnidad, Referencia> | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [success,    setSuccess]    = useState<string | null>(null);

  /* ── Estado del modal de edición ── */
  const [editando,   setEditando]   = useState<Tarifa | null>(null);
  const [form,       setForm]       = useState<FormState>({ limite_peso_ton: "", costo_base_km: "" });
  const [guardando,  setGuardando]  = useState(false);
  const [formError,  setFormError]  = useState<string | null>(null);

  /* ── Carga inicial ── */
  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resTarifas, resRef] = await Promise.all([listarTarifas(), getReferencia()]);
      setTarifas(resTarifas.data?.tarifas ?? resTarifas.data ?? []);


      const refRaw = resRef.data ?? {};

const refTransformada: Record<TipoUnidad, Referencia> = {
  LIGERA: {
    limite_peso_ton_max: refRaw.LIGERA?.limite_peso_ton ?? 0,
    costo_base_km_sugerido: refRaw.LIGERA?.costo_base_km ?? 0,
    descripcion: "Vehículos livianos para entregas urbanas y cargas pequeñas.",
  },
  PESADA: {
    limite_peso_ton_max: refRaw.PESADA?.limite_peso_ton ?? 0,
    costo_base_km_sugerido: refRaw.PESADA?.costo_base_km ?? 0,
    descripcion: "Camiones de carga media para transporte interurbano y mercancía moderada.",
  },
  CABEZAL: {
    limite_peso_ton_max: refRaw.CABEZAL?.limite_peso_ton ?? 0,
    costo_base_km_sugerido: refRaw.CABEZAL?.costo_base_km ?? 0,
    descripcion: "Unidades de alto tonelaje para transporte pesado y largas distancias.",
  },
};

setReferencia(refTransformada);



    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cargar el tarifario");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  /* ── Helpers de mensajes ── */
  const msgOk = (m: string) => {
    setSuccess(m);
    setTimeout(() => setSuccess(null), 5000);
  };

  /* ── Abrir modal de edición ── */
  const handleEditar = (tarifa: Tarifa) => {
    setEditando(tarifa);
    setForm({
      limite_peso_ton: String(tarifa.limite_peso_ton),
      costo_base_km:   String(tarifa.costo_base_km),
    });
    setFormError(null);
  };

  /* ── Cerrar modal ── */
  const handleCerrar = () => {
    setEditando(null);
    setFormError(null);
  };

  /* ── Validación del formulario en cliente (FA1 / FA2) ── */
  const validarForm = (): string | null => {
    const peso  = parseFloat(form.limite_peso_ton);
    const costo = parseFloat(form.costo_base_km);

    // FA2 — campos obligatorios
    if (!form.limite_peso_ton.trim() || !form.costo_base_km.trim())
      return "Todos los campos son obligatorios.";

    if (isNaN(peso)  || peso  <= 0) return "El límite de peso debe ser un número mayor a 0.";
    if (isNaN(costo) || costo <= 0) return "El costo por km debe ser un número mayor a 0.";


    return null;
  };

  /* ── Guardar cambios (PUT) ── */
  const handleGuardar = async () => {
    const validacion = validarForm();
    if (validacion) { setFormError(validacion); return; }
    if (!editando) return;

    setGuardando(true);
    setFormError(null);
    try {
      await actualizarTarifa(editando.tipo_unidad, {
        limite_peso_ton: parseFloat(form.limite_peso_ton),
        costo_base_km:   parseFloat(form.costo_base_km),
      });
      msgOk(`Tarifa de ${ETIQUETA[editando.tipo_unidad]} actualizada correctamente.`);
      handleCerrar();
      cargar();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Error al actualizar la tarifa.");
    } finally {
      setGuardando(false);
    }
  };

  /* ── Estadísticas rápidas ── */
  const promedioKm = tarifas.length
    ? tarifas.reduce((s, t) => s + t.costo_base_km, 0) / tarifas.length
    : 0;

  const maxPeso = tarifas.length
    ? Math.max(...tarifas.map((t) => t.limite_peso_ton))
    : 0;

  /* ════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════ */
  return (
    <div className="fn-page">
      <FinanzasHeader />
      <FinanzasMenu />

      <div className="fn-container">
        {/* ── Encabezado ── */}
        <div className="fn-page-header">
          <h1>Parametrización de Tarifario</h1>
          <p>Configura los costos base y límites de peso por tipo de unidad de transporte</p>
        </div>

        {/* ── Alertas ── */}
        {success && <div className="fn-alert fn-alert-success">✓ {success}</div>}
        {error   && <div className="fn-alert fn-alert-error">✕ {error}</div>}

        {/* ── Info de contexto ── */}
        <div className="fn-alert fn-alert-info">
           Los cambios aplican únicamente a contratos nuevos o modificados.
        </div>

        {/* ── Stats rápidas ── */}
        <div className="fn-stats-grid">
          <div className="fn-stat-card fn-stat-azul">
            <p className="stat-label">Tipos de unidad</p>
            <p className="stat-value">{tarifas.length}</p>
          </div>
          <div className="fn-stat-card fn-stat-verde">
            <p className="stat-label">Costo promedio / km</p>
            <p className="stat-value" style={{ fontSize: "1.2rem" }}>{fmt(promedioKm)}</p>
          </div>
          <div className="fn-stat-card fn-stat-amarillo">
            <p className="stat-label">Mayor capacidad (Ton)</p>
            <p className="stat-value">{maxPeso.toFixed(2)}</p>
          </div>
        </div>

        {/* ── Tabla de tarifas ── */}
        <div className="fn-panel">
          {loading ? (
            <div className="fn-spinner" />
          ) : tarifas.length === 0 ? (
            <div className="fn-empty">
              <span className="empty-icon">📋</span>
              <p>No hay tarifas configuradas en el sistema</p>
            </div>
          ) : (
            <div className="fn-table-wrap">
              <table className="fn-table">
                <thead>
                  <tr>
                    <th>Tipo de Unidad</th>
                    <th>Límite de Peso (Ton)</th>
                    <th>Costo Base / km</th>
                    <th>Desde peso estandar</th>
                    <th>Última actualización</th>
                    <th>Actualizado por</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tarifas.map((t) => {
                    const ref = referencia?.[t.tipo_unidad];
                    const superaRef = ref && t.limite_peso_ton > ref.limite_peso_ton_max;
                    return (
                      <tr key={t.id}>
                        <td>
                          <span style={{ fontSize: "1.2rem", marginRight: 6 }}>
                            {ICONO[t.tipo_unidad]}
                          </span>
                          <strong>{ETIQUETA[t.tipo_unidad]}</strong>
                          <br />
                          <span style={{ fontSize: "0.75rem", opacity: 0.6 }}>{t.tipo_unidad}</span>
                        </td>
                        <td>
                          <span style={{ color: superaRef ? "var(--fn-error, #dc2626)" : "inherit" }}>
                            {t.limite_peso_ton} Ton
                          </span>
                        </td>
                        <td><strong>{fmt(t.costo_base_km)}</strong></td>
                        <td style={{ opacity: 0.65, fontSize: "0.85rem" }}>
                          {ref ? `${ref.limite_peso_ton_max} Ton` : "—"}
                        </td>
                        <td style={{ fontSize: "0.85rem" }}>{fmtDate(t.fecha_actualizacion)}</td>
                        <td style={{ fontSize: "0.85rem" }}>{t.actualizado_por_nombre ?? "—"}</td>
                        <td>
                          <div className="fn-row-actions">
                            <button
                              className="fn-btn fn-btn-primary fn-btn-xs"
                              onClick={() => handleEditar(t)}
                            >
                              Editar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Tabla de referencia (rangos del sistema) ── */}
        {referencia && (
          <div className="fn-panel" style={{ marginTop: "1.5rem" }}>
            <div style={{ padding: "1rem 1.25rem 0.5rem", borderBottom: "1px solid var(--fn-border, #e5e7eb)" }}>
              <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600 }}>
                Rangos de referencia del sistema
              </h3>
              <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", opacity: 0.6 }}>
                Valores base iniciales. Los contratos pueden negociar tarifas diferentes.
              </p>
            </div>
            <div className="fn-table-wrap">
              <table className="fn-table">
                <thead>
                  <tr>
                    <th>Tipo de Unidad</th>
                    <th>Límite máx. (Ton)</th>
                    <th>Costo sugerido / km</th>
                    <th>Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  {(["LIGERA", "PESADA", "CABEZAL"] as TipoUnidad[]).map((tipo) => (
                    <tr key={tipo}>
                      <td>
                        {ICONO[tipo]} <strong>{ETIQUETA[tipo]}</strong>
                      </td>
                      <td>{referencia[tipo]?.limite_peso_ton_max} Ton</td>
                      <td>{fmt(referencia[tipo]?.costo_base_km_sugerido)}</td>
                      <td style={{ fontSize: "0.85rem", opacity: 0.7 }}>
                        {referencia[tipo]?.descripcion}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════
          MODAL DE EDICIÓN
          ════════════════════════════════════════════════════ */}
      {editando && (
        <div className="fn-modal-overlay" onClick={handleCerrar}>
          <div
            className="fn-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 480 }}
          >
            {/* Cabecera */}
            <div className="fn-modal-header">
              <h2>
                {ICONO[editando.tipo_unidad]} Editar tarifa —{" "}
                {ETIQUETA[editando.tipo_unidad]}
              </h2>
              <button className="fn-modal-close" onClick={handleCerrar}>✕</button>
            </div>

            {/* Cuerpo */}
            <div className="fn-modal-body">
              {formError && (
                <div className="fn-alert fn-alert-error" style={{ marginBottom: "1rem" }}>
                  ✕ {formError}
                </div>
              )}

              {/* Referencia del tipo */}
              {referencia?.[editando.tipo_unidad] && (
                <div className="fn-alert fn-alert-info" style={{ marginBottom: "1rem", fontSize: "0.85rem" }}>
                  Rango permitido: hasta{" "}
                  <strong>{referencia[editando.tipo_unidad].limite_peso_ton_max} Ton</strong> —
                  costo sugerido{" "}
                  <strong>{fmt(referencia[editando.tipo_unidad].costo_base_km_sugerido)}/km</strong>
                </div>
              )}

              {/* Valores actuales */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1.25rem", padding: "0.75rem", background: "var(--fn-bg-subtle, #f9fafb)", borderRadius: 6, fontSize: "0.82rem" }}>
                <div>
                  <span style={{ opacity: 0.6 }}>Max. Peso actual</span>
                  <br />
                  <strong>{editando.limite_peso_ton} Ton</strong>
                </div>
                <div>
                  <span style={{ opacity: 0.6 }}>Costo actual</span>
                  <br />
                  <strong>{fmt(editando.costo_base_km)}</strong>
                </div>
              </div>

              {/* Campo: Límite de peso */}
              <div className="fn-field">
                <label>
                  Límite de peso (Ton){" "}
                  {referencia?.[editando.tipo_unidad] && (
                    <span style={{ opacity: 0.55, fontWeight: 400 }}>
                    </span>
                  )}
                </label>
                <input
                  className="fn-input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={referencia?.[editando.tipo_unidad]?.limite_peso_ton_max}
                  placeholder="ej. 3.50"
                  value={form.limite_peso_ton}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, limite_peso_ton: e.target.value }));
                    setFormError(null);
                  }}
                />
              </div>

              {/* Campo: Costo por km */}
              <div className="fn-field" style={{ marginTop: "0.75rem" }}>
                <label>
                  Costo base / km (Q){" "}
                  {referencia?.[editando.tipo_unidad] && (
                    <span style={{ opacity: 0.55, fontWeight: 400 }}>
                      — sugerido: {fmt(referencia[editando.tipo_unidad].costo_base_km_sugerido)}
                    </span>
                  )}
                </label>
                <input
                  className="fn-input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="ej. 8.00"
                  value={form.costo_base_km}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, costo_base_km: e.target.value }));
                    setFormError(null);
                  }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="fn-modal-footer">
              <button
                className="fn-btn fn-btn-ghost"
                onClick={handleCerrar}
                disabled={guardando}
              >
                Cancelar
              </button>
              <button
                className="fn-btn fn-btn-primary"
                onClick={handleGuardar}
                disabled={guardando}
              >
                {guardando ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TarifasPage;