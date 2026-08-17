const chai = require("chai");
const expect = chai.expect;
const request = require("supertest");
const { app } = require("../../index");

describe("Flujo Completo: Agente Operativo", function () {
  this.timeout(10000);

  let token;
  let ordenPendienteId;

  it("Debería iniciar sesión, consultar órdenes pendientes y obtener rutas autorizadas", async () => {
    // 1. LOGIN
    const loginRes = await request(app).post("/api/auth/login").send({
      email: "operativo@logitrans.com",
      password: "12345678",
    });

    expect(loginRes.status).to.equal(200);
    expect(loginRes.body).to.exist;

    token = loginRes.body.data?.token || loginRes.body.token;
    expect(token).to.be.a("string").and.to.not.equal("");

    // 2. CONSULTAR ÓRDENES PENDIENTES
    const pendientesRes = await request(app)
      .get("/api/orden/pendiente")
      .set("Authorization", `Bearer ${token}`);

    expect(pendientesRes.status).to.equal(200);
    expect(pendientesRes.body).to.exist;

    const ordenesPendientes = pendientesRes.body.data || pendientesRes.body;

    expect(ordenesPendientes).to.be.an("array");
    expect(ordenesPendientes.length).to.be.greaterThan(0);

    console.log("Primera orden pendiente:", ordenesPendientes[0]);

    ordenPendienteId = ordenesPendientes[0]?.id;

    expect(ordenPendienteId).to.exist;

    // 3. VEHÍCULOS
    const vehiculosRes = await request(app)
      .get("/api/orden/vehiculos")
      .set("Authorization", `Bearer ${token}`);

    expect(vehiculosRes.status).to.equal(200);
    expect(vehiculosRes.body).to.exist;

    const vehiculos = vehiculosRes.body.data || vehiculosRes.body;

    expect(vehiculos).to.be.an("array");
    expect(vehiculos.length).to.be.greaterThan(0);

    console.log("Vehículo:", vehiculos[0]);

    // 4. PILOTOS
    const pilotosRes = await request(app)
      .get("/api/orden/pilotos")
      .set("Authorization", `Bearer ${token}`);

    expect(pilotosRes.status).to.equal(200);
    expect(pilotosRes.body).to.exist;

    const pilotos = pilotosRes.body.data || pilotosRes.body;

    expect(pilotos).to.be.an("array");
    expect(pilotos.length).to.be.greaterThan(0);

    console.log("Piloto:", pilotos[0]);
  });
});
