

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import ClientHeader from '../../components/client/ClientHeader';
import ClientMenu from '../../components/client/ClientMenu';
import { getPagosByCliente, getCobrosCliente, registrarPago } from '../../services/facturacion/pagos';
import { formatMoney } from '../../services/client/client';
import apiService from '../../services/api';
import './cliente_estilo.css';

// Helper para obtener código de moneda desde moneda_id
const getCodigoMonedaDesdeId = (moneda_id?: number): string => {
  const monedasMap: Record<number, string> = {
    1: 'GTQ',
    2: 'USD',
    6: 'HNL',
    7: 'SVC'
  };
  return moneda_id ? (monedasMap[moneda_id] || 'GTQ') : 'GTQ';
};

/* ── Tipos ─────────────────────────────────────────────── */
interface Pago {
  id: number;
  factura_id: number;
  numero_factura?: string;
  monto: number;
  tipo_pago: 'CHEQUE' | 'TRANSFERENCIA';
  numero_autorizacion: string;
  banco?: string;
  referencia?: string;
  fecha_pago: string;
  registrado_por_nombre?: string;
}

interface CuentaPorCobrar {
  id: number;
  factura_id: number;
  numero_factura?: string;
  monto_original: number;
  saldo_pendiente: number;
  fecha_vencimiento: string;
  estado_cobro: 'PENDIENTE' | 'PAGADA' | 'VENCIDA' | 'ANULADA';
}

/* ── Utilidades ─────────────────────────────────────────── */
const fmtMoney = (n: number, monedaCode: string = 'GTQ') =>
  formatMoney(n ?? 0, monedaCode);

const fmtDate = (s?: string) =>
  s ? new Date(s).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const fmtDateTime = (s?: string) =>
  s ? new Date(s).toLocaleString('es-GT') : '—';

const tipoBadge = (tipo: string) =>
  tipo === 'TRANSFERENCIA' ? 'cl-badge cl-badge-transferencia' : 'cl-badge cl-badge-cheque';

const cobroBadge = (estado: string) => {
  const mapa: Record<string, string> = {
    PENDIENTE: 'cl-badge cl-badge-pendiente',
    PAGADA:    'cl-badge cl-badge-pagada',
    VENCIDA:   'cl-badge cl-badge-vencida',
    ANULADA:   'cl-badge cl-badge-anulada',
  };
  return mapa[estado] ?? 'cl-badge';
};



