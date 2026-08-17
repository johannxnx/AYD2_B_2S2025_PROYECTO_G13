/**
 * @file Facturacion.js  (services/facturacion/Facturacion.js)
 *
 * CORRECCIONES aplicadas:
 *
 *   1. generarBorrador: ahora acepta órdenes en estado "CERRADA" además de
 *      "ENTREGADA", porque tu módulo de órdenes cierra la orden con estado
 *      "CERRADA" directamente (ver orden.store.js → finalizarEntrega).
 *
 *   2. validarFactura: el segundo parámetro era `validado_por` (ID del usuario
 *      del JWT). El bug era que en el controlador se leía `req.user.id` pero
 *      algunos payloads de JWT usan `sub` u otro campo. Se añade un fallback
 *      en el CONTROLADOR (ver facturacionController.js). Aquí el servicio ya
 *      recibe el número limpio, así que no necesita cambio lógico, pero se
 *      añade una guarda defensiva.
 *
 *   3. certificarFactura: guarda defensiva por si facturaCert es undefined
 *      (significa que la factura no estaba en VALIDADA), con mensaje claro.
 */

"use strict";

const FacturaFEL = require("../../models/facturacion/FacturaFel");
const { certificarFEL, validarBorrador } = require("./fel_simulacion");
const Contrato = require("../../models/contratos/Contrato");
const {
  notificarCorrecto,
  notificarInformativo,
} = require("../../utils/mailer");

/* ── Utilidades ─────────────────────────────────────── */

function generarNumeroFactura() {
  const fecha     = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const aleatorio = Math.floor(Math.random() * 90000) + 10000;
  return `F-${fecha}-${aleatorio}`;
}

function r2(valor) {
  return Math.round(valor * 100) / 100;
}

/* ═══════════════════════════════════════════════════════
   1. GENERAR BORRADOR (CDU003.1)
   ═══════════════════════════════════════════════════════ */
// Solo la función generarBorrador cambia. El resto del servicio queda igual.

async function generarBorrador(orden_id, usuario_id, io = null) {
  const datos = await FacturaFEL.obtenerDatosParaBorrador(orden_id);

  if (!datos) {
    throw Object.assign(
      new Error(`Orden ${orden_id} no encontrada o le faltan datos.`),
      { status: 404 }
    );
  }

  const estadosPermitidos = ["ENTREGADA", "CERRADA"];
  if (!estadosPermitidos.includes(datos.estado_orden)) {
    throw Object.assign(
      new Error(
        `La orden ${orden_id} debe estar en estado ENTREGADA o CERRADA. ` +
        `Estado actual: ${datos.estado_orden}`
      ),
      { status: 422 }
    );
  }

  const facturaExistente = await FacturaFEL.buscarPorOrden(orden_id);
  if (facturaExistente) {
    return { borrador: facturaExistente, calculoDetallado: null, yaExistia: true };
  }

  if (!datos.distancia_km || datos.distancia_km <= 0) {
    throw Object.assign(
      new Error("La ruta autorizada no tiene distancia_km configurada."),
      { status: 422 }
    );
  }

  if (!datos.tarifa_aplicada || datos.tarifa_aplicada <= 0) {
    throw Object.assign(
      new Error("No se encontró tarifa para el tipo de unidad."),
      { status: 422 }
    );
  }

  const bruto               = r2(datos.distancia_km * datos.tarifa_aplicada);
  const porcentajeDescuento = datos.porcentaje_descuento || 0;
  const descuento_aplicado  = r2(bruto * (porcentajeDescuento / 100));
  const subtotal            = r2(bruto - descuento_aplicado);
  const iva                 = r2(subtotal * 0.12);
  const total_factura       = r2(subtotal + iva);

  const calculoDetallado = {
    distancia_km:         datos.distancia_km,
    tarifa_aplicada:      datos.tarifa_aplicada,
    tipo_unidad:          datos.tipo_unidad,
    bruto,
    porcentaje_descuento: porcentajeDescuento,
    descuento_aplicado,
    subtotal,
    iva_porcentaje:       12,
    iva,
    total_factura,
  };

  const borrador = await FacturaFEL.crearBorrador({
    orden_id,
    cliente_id:                 datos.cliente_id,
    contrato_id:                datos.contrato_id,
    numero_factura:             generarNumeroFactura(),
    distancia_km:               datos.distancia_km,
    tarifa_aplicada:            datos.tarifa_aplicada,
    descuento_aplicado,
    subtotal,
    iva,
    total_factura,
    nit_cliente:                datos.cliente_nit,
    nombre_cliente_facturacion: datos.cliente_nombre,
  });

  /* ─── Emisión WebSocket ───────────────────────── */
  // io es opcional: si viene null (llamada interna), simplemente no emite
  if (io) {
    io.to("AGENTE_FINANCIERO").emit("nuevo_borrador", {
      tipo: "NUEVO_BORRADOR",
      borrador: {
        id:                         borrador.id,
        numero_factura:             borrador.numero_factura,
        estado:                     borrador.estado,
        // La tabla usa f.cliente_nombre ?? f.nombre_cliente_facturacion
        // Enviamos ambos para cubrir los dos casos
        cliente_nombre:             datos.cliente_nombre,
        nombre_cliente_facturacion: borrador.nombre_cliente_facturacion,
        nit_cliente:                borrador.nit_cliente,
        subtotal:                   borrador.subtotal,       // ← faltaba
        iva:                        borrador.iva,            // ← faltaba
        total_factura:              borrador.total_factura,
        fecha_emision:              borrador.fecha_emision,
        orden_id:                   borrador.orden_id,
      },
      mensaje:   `Nuevo borrador — Orden #${orden_id} | ${datos.cliente_nombre} | Q${borrador.total_factura}`,
      timestamp: new Date().toISOString(),
    });

    console.log(`[WS] Evento nuevo_borrador emitido a sala AGENTE_FINANCIERO`);
  } else {
    console.warn("[WS] io es null — evento NO emitido (llamada interna sin HTTP)");
  }
  /* ─────────────────────────────────────────────── */

  return { borrador, calculoDetallado, yaExistia: false };
}

