import { useState, useCallback } from 'react';
import apiService from '../../api';

// Tipos para clientes
export type Cliente = {
  id: number;
  nit: string;
  email: string;
  nombre: string;
  telefono?: string;
  pais?: string;
  tipo_usuario: string;
  estado: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
};

export type ClienteDetalle = Cliente & {
  contratos_activos?: number;
  credito_disponible?: number;
  credito_usado?: number;
  ultimo_pedido?: string;
};

interface UseClientesReturn {
  loading: boolean;
  error:string | null;
  clientes: Cliente[];
  clienteActual: ClienteDetalle | null;
  listarClientes: (filtros?: { tipo_usuario?: string; estado?: string; nombre?: string }) => Promise<Cliente[]>;
  obtenerCliente: (id: number) => Promise<ClienteDetalle | null>;
  modificarCliente: (id: number, datos: Partial<Cliente>) => Promise<ClienteDetalle | null>;
  crearCliente: (datos: Partial<Cliente>) => Promise<ClienteDetalle | null>;
  cambiarEstadoCliente: (id: number, estado: string, motivo: string) => Promise<any>;
  limpiarError: () => void;
  limpiarClienteActual: () => void;
}

export const useClientes = (): UseClientesReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteActual, setClienteActual] = useState<ClienteDetalle | null>(null);

  const handleError = (err: unknown) => {
    let message = 'Error en la operación';
    
    if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === 'object' && err !== null) {
      const errorObj = err as any;
      if (errorObj.mensaje) {
        message = errorObj.mensaje;
        if (errorObj.detalles && Array.isArray(errorObj.detalles)) {
          message += '\n' + errorObj.detalles.join('\n');
        }
      }
    }
    
    setError(message);
    return null;
  };

  const limpiarError = () => setError(null);
  const limpiarClienteActual = () => setClienteActual(null);

  const listarClientes = useCallback(async (filtros?: { 
    tipo_usuario?: string; 
    estado?: string; 
    nombre?: string 
  }): Promise<Cliente[]> => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (filtros?.tipo_usuario) queryParams.append('tipo_usuario', filtros.tipo_usuario);
      if (filtros?.estado) queryParams.append('estado', filtros.estado);
      if (filtros?.nombre) queryParams.append('nombre', filtros.nombre);

      const url = `/usuarios${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await apiService.request<Cliente[]>(url, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(response.mensaje || 'Error al listar clientes');
      }

      setClientes(response.data as Cliente[]);
      return response.data as Cliente[];
    } catch (err) {
      handleError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const obtenerCliente = useCallback(async (id: number): Promise<ClienteDetalle | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.request<ClienteDetalle>(`/usuarios/${id}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(response.mensaje || 'Error al obtener cliente');
      }

      setClienteActual(response.data as ClienteDetalle);
      return response.data as ClienteDetalle;
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const modificarCliente = useCallback(async (id: number, datos: Partial<Cliente>): Promise<ClienteDetalle | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.request<ClienteDetalle>(`/usuarios/${id}`, {
        method: 'PUT',
        body: JSON.stringify(datos),
      });

      if (!response.ok) {
        throw new Error(response.mensaje || 'Error al modificar cliente');
      }

      const clienteModificado = response.data as ClienteDetalle;
      setClienteActual(clienteModificado);
      
      // Actualizar en la lista
      setClientes(prev => prev.map(c => c.id === id ? clienteModificado : c));
      
      return clienteModificado;
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const cambiarEstadoCliente = useCallback(async (id: number, estado: string, motivo: string): Promise<any> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.request<any>(`/usuarios/${id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado, motivo }),
      });

      if (!response.ok) {
        throw new Error(response.mensaje || 'Error al cambiar estado');
      }

      // Actualizar en la lista
      setClientes(prev => prev.map(c => c.id === id ? { ...c, estado } : c));
      if (clienteActual?.id === id) {
        setClienteActual({ ...clienteActual, estado });
      }

      return response.data;
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [clienteActual]);

  const crearCliente = useCallback(async (datos: Partial<Cliente>): Promise<ClienteDetalle | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.request<ClienteDetalle>(`/usuarios`, {
        method: 'POST',
        body: JSON.stringify(datos),
      });

      if (!response.ok) {
        // Preservar el mensaje del servidor en el error
        const error = new Error(response.mensaje || 'Error al crear cliente');
        (error as any).mensaje = response.mensaje;
        throw error;
      }

      const nuevoCliente = response.data as ClienteDetalle;
      
      // Agregar a la lista
      setClientes(prev => [...prev, nuevoCliente]);
      
      return nuevoCliente;
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  }, []);



  return {
    loading,
    error,
    clientes,
    clienteActual,
    listarClientes,
    obtenerCliente,
    modificarCliente,
    crearCliente,
    cambiarEstadoCliente,
    limpiarError,
    limpiarClienteActual,
  };
};
