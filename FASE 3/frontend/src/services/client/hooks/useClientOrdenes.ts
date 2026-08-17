// src/services/client/hooks/useClientOrders.ts
import { useState, useCallback } from "react";
import {
  ClientService,
  type OrdenCliente,
  type ActividadReciente,
} from "../client";
import { apiService } from "../../api";
import type { RutaAutorizada } from "../../api";
type DashboardStats = any;
interface UseClientOrdersReturn {
  loading: boolean;
  error: string | null;
  ordenes: OrdenCliente[];
  rutas: RutaAutorizada[];
  estadisticas: DashboardStats | null;
  actividades: ActividadReciente[];
  cargarDatos: (userId: number) => Promise<void>;
  crearNuevaOrden: (payload: any) => Promise<{ ok: boolean; mensaje?: string }>;
  limpiarError: () => void;
}

export const useClientOrders = (): UseClientOrdersReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ordenes, setOrdenes] = useState<OrdenCliente[]>([]);
  const [rutas, setRutas] = useState<RutaAutorizada[]>([]);
  const [estadisticas, setEstadisticas] = useState<DashboardStats | null>(null);
  const [actividades, setActividades] = useState<ActividadReciente[]>([]);

  const limpiarError = () => setError(null);

  const cargarDatos = useCallback(async (userId: number) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Cargamos datos base (Contratos para stats y Órdenes/Rutas para la vista)
      const [dataOrdenes, dataRutas, dataContratos] = await Promise.all([
        ClientService.obtenerMisOrdenes(userId),
        ClientService.obtenerRutasAutorizadas(userId),
        ClientService.obtenerMisContratos(userId),
      ]);

      setOrdenes(dataOrdenes);
      setRutas(dataRutas);

      // 2. Usamos el ClientService para procesar lógica de negocio
      const stats = ClientService.calcularEstadisticas(
        dataContratos,
        dataOrdenes,
      );
      setEstadisticas(stats);

      const feed = ClientService.generarActividadesRecientes(
        dataContratos,
        dataOrdenes,
      );
      setActividades(feed);
    } catch (err: any) {
      const message =
        err instanceof Error
          ? err.message
          : "Error al cargar información de órdenes";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const crearNuevaOrden = async (payload: any) => {
    setLoading(true);
    try {
      // Usamos el apiService directamente para la acción de POST
      const res = await apiService.crearOrden(payload);

      if (res.ok) {
        // Recargamos datos para refrescar stats y lista tras la creación
        await cargarDatos(payload.cliente_id);
      }

      return { ok: res.ok, mensaje: res.mensaje };
    } catch (err: any) {
      setError(err.message || "No se pudo crear la orden");
      return { ok: false, mensaje: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    ordenes,
    rutas,
    estadisticas,
    actividades,
    cargarDatos,
    crearNuevaOrden,
    limpiarError,
  };
};