/* ═══════════════════════════════════════════════════════
   2. VALIDAR BORRADOR (CDU003.2)
   ═══════════════════════════════════════════════════════ */

/**
 * @param {number} factura_id
 * @param {number} validado_por  — viene del JWT (req.user.id)
 *                                 CORRECCIÓN: el controlador ahora garantiza
 *                                 que este valor nunca es undefined/null.
 */
async function validarFactura(factura_id, validado_por) {
  // Guarda defensiva: si por algún motivo llega null, lanzar error claro
  if (!validado_por) {
    throw Object.assign(
      new Error("No se pudo identificar al usuario que valida. Token inválido o expirado."),
      { status: 401 }
    );
  }

  const factura = await FacturaFEL.buscarPorId(factura_id);

  if (!factura) {
    throw Object.assign(new Error(`Factura ${factura_id} no encontrada.`), { status: 404 });
  }

  if (factura.estado !== "BORRADOR") {
    throw Object.assign(
      new Error(
        `Solo se pueden validar facturas en estado BORRADOR. Estado actual: ${factura.estado}`
      ),
      { status: 422 }
    );
  }

  const resultado = validarBorrador(factura);

  const validacion = await FacturaFEL.registrarValidacion({
    factura_id,
    nit_validado:                  factura.nit_cliente,
    nit_valido:                    resultado.nitValido,
    campos_obligatorios_completos: resultado.camposCompletos,
    resultado_validacion:          resultado.aprobada ? "APROBADA" : "RECHAZADA",
    mensaje_validacion:            resultado.aprobada
      ? "Validación exitosa. Factura lista para certificación."
      : resultado.errores.join("; "),
    uuid_generado: null,
    validado_por,              // ← garantizado que es un número válido
  });

  let facturaActualizada = factura;
  if (resultado.aprobada) {
    facturaActualizada = await FacturaFEL.actualizarEstado(factura_id, "VALIDADA");
  }

  return { resultado, factura: facturaActualizada, validacion };
}

/* ═══════════════════════════════════════════════════════
   3. CERTIFICAR (CDU003.3 + CDU003.4 + CDU003.5)
   ═══════════════════════════════════════════════════════ */

