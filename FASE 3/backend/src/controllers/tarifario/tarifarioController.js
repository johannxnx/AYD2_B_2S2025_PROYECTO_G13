// controllers/tarifario/tarifarioController.js
const tarifarioService = require('../../services/tarifario/tarifarioService');

const obtenerTarifario = async (req, res) => {
  try {
    const tarifas = await tarifarioService.obtenerTarifario();
    res.status(200).json({ ok: true, data: tarifas });
  } catch (error) {
    res.status(error.status || 500).json({ ok: false, mensaje: error.mensaje || 'Error al obtener tarifario' });
  }
};

const obtenerTarifaPorTipo = async (req, res) => {
  try {
    const { tipo_unidad } = req.params;
    const tarifa = await tarifarioService.obtenerTarifaPorTipo(tipo_unidad.toUpperCase());
    res.status(200).json({ ok: true, data: tarifa });
  } catch (error) {
    res.status(error.status || 500).json({ ok: false, mensaje: error.mensaje || 'Error al obtener tarifa' });
  }
};

const actualizarTarifa = async (req, res) => {
  try {
    const { tipo_unidad }  = req.params;
    const datos            = req.body;
    const usuario_ejecutor  = req.user ? Number(req.user.sub) : null;
    const ip               = req.ip;

    if (!datos.limite_peso_ton || !datos.costo_base_km) {
      return res.status(400).json({ ok: false, mensaje: 'Los campos limite_peso_ton y costo_base_km son obligatorios' });
    }

    const tarifaActualizada = await tarifarioService.actualizarTarifa(tipo_unidad.toUpperCase(), datos, usuario_ejecutor, ip);
    res.status(200).json({ ok: true, mensaje: `Tarifa de ${tipo_unidad.toUpperCase()} actualizada correctamente`, data: tarifaActualizada });
  } catch (error) {
    res.status(error.status || 500).json({ ok: false, mensaje: error.mensaje || 'Error al actualizar tarifa' });
  }
};

const obtenerRangosReferencia = (req, res) => {
  try {
    const rangos = tarifarioService.obtenerRangosReferencia();
    res.status(200).json({ ok: true, data: rangos });
  } catch (error) {
    res.status(error.status || 500).json({ ok: false, mensaje: error.mensaje || 'Error al obtener rangos' });
  }
};

module.exports = {
  obtenerTarifario,
  obtenerTarifaPorTipo,
  actualizarTarifa,
  obtenerRangosReferencia
};