/* ── Modal de detalle de pago ───────────────────────────── */
const ModalDetallePago: React.FC<{ pago: Pago; onClose: () => void; monedaCode: string }> = ({ pago, onClose, monedaCode }) => (
  <div className="cl-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
    <div className="cl-modal">
      <div className="cl-modal-header">
        <div>
          <h3>Detalle del Pago</h3>
          <span className="modal-subtitle">Factura {pago.numero_factura ?? `#${pago.factura_id}`}</span>
        </div>
        <button className="cl-modal-close" onClick={onClose}>✕</button>
      </div>

      <div className="cl-modal-body">
        <div className="cl-kv-list">
          <div className="cl-kv-row">
            <span className="kv-label">Tipo de pago</span>
            <span className="kv-value">
              <span className={tipoBadge(pago.tipo_pago)}>{pago.tipo_pago}</span>
            </span>
          </div>
          <div className="cl-kv-row">
            <span className="kv-label">Fecha y hora</span>
            <span className="kv-value">{fmtDateTime(pago.fecha_pago)}</span>
          </div>
          {pago.banco && (
            <div className="cl-kv-row">
              <span className="kv-label">Banco</span>
              <span className="kv-value">{pago.banco}</span>
            </div>
          )}
          {pago.referencia && (
            <div className="cl-kv-row">
              <span className="kv-label">Cuenta origen</span>
              <span className="kv-value mono">{pago.referencia}</span>
            </div>
          )}
          {pago.registrado_por_nombre && (
            <div className="cl-kv-row">
              <span className="kv-label">Registrado por</span>
              <span className="kv-value">{pago.registrado_por_nombre}</span>
            </div>
          )}

          <hr className="cl-kv-divider" />

          <div className="cl-kv-row cl-kv-total">
            <span className="kv-label">Monto pagado</span>
            <span className="kv-value">{fmtMoney(pago.monto, monedaCode)}</span>
          </div>
        </div>

        <div className="cl-auth-box">
          <div className="auth-label">N° Autorización bancaria</div>
          <div className="auth-value">{pago.numero_autorizacion}</div>
        </div>
      </div>

      <div className="cl-modal-footer">
        <button className="cl-btn cl-btn-naranja cl-btn-sm" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ══════════════════════════════════════════════════════════ */
const ClientePagosPage: React.FC = () => {
  const { user } = useAuth();
  const [monedaCode, setMonedaCode] = useState('GTQ'); // Moneda por defecto
  
  /* Estado */
  const [pagos,   setPagos]   = useState<Pago[]>([]);
  const [cobros,  setCobros]  = useState<CuentaPorCobrar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const [filtroTipo,    setFiltroTipo]    = useState('TODOS');
  const [pagoDetalle,   setPagoDetalle]   = useState<Pago | null>(null);
  const [vistaActiva,   setVistaActiva]   = useState<'pagos' | 'cobros'>('pagos');

  const [mostrarModalPago, setMostrarModalPago] = useState(false);
const [cxcSeleccionada, setCxcSeleccionada] = useState<CuentaPorCobrar | null>(null);

const [formPago, setFormPago] = useState({
  forma_pago: 'TRANSFERENCIA',
  monto_pagado: 0,
  fecha_hora_pago: '',
  banco_origen: '',
  cuenta_origen: '',
  numero_autorizacion_bancaria: '',
  observacion: '',
});

const [loadingPago, setLoadingPago] = useState(false);

  /* Info del usuario */
  const userName    = user?.nombres && user?.apellidos
    ? `${user.nombres} ${user.apellidos}`
    : user?.email?.split('@')[0] ?? 'Cliente';
  const companyName = user?.empresa ?? 'Mi Empresa';
  const userId      = user?.id;

  /* ── Carga de datos ── */
  const cargar = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const [resPagos, resCobros, resContratos] = await Promise.all([
        getPagosByCliente(userId),
        getCobrosCliente(userId, { limit: 100 }),
        (apiService as any).listarContratosPorCliente(userId),
      ]);

      setPagos(resPagos?.data ?? []);

      const listaCobros = resCobros?.data?.cuentas ?? resCobros?.data ?? [];
      setCobros(listaCobros);
      
      // Obtener la moneda del primer contrato activo
      if (resContratos?.ok && resContratos.data?.length > 0) {
        const contratoActivo = resContratos.data[0];
        const moneda = getCodigoMonedaDesdeId(contratoActivo.moneda_id);
        setMonedaCode(moneda);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { cargar(); }, [cargar]);


  const handleRegistrarPago = async () => {
    if (!cxcSeleccionada) return;
  
    try {
      setLoadingPago(true);
  
      await registrarPago(cxcSeleccionada.factura_id, {
        cuenta_por_cobrar_id: cxcSeleccionada.id,
        ...formPago,
      });
  
      setMostrarModalPago(false);
      setCxcSeleccionada(null);
  
      // recargar datos
      await cargar();
  
    } catch (e: any) {
      alert(e.message || 'Error al registrar pago');
    } finally {
      setLoadingPago(false);
    }
  };

  /* ── Métricas ── */
  const totalPagado      = pagos.reduce((s, p) => s + (p.monto ?? 0), 0);
  const transferencias   = pagos.filter(p => p.tipo_pago === 'TRANSFERENCIA').length;
  const cheques          = pagos.filter(p => p.tipo_pago === 'CHEQUE').length;
  const pendienteTotal   = cobros
    .filter(c => c.estado_cobro !== 'PAGADA' && c.estado_cobro !== 'ANULADA')
    .reduce((s, c) => s + c.saldo_pendiente, 0);

  /* ── Pagos filtrados ── */
  const pagosFiltrados = filtroTipo === 'TODOS'
    ? pagos
    : pagos.filter(p => p.tipo_pago === filtroTipo);

  /* ── Render ── */
  return (
    <div className="cl-page">
      <ClientHeader companyName={companyName} userName={userName} />
      <ClientMenu />

      <div className="cl-container">
        <div className="cl-page-header">
          <h1>Mis Pagos y Cobros</h1>
          <p>Historial de pagos registrados y estado de tus cuentas por cobrar</p>
        </div>

        {error && (
          <div className="cl-alert cl-alert-error">
            ✕ {error}
            <button
              onClick={() => setError(null)}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
            >
              ×
            </button>
          </div>
        )}

        {/* ── Stats ── */}
        <div className="cl-stats-grid">
          <div className="cl-stat-card">
            <div className="cl-stat-icon cl-stat-icon-verde">💰</div>
            <div className="cl-stat-info">
              <p className="stat-label">Total pagado</p>
              <p className="stat-value-sm stat-value-verde">{fmtMoney(totalPagado, monedaCode)}</p>
            </div>
          </div>
          <div className="cl-stat-card">
            <div className="cl-stat-icon cl-stat-icon-naranja">📄</div>
            <div className="cl-stat-info">
              <p className="stat-label">Pagos registrados</p>
              <p className="stat-value">{pagos.length}</p>
            </div>
          </div>
          <div className="cl-stat-card">
            <div className="cl-stat-icon cl-stat-icon-azul">🏦</div>
            <div className="cl-stat-info">
              <p className="stat-label">Transferencias</p>
              <p className="stat-value stat-value-azul">{transferencias}</p>
            </div>
          </div>
          <div className="cl-stat-card">
            <div className="cl-stat-icon cl-stat-icon-purpura">📝</div>
            <div className="cl-stat-info">
              <p className="stat-label">Cheques</p>
              <p className="stat-value">{cheques}</p>
            </div>
          </div>
          <div className="cl-stat-card">
            <div className="cl-stat-icon cl-stat-icon-rojo">⏳</div>
            <div className="cl-stat-info">
              <p className="stat-label">Saldo pendiente</p>
              <p className="stat-value-sm stat-value-rojo">{fmtMoney(pendienteTotal, monedaCode)}</p>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            className={`cl-btn cl-btn-sm ${vistaActiva === 'pagos' ? 'cl-btn-naranja' : 'cl-btn-ghost'}`}
            onClick={() => setVistaActiva('pagos')}
          >
            💳 Historial de pagos
          </button>
          <button
            className={`cl-btn cl-btn-sm ${vistaActiva === 'cobros' ? 'cl-btn-naranja' : 'cl-btn-ghost'}`}
            onClick={() => setVistaActiva('cobros')}
          >
            📋 Cuentas por cobrar
          </button>
          <button
            className="cl-btn cl-btn-ghost cl-btn-sm"
            style={{ marginLeft: 'auto' }}
            onClick={cargar}
          >
            ↺ Actualizar
          </button>
        </div>

        {/* ════════════════════════════════════════
            VISTA: HISTORIAL DE PAGOS
            ════════════════════════════════════════ */}
        {vistaActiva === 'pagos' && (
          <div className="cl-panel">
            <div className="cl-panel-header">
              <div>
                <h2>Historial de Pagos</h2>
                <p>Cada pago registrado libera tu límite de crédito automáticamente</p>
              </div>
              <div className="cl-filtros" style={{ marginBottom: 0 }}>
                <select
                  className="cl-select"
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                >
                  <option value="TODOS">Todos los tipos</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="cl-spinner" />
            ) : pagosFiltrados.length === 0 ? (
              <div className="cl-empty">
                <span className="empty-icon">💳</span>
                <p>
                  {pagos.length === 0
                    ? 'No hay pagos registrados aún'
                    : 'No hay pagos con el filtro seleccionado'}
                </p>
              </div>
            ) : (
              <div className="cl-table-wrap">
                <table className="cl-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Factura</th>
                      <th>Tipo</th>
                      <th>Banco</th>
                      <th>Monto pagado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagosFiltrados.map((pago) => (
                      <tr key={pago.id}>
                        <td>{fmtDate(pago.fecha_pago)}</td>
                        <td className="mono">{pago.numero_factura ?? `#${pago.factura_id}`}</td>
                        <td>
                          <span className={tipoBadge(pago.tipo_pago)}>
                            {pago.tipo_pago === 'TRANSFERENCIA' ? '🏦 Transferencia' : '📝 Cheque'}
                          </span>
                        </td>
                        <td>{pago.banco ?? '—'}</td>
                        <td>
                          <strong style={{ color: 'var(--cl-verde)' }}>
                            {fmtMoney(pago.monto, monedaCode)}
                          </strong>
                        </td>
                        <td>
                          <button
                            className="cl-btn-icon"
                            title="Ver detalle"
                            onClick={() => setPagoDetalle(pago)}
                          >
                            👁
                          </button>
                        </td>
                      </tr>
                    ))}
                    {/* Fila de total */}
                    <tr style={{ background: 'var(--cl-gris-light)', fontWeight: 700 }}>
                      <td colSpan={4} style={{ padding: '10px 14px', color: 'var(--cl-texto-suave)', fontSize: '0.78rem' }}>
                        Total {filtroTipo !== 'TODOS' ? `(${filtroTipo})` : ''}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--cl-verde)' }}>
                        {fmtMoney(pagosFiltrados.reduce((s, p) => s + (p.monto ?? 0), 0), monedaCode)}
                      </td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════
            VISTA: CUENTAS POR COBRAR
            ════════════════════════════════════════ */}
        {vistaActiva === 'cobros' && (
          <div className="cl-panel">
            <div className="cl-panel-header">
              <div>
                <h2>Cuentas por Cobrar</h2>
                <p>Estado de tus facturas y fechas de vencimiento</p>
              </div>
            </div>

            {loading ? (
              <div className="cl-spinner" />
            ) : cobros.length === 0 ? (
              <div className="cl-empty">
                <span className="empty-icon">📋</span>
                <p>No hay cuentas por cobrar registradas</p>
              </div>
            ) : (
              <div className="cl-table-wrap">
                <table className="cl-table">
                  <thead>
                    <tr>
                      <th>Factura</th>
                      <th>Monto original</th>
                      <th>Saldo pendiente</th>
                      <th>Vencimiento</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cobros.map((c) => {
                      const vencida = c.estado_cobro === 'VENCIDA';
                      return (
                        <tr
                          key={c.id}
                          style={vencida ? { background: '#fff8f8' } : undefined}
                        >
                          <td className="mono">
                            {c.numero_factura ?? `ID:${c.factura_id}`}
                          </td>
                          <td>{fmtMoney(c.monto_original, monedaCode)}</td>
                          <td>
                            <strong
                              style={{
                                color: c.saldo_pendiente > 0
                                  ? 'var(--cl-rojo)'
                                  : 'var(--cl-verde)',
                              }}
                            >
                              {fmtMoney(c.saldo_pendiente, monedaCode)}
                            </strong>
                          </td>
                          <td style={{ color: vencida ? 'var(--cl-rojo)' : undefined }}>
                            {fmtDate(c.fecha_vencimiento)}
                            {vencida && ' ⚠️'}
                          </td>
                          <td>
                            <span className={cobroBadge(c.estado_cobro)}>
                              {c.estado_cobro}
                            </span>
                          </td>


                          <td>
  {c.estado_cobro !== 'PAGADA' && c.estado_cobro !== 'ANULADA' && (
    <button
      className="cl-btn cl-btn-naranja cl-btn-sm"
      onClick={() => {
        setCxcSeleccionada(c);
        setFormPago({
          forma_pago: 'TRANSFERENCIA',
          monto_pagado: c.saldo_pendiente,
          fecha_hora_pago: new Date().toISOString().slice(0,16),
          banco_origen: '',
          cuenta_origen: '',
          numero_autorizacion_bancaria: '',
          observacion: '',
        });
        setMostrarModalPago(true);
      }}
    >
      💳 Pagar
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

            {cobros.some(c => c.estado_cobro === 'VENCIDA') && (
              <div className="cl-alert cl-alert-error" style={{ margin: '12px 18px' }}>
                ⚠️ Tienes cuentas vencidas. Contacta a tu agente financiero para regularizar.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de detalle */}
      {pagoDetalle && (
        <ModalDetallePago
          pago={pagoDetalle}
          onClose={() => setPagoDetalle(null)}
          monedaCode={monedaCode}
        />
      )}

{mostrarModalPago && cxcSeleccionada && (
  <div className="cl-overlay" onClick={(e) => e.target === e.currentTarget && setMostrarModalPago(false)}>
    <div className="cl-modal">
      <div className="cl-modal-header">
        <h3>Registrar Pago</h3>
        <button className="cl-modal-close" onClick={() => setMostrarModalPago(false)}>✕</button>
      </div>

      <div className="cl-modal-body">
        <div className="cl-kv-list">

          <div className="cl-kv-row">
            <span>Factura</span>
            <strong>{cxcSeleccionada.numero_factura ?? `#${cxcSeleccionada.factura_id}`}</strong>
          </div>

          <div className="cl-kv-row">
            <span>Saldo pendiente</span>
            <strong>{fmtMoney(cxcSeleccionada.saldo_pendiente, monedaCode)}</strong>
          </div>

          <hr />

          {/* FORMULARIO */}
          <select
            className="cl-input"
            value={formPago.forma_pago}
            onChange={(e) => setFormPago({ ...formPago, forma_pago: e.target.value })}
          >
            <option value="TRANSFERENCIA">Transferencia</option>
            <option value="CHEQUE">Cheque</option>
          </select>

          <input
            type="number"
            className="cl-input"
            placeholder="Monto"
            value={formPago.monto_pagado}
            onChange={(e) => setFormPago({ ...formPago, monto_pagado: Number(e.target.value) })}
          />

          <input
            type="datetime-local"
            className="cl-input"
            value={formPago.fecha_hora_pago}
            onChange={(e) => setFormPago({ ...formPago, fecha_hora_pago: e.target.value })}
          />

          <input
            className="cl-input"
            placeholder="Banco"
            value={formPago.banco_origen}
            onChange={(e) => setFormPago({ ...formPago, banco_origen: e.target.value })}
          />

          <input
            className="cl-input"
            placeholder="Cuenta origen"
            value={formPago.cuenta_origen}
            onChange={(e) => setFormPago({ ...formPago, cuenta_origen: e.target.value })}
          />

          <input
            className="cl-input"
            placeholder="Número autorización"
            value={formPago.numero_autorizacion_bancaria}
            onChange={(e) => setFormPago({ ...formPago, numero_autorizacion_bancaria: e.target.value })}
          />

          <textarea
            className="cl-input"
            placeholder="Observación (opcional)"
            value={formPago.observacion}
            onChange={(e) => setFormPago({ ...formPago, observacion: e.target.value })}
          />

        </div>
      </div>

      <div className="cl-modal-footer">
        <button className="cl-btn cl-btn-ghost" onClick={() => setMostrarModalPago(false)}>
          Cancelar
        </button>

        <button
          className="cl-btn cl-btn-naranja"
          onClick={handleRegistrarPago}
          disabled={loadingPago}
        >
          {loadingPago ? 'Procesando...' : 'Confirmar Pago'}
        </button>
      </div>
    </div>
  </div>
)}



    </div>
  );
};

export default ClientePagosPage;