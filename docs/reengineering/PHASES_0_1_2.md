# TotalPlus frontend — reingeniería

Base `main` del 2026-10-25: `b81f6c5b648c852ad8eaeaba32385e416d07182d`.
Rama aislada: `reengineering/phase0-2-20261025`.

En las fases 0-2 se priorizan controles transaccionales y de autorización **en el backend**.
El frontend mantiene por ahora sus contratos existentes con `/sales`, `/credit-details`, `/credit-customer-details` y reportes.

Validación obligatoria previa a integración:
- `npm ci`
- `npm run lint`
- `npm run build`
- Verificar estado 403/404/422 para ventas, cartera y reportes.
- Ensayar dos empresas con roles diferentes.
- No almacenar tokens de Laravel en localStorage.
- No desplegar sin probar en conjunto con la nueva rama de backend.

Pendientes de la siguiente fase: migrar peticiones a un cliente unificado, mejorar la gestión de errores y agregar pruebas de integración para ventas.
