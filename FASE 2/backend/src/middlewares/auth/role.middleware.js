"use strict";

// Middleware factory: recibe una lista de roles permitidos y valida el rol del JWT.
function requireRole(...allowedRoles) {
  const normalizedRoles = allowedRoles.map((role) => String(role || "").toLowerCase());

  return (req, res, next) => {
    // El rol viene del payload JWT cargado por requireAuth.
    const currentRole = String(req.user?.role || "").toLowerCase();

    if (!currentRole || !normalizedRoles.includes(currentRole)) {
      return res.status(403).json({
        ok: false,
        mensaje: "No autorizado para acceder a este recurso",
      });
    }

    return next();
  };
}

module.exports = {
  requireRole,
};