async function certificarFactura(factura_id, certificado_por) {
  const factura = await FacturaFEL.buscarPorId(factura_id);

  if (!factura) {
    throw Object.assign(new Error(`Factura ${factura_id} no encontrada.`), { status: 404 });
  }

  if (factura.estado !== "VALIDADA") {
    throw Object.assign(
      new Error(
        `La factura debe estar en estado VALIDADA para certificar. ` +
        `Estado actual: ${factura.estado}. ` +
        `${factura.estado === "BORRADOR" ? "Primero ejecute la validación." : ""}`
      ),
      { status: 422 }
    );
  }

  const resultadoFEL = certificarFEL(factura);

  if (!resultadoFEL.aprobada) {
    await FacturaFEL.actualizarEstado(
      factura_id, "BORRADOR",
      `Certificación rechazada: ${resultadoFEL.errores.join("; ")}`
    );
    throw Object.assign(
      new Error(`Certificación FEL rechazada: ${resultadoFEL.mensajeSAT}`),
      { status: 422, detallesSAT: resultadoFEL }
    );
  }

  const pdfUrl      = `/facturas/pdf/${factura.numero_factura}.pdf`;
  const facturaCert = await FacturaFEL.certificarFactura(
    factura_id,
    certificado_por,
    resultadoFEL.uuid,
    resultadoFEL.xml,
    pdfUrl
  );

  // CORRECCIÓN: si certificarFactura devuelve undefined significa que la factura
  // no estaba en VALIDADA en el momento del UPDATE (race condition o doble click)
  if (!facturaCert) {
    throw Object.assign(
      new Error("No se pudo certificar: la factura ya no estaba en estado VALIDADA."),
      { status: 409 }
    );
  }

  const contrato      = await Contrato.buscarPorId(factura.contrato_id);
  const cxc           = await FacturaFEL.crearCuentaPorCobrar({
    factura_id,
    cliente_id:     factura.cliente_id,
    contrato_id:    factura.contrato_id,
    monto_original: factura.total_factura,
    plazo_pago:     contrato.plazo_pago,
  });

  const saldoAnterior = parseFloat(contrato.saldo_usado) || 0;
  const saldoNuevo    = r2(saldoAnterior + parseFloat(factura.total_factura));
  await Contrato.actualizarSaldo_finanzas(factura.contrato_id, saldoNuevo);

  const movimiento = await FacturaFEL.registrarMovimientoCredito({
    contrato_id:      factura.contrato_id,
    factura_id,
    pago_id:          null,
    tipo_movimiento:  "CARGO",
    monto_movimiento: parseFloat(factura.total_factura),
    saldo_anterior:   saldoAnterior,
    saldo_nuevo:      saldoNuevo,
    motivo:           `Factura certificada: ${factura.numero_factura} — UUID: ${resultadoFEL.uuid}`,
    registrado_por:   certificado_por,
  });

  try {
    await notificarInformativo(
      factura.cliente_email,
      factura.cliente_nombre,
      "Se ha emitido y certificado su Factura Electrónica.",
      {
        titulo: "Factura Electrónica FEL Certificada",
        datos: [
          { etiqueta: "N° Factura",      valor: factura.numero_factura        },
          { etiqueta: "N° Autorización", valor: resultadoFEL.uuid             },
          { etiqueta: "Subtotal",        valor: `Q ${factura.subtotal}`       },
          { etiqueta: "IVA (12%)",       valor: `Q ${factura.iva}`            },
          { etiqueta: "Total",           valor: `Q ${factura.total_factura}`  },
          { etiqueta: "Plazo de pago",   valor: `${contrato.plazo_pago} días` },
          { etiqueta: "Vence",           valor: cxc.fecha_vencimiento         },
        ],
      }
    );
  } catch (mailError) {
    console.error("[Facturacion.service] correo certificación:", mailError.message);
  }

  return { factura: facturaCert, cuentaPorCobrar: cxc, movimiento, uuid: resultadoFEL.uuid, mensajeSAT: resultadoFEL.mensajeSAT };
}

/* ═══════════════════════════════════════════════════════
   4. REGISTRAR PAGO (CDU003.6 / CDU003.9)
   ═══════════════════════════════════════════════════════ */

