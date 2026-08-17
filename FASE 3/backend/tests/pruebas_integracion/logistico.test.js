const chai = require("chai");
const expect = chai.expect;
const request = require("supertest");
const { app } = require("../../index");

describe("Flujo Completo: Agente Logístico", function () {
  this.timeout(10000);

  let token;
  let contratoId;

  it("Debería iniciar sesión, consultar contratos y listar usuarios correctamente", async () => {
    // 1. LOGIN
    const loginRes = await request(app).post("/api/auth/login").send({
      email: "logistico@logitrans.com",
      password: "jens123",
    });

    expect(loginRes.status).to.equal(200);
    expect(loginRes.body).to.exist;

    token = loginRes.body.data?.token || loginRes.body.token;
    expect(token).to.be.a("string").and.to.not.equal("");

    // 2. CONSULTAR CONTRATOS
    const contratoRes = await request(app)
      .get("/api/contratos")
      .set("Authorization", `Bearer ${token}`);

    expect(contratoRes.status).to.equal(200);
    expect(contratoRes.body).to.exist;

    const contratos = contratoRes.body.data || contratoRes.body;

    expect(contratos).to.be.an("array");
    expect(contratos.length).to.be.greaterThan(0);

    contratoId = contratos[0]?.id;
    expect(contratoId).to.exist;

    console.log("Primer contrato obtenido:", contratos[0]);

    // 3. CONSULTAR USUARIOS
    const usuariosRes = await request(app)
      .get("/api/usuarios")
      .set("Authorization", `Bearer ${token}`);

    expect(usuariosRes.status).to.equal(200);
    expect(usuariosRes.body).to.exist;

    const usuarios = usuariosRes.body.data || usuariosRes.body;

    expect(usuarios).to.be.an("array");
    expect(usuarios.length).to.be.greaterThan(0);

    console.log("Primer usuario obtenido:", usuarios[0]);
  });
});
