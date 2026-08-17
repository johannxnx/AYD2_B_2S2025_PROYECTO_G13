"use strict";

const sql = require("mssql");

let poolPromise = null;

function getDbConfig() {
  return {
    server: process.env.DB_SERVER,
    port: Number(process.env.DB_PORT || 1433),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    options: {
      encrypt: true,
      trustServerCertificate: true,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };
}

function assertDbEnv() {
  const requiredVars = ["DB_SERVER", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME"];
  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length) {
    throw new Error(`Faltan variables de entorno de BD: ${missingVars.join(", ")}`);
  }
}

async function getConnection() {
  assertDbEnv();

  if (!poolPromise) {
    const config = getDbConfig();
    poolPromise = new sql.ConnectionPool(config)
      .connect()
      .catch((error) => {
        poolPromise = null;
        throw error;
      });
  }

  return poolPromise;
}

module.exports = {
  sql,
  getConnection,
};
