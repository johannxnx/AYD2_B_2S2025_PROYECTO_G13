const chai = require("chai");
const expect = chai.expect;
const sinon = require("sinon");

const ordenController = require("../../src/controllers/orden/orden.controller");
const ordenService = require("../../src/services/orden/orden.service");

describe("Orden Controller - optenerOrdenUsuario (Unit)", () => {
  afterEach(() => {
    sinon.restore();
  });

  it("Debería retornar 200 y una lista de órdenes cuando el usuario tiene historial", async () => {
    // 1. Setup de la petición
    const req = {
      params: { id: "13" },
      body: {},
    };

    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
    };

    // 2. Mock de la respuesta del Service
    const mockServiceResult = {
      mensaje: "Obtención de ordenes exitosa",
      data: [
        {
          id: 16,
          numero_orden: "ORD-1775276484438",
          origen: "Quetzaltenango",
          destino: "Guatemala",
          estado: "ENTREGADA",
        },
        {
          id: 18,
          numero_orden: "ORD-1775337359422",
          origen: "Quetzaltenango",
          destino: "Guatemala",
          estado: "CERRADA",
        },
      ],
    };

    sinon.stub(ordenService, "optenerOrdenUsuario").resolves(mockServiceResult);

    // 3. Ejecución
    await ordenController.optenerOrdenUsuario(req, res);

    // 4. Verificaciones
    const respuesta = res.json.getCall(0).args[0];

    expect(res.status.calledWith(200)).to.be.true;
    expect(respuesta.ok).to.be.true;
    expect(respuesta.mensaje).to.equal("Obtención de ordenes exitosa");

    // Verificamos que 'data' sea un arreglo y tenga el contenido esperado
    expect(respuesta.data).to.be.an("array");
    expect(respuesta.data).to.have.lengthOf(2);
    expect(respuesta.data[0].numero_orden).to.equal("ORD-1775276484438");
    expect(respuesta.data[1].estado).to.equal("CERRADA");
  });

  it("Debería manejar correctamente el caso de un usuario sin órdenes", async () => {
    const req = { params: { id: "99" }, body: {} };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
    };

    // Simulamos que el servicio devuelve una lista vacía
    const mockEmptyResult = {
      mensaje: "Obtención de ordenes exitosa",
      data: [],
    };

    sinon.stub(ordenService, "optenerOrdenUsuario").resolves(mockEmptyResult);

    await ordenController.optenerOrdenUsuario(req, res);

    const respuesta = res.json.getCall(0).args[0];
    expect(respuesta.ok).to.be.true;
    expect(respuesta.data).to.be.an("array").that.is.empty;
  });
});
