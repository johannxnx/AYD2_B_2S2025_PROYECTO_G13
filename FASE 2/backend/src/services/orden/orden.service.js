"use strict";
const ordenStore = require("../../models/orden/orden.store");

async function generarOrden(payload) {
  const ctx = await ordenStore.obtenerContextoValidacion(
    payload.cliente_id,
    payload.origen,
    payload.destino,
    payload.peso_estimado,
  );

  if (!ctx.contrato) throw crearError("Contrato no vigente o bloqueado", 403);
  if (ctx.facturasVencidas > 0)
    throw crearError("Tiene facturas vencidas", 403);
  if (!ctx.ruta) throw crearError("Ruta no autorizada por contrato", 403);
  if (!ctx.tarifa) throw crearError("Peso excede capacidad de unidades", 403);

  const costoTotal = ctx.ruta.distancia_km * ctx.tarifa.costo_km;

  if (ctx.contrato.saldo_usado + costoTotal > ctx.contrato.limite_credito) {
    throw crearError("Crédito insuficiente", 403);
  }

  const nuevaOrden = await ordenStore.insertarOrden({
    ...payload,
    contrato_id: ctx.contrato.id,
    costo: costoTotal,
  });

  return { mensaje: "Orden registrada exitosamente", data: nuevaOrden };
}

function crearError(msg, code) {
  const e = new Error(msg);
  e.statusCode = code;
  return e;
}

async function optenerOrden() {
  const ordenes = await ordenStore.obtenerOrdenes();
  return {
    mensaje: "Obtención de ordenes exitosa",
    data: ordenes,
  };
}

async function optenerOrdenPendiente() {
  const ordenes = await ordenStore.optenerOrdenPendiente();
  return {
    mensaje: "Obtención de ordenes exitosa",
    data: ordenes,
  };
}

async function optenerOrdenPlanificada() {
  const ordenes = await ordenStore.optenerOrdenPlanificada();
  return {
    mensaje: "Obtención de ordenes exitosa",
    data: ordenes,
  };
}

async function optenerOrdenPiloto(id_piloto) {
  const ordenes = await ordenStore.optenerOrdenPiloto(id_piloto);
  return {
    mensaje: "Obtención de ordenes exitosa",
    data: ordenes,
  };
}

async function optenerOrdenUsuario(id_usuario) {
  const ordenes = await ordenStore.optenerOrdenUsuario(id_usuario);
  return {
    mensaje: "Obtención de ordenes exitosa",
    data: ordenes,
  };
}

async function asignarRecursos(ordenId, payload) {
  const vehiculo = await ordenStore.vehiculoApto(
    payload.vehiculo_id,
    payload.peso_estimado,
  );
  if (!vehiculo) {
    const error = new Error(
      "El vehículo no se encuentra apto o no tiene capacidad",
    );
    error.statusCode = 403;
    throw error;
  }

  const piloto = await ordenStore.conductorApto(payload.piloto_id);
  if (!piloto) {
    const error = new Error("El conductor no se encuentra apto");
    error.statusCode = 403;
    throw error;
  }

  const resultado = await ordenStore.actualizarAsignacion(ordenId, payload);

  return {
    mensaje: "Asignación de recursos exitosa.",
    data: resultado,
  };
}

async function getVehiculos() {
  const vehiculos = await ordenStore.getVehiculos();
  return {
    mensaje: "Obtención de ordenes exitosa",
    data: vehiculos,
  };
}

async function getPilotos() {
  const pilotos = await ordenStore.getPilotos();
  return {
    mensaje: "Obtención de ordenes exitosa",
    data: pilotos,
  };
}

async function registrarSalidaPatio(id, payload) {
  try {
    if (!payload.asegurada || !payload.estibada) {
      const error = new Error("La carga debe estar asegurada y estibada.");
      error.statusCode = 403;
      throw error;
    }

    if (!payload.peso_real || payload.peso_real <= 0) {
      const error = new Error("Debe ingresar un peso real válido.");
      error.statusCode = 400;
      throw error;
    }

    const ordenActualizada = await ordenStore.formalizarSalidaPatio(
      id,
      payload,
    );

    return {
      mensaje: "Salida de patio formalizada. Unidad en tránsito.",
      data: ordenActualizada,
    };
  } catch (error) {
    console.error("Error en el Service de salida de patio:", error.message);
    throw error;
  }
}

async function actualizarRutaTransito(ordenId) {
  const actualizacion = await ordenStore.actualizarRutaTransito(ordenId);
  return {
    mensaje: "Actualizacion Exitosa",
    data: actualizacion,
  };
}

async function eventosTransito(payload) {
  try {
    // Llamamos al store con el nombre correcto
    const nuevoEvento = await ordenStore.registrarEventoBitacora(payload);

    // Retornamos solo el objeto de datos
    return {
      mensaje: "Evento registrado en bitácora correctamente.",
      data: nuevoEvento,
    };
  } catch (error) {
    console.error("Error en el Service de eventos:", error);
    // Re-lanzamos el error para que lo capture el catch del Controller
    throw error;
  }
}

async function finalizarRuta(id, rutasArchivos) {
  const result = await ordenStore.finalizarEntrega(id, rutasArchivos);
  return result;
}

module.exports = {
  generarOrden,
  optenerOrden,
  asignarRecursos,
  getVehiculos,
  getPilotos,
  registrarSalidaPatio,
  actualizarRutaTransito,
  eventosTransito,
  finalizarRuta,
  optenerOrdenPendiente,
  optenerOrdenPlanificada,
  optenerOrdenPiloto,
  optenerOrdenUsuario,
};
