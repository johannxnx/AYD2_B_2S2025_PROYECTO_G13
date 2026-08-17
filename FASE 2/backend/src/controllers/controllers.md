### **4. controllers/**
Manejan las peticiones HTTP y coordinan la respuesta. Son el puente entre las rutas y los services.

**auth/**: Controllers de autenticación
- Cada archivo maneja las peticiones de registro y login de su tipo de usuario
- Reciben datos de la petición, llaman al service correspondiente, y devuelven la respuesta

**verification/**:
- **verificationController.js**: Maneja la verificación de emails y tokens

**¿Qué hace un controller?**
- Recibe la petición HTTP (req, res)
- Extrae y valida datos básicos
- Llama al service apropiado
- Formatea y envía la respuesta