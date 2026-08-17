"use strict";

const { sql, getConnection } = require("../../config/db");

const APP_TO_DB_ROLE = {
  cliente: "CLIENTE_CORPORATIVO",
  piloto: "PILOTO",
  finanzas: "AGENTE_FINANCIERO",
  gerencia: "GERENCIA",
  operativo: "AGENTE_OPERATIVO",
};

const DB_TO_APP_ROLE = {
  CLIENTE_CORPORATIVO: "cliente",
  PILOTO: "piloto",
  AGENTE_FINANCIERO: "finanzas",
  AREA_CONTABLE: "finanzas",
  GERENCIA: "gerencia",
  AGENTE_OPERATIVO: "operativo",
  AGENTE_LOGISTICO: "operativo",
  ENCARGADO_PATIO: "operativo",
};

function mapDbRoleToApp(dbRole) {
  return DB_TO_APP_ROLE[String(dbRole || "").toUpperCase()] || "operativo";
}

function mapAppRoleToDb(appRole) {
  const dbRole = APP_TO_DB_ROLE[String(appRole || "").toLowerCase()];
  if (!dbRole) {
    throw new Error("Rol de aplicación no mapeado a base de datos");
  }
  return dbRole;
}

function splitFullName(fullName) {
  const cleanName = String(fullName || "").trim();
  if (!cleanName) {
    return { nombres: "", apellidos: "" };
  }

  const parts = cleanName.split(/\s+/);
  if (parts.length === 1) {
    return { nombres: parts[0], apellidos: "" };
  }

  return {
    nombres: parts.slice(0, -1).join(" "),
    apellidos: parts.slice(-1).join(" "),
  };
}

function mapDbRowToUser(row) {
  const parsedName = splitFullName(row.nombre);

  return {
    id: row.id,
    nit: row.nit,
    nombre: row.nombre,
    nombres: parsedName.nombres,
    apellidos: parsedName.apellidos,
    email: row.email,
    telefono: row.telefono,
    passwordHash: row.password_hash,
    role: mapDbRoleToApp(row.tipo_usuario),
    dbRole: row.tipo_usuario,
    estado: row.estado,
    createdAt: row.fecha_registro,
  };
}

async function findByEmail(email) {
  // Punto de lectura para login/registro: busca usuario por email único.
  const pool = await getConnection();

  const result = await pool
    .request()
    .input("email", sql.NVarChar(255), String(email || "").toLowerCase())
    .query(`
      SELECT TOP 1
        id,
        nit,
        nombre,
        email,
        telefono,
        password_hash,
        tipo_usuario,
        estado,
        fecha_registro
      FROM usuarios
      WHERE email = @email
    `);

  if (!result.recordset.length) return null;
  return mapDbRowToUser(result.recordset[0]);
}

async function createUser(payload) {
  // Punto de escritura para registro: inserta usuario y retorna fila creada.
  const fullName = `${payload.nombres || ""} ${payload.apellidos || ""}`.trim();
  const nombre = fullName || String(payload.nombres || "Usuario").trim();
  const dbRole = mapAppRoleToDb(payload.role);

  const pool = await getConnection();

  const result = await pool
    .request()
    .input("nit", sql.NVarChar(13), String(payload.nit || ""))
    .input("nombre", sql.NVarChar(255), nombre)
    .input("email", sql.NVarChar(255), String(payload.email || "").toLowerCase())
    .input("telefono", sql.NVarChar(20), payload.telefono || null)
    .input("password_hash", sql.NVarChar(255), payload.passwordHash)
    .input("tipo_usuario", sql.NVarChar(30), dbRole)
    .query(`
      INSERT INTO usuarios (
        nit,
        nombre,
        email,
        telefono,
        password_hash,
        tipo_usuario,
        estado,
        creado_por
      )
      OUTPUT
        INSERTED.id,
        INSERTED.nit,
        INSERTED.nombre,
        INSERTED.email,
        INSERTED.telefono,
        INSERTED.password_hash,
        INSERTED.tipo_usuario,
        INSERTED.estado,
        INSERTED.fecha_registro
      VALUES (
        @nit,
        @nombre,
        @email,
        @telefono,
        @password_hash,
        @tipo_usuario,
        'ACTIVO',
        NULL
      )
    `);

  return mapDbRowToUser(result.recordset[0]);
}

module.exports = {
  mapDbRoleToApp,
  mapAppRoleToDb,
  findByEmail,
  createUser,
};