async function registrarPago(datos, registrado_por) {
  const {
    factura_id, cuenta_por_cobrar_id,
    forma_pago, monto_pagado, fecha_hora_pago,
    banco_origen, cuenta_origen,
    numero_autorizacion_bancaria, observacion,
  } = datos;

  const factura = await FacturaFEL.buscarPorId(factura_id);
  if (!factura) {
    throw Object.assign(new Error(`Factura ${factura_id} no encontrada.`), { status: 404 });
  }
  if (factura.estado !== "CERTIFICADA") {
    throw Object.assign(
      new Error(`Solo se pueden registrar pagos contra facturas CERTIFICADAS. Estado: ${factura.estado}`),
      { status: 422 }
    );
  }

  const cuentas = await FacturaFEL.listarCuentasPorCobrar({ cliente_id: factura.cliente_id });
  const cxc     = cuentas.find((c) => c.id === parseInt(cuenta_por_cobrar_id));

  if (!cxc) {
    throw Object.assign(new Error(`Cuenta por cobrar ${cuenta_por_cobrar_id} no encontrada.`), { status: 404 });
  }
  if (cxc.estado_cobro === "PAGADA") {
    throw Object.assign(new Error("Esta cuenta ya está completamente pagada."), { status: 422 });
  }
  if (parseFloat(monto_pagado) > parseFloat(cxc.saldo_pendiente)) {
    throw Object.assign(
      new Error(`El monto (Q${monto_pagado}) supera el saldo pendiente (Q${cxc.saldo_pendiente}).`),
      { status: 422 }
    );
  }

  const pago = await FacturaFEL.registrarPago({
    factura_id,
    cuenta_por_cobrar_id,
    cliente_id:                   factura.cliente_id,
    forma_pago,
    monto_pagado:                 parseFloat(monto_pagado),
    fecha_hora_pago,
    banco_origen,
    cuenta_origen,
    numero_autorizacion_bancaria,
    registrado_por,
    observacion,
  });

  const nuevoSaldoCXC  = r2(parseFloat(cxc.saldo_pendiente) - parseFloat(monto_pagado));
  const cuentaActualizada = await FacturaFEL.actualizarCuentaPorCobrar(cuenta_por_cobrar_id, nuevoSaldoCXC);

  const contrato      = await Contrato.buscarPorId(factura.contrato_id);
  const saldoAnterior = parseFloat(contrato.saldo_usado) || 0;
  const saldoNuevo    = r2(Math.max(0, saldoAnterior - parseFloat(monto_pagado)));
  await Contrato.actualizarSaldo_finanzas(factura.contrato_id, saldoNuevo);

  const movimiento = await FacturaFEL.registrarMovimientoCredito({
    contrato_id:      factura.contrato_id,
    factura_id,
    pago_id:          pago.id,
    tipo_movimiento:  "ABONO",
    monto_movimiento: parseFloat(monto_pagado),
    saldo_anterior:   saldoAnterior,
    saldo_nuevo:      saldoNuevo,
    motivo:           `Pago: ${forma_pago} — ${banco_origen} — Auth: ${numero_autorizacion_bancaria}`,
    registrado_por,
  });

  try {
    await notificarCorrecto(
      factura.cliente_email,
      factura.cliente_nombre,
      `Pago de Q${monto_pagado} registrado para factura ${factura.numero_factura}.`,
      {
        titulo: "Pago Registrado",
        detalle: `Crédito disponible actualizado. Saldo utilizado: Q${saldoNuevo}.`,
      }
    );
  } catch (mailError) {
    console.error("[Facturacion.service] correo pago:", mailError.message);
  }

  return {
    pago,
    cuentaActualizada,
    movimiento,
    creditoLiberado:       parseFloat(monto_pagado),
    saldoContratoAnterior: saldoAnterior,
    saldoContratoNuevo:    saldoNuevo,
  };
}

/* ═══════════════════════════════════════════════════════
   5. CONSULTA COMPLETA
   ═══════════════════════════════════════════════════════ */

async function obtenerFacturaCompleta(factura_id) {
  const factura = await FacturaFEL.buscarPorId(factura_id);
  if (!factura) {
    throw Object.assign(new Error(`Factura ${factura_id} no encontrada.`), { status: 404 });
  }

  const pagos   = await FacturaFEL.listarPagosPorFactura(factura_id);
  const cuentas = await FacturaFEL.listarCuentasPorCobrar({ cliente_id: factura.cliente_id });
  const cxc     = cuentas.find((c) => c.factura_id === factura_id) || null;

  return { factura, pagos, cuentaPorCobrar: cxc };
}

module.exports = {
  generarBorrador,
  validarFactura,
  certificarFactura,
  registrarPago,
  obtenerFacturaCompleta,
};