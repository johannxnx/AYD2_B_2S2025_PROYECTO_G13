const chai = require("chai");
const expect = chai.expect;
const request = require("supertest");
const { app } = require("../../index");

describe("Flujo Completo: Gerencia", function () {
  this.timeout(10000);

  let token;

  it("Debería iniciar sesión y acceder a dashboard gerencial", async () => {
    const loginRes = await request(app).post("/api/auth/login").send({
      email: "marcojosuecruz81@gmail.com",
      password: "12345678",
    });

    expect(loginRes.status).to.equal(200);

    token = loginRes.body.data?.token || loginRes.body.token;
    expect(token).to.exist;

    // 2. CORTE DIARIO
    const corteRes = await request(app)
      .get("/api/gerencial/corte-diario")
      .set("Authorization", `Bearer ${token}`);

    expect(corteRes.status).to.equal(200);
    expect(corteRes.body).to.exist;

    // 3. KPIs
    const kpisRes = await request(app)
      .get("/api/gerencial/kpis")
      .set("Authorization", `Bearer ${token}`);

    expect(kpisRes.status).to.equal(200);

    // 4. ALERTAS
    const alertasRes = await request(app)
      .get("/api/gerencial/alertas")
      .set("Authorization", `Bearer ${token}`);

    expect(alertasRes.status).to.equal(200);

    // 5. EVENTOS
    const eventosRes = await request(app)
      .get("/api/gerencial/eventos")
      .set("Authorization", `Bearer ${token}`);

    expect(eventosRes.status).to.equal(200);

    console.log("Dashboard gerencial funcionando correctamente");
  });
});
