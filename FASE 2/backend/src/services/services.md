# **services/**
Contiene toda la lógica de negocio. Es el cerebro de la aplicación.

**auth/**: Services de autenticación
- Cada archivo contiene la lógica específica de registro y login
- Interactúa con los modelos
- Aplica reglas de negocio específicas

**shared/**: Services compartidos
- **emailService.js**: Funciones para enviar emails (verificación, notificaciones, etc.)
- **tokenService.js**: Generación de tokens únicos, validación de expiración
- **passwordService.js**: Hash de contraseñas, comparación, generación de temporales

**notification/**:
- **notificationService.js**: Envío de notificaciones a usuarios según eventos

**¿Qué hace un service?**
- Implementa la lógica de negocio
- Valida reglas complejas
- Interactúa con la base de datos
- Orquesta operaciones complejas
- Es reutilizable