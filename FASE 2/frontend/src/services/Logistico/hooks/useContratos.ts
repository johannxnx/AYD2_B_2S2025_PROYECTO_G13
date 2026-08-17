// src/services/Logistico/hooks/useContratos.ts
import { useState, useCallback, useEffect } from 'react';
import { ContratoService } from '../Logistico';
import type { ContratoConDetalles, ResumenValidacion } from '../Logistico';
import type { Contrato, CrearContratoPayload, Tarifario, RangosReferencia } from '../../api';

interface UseContratosReturn {
  loading: boolean;
  error: string | null;
  contratos: Contrato[];
  todosContratos: Contrato[];  // NUEVO - Agregado
  contratoActual: ContratoConDetalles | null;
  validacionActual: ResumenValidacion | null;
  tarifarios: Tarifario[];
  rangosReferencia: RangosReferencia | null;
  loadingTarifarios: boolean;
  
  crearContrato: (payload: CrearContratoPayload) => Promise<Contrato | null>;
  obtenerContrato: (id: number) => Promise<ContratoConDetalles | null>;
  listarContratosCliente: (clienteId: number) => Promise<Contrato[]>;
  listarTodosContratos: (params?: { limit?: number; estado?: string }) => Promise<Contrato[]>; // NUEVO
  validarServicio: (clienteId: number, origen: string, destino: string, tipoUnidad: string) => Promise<ResumenValidacion | null>;
  agregarDescuento: (contratoId: number, tipoUnidad: string, porcentaje: number, observacion?: string) => Promise<any>;
  agregarRuta: (contratoId: number, origen: string, destino: string, distanciaKm?: number, tipoCarga?: string) => Promise<any>;
  cargarTarifarios: () => Promise<Tarifario[]>;
  cargarRangosReferencia: () => Promise<RangosReferencia | null>;
  
  limpiarError: () => void;
  limpiarValidacion: () => void;
}

export const useContratos = (): UseContratosReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [todosContratos, setTodosContratos] = useState<Contrato[]>([]); // NUEVO
  const [contratoActual, setContratoActual] = useState<ContratoConDetalles | null>(null);
  const [validacionActual, setValidacionActual] = useState<ResumenValidacion | null>(null);
  const [tarifarios, setTarifarios] = useState<Tarifario[]>([]);
  const [rangosReferencia, setRangosReferencia] = useState<RangosReferencia | null>(null);
  const [loadingTarifarios, setLoadingTarifarios] = useState(false);

  const handleError = (err: unknown) => {
    const message = err instanceof Error ? err.message : 'Error en la operación';
    setError(message);
    return null;
  };

  const limpiarError = () => setError(null);
  const limpiarValidacion = () => setValidacionActual(null);

  const cargarTarifarios = useCallback(async (): Promise<Tarifario[]> => {
    setLoadingTarifarios(true);
    try {
      const lista = await ContratoService.obtenerTarifarios();
      setTarifarios(lista);
      return lista;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar tarifarios';
      setError(message);
      return [];
    } finally {
      setLoadingTarifarios(false);
    }
  }, []);

  const cargarRangosReferencia = useCallback(async (): Promise<RangosReferencia | null> => {
    setLoadingTarifarios(true);
    try {
      const rangos = await ContratoService.obtenerRangosReferencia();
      setRangosReferencia(rangos);
      return rangos;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar rangos de referencia';
      setError(message);
      return null;
    } finally {
      setLoadingTarifarios(false);
    }
  }, []);

  const crearContrato = useCallback(async (payload: CrearContratoPayload): Promise<Contrato | null> => {
    setLoading(true);
    setError(null);
    try {
      const contrato = await ContratoService.crear(payload);
      return contrato;
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const obtenerContrato = useCallback(async (id: number): Promise<ContratoConDetalles | null> => {
    setLoading(true);
    setError(null);
    try {
      const contrato = await ContratoService.obtener(id);
      setContratoActual(contrato);
      return contrato;
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const listarContratosCliente = useCallback(async (clienteId: number): Promise<Contrato[]> => {
    setLoading(true);
    setError(null);
    try {
      const lista = await ContratoService.listarPorCliente(clienteId);
      setContratos(lista);
      return lista;
    } catch (err) {
      return handleError(err) as unknown as Contrato[];
    } finally {
      setLoading(false);
    }
  }, []);

  const listarTodosContratos = useCallback(async (params?: { limit?: number; estado?: string }): Promise<Contrato[]> => {
    setLoading(true);
    setError(null);
    try {
      const lista = await ContratoService.listarTodos(params);
      setTodosContratos(lista);
      return lista;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al listar contratos';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const validarServicio = useCallback(async (
    clienteId: number,
    origen: string,
    destino: string,
    tipoUnidad: string
  ): Promise<ResumenValidacion | null> => {
    setLoading(true);
    setError(null);
    try {
      const validacion = await ContratoService.validarServicio(clienteId, origen, destino, tipoUnidad);
      setValidacionActual(validacion);
      return validacion;
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const agregarDescuento = useCallback(async (
    contratoId: number,
    tipoUnidad: string,
    porcentaje: number,
    observacion?: string
  ): Promise<any> => {
    setLoading(true);
    setError(null);
    try {
      const resultado = await ContratoService.agregarDescuento(contratoId, {
        tipo_unidad: tipoUnidad,
        porcentaje_descuento: porcentaje,
        observacion
      });
      return resultado;
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const agregarRuta = useCallback(async (
    contratoId: number,
    origen: string,
    destino: string,
    distanciaKm?: number,
    tipoCarga?: string
  ): Promise<any> => {
    setLoading(true);
    setError(null);
    try {
      const resultado = await ContratoService.agregarRuta(contratoId, {
        origen,
        destino,
        distancia_km: distanciaKm,
        tipo_carga: tipoCarga
      });
      return resultado;
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar tarifarios al montar el hook
  useEffect(() => {
    cargarTarifarios();
    cargarRangosReferencia();
  }, []);

  return {
    loading,
    error,
    contratos,
    todosContratos, // NUEVO
    contratoActual,
    validacionActual,
    tarifarios,
    rangosReferencia,
    loadingTarifarios,
    crearContrato,
    obtenerContrato,
    listarContratosCliente,
    listarTodosContratos, // NUEVO
    validarServicio,
    agregarDescuento,
    agregarRuta,
    cargarTarifarios,
    cargarRangosReferencia,
    limpiarError,
    limpiarValidacion
  };
};

export default useContratos;