"use strict";

function validarGenerarOrden(req, res, next) {
  const { cliente_id, origen, destino, tipo_mercancia, peso_estimado } =
    req.body;

  if (!cliente_id || !origen || !destino || !tipo_mercancia || !peso_estimado) {
    return res.status(400).json({
      ok: false,
      mensaje:
        "Faltan campos obligatorios: cliente_id, origen, destino, tipo_mercancia o peso_estimado.",
    });
  }

  if (isNaN(peso_estimado) || peso_estimado <= 0) {
    return res.status(400).json({
      ok: false,
      mensaje: "El peso estimado debe ser un número mayor a cero.",
    });
  }

  next();
}

function valAsignacionRecursos(req, res, next) {
  const { id } = req.params;
  const { vehiculo_id, piloto_id, peso_estimado, tiempo_estimado } = req.body;

  if (!id || isNaN(id)) {
    return res
      .status(400)
      .json({ ok: false, mensaje: "ID de orden inválido." });
  }

  // Tiempo estimado en horas
  if (!tiempo_estimado || isNaN(tiempo_estimado) || tiempo_estimado < 0) {
    return res
      .status(400)
      .json({ ok: false, mensaje: "Tiempo estimano invalido." });
  }

  if (!vehiculo_id || !piloto_id || !peso_estimado) {
    return res
      .status(400)
      .json({ ok: false, mensaje: "Faltan campos obligatorios." });
  }

  next();
}

function valSalidaPatio(req, res, next) {
  const { id } = req.params;
  const { codigo_orden, peso_real, asegurada, estibada } = req.body;

  if (!id || isNaN(id)) {
    return res
      .status(400)
      .json({ ok: false, mensaje: "ID de orden inválido." });
  }

  if (!codigo_orden || !peso_real || !asegurada || !estibada) {
    return res
      .status(400)
      .json({ ok: false, mensaje: "Faltan campos obligatorios." });
  }
  next();
}

function valInicioTransito(req, res, next) {
  const { id } = req.params;
  if (!id || isNaN(id)) {
    return res
      .status(400)
      .json({ ok: false, mensaje: "ID de orden inválido." });
  }
  next();
}

function valEventosTransito(req, res, next) {
  const { orden_id, piloto_id, tipo_evento, descripcion, genera_retraso } =
    req.body;

  if (!orden_id || !piloto_id || !tipo_evento || !descripcion) {
    return res
      .status(400)
      .json({ ok: false, mensaje: "Faltan campos obligatorios." });
  }

  const eventosPermitidos = ["NORMAL", "INCIDENTE", "RETRASO", "CRITICO"];
  if (!eventosPermitidos.includes(tipo_evento)) {
    return res
      .status(400)
      .json({ ok: false, mensaje: "Tipo de evento no válido." });
  }

  req.body.genera_retraso = !!genera_retraso;

  next();
}

function valFinalizarEntrega(req, res, next) {
  const { id } = req.params;

  // Validamos req.files (que es donde Multer pone los archivos)
  if (!id)
    return res
      .status(400)
      .json({ ok: false, mensaje: "ID de orden inválido." });

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      ok: false,
      mensaje: "Debe adjuntar al menos una imagen de evidencia.",
    });
  }
  next();
}

module.exports = {
  validarGenerarOrden,
  valAsignacionRecursos,
  valSalidaPatio,
  valInicioTransito,
  valEventosTransito,
  valFinalizarEntrega,
};
