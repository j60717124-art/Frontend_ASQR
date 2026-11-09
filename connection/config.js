// Configuración del frontend. Se carga ANTES que api.js en todas las páginas.
(() => {
  const local = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  window.ASQR_CONFIG = Object.freeze({
    API_BASE_URL: String(window.ASQR_API_URL || (local ? 'http://localhost:8000' : 'https://backend-asqr.onrender.com')).replace(/\/+$/, ''),
    TIMEOUT_MS: 60000,
    // Roles (comparación sin distinguir mayúsculas)
    ROLES_ADMIN: ['Administrador', 'Direccion'],
    ROLES_PERSONAL: ['Administrador', 'Direccion', 'Secretaria'],
  });
})();