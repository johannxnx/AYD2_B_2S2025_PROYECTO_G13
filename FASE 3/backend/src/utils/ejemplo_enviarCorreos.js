



const {
  notificarCorrecto,
  notificarIncorrecto,
  notificarInformativo,
} = require("./mailer");

async function probarMailer() {
  const correoDestino = "3035111680110@ingenieria.usac.edu.gt";
  const nombreDestino = "Usuario de Prueba";

  console.log("Iniciando pruebas de correo...");

  // 1) Correo de éxito
  try {
    await notificarCorrecto(
      correoDestino,
      nombreDestino,
      "La operación de prueba se completó correctamente.",
      {
        titulo: "Prueba de Correo Correcto",
        detalle: "Este correo confirma que la plantilla verde funciona correctamente.",
      }
    );
    console.log("Correo CORRECTO enviado con éxito.");
  } catch (error) {
    console.error("Error al enviar correo CORRECTO:", error.message);
  }

  // 2) Correo de error
  try {
    await notificarIncorrecto(
      correoDestino,
      nombreDestino,
      "Se detectó un problema durante la ejecución de la prueba.",
      {
        titulo: "Prueba de Correo Incorrecto",
        detalle: "Este correo valida que la plantilla roja funciona correctamente.",
        codigo: "TEST-ERR-001",
      }
    );
    console.log("Correo INCORRECTO enviado con éxito.");
  } catch (error) {
    console.error("Error al enviar correo INCORRECTO:", error.message);
  }

  // 3) Correo informativo
  try {
    await notificarInformativo(
      correoDestino,
      nombreDestino,
      "Esta es una notificación informativa de prueba.",
      {
        titulo: "Prueba de Correo Informativo",
        detalle: "Este correo valida que la plantilla azul funciona correctamente.",
        datos: [
          { etiqueta: "Módulo", valor: "Mailer" },
          { etiqueta: "Ambiente", valor: process.env.NODE_ENV || "development" },
          { etiqueta: "Estado", valor: "Prueba ejecutada" },
        ],
      }
    );
    console.log("Correo INFORMATIVO enviado con éxito.");
  } catch (error) {
    console.error("Error al enviar correo INFORMATIVO:", error.message);
  }

  console.log("Pruebas finalizadas.");
}

probarMailer();