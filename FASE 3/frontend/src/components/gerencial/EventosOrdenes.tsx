// src/components/gerencial/EventosOrdenes.tsx
import React, { useEffect, useState } from "react";
import { getEventosOrdenes } from "../../services/Gerencial/gerencial";
import {
  FaExclamationCircle,
  FaExclamationTriangle,
  FaClock,
  FaCheckCircle,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";

interface Evento {
  eventoId: number;
  ordenId: number;
  numeroOrden: string;
  pilotoId: number | null;
  pilotoNombre: string;
  clienteNombre: string;
  tipoEvento: "NORMAL" | "INCIDENTE" | "RETRASO" | "CRITICO";
  descripcion: string;
  generaRetraso: boolean;
  fechaHora: string;
  origen: string;
  destino: string;
  ruta: string;
  imagenes?: string[];
}

interface EventosData {
  desde: string;
  hasta: string;
  sede: string;
  tipoEvento: string;
  total: number;
  conteoTipos: {
    NORMAL: number;
    INCIDENTE: number;
    RETRASO: number;
    CRITICO: number;
  };
  eventos: Evento[];
  modoActualizacion: string;
  actualizadoEn: string;
}

interface EventosOrdenesProps {
  desde?: string;
  hasta?: string;
  sede?: string;
}

const TIPO_EVENTO_COLORS: Record<
  string,
  { bg: string; text: string; border: string; icon: React.ReactNode }
> = {
  NORMAL: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    icon: <FaCheckCircle className="text-green-600 text-lg" />,
  },
  INCIDENTE: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
    icon: <FaExclamationTriangle className="text-yellow-600 text-lg" />,
  },
  RETRASO: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    icon: <FaClock className="text-orange-600 text-lg" />,
  },
  CRITICO: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    icon: <FaExclamationCircle className="text-red-600 text-lg" />,
  },
};

