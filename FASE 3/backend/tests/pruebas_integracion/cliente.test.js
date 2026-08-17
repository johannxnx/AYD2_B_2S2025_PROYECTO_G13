const chai = require("chai");
const expect = chai.expect;
const request = require("supertest");
const { app } = require("../../index");

describe("Flujo Completo: Cliente Corporativo", function () {
  this.timeout(10000);

  let token;
  let clienteId;

  it("Debería iniciar sesión y consultar sus contratos, órdenes y rutas autorizadas", async () => {
    // 1. LOGIN
    const loginRes = await request(app).post("/api/auth/login").send({
      email: "giolinux25@gmail.com",
      password: "12345678",
    });

    expect(loginRes.status).to.equal(200);
    expect(loginRes.body).to.exist;

    token = loginRes.body.data?.token || loginRes.body.token;
    expect(token).to.be.a("string").and.to.not.equal("");

    const clienteId = loginRes.body.data.user.id;

    // 2. CONSULTAR CONTRATOS DEL CLIENTE
    const contratosRes = await request(app)
      .get(`/api/contratos/cliente/${clienteId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(contratosRes.status).to.equal(200);
    expect(contratosRes.body).to.exist;

    const contratos = contratosRes.body.data || contratosRes.body;

    expect(contratos).to.be.an("array");
    console.log("Primer contrato del cliente:", contratos[0] || contratos);

    // 3. CONSULTAR ÓRDENES DEL CLIENTE
    const ordenesRes = await request(app)
      .get(`/api/orden/usuario/${clienteId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(ordenesRes.status).to.equal(200);
    expect(ordenesRes.body).to.exist;

    const ordenes = ordenesRes.body.data || ordenesRes.body;

    expect(ordenes).to.be.an("array");
    console.log("Primera orden del cliente:", ordenes[0] || ordenes);

    // 4. CONSULTAR RUTAS AUTORIZADAS DEL CLIENTE
    const rutasRes = await request(app)
      .get(`/api/orden/rutasAutorizada/${clienteId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(rutasRes.status).to.equal(200);
    expect(rutasRes.body).to.exist;

    const rutas = rutasRes.body.data || rutasRes.body;

    expect(rutas).to.be.an("array");
    console.log("Primera ruta autorizada del cliente:", rutas[0] || rutas);
  });
});
