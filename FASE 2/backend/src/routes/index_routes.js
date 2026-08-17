/**
 * @file Rutas Principales (Router Agregador)
 * @description Router principal que agrega todas las rutas modulares de la API
 * Monta los siguientes módulos bajo la ruta /api/:
 * - /api/auth - Autenticación y gestión de sesiones
 * - /api/usuarios - Gestión de usuarios y perfiles
 * - /api/contratos - Gestión de contratos de transporte
 * - /api/tarifario - Gestión de tarifas y costos base
 * - /api/facturacion - Módulo de facturación
 * @module routes/index_routes
 * @version 1.0.0
 * @requires express
 */

const express = require('express');
const router = express.Router();

/**
 * GET /api
 * @description Verifica que la API está operativa
 * @response {status: 200, ok: true, mensaje: 'Dentro de la API'}
 */
router.get('/', (req, res) => {
    res.status(200).json({
      ok: true,
      mensaje: 'Dentro de la API'
    });
});

// Importar rutas por módulo
const facturacionRoutes = require("./facturacion/routes_factuacion");
const authRoutes = require("./auth/auth.routes");
const ordenRoutes = require("./orden/orden.routes");

// otras carpetas por ejemplo:
// const contratosRoutes = require('./contratos/routes_contratos');


const usuarioRoutes   = require('./usuarios/usuarioRoutes');
const contratoRoutes  = require('./contratos/contratoRoutes');
const tarifarioRoutes = require('./tarifario/tarifarioRoutes');

const gerencialRoutes = require('./gerencial/dashboard.routes');

// Convención general:
router.use('/orden', ordenRoutes);
// /api/modulo
router.use('/facturacion', facturacionRoutes);
router.use('/auth', authRoutes);
router.use('/usuarios',    usuarioRoutes);
router.use('/contratos',   contratoRoutes);
router.use('/tarifario',   tarifarioRoutes);
router.use('/gerencial',   gerencialRoutes);
router.use("/orden", ordenRoutes);
//  /api/contratos
//  router.use('/contratos', contratosRoutes);

// ... asi para todas las demas rutas

module.exports = router;
