// src/services/auth/authApi.ts
// Importación de tipos usando "type"
import type { 
  LoginPayload, 
  RegisterPayload, 
  LoginResponse, 
  RegisterResponse,
  MeResponse,
  AuthUser
} from '../api';

// Importación de valores usando import normal
import apiService from '../api';

// Re-exportar tipos para mantener compatibilidad
export type { 
  LoginPayload, 
  RegisterPayload, 
  LoginResponse, 
  RegisterResponse,
  MeResponse,
  AuthUser
};

export async function loginRequest(payload: LoginPayload) {
  console.log('[authApi] loginRequest - email:', payload.email);
  try {
    const response = await apiService.login(payload);
    console.log('[authApi] loginRequest - response.ok:', response.ok);
    console.log('[authApi] loginRequest - response.data:', response.data);
    if (response.data?.user) {
      console.log('[authApi] loginRequest - user.id:', response.data.user.id);
      console.log('[authApi] loginRequest - user.role:', response.data.user.role);
    }
    return {
      ok: response.ok,
      mensaje: response.mensaje,
      data: response.data
    };
  } catch (error) {
    console.error('[authApi] loginRequest error:', error);
    throw error;
  }
}

export async function registerRequest(payload: RegisterPayload) {
  console.log('[authApi] registerRequest - email:', payload.email);
  try {
    const response = await apiService.register(payload);
    console.log('[authApi] registerRequest - response.ok:', response.ok);
    return {
      ok: response.ok,
      mensaje: response.mensaje,
      data: response.data
    };
  } catch (error) {
    console.error('[authApi] registerRequest error:', error);
    throw error;
  }
}

// src/services/auth/authApi.ts
export async function meRequest(token: string) {
  console.log('[authApi] meRequest - calling with token:', token?.substring(0, 30) + '...');
  try {
    const response = await apiService.getMe(token);
    console.log('[authApi] meRequest - response:', response);
    console.log('[authApi] meRequest - response.data.sub:', response.data?.sub);
    console.log('[authApi] meRequest - response.data.email:', response.data?.email);
    console.log('[authApi] meRequest - response.data.role:', response.data?.role);
    return {
      ok: response.ok,
      mensaje: response.mensaje,
      data: response.data
    };
  } catch (error) {
    console.error('[authApi] meRequest error:', error);
    throw error;
  }
}