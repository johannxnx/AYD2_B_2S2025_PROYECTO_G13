"use strict";

const ordenService = require("../../services/orden/orden.service");

async function generarOrden(req, res) {
  try {
    const result = await ordenService.generarOrden(req.body || {});
    return res.status(201).json({ ok: true, ...result });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      ok: false,
      mensaje: error.message || "No se pudo generar la Orden",
    });
  }
}

async function optenerOrden(req, res) {
  try {
    const result = await ordenService.optenerOrden(req.body || {});
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      ok: false,
      mensaje: error.message || "No se pudo obtener el listado de ordenes",
    });
  }
}

async function getOrdenPendiente(req, res) {
  try {
    const result = await ordenService.optenerOrdenPendiente(req.body || {});
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      ok: false,
      mensaje: error.message || "No se pudo obtener el listado de ordenes",
    });
  }
}

async function getOrdenPlanificada(req, res) {
  try {
    const result = await ordenService.optenerOrdenPlanificada(req.body || {});
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      ok: false,
      mensaje: error.message || "No se pudo obtener el listado de ordenes",
    });
  }
}

async function getOrdenPiloto(req, res) {
  try {
    const { id } = req.params;
    const result = await ordenService.optenerOrdenPiloto(id);
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      ok: false,
      mensaje: error.message || "No se pudo obtener el listado de ordenes",
    });
  }
}

async function asignarRecursos(req, res) {
  try {
    const { id } = req.params;
    const result = await ordenService.asignarRecursos(id, req.body);

    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      ok: false,
      mensaje: error.message || "No se pudo asignar recursos",
    });
  }
}

async function optenerOrdenUsuario(req, res) {
  try {
    const { id } = req.params;
    const result = await ordenService.optenerOrdenUsuario(id, req.body);

    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      ok: false,
      mensaje: error.message || "No se pudo asignar recursos",
    });
  }
}

async function getVehiculos(req, res) {
  try {
    const result = await ordenService.getVehiculos(req.body || {});
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      ok: false,
      mensaje: error.message || "No se pudo obtener el listado de ordenes",
    });
  }
}

async function getPilotos(req, res) {
  try {
    const result = await ordenService.getPilotos(req.body || {});
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      ok: false,
      mensaje: error.message || "No se pudo obtener el listado de ordenes",
    });
  }
}

async function registrarSalidaPatio(req, res) {
  try {
    const { id } = req.params;
    const result = await ordenService.registrarSalidaPatio(id, req.body || {});
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      ok: false,
      mensaje: error.message || "No se pudo obtener el listado de ordenes",
    });
  }
}

async function actualizarRutaTransito(req, res) {
  try {
    const { id } = req.params;
    const result = await ordenService.actualizarRutaTransito(id);
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      ok: false,
      mensaje: error.message || "No se pudo obtener el listado de ordenes",
    });
  }
}

async function eventosTransito(req, res) {
  try {
    const result = await ordenService.eventosTransito(req.body || {});
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      ok: false,
      mensaje: error.message || "No se pudo obtener el listado de ordenes",
    });
  }
}

async function actualizarRutaTransitoF(req, res) {
  try {
    const { id } = req.params;
    // Extraemos las rutas de los archivos
    const rutasArchivos = req.files.map((f) => f.path);

    // Llamamos al service solo con los datos necesarios
    const result = await ordenService.finalizarRuta(id, rutasArchivos);

    res.status(200).json({ ok: true, data: result });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ ok: false, mensaje: error.message });
  }
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
  actualizarRutaTransitoF,
  getOrdenPendiente,
  getOrdenPlanificada,
  getOrdenPlanificada,
  getOrdenPiloto,
  optenerOrdenUsuario,
};
