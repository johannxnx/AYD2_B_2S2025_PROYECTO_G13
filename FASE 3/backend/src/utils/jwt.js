"use strict";

let jwt;
try {
  jwt = require("jsonwebtoken");
} catch (error) {
  jwt = null;
}

const DEFAULT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

function assertJwtLib() {
  if (!jwt) {
    const error = new Error("Dependencia jsonwebtoken no instalada");
    error.statusCode = 500;
    throw error;
  }
}

function signJwt(payload, options = {}) {
  assertJwtLib();
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: DEFAULT_EXPIRES_IN,
    ...options,
  });
}

function verifyJwt(token) {
  assertJwtLib();
  return jwt.verify(token, JWT_SECRET);
}

function extractBearerToken(authorizationHeader) {
  const parts = String(authorizationHeader || "").split(" ");
  if (parts.length !== 2) return null;
  if (parts[0] !== "Bearer") return null;
  return parts[1];
}

module.exports = {
  signJwt,
  verifyJwt,
  extractBearerToken,
};
