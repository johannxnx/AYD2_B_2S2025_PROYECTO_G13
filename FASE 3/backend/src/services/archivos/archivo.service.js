"use strict";

// Este servicio es agnóstico: no sabe si es una orden o un perfil de usuario
async function procesarArchivosLocales(files) {
  if (!files || files.length === 0) return [];

  // Retorna solo las rutas relativas para guardar en la BD
  return files.map((file) => ({
    ruta: file.path,
    nombre: file.filename,
    mimetype: file.mimetype,
  }));
}

module.exports = { procesarArchivosLocales };
