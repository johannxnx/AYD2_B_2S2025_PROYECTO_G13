"use strict";

const dashboardService = require("../../services/gerencial/dashboard.service");

// Controlador HTTP para el corte diario del dashboard gerencial.
async function getCorteDiario(req, res) {
  try {
    const data = await dashboardService.getCorteDiario({
      fecha: req.query.fecha,
      sede: req.query.sede,
      moneda_id: req.query.moneda_id ? Number(req.query.moneda_id) : null,
    });

    return res.status(200).json({
      ok: true,
      mensaje: "Corte diario generado correctamente",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      mensaje: error.message || "No se pudo generar el corte diario",
    });
  }
}

// Controlador HTTP para KPIs gerenciales por rango de fechas.
async function getKpis(req, res) {
  try {
    const data = await dashboardService.getKpis({
      desde: req.query.desde,
      hasta: req.query.hasta,
      sede: req.query.sede,
      moneda_id: req.query.moneda_id ? Number(req.query.moneda_id) : null,
    });

    return res.status(200).json({
      ok: true,
      mensaje: "KPIs gerenciales generados correctamente",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      mensaje: error.message || "No se pudieron generar los KPIs",
    });
  }
}

// Controlador HTTP para alertas de desviación del dashboard.
async function getAlertas(req, res) {
  try {
    const data = await dashboardService.getAlertas({
      desde: req.query.desde,
      hasta: req.query.hasta,
    });

    return res.status(200).json({
      ok: true,
      mensaje: "Alertas generadas correctamente",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      mensaje: error.message || "No se pudieron generar las alertas",
    });
  }
}

// Controlador HTTP para obtener eventos/bitácora de órdenes.
async function getEventosOrdenes(req, res) {
  try {
    const data = await dashboardService.getEventosOrdenes({
      desde: req.query.desde,
      hasta: req.query.hasta,
      sede: req.query.sede,
      tipo_evento: req.query.tipo_evento,
      limite: req.query.limite || 100,
    });

    return res.status(200).json({
      ok: true,
      mensaje: "Eventos de órdenes obtenidos correctamente",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      mensaje: error.message || "No se pudieron obtener los eventos de órdenes",
    });
  }
}

module.exports = {
  getCorteDiario,
  getKpis,
  getAlertas,
  getEventosOrdenes,
};
