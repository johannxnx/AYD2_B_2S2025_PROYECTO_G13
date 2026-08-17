### **models/**
Define los esquemas de datos que se usarán en la base de datos. 
Cada tipo de usuario tiene su modelo específico, pero pueden compartir campos comunes heredados de un modelo base.

- **User.js**: Modelo base con campos comunes (email, password, verificado, etc.)
- **Token.js**: Para almacenar tokens de verificación con expiración
