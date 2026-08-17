// src/services/api.ts

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export { API_BASE_URL };

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
  pais?: string;
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
  moneda_id?: number; // 1=GTQ, 2=USD, 6=HNL, 7=SVC
  tarifas: TarifaNegociada[];
  rutas: RutaAutorizada[];
};

export type Tarifario = {
  id: number;
  tipo_unidad: string;
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
  moneda_id: number; // 1=GTQ, 2=USD, 6=HNL, 7=SVC
  nombre_moneda?: string;
  simbolo_moneda?: string;
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

// Agrega estos tipos a tu archivo de api.ts
export type Orden = {
  id: number;
  numero_orden: string;
  origen: string;
  destino: string;
  tipo_mercancia: string;
  peso_estimado: number;
  peso_real?: number;
  costo: number;
  estado: string;
  tiempo_estimado?: number;
  fecha_despacho?: string;
  fecha_entrega?: string;
};

export type CrearOrdenPayload = {
  cliente_id: number;
  contrato_id: number;
  origen: string;
  destino: string;
  tipo_mercancia: string;
  peso_estimado: number;
  costo: number;
  creado_por: number;
};

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  // Método público para obtener la base URL
  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public async request<T>(
    endpoint: string,
    options: RequestInit,
  ): Promise<ApiResponse<T>> {
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

  async register(
    payload: RegisterPayload,
  ): Promise<ApiResponse<RegisterResponse>> {
    return this.request<RegisterResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getMe(token: string): Promise<ApiResponse<MeResponse>> {
    console.log(
      "[apiService] getMe called with token:",
      token?.substring(0, 30) + "...",
    );
    const response = await this.request<MeResponse>("/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("[apiService] getMe response:", response);
    console.log("[apiService] getMe response.data.sub:", response.data?.sub);
    return response;
  }

  // ============ MÉTODOS DE CONTRATOS ============

  async crearContrato(
    payload: CrearContratoPayload,
  ): Promise<ApiResponse<Contrato>> {
    return this.request<Contrato>("/contratos", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async obtenerContrato(id: number): Promise<ApiResponse<Contrato>> {
    return this.request<Contrato>(`/contratos/${id}`, {
      method: "GET",
    });
  }

  async listarContratosPorCliente(
    clienteId: number,
  ): Promise<ApiResponse<Contrato[]>> {
    return this.request<Contrato[]>(`/contratos/cliente/${clienteId}`, {
      method: "GET",
    });
  }

  async modificarContrato(
    id: number,
    payload: Partial<CrearContratoPayload>,
  ): Promise<ApiResponse<Contrato>> {
    return this.request<Contrato>(`/contratos/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async validarCliente(
    clienteId: number,
    params: { origen: string; destino: string; tipo_unidad: string },
  ): Promise<ApiResponse<ValidacionCliente>> {
    const queryParams = new URLSearchParams({
      origen: params.origen,
      destino: params.destino,
      tipo_unidad: params.tipo_unidad,
    }).toString();

    return this.request<ValidacionCliente>(
      `/contratos/validar/${clienteId}?${queryParams}`,
      {
        method: "GET",
      },
    );
  }

  async agregarDescuento(
    contratoId: number,
    payload: DescuentoContrato,
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

  async listarTodosContratos(params?: {
    limit?: number;
    estado?: string;
  }): Promise<ApiResponse<Contrato[]>> {
    let url = "/contratos";
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.limit) queryParams.append("limit", params.limit.toString());
      if (params.estado) queryParams.append("estado", params.estado);
      if (queryParams.toString()) url += `?${queryParams.toString()}`;
    }
    return this.request<Contrato[]>(url, {
      method: "GET",
    });
  }

  async obtenerProxNumeroContrato(): Promise<
    ApiResponse<{ numero_contrato: string }>
  > {
    return this.request<{ numero_contrato: string }>(
      "/contratos/obtener-numero-proximo",
      {
        method: "GET",
      },
    );
  }

  async agregarRuta(
    contratoId: number,
    payload: RutaAutorizada,
  ): Promise<ApiResponse<any>> {
    return this.request<any>(`/contratos/${contratoId}/rutas`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
  // ============ MÉTODOS DE USUARIOS ============

  async listarUsuarios(params?: {
    tipo_usuario?: string;
    estado?: string;
    nombre?: string;
  }): Promise<ApiResponse<any[]>> {
    let url = "/usuarios";
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.tipo_usuario) queryParams.append("tipo_usuario", params.tipo_usuario);
      if (params.estado) queryParams.append("estado", params.estado);
      if (params.nombre) queryParams.append("nombre", params.nombre);
      if (queryParams.toString()) url += `?${queryParams.toString()}`;
    }
    return this.request<any[]>(url, {
      method: "GET",
    });
  }

  async obtenerUsuario(id: number): Promise<ApiResponse<any>> {
    return this.request<any>(`/usuarios/${id}`, {
      method: "GET",
    });
  }

  async actualizarUsuario(
    id: number,
    payload: Partial<{
      nombre: string;
      email: string;
      telefono: string;
      pais: string;
    }>,
  ): Promise<ApiResponse<any>> {
    return this.request<any>(`/usuarios/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  // ============ MÉTODOS DE ÓRDENES ============

  async listarOrdenesPorUsuario(
    usuarioId: number,
  ): Promise<ApiResponse<Orden[]>> {
    // Nota: Asegúrate si el endpoint es /orden o /ordenes según tu backend
    return this.request<Orden[]>(`/orden/usuario/${usuarioId}`, {
      method: "GET",
    });
  }

  async obtenerRutasAutorizadas(
    usuarioId: number,
  ): Promise<ApiResponse<RutaAutorizada[]>> {
    return this.request<RutaAutorizada[]>(
      `/orden/rutasAutorizada/${usuarioId}`,
      {
        method: "GET",
      },
    );
  }

  async crearOrden(payload: CrearOrdenPayload): Promise<ApiResponse<Orden>> {
    return this.request<Orden>("/orden", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  getToken(): string | null {
    return localStorage.getItem("authToken");
  }

  getCurrentUser(): AuthUser | null {
    const rawUser = localStorage.getItem("authUser");
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
