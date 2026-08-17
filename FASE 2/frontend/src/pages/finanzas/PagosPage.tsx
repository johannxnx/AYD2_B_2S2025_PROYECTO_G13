// src/pages/finanzas/PagosPage.tsx
import React, { useEffect, useState } from "react";
import { getPagos, registrarPago } from "../../services/facturacion/pagos";
import FinanzasHeader from "../../components/finanzas/FinanzasHeader";
import FinanzasMenu from "../../components/finanzas/FinanzasMenu";

type Pago = {
  id: number;
  factura_id: number;
  numero_factura?: string;
  cliente_nombre?: string;
  monto: number;
  tipo_pago: "CHEQUE" | "TRANSFERENCIA";
  numero_autorizacion?: string;
  banco?: string;
  referencia?: string;
  fecha_pago?: string;
};

type NuevoPagoForm = {
  factura_id: string;
  monto: string;
  tipo_pago: "CHEQUE" | "TRANSFERENCIA";
  numero_autorizacion: string;
  banco: string;
  referencia: string;
};

const FORM_INICIAL: NuevoPagoForm = {
  factura_id: "",
  monto: "",
  tipo_pago: "TRANSFERENCIA",
  numero_autorizacion: "",
  banco: "",
  referencia: "",
};

const PagosPage: React.FC = () => {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NuevoPagoForm>(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState("");

  const fetchPagos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPagos({ tipo_pago: filtroTipo || undefined });
      setPagos(res.data || []);
    } catch (e: any) {
      setError(e.message || "Error al cargar pagos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPagos();
  }, [filtroTipo]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.factura_id || !form.monto || !form.numero_autorizacion || !form.banco) {
      setError("Por favor completa todos los campos requeridos.");
      return;
    }
    setGuardando(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await registrarPago({
        factura_id: Number(form.factura_id),
        monto: Number(form.monto),
        tipo_pago: form.tipo_pago,
        numero_autorizacion: form.numero_autorizacion,
        banco: form.banco,
        referencia: form.referencia,
      });
      setSuccessMsg("Pago registrado. El crédito del cliente fue liberado.");
      setForm(FORM_INICIAL);
      setShowForm(false);
      fetchPagos();
    } catch (e: any) {
      setError(e.message || "Error al registrar pago");
    } finally {
      setGuardando(false);
    }
  };

  const totalRecaudado = pagos.reduce((acc, p) => acc + (p.monto || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <FinanzasHeader />
      <FinanzasMenu />

      {/* Header de sección */}
      <div className="bg-blue-900 text-white px-6 py-5 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Cobros y Pagos</h1>
            <p className="text-blue-200 text-sm mt-1">Registro de pagos y liberación de crédito</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-blue-800 rounded-xl px-5 py-3 text-right">
              <p className="text-xs text-blue-300">Total recaudado</p>
              <p className="text-xl font-bold">
                Q {totalRecaudado.toLocaleString("es-GT", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <button
              onClick={() => { setShowForm(true); setError(null); setSuccessMsg(null); }}
              className="px-4 py-2 bg-white text-blue-900 rounded-xl font-bold text-sm hover:bg-blue-50 transition shadow"
            >
              + Registrar Pago
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Mensajes */}
        {successMsg && (
          <div className="mb-4 p-4 bg-green-50 border border-green-300 rounded-xl text-green-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {successMsg}
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-300 rounded-xl text-red-800">
            {error}
          </div>
        )}

        {/* Cards resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total pagos</p>
            <p className="text-3xl font-bold mt-1 text-blue-900">{pagos.length}</p>
          </div>
          <div className="bg-white rounded-2xl border shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Transferencias</p>
            <p className="text-3xl font-bold mt-1 text-indigo-600">
              {pagos.filter((p) => p.tipo_pago === "TRANSFERENCIA").length}
            </p>
          </div>
          <div className="bg-white rounded-2xl border shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Cheques</p>
            <p className="text-3xl font-bold mt-1 text-cyan-600">
              {pagos.filter((p) => p.tipo_pago === "CHEQUE").length}
            </p>
          </div>
        </div>

        {/* Filtro */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6 flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Tipo de pago</label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Todos</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </div>
          <button
            onClick={fetchPagos}
            className="ml-auto px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition"
          >
            Actualizar
          </button>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700"></div>
            </div>
          ) : pagos.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              No hay pagos registrados
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["ID", "Factura", "Cliente", "Monto (Q)", "Tipo", "Banco", "No. Autorización", "Fecha"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pagos.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">#{p.id}</td>
                      <td className="px-4 py-3 font-semibold text-blue-900 font-mono">
                        {p.numero_factura || `#${p.factura_id}`}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{p.cliente_nombre || "—"}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        Q {(p.monto || 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          p.tipo_pago === "TRANSFERENCIA"
                            ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                            : "bg-cyan-100 text-cyan-700 border border-cyan-200"
                        }`}>
                          {p.tipo_pago}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{p.banco || "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.numero_autorizacion || "—"}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {p.fecha_pago ? new Date(p.fecha_pago).toLocaleDateString("es-GT") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Registrar Pago */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="bg-blue-900 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h2 className="font-bold text-lg">Registrar Pago</h2>
              <button onClick={() => setShowForm(false)} className="text-blue-200 hover:text-white transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">ID Factura *</label>
                  <input
                    type="number"
                    name="factura_id"
                    value={form.factura_id}
                    onChange={handleFormChange}
                    required
                    placeholder="Ej: 42"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Monto (Q) *</label>
                  <input
                    type="number"
                    name="monto"
                    value={form.monto}
                    onChange={handleFormChange}
                    required
                    placeholder="0.00"
                    step="0.01"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo de pago *</label>
                <select
                  name="tipo_pago"
                  value={form.tipo_pago}
                  onChange={handleFormChange}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="TRANSFERENCIA">Transferencia</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Banco *</label>
                <input
                  type="text"
                  name="banco"
                  value={form.banco}
                  onChange={handleFormChange}
                  required
                  placeholder="Ej: Banrural, G&T Continental..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">No. Autorización entidad financiera *</label>
                <input
                  type="text"
                  name="numero_autorizacion"
                  value={form.numero_autorizacion}
                  onChange={handleFormChange}
                  required
                  placeholder="Número de autorización del banco"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Referencia / Notas</label>
                <input
                  type="text"
                  name="referencia"
                  value={form.referencia}
                  onChange={handleFormChange}
                  placeholder="Opcional"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 bg-blue-900 text-white rounded-xl text-sm font-semibold hover:bg-blue-800 transition disabled:opacity-60 flex items-center gap-2"
                >
                  {guardando && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                  {guardando ? "Registrando..." : "Registrar Pago"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PagosPage;