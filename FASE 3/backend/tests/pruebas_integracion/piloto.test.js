const chai = require("chai");
const expect = chai.expect;
const request = require("supertest");
const { app } = require("../../index");

describe("Flujo Completo: Piloto", function () {
  this.timeout(10000);

  let token;
  let pilotoId;

  it("Debería iniciar sesión y consultar sus órdenes como piloto", async () => {
    // 1. LOGIN
    const loginRes = await request(app).post("/api/auth/login").send({
      email: "nando1852004@gmail.com",
      password: "12345678",
    });

    expect(loginRes.status).to.equal(200);
    expect(loginRes.body).to.exist;

    token = loginRes.body.data?.token || loginRes.body.token;
    expect(token).to.be.a("string").and.to.not.equal("");

    // 2. OBTENER ID DEL PILOTO DESDE EL LOGIN
    pilotoId = loginRes.body.data.user.id;

    expect(pilotoId).to.exist;

    console.log("Piloto ID:", pilotoId);

    // 3. CONSULTAR ÓRDENES DEL PILOTO
    const ordenesRes = await request(app)
      .get(`/api/orden/piloto/${pilotoId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(ordenesRes.status).to.equal(200);
    expect(ordenesRes.body).to.exist;

    const ordenes = ordenesRes.body.data || ordenesRes.body;

    expect(ordenes).to.be.an("array");

    console.log("Primera orden del piloto:", ordenes[0] || ordenes);
  });
});
