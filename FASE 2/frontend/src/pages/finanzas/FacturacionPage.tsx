// src/pages/finanzas/FacturacionPage.tsx
import React, { useEffect, useState } from "react";
import { getFacturas, certificarFactura } from "../../services/facturacion/facturacion";

type Factura = {
  id: number;
  numero_factura?: string;
  cliente_nombre?: string;
  cliente_nit?: string;
  orden_id?: number;
  monto_base?: number;
  descuento?: number;
  iva?: number;
  total?: number;
  estado?: string; // BORRADOR | CERTIFICADA | ANULADA
  uuid_autorizacion?: string;
  fecha_emision?: string;
  fecha_certificacion?: string;
};

const ESTADO_COLORS: Record<string, string> = {
  BORRADOR: "bg-yellow-100 text-yellow-800 border border-yellow-300",
  CERTIFICADA: "bg-green-100 text-green-800 border border-green-300",
  ANULADA: "bg-red-100 text-red-800 border border-red-300",
};

const FacturacionPage: React.FC = () => {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [certificando, setCertificando] = useState<number | null>(null);
  const [selectedFactura, setSelectedFactura] = useState<Factura | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchFacturas = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getFacturas({ estado: filtroEstado || undefined });
      setFacturas(res.data || []);
    } catch (e: any) {
      setError(e.message || "Error al cargar facturas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacturas();
  }, [filtroEstado]);

  const handleCertificar = async (factura: Factura) => {
    if (!window.confirm(`¿Certificar (FEL) la factura #${factura.numero_factura || factura.id}?`)) return;
    setCertificando(factura.id);
    setSuccessMsg(null);
    try {
      await certificarFactura(factura.id);
      setSuccessMsg(`Factura #${factura.numero_factura || factura.id} certificada exitosamente.`);
      fetchFacturas();
    } catch (e: any) {
      setError(e.message || "Error al certificar factura");
    } finally {
      setCertificando(null);
    }
  };

  const totalFacturado = facturas
    .filter((f) => f.estado === "CERTIFICADA")
    .reduce((acc, f) => acc + (f.total || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-900 text-white px-6 py-5 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Facturación Electrónica (FEL)</h1>
            <p className="text-blue-200 text-sm mt-1">Gestión y certificación de facturas</p>
          </div>
          <div className="bg-blue-800 rounded-xl px-5 py-3 text-right">
            <p className="text-xs text-blue-300">Total certificado</p>
            <p className="text-xl font-bold">Q {totalFacturado.toLocaleString("es-GT", { minimumFractionDigits: 2 })}</p>
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

        {/* Filtros */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6 flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Todos</option>
              <option value="BORRADOR">Borrador</option>
              <option value="CERTIFICADA">Certificada</option>
              <option value="ANULADA">Anulada</option>
            </select>
          </div>
          <button
            onClick={fetchFacturas}
            className="ml-auto px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition"
          >
            Actualizar
          </button>
        </div>

        {/* Cards resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: "Borradores", estado: "BORRADOR", color: "yellow" },
            { label: "Certificadas", estado: "CERTIFICADA", color: "green" },
            { label: "Anuladas", estado: "ANULADA", color: "red" },
          ].map(({ label, estado, color }) => (
            <div key={estado} className={`bg-white rounded-2xl border shadow-sm p-5`}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
              <p className={`text-3xl font-bold mt-1 text-${color}-600`}>
                {facturas.filter((f) => f.estado === estado).length}
              </p>
            </div>
          ))}
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700"></div>
            </div>
          ) : facturas.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              No hay facturas registradas
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["# Factura", "Cliente", "NIT", "Orden", "Total (Q)", "Estado", "Fecha", "Acciones"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {facturas.map((f) => (
                    <tr key={f.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-mono font-semibold text-blue-900">
                        {f.numero_factura || `#${f.id}`}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{f.cliente_nombre || "—"}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{f.cliente_nit || "—"}</td>
                      <td className="px-4 py-3 text-gray-500">#{f.orden_id || "—"}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        Q {(f.total || 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${ESTADO_COLORS[f.estado || ""] || "bg-gray-100 text-gray-600"}`}>
                          {f.estado || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {f.fecha_emision ? new Date(f.fecha_emision).toLocaleDateString("es-GT") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedFactura(f)}
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition"
                          >
                            Ver
                          </button>
                          {f.estado === "BORRADOR" && (
                            <button
                              onClick={() => handleCertificar(f)}
                              disabled={certificando === f.id}
                              className="px-3 py-1 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold transition disabled:opacity-60"
                            >
                              {certificando === f.id ? "..." : "Certificar FEL"}
                            </button>
                          )}
                          {f.estado === "CERTIFICADA" && f.uuid_autorizacion && (
                            <span className="px-2 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-mono">
                              ✓ UUID
                            </span>
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

      {/* Modal detalle */}
      {selectedFactura && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="bg-blue-900 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h2 className="font-bold text-lg">
                Factura {selectedFactura.numero_factura || `#${selectedFactura.id}`}
              </h2>
              <button onClick={() => setSelectedFactura(null)} className="text-blue-200 hover:text-white transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <Row label="Cliente" value={selectedFactura.cliente_nombre} />
              <Row label="NIT" value={selectedFactura.cliente_nit} />
              <Row label="Orden #" value={selectedFactura.orden_id} />
              <Row label="Monto base" value={`Q ${(selectedFactura.monto_base || 0).toFixed(2)}`} />
              <Row label="Descuento" value={`Q ${(selectedFactura.descuento || 0).toFixed(2)}`} />
              <Row label="IVA (12%)" value={`Q ${(selectedFactura.iva || 0).toFixed(2)}`} />
              <div className="border-t pt-3 flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-blue-900">Q {(selectedFactura.total || 0).toFixed(2)}</span>
              </div>
              {selectedFactura.uuid_autorizacion && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 mt-2">
                  <p className="text-xs text-green-600 font-semibold mb-1">UUID de Autorización SAT</p>
                  <p className="font-mono text-xs text-green-800 break-all">{selectedFactura.uuid_autorizacion}</p>
                </div>
              )}
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>Emitida: {selectedFactura.fecha_emision ? new Date(selectedFactura.fecha_emision).toLocaleDateString("es-GT") : "—"}</span>
                {selectedFactura.fecha_certificacion && (
                  <span>Certificada: {new Date(selectedFactura.fecha_certificacion).toLocaleDateString("es-GT")}</span>
                )}
              </div>
            </div>
            <div className="px-6 pb-6 flex justify-end gap-3">
              {selectedFactura.estado === "BORRADOR" && (
                <button
                  onClick={() => { handleCertificar(selectedFactura); setSelectedFactura(null); }}
                  className="px-4 py-2 bg-blue-900 text-white rounded-xl text-sm font-semibold hover:bg-blue-800 transition"
                >
                  Certificar FEL
                </button>
              )}
              <button
                onClick={() => setSelectedFactura(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Row: React.FC<{ label: string; value: any }> = ({ label, value }) => (
  <div className="flex justify-between">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium text-gray-800">{value ?? "—"}</span>
  </div>
);

export default FacturacionPage;