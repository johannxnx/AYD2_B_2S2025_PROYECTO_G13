import { useState, useCallback } from 'react';
import apiService from '../../api';

/**
 * Resultado de validación de cliente
 * Indica si el cliente puede hacer transporte y por qué en caso contrario
 */
export interface ValidacionResultado {
  habilitado: boolean;
  motivo?: string;
  cliente?: {
    id: number;
    nombre: string;
    estado: string;
    tipo_usuario: string;
  };
  contrato?: {
    id: number;
    numero_contrato: string;
    fecha_fin: string;
    limite_credito: number;
    saldo_usado: number;
    saldo_disponible: number;
    plazo_pago: number;
    moneda_id?: number;
    nombre_moneda?: string;
    simbolo_moneda?: string;
  };
  contratos_resumen?: {
    total_limite_credito: number;
    total_saldo_usado: number;
    total_saldo_disponible: number;
    cantidad_contratos: number;
    contratos: Array<{
      numero_contrato: string;
      limite_credito: number;
      saldo_usado: number;
      saldo_disponible: number;
      fecha_fin?: string;
      plazo_pago?: number;
      moneda_id?: number;
      nombre_moneda?: string;
      simbolo_moneda?: string;
    }>;
  };
  tarifa?: {
    tipo_unidad: string;
    costo_km_negociado: number;
    limite_peso_ton: number;
  };
  descuento?: {
    porcentaje_descuento: number;
  };
  facturas_pendientes?: Array<{
    id: number;
    numero_factura: string;
    total_factura: number;
  }>;
  cuentas_vencidas?: Array<{
    id: number;
    monto_original: number;
    saldo_pendiente: number;
    fecha_vencimiento: string;
  }>;
  contratos_resumen_bloqueado?: Array<{
    numero_contrato: string;
    limite_credito: number;
    saldo_usado: number;
  }>;
}

interface UseValidarClienteReturn {
  loading: boolean;
  error: string | null;
  validacion: ValidacionResultado | null;
  validarCliente: (
    cliente_id: number,
    origen?: string,
    destino?: string,
    tipo_unidad?: string
  ) => Promise<ValidacionResultado | null>;
  limpiarError: () => void;
  limpiarValidacion: () => void;
}

/**
 * Hook para validar si un cliente puede hacer una orden (Bloqueo Automático)
 * Consulta el endpoint GET /api/contratos/validar/:cliente_id
 * 
 * @returns {UseValidarClienteReturn} Estado de validación y función para validar
 * 
 * @example
 * const { validarCliente, validacion, loading, error } = useValidarCliente();
 * 
 * // Validar cliente sin especificar ruta
 * await validarCliente(5);
 * 
 * // Validar cliente con ruta y tipo de unidad
 * await validarCliente(5, 'Guatemala', 'Antigua', 'PESADA');
 * 
 * if (validacion?.habilitado) {
 *   // Cliente puede crear orden
 * } else {
 *   // Cliente está bloqueado - mostrar motivo
 *   console.log(validacion?.motivo);
 * }
 */
export const useValidarCliente = (): UseValidarClienteReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validacion, setValidacion] = useState<ValidacionResultado | null>(null);

  const handleError = (err: unknown) => {
    const message = err instanceof Error ? err.message : 'Error en la validación';
    setError(message);
    return null;
  };

  const limpiarError = () => setError(null);
  const limpiarValidacion = () => setValidacion(null);

  const validarCliente = useCallback(
    async (
      cliente_id: number,
      origen?: string,
      destino?: string,
      tipo_unidad?: string
    ): Promise<ValidacionResultado | null> => {
      setLoading(true);
      setError(null);
      setValidacion(null);

      try {
        // Construir query string
        const params = new URLSearchParams();
        if (origen) params.append('origen', origen);
        if (destino) params.append('destino', destino);
        if (tipo_unidad) params.append('tipo_unidad', tipo_unidad);

        const queryString = params.toString() ? `?${params.toString()}` : '';

        const response = await (apiService as any).request(
          `/contratos/validar/${cliente_id}${queryString}`,
          { method: 'GET' }
        );

        if (response.ok && response.data) {
          setValidacion(response.data);
          return response.data;
        } else {
          return handleError(response.error || 'No se pudo validar el cliente');
        }
      } catch (err) {
        return handleError(err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    validacion,
    validarCliente,
    limpiarError,
    limpiarValidacion,
  };
};
