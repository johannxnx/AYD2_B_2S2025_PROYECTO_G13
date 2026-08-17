"use strict";

const express = require("express");
const ordenController = require("../../controllers/orden/orden.controller");
const { upload } = require("../../utils/multer");
const { requireAuth } = require("../../middlewares/auth/auth.middleware");

const {
  validarGenerarOrden,
  valAsignacionRecursos,
  valSalidaPatio,
  valInicioTransito,
  valEventosTransito,
  valFinalizarEntrega, 
} = require("../../middlewares/orden/orden.validation.middleware");

const router = express.Router();
//router.use(requireAuth); // Comentar si te falla :) (No lo probe)

// Consultas Basicas de las Ordenes

router.get("/", ordenController.optenerOrden);
router.get("/pendiente", ordenController.getOrdenPendiente); // El agente logistico tiene acceso a este enpoint
router.get("/planificada", ordenController.getOrdenPlanificada); // El agente de patio puede visualizar esta enpoint
router.get("/piloto/:id", ordenController.getOrdenPiloto); // En esta el piloto puede ver sus ordenes en sus diferentes estado
router.get("/usuario/:id", ordenController.optenerOrdenUsuario); // En esta el piloto puede ver sus ordenes en sus diferentes estado
router.post("/", validarGenerarOrden, ordenController.generarOrden);
router.put("/:id", valAsignacionRecursos, ordenController.asignarRecursos);

// Enpoint que no deben de ir aqui pero para facilidad de conflictos los voy a colocar por aquí ;))

router.get("/vehiculos", ordenController.getVehiculos);
router.get("/pilotos", ordenController.getPilotos);
router.get("/rutasAutorizada/:id", ordenController.getRutasAutorizadas);

// Rutas destinadas a la logistica de la orden
router.put(
  "/logistica/:id",
  valSalidaPatio,
  ordenController.registrarSalidaPatio,
);

// Gesitones de oredenes en la ruta
router.put(
  "/trasito/inicio/:id",
  valInicioTransito,
  ordenController.actualizarRutaTransito,
);

router.post("/eventos", valEventosTransito, ordenController.eventosTransito);

router.post(
  "/trasito/fin/:id",
  upload.array("evidencias", 5),
  valFinalizarEntrega,
  ordenController.actualizarRutaTransitoF,
);

module.exports = router;
