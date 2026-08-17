// src/services/api.ts
const viteEnv = (import.meta as ImportMeta & { env?: { VITE_API_URL?: string } }).env;
const API_BASE_URL = viteEnv?.VITE_API_URL || "http://localhost:3001/api";

// Tipos exportados con "export type"
export type ApiResponse<T = any> = {
  ok: boolean;
  mensaje: string;
  data: T;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  nit: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
  nombres?: string;
  apellidos?: string;
  telefono?: string;
};

export type AuthUser = {
  id?: number;
  email: string;
  role: string;
  nombres?: string;
  apellidos?: string;
  empresa?: string;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export type RegisterResponse = {
  id: number;
  email: string;
  role: string;
};

export type MeResponse = {
  sub?: string;
  email?: string;
  role?: string;
  nombres?: string;
  apellidos?: string;
};

// Tipos para Contratos
export type TarifaNegociada = {
  tarifario_id: number;
  costo_km_negociado: number;
  tipo_unidad?: string;
};

export type RutaAutorizada = {
  origen: string;
  destino: string;
  distancia_km?: number;
  tipo_carga?: string;
};

export type DescuentoContrato = {
  tipo_unidad: string;
  porcentaje_descuento: number;
  observacion?: string;
};

export type CrearContratoPayload = {
  numero_contrato: string;
  cliente_id: number;
  fecha_inicio: string;
  fecha_fin: string;
  limite_credito: number;
  plazo_pago: number;
  tarifas: TarifaNegociada[];
  rutas: RutaAutorizada[];
};



export type Tarifario = {
  id: number;
  tipo_unidad: string;  // LIGERA, PESADA, CABEZAL
  limite_peso_ton: number;
  costo_base_km: number;
  activo: boolean;
  fecha_actualizacion?: string;
  actualizado_por_nombre?: string;
};

export type RangoReferencia = {
  limite_peso_ton: number;
  costo_base_km: number;
};

export type RangosReferencia = {
  LIGERA: RangoReferencia;
  PESADA: RangoReferencia;
  CABEZAL: RangoReferencia;
};

export type Contrato = {
  id: number;
  numero_contrato: string;
  cliente_id: number;
  cliente_nombre?: string;
  cliente_nit?: string;
  fecha_inicio: string;
  fecha_fin: string;
  limite_credito: number;
  saldo_usado: number;
  plazo_pago: number;
  estado: string;
  fecha_creacion: string;
  creado_por_nombre?: string;
  modificado_por_nombre?: string;
};

export type ValidacionCliente = {
  valido: boolean;
  contrato?: Contrato;
  mensaje?: string;
  tarifa_negociada?: {
    costo_km_negociado: number;
    tipo_unidad: string;
  };
  descuento?: {
    porcentaje_descuento: number;
  };
};

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async request<T>(endpoint: string, options: RequestInit): Promise<ApiResponse<T>> {
    const token = this.getToken();
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(options.headers || {}),
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.mensaje || "Error en la solicitud");
    }

    return data as ApiResponse<T>;
  }

  async login(payload: LoginPayload): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async register(payload: RegisterPayload): Promise<ApiResponse<RegisterResponse>> {
    return this.request<RegisterResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }


async getMe(token: string): Promise<ApiResponse<MeResponse>> {
  console.log('[apiService] getMe called with token:', token?.substring(0, 30) + '...');
  const response = await this.request<MeResponse>("/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  console.log('[apiService] getMe response:', response);
  console.log('[apiService] getMe response.data.sub:', response.data?.sub);
  return response;
}

  // metodos relacionados a contratos
  
  /**
   * Crear un nuevo contrato
   */
  async crearContrato(payload: CrearContratoPayload): Promise<ApiResponse<Contrato>> {
    return this.request<Contrato>("/contratos", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  /**
   * Obtener un contrato por ID
   */
  async obtenerContrato(id: number): Promise<ApiResponse<Contrato>> {
    return this.request<Contrato>(`/contratos/${id}`, {
      method: "GET",
    });
  }

  /**
   * Listar contratos de un cliente
   */
  async listarContratosPorCliente(clienteId: number): Promise<ApiResponse<Contrato[]>> {
    return this.request<Contrato[]>(`/contratos/cliente/${clienteId}`, {
      method: "GET",
    });
  }

  /**
   * Modificar un contrato
   */
  async modificarContrato(id: number, payload: Partial<CrearContratoPayload>): Promise<ApiResponse<Contrato>> {
    return this.request<Contrato>(`/contratos/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  /**
   * Validar si un cliente puede realizar una ruta
   */

async validarCliente(
  clienteId: number,
  params: { origen: string; destino: string; tipo_unidad: string }
): Promise<ApiResponse<ValidacionCliente>> {
  const queryParams = new URLSearchParams({
    origen: params.origen,
    destino: params.destino,
    tipo_unidad: params.tipo_unidad,
  }).toString();
  
  return this.request<ValidacionCliente>(`/contratos/validar/${clienteId}?${queryParams}`, {
    method: "GET",
  });
}

  /**
   * Agregar descuento a un contrato
   */
  async agregarDescuento(
    contratoId: number,
    payload: DescuentoContrato
  ): Promise<ApiResponse<any>> {
    return this.request<any>(`/contratos/${contratoId}/descuentos`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }


async obtenerTarifarios(): Promise<ApiResponse<Tarifario[]>> {
  return this.request<Tarifario[]>("/tarifario", {
    method: "GET",
  });
}

async obtenerRangosReferencia(): Promise<ApiResponse<RangosReferencia>> {
  return this.request<RangosReferencia>("/tarifario/referencia", {
    method: "GET",
  });
}


/**
 * Listar todos los contratos (para vista de logística)
 */
async listarTodosContratos(params?: { limit?: number; estado?: string }): Promise<ApiResponse<Contrato[]>> {
  let url = "/contratos";
  if (params) {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.estado) queryParams.append('estado', params.estado);
    if (queryParams.toString()) url += `?${queryParams.toString()}`;
  }
  return this.request<Contrato[]>(url, {
    method: "GET",
  });
}




  /**
   * Agregar ruta autorizada a un contrato
   */
  async agregarRuta(
    contratoId: number,
    payload: RutaAutorizada
  ): Promise<ApiResponse<any>> {
    return this.request<any>(`/contratos/${contratoId}/rutas`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  getCurrentUser(): AuthUser | null {
    const rawUser = localStorage.getItem('authUser');
    if (!rawUser) return null;
    try {
      return JSON.parse(rawUser) as AuthUser;
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }
}

export const apiService = new ApiService();
export default apiService;