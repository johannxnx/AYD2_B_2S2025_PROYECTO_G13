"use strict";

const express = require("express");
const dashboardController = require("../../controllers/gerencial/dashboard.controller");
const { requireAuth } = require("../../middlewares/auth/auth.middleware");
const { requireRole } = require("../../middlewares/auth/role.middleware");

const router = express.Router();

// Todas las rutas gerenciales requieren sesión activa y rol gerencia.
router.use(requireAuth, requireRole("gerencia"));

// Vista consolidada diaria de operaciones y facturación.
router.get("/corte-diario", dashboardController.getCorteDiario);
// KPIs de rentabilidad y cumplimiento por rango de fechas.
router.get("/kpis", dashboardController.getKpis);
// Alertas de desviaciones (clientes con baja carga y rutas con exceso de costo).
router.get("/alertas", dashboardController.getAlertas);

module.exports = router;
