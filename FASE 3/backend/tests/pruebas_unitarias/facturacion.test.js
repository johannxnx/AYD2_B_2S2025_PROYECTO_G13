const chai = require("chai");
const expect = chai.expect;
const sinon = require("sinon");

const facturacionService = require("../../src/services/facturacion/Facturacion");
const FacturaFEL = require("../../src/models/facturacion/FacturaFel");
const Contrato = require("../../src/models/contratos/Contrato");

describe("Facturacion Service - certificarFactura (Unit)", () => {
  afterEach(() => {
    sinon.restore();
  });

  it("Debería lanzar error 404 si la factura no existe", async () => {
    sinon.stub(FacturaFEL, "buscarPorId").resolves(null);

    try {
      await facturacionService.certificarFactura(99, 1);
      expect.fail("Debería haber lanzado un error");
    } catch (error) {
      expect(error.status).to.equal(404);
      expect(error.message).to.contain("no encontrada");
    }
  });

  it("Debería lanzar error 422 si la factura no está en estado VALIDADA", async () => {
    sinon.stub(FacturaFEL, "buscarPorId").resolves({
      id: 10,
      estado: "BORRADOR",
    });

    try {
      await facturacionService.certificarFactura(10, 1);
      expect.fail("Debería haber lanzado un error");
    } catch (error) {
      expect(error.status).to.equal(422);
      expect(error.message).to.contain("VALIDADA");
    }
  });
});
