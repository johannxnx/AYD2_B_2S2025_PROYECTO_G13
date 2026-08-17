// FASE 3/frontend/src/services/facturacion/socketFacturacion.ts
import { io, Socket } from "socket.io-client";

// Asegúrate de que en tu .env del frontend esté:
// VITE_API_URL=http://localhost:3001
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? "http://localhost:3001";

let socket: Socket | null = null;

export interface NuevoBorradorPayload {
  tipo: "NUEVO_BORRADOR";
  borrador: BorradorWS;
  mensaje: string;
  timestamp: string;
}

// Tipo explícito que coincide exactamente con lo que emite el backend
export interface BorradorWS {
  id: number;
  numero_factura: string;
  estado: string;
  nombre_cliente_facturacion: string;
  cliente_nombre: string; // ← agregado (ver corrección del backend)
  nit_cliente: string;
  subtotal: number;
  iva: number;
  total_factura: number;
  fecha_emision: string;
  orden_id: number;
}

export const conectarSocketFacturacion = (
  onNuevoBorrador: (data: NuevoBorradorPayload) => void,
): (() => void) => {
  // Evitar sockets duplicados si el componente re-renderiza
  if (socket?.connected) {
    console.log("[WS] Ya hay un socket activo, reutilizando.");
    return () => {};
  }

  socket = io(SOCKET_URL, {
    transports: ["websocket", "polling"], // polling como fallback por si websocket falla
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on("join_confirmado", (data: { sala: string }) => {
    console.log(`[WS] Confirmado en sala: ${data.sala}`);
  });

  socket.on("connect", () => {
    console.log(`[WS] Conectado — socket id: ${socket?.id}`);
    // join_room DENTRO del evento connect garantiza que el socket ya existe
    socket?.emit("join_room", "AGENTE_FINANCIERO");
  });

  socket.on("connect_error", (err) => {
    console.error("[WS] Error de conexión:", err.message);
  });

  socket.on("nuevo_borrador", (data: NuevoBorradorPayload) => {
    console.log("[WS] nuevo_borrador recibido:", data);
    onNuevoBorrador(data);
  });

  socket.on("disconnect", (reason) => {
    console.log("[WS] Desconectado. Razón:", reason);
  });

  return () => {
    socket?.disconnect();
    socket = null;
  };
};
