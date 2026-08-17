/**
 * @file usuarioRoutes.js
 * @description Rutas para la gestión de usuarios del sistema.
 * Incluye CRUD de usuarios y evaluación de riesgos de clientes.
 */

const express      = require('express');
const router       = express.Router();
const { requireAuth } = require('../../middlewares/auth/auth.middleware');
const {
  listarUsuarios,
  obtenerUsuario,
  modificarUsuario,
  cambiarEstadoUsuario,
  crearRiesgoCliente,
  obtenerRiesgoCliente,
  crearCliente
} = require('../../controllers/usuarios/usuarioController');

/**
 * POST /api/usuarios
 * @description Crear nuevo usuario/cliente corporativo
 * @auth Requerida (token JWT)
 * @body {
 *   nombre: string - Nombre del cliente
 *   email: string - Email único
 *   nit: string - NIT único
 *   telefono: string - Teléfono (opcional)
 *   tipo_usuario: string - Tipo (CLIENTE_CORPORATIVO, PILOTO, etc)
 *   estado: string - Estado inicial (generalmente PENDIENTE_ACEPTACION)
 *   password: string - Contraseña en texto plano
 * }
 * @response {status: 201, data: usuarioCreado}
 */
router.post('/', requireAuth, crearCliente);

/**
 * GET /api/usuarios
 * @description Lista todos los usuarios con filtros opcionales
 * @auth Requerida (token JWT)
 * @query tipo_usuario: string - Filtro por tipo (CLIENTE, ADMIN, OPERADOR)
 * @query estado: string - Filtro por estado (ACTIVO, INACTIVO, SUSPENDIDO)
 * @query nombre: string - Búsqueda parcial por nombre
 * @response {status: 200, data: [usuarios]}
 */
router.get('/',    requireAuth, listarUsuarios);

/**
 * GET /api/usuarios/:id
 * @description Obtiene los datos de un usuario específico
 * @auth Requerida (token JWT)
 * @params id: number - ID del usuario
 * @response {status: 200, data: usuario}
 */
router.get('/:id', requireAuth, obtenerUsuario);

/**
 * PUT /api/usuarios/:id
 * @description Actualiza los datos de contacto de un usuario
 * @auth Requerida (token JWT)
 * @params id: number - ID del usuario
 * @body {
 *   nombre: string - Nombre completo
 *   email: string - Correo electrónico
 *   telefono: string - Teléfono de contacto
 * }
 * @response {status: 200, data: usuarioActualizado}
 */
router.put('/:id', requireAuth, modificarUsuario);

/**
 * PATCH /api/usuarios/:id/estado
 * @description Cambia el estado de un usuario (activar/desactivar/suspender)
 * @auth Requerida (token JWT)
 * @params id: number - ID del usuario
 * @body {
 *   estado: string - Nuevo estado (ACTIVO, INACTIVO, SUSPENDIDO)
 *   motivo: string - Razón del cambio de estado
 * }
 * @response {status: 200, data: { id, nombre, estado }}
 */
router.patch('/:id/estado', requireAuth, cambiarEstadoUsuario);

/**
 * POST /api/usuarios/:id/riesgo
 * @description Registra una evaluación de riesgo para un cliente
 * @auth Requerida (token JWT)
 * @params id: number - ID del usuario/cliente
 * @body {
 *   riesgo_capacidad_pago: string - ALTO, MEDIO, BAJO
 *   riesgo_lavado_dinero: string - ALTO, MEDIO, BAJO
 *   riesgo_aduanas: string - ALTO, MEDIO, BAJO
 *   riesgo_mercancia: string - ALTO, MEDIO, BAJO
 * }
 * @response {status: 201, data: perfilRiesgo}
 */
router.post('/:id/riesgo', requireAuth, crearRiesgoCliente);

/**
 * GET /api/usuarios/:id/riesgo
 * @description Obtiene el perfil de riesgo de un cliente
 * @auth Requerida (token JWT)
 * @params id: number - ID del usuario/cliente
 * @response {status: 200, data: perfilRiesgo}
 */
router.get('/:id/riesgo', requireAuth, obtenerRiesgoCliente);

module.exports = router;
