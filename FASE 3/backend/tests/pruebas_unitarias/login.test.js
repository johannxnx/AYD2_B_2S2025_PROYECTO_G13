const chai = require("chai");
const expect = chai.expect;
const sinon = require("sinon");
const authController = require("../../src/controllers/auth/auth.controller");
const authService = require("../../src/services/auth/auth.service");

describe("Auth Controller (Unit)", () => {
  afterEach(() => sinon.restore());

  it("Debería responder con el formato JSON correcto en login exitoso", async () => {
    // 1. Configuración del Request y Response simulados
    const req = {
      body: { email: "test@gmail.com", password: "123" },
    };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
    };

    // 2. Mock del servicio: Debe devolver lo que el controller mete dentro de "data"
    const data = {
      token: "eyJhbGci...",
      user: {
        id: 0,
        email: "test@gmail.com",
        role: "gerencia",
        nombres: "test",
        apellidos: "unitaria",
      },
    };

    const serviceData = { ok: true, mensaje: "Login exitoso", data: data };

    // Forzamos al servicio a devolver estos datos
    sinon.stub(authService, "login").resolves(serviceData);

    // 3. Ejecución
    await authController.login(req, res);

    // 4. Verificación de la respuesta
    const respuesta = res.json.getCall(0).args[0];

    expect(res.status.calledWith(200)).to.be.true;
    expect(respuesta.ok).to.be.true;
    expect(respuesta.mensaje).to.equal("Login exitoso");

    // Verificamos la ruta completa según tu JSON real: respuesta.data.user.id
    expect(respuesta.data.user.id).to.equal(0);
    expect(respuesta.data.token).to.be.a("string");
  });

  it("Debería responder con status 401 cuando las credenciales son inválidas", async () => {
    const req = {
      body: { email: "test@gmail.com", password: "CLAVE_ERRONEA" },
    };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
    };

    sinon.stub(console, "error");

    const errorSimulado = new Error("Credenciales invalidas");
    errorSimulado.statusCode = 401;

    sinon.stub(authService, "login").rejects(errorSimulado);

    await authController.login(req, res);

    const respuesta = res.json.getCall(0).args[0];

    expect(res.status.calledWith(401)).to.be.true;
    expect(respuesta.ok).to.be.false;
    expect(respuesta.mensaje).to.equal("Credenciales invalidas");
  });
});
