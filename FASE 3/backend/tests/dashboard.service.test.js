"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { __testables } = require("../src/services/gerencial/dashboard.service");

const { parseDateInput, normalizeSede, buildSedeCaseForOrders } = __testables;

test("normalizeSede acepta alias y formatos del frontend", () => {
  assert.equal(normalizeSede("guatemala"), "GUATEMALA");
  assert.equal(normalizeSede("xela"), "XELA");
  assert.equal(normalizeSede("quetzaltenango"), "XELA");
  assert.equal(normalizeSede("puerto_barrios"), "PUERTO BARRIOS");
  assert.equal(normalizeSede("puerto-barrios"), "PUERTO BARRIOS");
  assert.equal(normalizeSede("  puerto   barrios  "), "PUERTO BARRIOS");
});

test("normalizeSede retorna null cuando no recibe sede", () => {
  assert.equal(normalizeSede(), null);
  assert.equal(normalizeSede(null), null);
  assert.equal(normalizeSede(""), null);
});

test("normalizeSede rechaza sedes no permitidas", () => {
  assert.throws(() => normalizeSede("PETEN"), /Sede invalida/);
});

test("parseDateInput parsea fecha valida", () => {
  const date = parseDateInput("2026-04-04");
  assert.equal(Number.isNaN(date.getTime()), false);
  assert.equal(date.toISOString().slice(0, 10), "2026-04-04");
});

test("parseDateInput lanza error con fecha invalida", () => {
  assert.throws(() => parseDateInput("fecha-no-valida"), /Fecha invalida/);
});

test("buildSedeCaseForOrders genera CASE SQL con alias de tabla", () => {
  const sqlCase = buildSedeCaseForOrders("o");
  assert.match(sqlCase, /CASE/);
  assert.match(sqlCase, /o\.origen/);
  assert.match(sqlCase, /o\.destino/);
  assert.match(sqlCase, /PUERTO BARRIOS/);
});
