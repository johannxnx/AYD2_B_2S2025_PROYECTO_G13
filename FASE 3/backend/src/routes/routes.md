# **routes/**
Define todos los endpoints de la API y los conecta con sus controllers.

**inicio_rutas.js**: 
- Es el HUB central
- Importa todas las rutas modulares
- Las organiza con prefijos claros
- Ejemplo:
  ```
  /api/auth/cliente/registro
  /api/auth/agente/registro
  /api/auth/compania/registro
  /api/auth/admin/registro
  /api/verification/email
  /api/verification/token
  ```

**auth/**: Rutas de autenticación separadas por tipo de usuario
- Cada archivo define sus endpoints específicos
- Usa middlewares de validación específicos
- Conecta con su controller correspondiente

**cliente/**
- ...

**verification/**:
- Rutas para verificar emails y tokens

**ruta/**
- ...