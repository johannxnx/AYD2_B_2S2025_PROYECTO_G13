const chai = require("chai");
const expect = chai.expect;
const sinon = require("sinon");

const contratoController = require("../../src/controllers/contratos/contratoController");
const contratoService = require("../../src/services/contratos/contratoService");

describe("Contrato Controller (Unit)", () => {
  afterEach(() => sinon.restore());

  it("Debería retornar 400 si falta un campo obligatorio (ej. cliente_id)", async () => {
    const req = {
      body: { fecha_inicio: "2026-01-01" },
      user: { sub: "13" },
      ip: "127.0.0.1",
    };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
    };

    await contratoController.crearContrato(req, res);

    expect(res.status.calledWith(400)).to.be.true;
    const respuesta = res.json.getCall(0).args[0];
    expect(respuesta.mensaje).to.contain("obligatorio");
  });

  it("Debería retornar 201 si el service crea el contrato con éxito", async () => {
    const req = {
      body: {
        cliente_id: 1,
        fecha_inicio: "2026-01-01",
        fecha_fin: "2026-12-31",
        limite_credito: 5000,
        plazo_pago: 30,
      },
      user: { sub: "13" },
      ip: "127.0.0.1",
    };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
    };

    const mockContrato = { id: 50, numero_contrato: "CONT-2026-001" };
    sinon.stub(contratoService, "crearContrato").resolves(mockContrato);

    await contratoController.crearContrato(req, res);

    expect(res.status.calledWith(201)).to.be.true;
    const respuesta = res.json.getCall(0).args[0];
    expect(respuesta.ok).to.be.true;
    expect(respuesta.data.id).to.equal(50);
  });
});