const EventosOrdenes: React.FC<EventosOrdenesProps> = ({
  desde,
  hasta,
  sede,
}) => {
  const [eventos, setEventos] = useState<EventosData | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<string>("TODOS");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ordenesExpandidas, setOrdenesExpandidas] = useState<Set<number>>(
    new Set(),
  );

  const cargarEventos = async () => {
    try {
      setCargando(true);
      setError(null);

      const response = await getEventosOrdenes({
        desde: desde || new Date().toISOString().split("T")[0],
        hasta: hasta || new Date().toISOString().split("T")[0],
        sede: sede,
        tipo_evento: filtroTipo !== "TODOS" ? filtroTipo : undefined,
        limite: 200,
      });

      if (response.ok && response.data) {
        setEventos(response.data);
      } else {
        setError(response.mensaje || "Error al cargar eventos");
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar eventos");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEventos();
  }, [desde, hasta, sede, filtroTipo]);

  const abrirVisor = (base64: string) => {
    const w = window.open("");
    if (!w) return;

    w.document.write(`
      <html>
        <head><title>Visor de Evidencia</title></head>
        <body style="margin:0; background:#1a1a1a; display:flex; align-items:center; justify-content:center;">
          <img src="${base64}" style="max-width:100%; max-height:100vh; box-shadow:0 10px 25px rgba(0,0,0,0.5);" />
        </body>
      </html>
    `);
  };

  const toggleOrden = (ordenId: number) => {
    const newSet = new Set(ordenesExpandidas);
    if (newSet.has(ordenId)) {
      newSet.delete(ordenId);
    } else {
      newSet.add(ordenId);
    }
    setOrdenesExpandidas(newSet);
  };

  if (cargando) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando eventos...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!eventos) {
    return null;
  }

  const eventosFiltrados =
    filtroTipo === "TODOS"
      ? eventos.eventos
      : eventos.eventos.filter((e) => e.tipoEvento === filtroTipo);

  const ordenesAgrupadas = new Map<number, Evento[]>();
  eventosFiltrados.forEach((evento) => {
    if (!ordenesAgrupadas.has(evento.ordenId)) {
      ordenesAgrupadas.set(evento.ordenId, []);
    }
    ordenesAgrupadas.get(evento.ordenId)?.push(evento);
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Encabezado */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <svg
            className="w-6 h-6 text-gray-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
          <h2 className="text-2xl font-bold text-gray-800">
            Bitácora de Eventos - Anomalías en Operaciones
          </h2>
        </div>
        <p className="text-gray-600 text-sm">
          Detección de anomalías en la operación: retrasos constantes, exceso de
          consumo de combustible, cambios en volumen de carga de clientes y
          otros eventos críticos.
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-blue-700">{eventos.total}</p>
          <p className="text-xs text-blue-600">Total Eventos</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-700">
            {eventos.conteoTipos.NORMAL}
          </p>
          <p className="text-xs text-green-600">Normal</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-yellow-700">
            {eventos.conteoTipos.INCIDENTE}
          </p>
          <p className="text-xs text-yellow-600">Incidentes</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-orange-700">
            {eventos.conteoTipos.RETRASO}
          </p>
          <p className="text-xs text-orange-600">Retrasos</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-red-700">
            {eventos.conteoTipos.CRITICO}
          </p>
          <p className="text-xs text-red-600">Críticos</p>
        </div>
      </div>

      {/* Filtro por tipo */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {["TODOS", "NORMAL", "INCIDENTE", "RETRASO", "CRITICO"].map((tipo) => (
          <button
            key={tipo}
            onClick={() => setFiltroTipo(tipo)}
            className={`px-4 py-2 rounded-lg transition-all ${
              filtroTipo === tipo
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {tipo}
          </button>
        ))}
      </div>

      {/* Grid de órdenes agrupadas */}
      <div className="space-y-4">
        {Array.from(ordenesAgrupadas.entries()).length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <p>No hay eventos para mostrar en este período</p>
          </div>
        ) : (
          Array.from(ordenesAgrupadas.entries()).map(
            ([ordenId, eventosOrden]) => {
              const primerEvento = eventosOrden[0];
              const isExpandido = ordenesExpandidas.has(ordenId);

              const conteoEventos = {
                NORMAL: eventosOrden.filter((e) => e.tipoEvento === "NORMAL")
                  .length,
                INCIDENTE: eventosOrden.filter(
                  (e) => e.tipoEvento === "INCIDENTE",
                ).length,
                RETRASO: eventosOrden.filter((e) => e.tipoEvento === "RETRASO")
                  .length,
                CRITICO: eventosOrden.filter((e) => e.tipoEvento === "CRITICO")
                  .length,
              };

              const tieneCritico = conteoEventos.CRITICO > 0;
              const tieneRetraso = conteoEventos.RETRASO > 0;

              const imagenesConstancia =
                eventosOrden.find((e) => e.imagenes && e.imagenes.length > 0)
                  ?.imagenes || [];

              return (
                <div
                  key={ordenId}
                  className={`border rounded-lg transition-all ${
                    tieneCritico
                      ? "border-red-300 bg-red-50"
                      : tieneRetraso
                        ? "border-orange-300 bg-orange-50"
                        : "border-gray-200 bg-white"
                  } shadow-md hover:shadow-lg`}
                >
                  {/* Encabezado de la orden */}
                  <button
                    onClick={() => toggleOrden(ordenId)}
                    className="w-full p-4 flex items-center justify-between hover:bg-opacity-75 transition"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-gray-800">
                            Orden #{primerEvento.numeroOrden}
                          </h3>
                          {tieneCritico && (
                            <span className="px-2 py-1 bg-red-600 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                              <FaExclamationCircle className="text-sm" />
                              CRÍTICO
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Cliente</p>
                            <p className="font-semibold text-gray-800">
                              {primerEvento.clienteNombre}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Ruta</p>
                            <p className="font-semibold text-gray-800">
                              {primerEvento.ruta}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Piloto</p>
                            <p className="font-semibold text-gray-800">
                              {primerEvento.pilotoNombre}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Eventos</p>
                            <p className="font-semibold text-gray-800">
                              {eventosOrden.length} total
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {conteoEventos.CRITICO > 0 && (
                          <div className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                            <svg
                              className="w-3 h-3"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <circle cx="10" cy="10" r="8" />
                            </svg>
                            {conteoEventos.CRITICO}
                          </div>
                        )}
                        {conteoEventos.RETRASO > 0 && (
                          <div className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                            <svg
                              className="w-3 h-3"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <circle cx="10" cy="10" r="8" />
                            </svg>
                            {conteoEventos.RETRASO}
                          </div>
                        )}
                        {conteoEventos.INCIDENTE > 0 && (
                          <div className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                            <svg
                              className="w-3 h-3"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <circle cx="10" cy="10" r="8" />
                            </svg>
                            {conteoEventos.INCIDENTE}
                          </div>
                        )}
                        {conteoEventos.NORMAL > 0 && (
                          <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                            <svg
                              className="w-3 h-3"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <circle cx="10" cy="10" r="8" />
                            </svg>
                            {conteoEventos.NORMAL}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="ml-4 text-gray-600">
                      {isExpandido ? (
                        <FaChevronUp className="text-xl" />
                      ) : (
                        <FaChevronDown className="text-xl" />
                      )}
                    </div>
                  </button>

                  {/* Detalle de eventos */}
                  {isExpandido && (
                    <div className="border-t p-4 bg-gray-50/50">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-sm uppercase tracking-wider text-gray-600">
                          Bitácora de Eventos
                        </h4>
                        <span className="text-xs text-gray-400">
                          {eventosOrden.length} registros
                        </span>
                      </div>

                      <div className="space-y-4">
                        {eventosOrden.map((evento) => {
                          const colores =
                            TIPO_EVENTO_COLORS[evento.tipoEvento] ||
                            TIPO_EVENTO_COLORS.NORMAL;
                          const fecha = new Date(evento.fechaHora);

                          return (
                            <div
                              key={evento.eventoId}
                              className={`bg-white border-l-4 ${colores.border} shadow-sm rounded-r-lg p-3 transition-all hover:shadow-md`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`p-1 rounded-md ${colores.bg} ${colores.text}`}
                                  >
                                    {colores.icon}
                                  </span>
                                  <span
                                    className={`text-xs font-bold uppercase ${colores.text}`}
                                  >
                                    {evento.tipoEvento}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  {evento.generaRetraso && (
                                    <span className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">
                                      <svg
                                        className="w-3 h-3"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" />
                                      </svg>
                                      RETRASO
                                    </span>
                                  )}
                                  <span className="text-[10px] text-gray-400 font-medium">
                                    {fecha.toLocaleTimeString("es-GT", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                              </div>

                              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                                {evento.descripcion}
                              </p>

                              <div className="mt-2 pt-2 border-t border-gray-50 flex justify-end">
                                <span className="text-[10px] text-gray-400 italic">
                                  Registrado el{" "}
                                  {fecha.toLocaleDateString("es-GT", {
                                    day: "numeric",
                                    month: "long",
                                  })}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Constancias de entrega */}
                      {imagenesConstancia.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-sm uppercase tracking-wider text-gray-600">
                              Constancias de Entrega
                            </h4>
                            <span className="text-xs text-gray-400">
                              {imagenesConstancia.length} archivo(s)
                            </span>
                          </div>

                          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                            <p className="text-xs text-gray-500 mb-3">
                              Estas imágenes corresponden a constancias de
                              entrega asociadas a la orden.
                            </p>

                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                              {imagenesConstancia.map((base64, index) => (
                                <div
                                  key={index}
                                  className="relative group flex-shrink-0"
                                >
                                  <img
                                    src={base64}
                                    alt={`Constancia ${index + 1}`}
                                    className="h-24 w-24 object-cover rounded-md border-2 border-gray-100 shadow-sm transition-all group-hover:border-blue-400 cursor-zoom-in"
                                    onClick={() => abrirVisor(base64)}
                                  />
                                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center pointer-events-none">
                                    <svg
                                      className="w-5 h-5 text-white"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M15 12H9m12 0A9 9 0 1112 3a9 9 0 019 9z"
                                      />
                                    </svg>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            },
          )
        )}
      </div>

      {/* Información de datos */}
      <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
        <p>
          Período: {eventos.desde} a {eventos.hasta} | Sede: {eventos.sede} |
          Filtro: {eventos.tipoEvento} | Actualizado:{" "}
          {new Date(eventos.actualizadoEn).toLocaleTimeString("es-ES")}
        </p>
      </div>
    </div>
  );
};

export default EventosOrdenes;
