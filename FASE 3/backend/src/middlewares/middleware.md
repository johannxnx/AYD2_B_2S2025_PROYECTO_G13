### **middlewares/**
Funciones que se ejecutan antes de llegar a los controllers. Son el guardián de las rutas.

**auth/**: Middlewares de autenticación
- **verifyToken.js**: Verifica que el token JWT sea válido

**validation/**: Middlewares de validación de datos
- Cada archivo valida los datos específicos de cada tipo de usuario en registro/login
- Usa librerías como `express-validator` o `joi`

**Otros:**
- **errorHandler.js**: Captura y formatea todos los errores del sistema
- **upload.js**: Maneja la subida de archivos (fotos de socios)
