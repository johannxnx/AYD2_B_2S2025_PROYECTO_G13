const chai = require("chai");
const expect = chai.expect;
const sinon = require("sinon");

const usuarioController = require("../../src/controllers/usuarios/usuarioController");
const usuarioService = require("../../src/services/usuarios/usuarioService");

describe("Usuario Controller - modificarUsuario (Unit)", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: { id: "10" },
      body: { nombre: "Juan Perez", rol: "gerencia" },
      user: { sub: "1" },
      ip: "127.0.0.1",
    };

    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  it("Debería actualizar el usuario y devolver 200 cuando los datos son válidos", async () => {
    // 1. Datos simulados de respuesta del servicio
    const mockUsuarioActualizado = {
      id: 10,
      nombre: "Juan Perez",
      rol: "gerencia",
    };

    // 2. Stub del servicio: simulamos éxito
    const stubService = sinon
      .stub(usuarioService, "modificarUsuario")
      .resolves(mockUsuarioActualizado);

    // 3. Ejecución del controlador
    await usuarioController.modificarUsuario(req, res);

    // 4. Verificaciones
    // ¿Se llamó al servicio con los tipos de datos correctos (Number)?
    expect(stubService.calledOnceWith(10, req.body, 1, "127.0.0.1")).to.be.true;

    // ¿El status code es 200?
    expect(res.status.calledWith(200)).to.be.true;

    // ¿El JSON de respuesta es el correcto?
    expect(
      res.json.calledWith(
        sinon.match({
          ok: true,
          mensaje: "Usuario actualizado correctamente",
          data: mockUsuarioActualizado,
        }),
      ),
    ).to.be.true;
  });

  it("Debería devolver 500 (o error.status) cuando el servicio lanza una excepción", async () => {
    // 1. Simulamos un error del servicio
    const errorSimulado = new Error("Error de base de datos");
    errorSimulado.status = 400;
    errorSimulado.mensaje = "Datos inválidos";

    sinon.stub(usuarioService, "modificarUsuario").throws(errorSimulado);

    // 2. Ejecución
    await usuarioController.modificarUsuario(req, res);

    // 3. Verificaciones
    expect(res.status.calledWith(400)).to.be.true;
    expect(
      res.json.calledWith(
        sinon.match({
          ok: false,
          mensaje: "Datos inválidos",
        }),
      ),
    ).to.be.true;
  });

  it("Debería manejar el caso donde req.user no existe (usuario_ejecutor = null)", async () => {
    // Quitamos el usuario de la petición
    req.user = null;

    const stubService = sinon
      .stub(usuarioService, "modificarUsuario")
      .resolves({});

    await usuarioController.modificarUsuario(req, res);

    // Verificamos que el tercer parámetro enviado al servicio sea null
    expect(stubService.calledOnce).to.be.true;
    expect(stubService.firstCall.args[2]).to.be.null;
  });
});
