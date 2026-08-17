"use strict";

const { verifyJwt, extractBearerToken } = require("../../utils/jwt");

function requireAuth(req, res, next) {
  const token = extractBearerToken(req.headers.authorization || "");

  if (!token) {
    return res.status(401).json({
      ok: false,
      mensaje: "Token requerido",
    });
  }

  try {
    const payload = verifyJwt(token);
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({
      ok: false,
      mensaje: "Token invalido o expirado",
    });
  }
}

module.exports = {
  requireAuth,
};
