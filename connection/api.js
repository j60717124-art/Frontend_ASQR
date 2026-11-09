//CAPA DE ACCESO A LA API + SESIÓN

const CFG = window.ASQR_CONFIG || { API_BASE_URL: 'http://localhost:8000', TIMEOUT_MS: 60000, ROLES_ADMIN: ['Administrador', 'Direccion'], ROLES_PERSONAL: ['Administrador', 'Direccion', 'Secretaria'] };
const RUTA_LOGIN = '/modules/login/login.html';
const RUTA_INICIO = '/modules/inicio/dashboard/inicio.html';
const RUTA_ESCANER = '/modules/escaner_qr/escaner_qr.html';

class ApiError extends Error {
  constructor(mensaje, { status = 0, datos = null, tipo = 'api' } = {}) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
    this.datos = datos;
    this.tipo = tipo;
  }
}

// SESIÓN
function obtenerTokenSesion() {
  return sessionStorage.getItem('tokenSesion') || '';
}

function obtenerCuentaActual() {
  try {
    const datos = sessionStorage.getItem('cuentaActual');
    return datos ? JSON.parse(datos) : null;
  } catch (_) {
    return null;
  }
}

function obtenerTipoCuenta() {
  return sessionStorage.getItem('tipoCuenta') || '';
}

function guardarSesion(respuestaLogin) {
  if (!respuestaLogin || !respuestaLogin.token) throw new ApiError('Respuesta de inicio de sesión inválida.');
  sessionStorage.setItem('tokenSesion', respuestaLogin.token);
  sessionStorage.setItem('tipoCuenta', respuestaLogin.tipo || '');
  sessionStorage.setItem('cuentaActual', JSON.stringify(respuestaLogin.usuario || {}));
}

function limpiarSesion() {
  ['tokenSesion', 'tipoCuenta', 'cuentaActual'].forEach((k) => sessionStorage.removeItem(k));
}

// Fecha de expiración (ms)
function expiracionToken() {
  try {
    const payload = obtenerTokenSesion().split('.')[0];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const exp = Number(JSON.parse(json).exp);
    return exp ? exp * 1000 : 0;
  } catch (_) {
    return 0;
  }
}

function sesionVigente() {
  if (!obtenerTokenSesion()) return false;
  const exp = expiracionToken();
  return exp === 0 || exp > Date.now();
}

// Mensaje que se mostrará (como toast). Lo lee ui.js.
function dejarMensajePendiente(texto, tipo = 'info') {
  try { sessionStorage.setItem('flashMensaje', JSON.stringify({ texto, tipo })); } catch (_) { /* nada */ }
}

function manejarSesionVencida(mensaje) {
  limpiarSesion();
  if (mensaje) dejarMensajePendiente(mensaje, 'warning');
  if (!window.location.pathname.includes('/login/')) {
    window.__redirigiendo = true;
    window.location.replace(RUTA_LOGIN);
  }
}

// ROLES
const _normRol = (r) => String(r || '').trim().toLowerCase();

function tieneRol(roles) {
  const actual = _normRol(obtenerTipoCuenta());
  return (Array.isArray(roles) ? roles : [roles]).some((r) => _normRol(r) === actual);
}

const esAdmin = () => tieneRol(CFG.ROLES_ADMIN);
const puedeGestionarMatricula = () => tieneRol(CFG.ROLES_PERSONAL);

function rutaInicioPorRol() {
  return _normRol(obtenerTipoCuenta()) === 'docente' ? RUTA_ESCANER : RUTA_INICIO;
}

// PETICIONES A LA API
function getHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = obtenerTokenSesion();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['X-API-Key'] = token;
  }
  return headers;
}

function construirUrl(endpoint) {
  const ruta = String(endpoint).startsWith('/') ? String(endpoint) : `/${endpoint}`;
  return `${CFG.API_BASE_URL}${ruta.startsWith('/api/') ? ruta : `/api${ruta}`}`;
}

const _esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function _enviar(url, options) {
  const controlador = new AbortController();
  const timer = setTimeout(() => controlador.abort(), CFG.TIMEOUT_MS || 60000);
  try {
    return await fetch(url, { ...options, headers: { ...getHeaders(), ...(options.headers || {}) }, signal: controlador.signal });
  } catch (e) {
    if (e && e.name === 'AbortError') {
      throw new ApiError('El servidor tardó demasiado en responder. Puede estar iniciando; intenta de nuevo en unos segundos.', { tipo: 'timeout' });
    }
    throw new ApiError('No se pudo conectar con el servidor. Verifica tu conexión a internet.', { tipo: 'red' });
  } finally {
    clearTimeout(timer);
  }
}

async function apiRequest(endpoint, options = {}) {
  const url = construirUrl(endpoint);
  const metodo = (options.method || 'GET').toUpperCase();

  let respuesta;
  try {
    respuesta = await _enviar(url, options);
  } catch (e) {
    if (metodo === 'GET' && (e.tipo === 'red' || e.tipo === 'timeout')) {
      await _esperar(1500);
      respuesta = await _enviar(url, options);
    } else {
      throw e;
    }
  }

  if (metodo === 'GET' && [502, 503, 504].includes(respuesta.status)) {
    await _esperar(1500);
    respuesta = await _enviar(url, options);
  }

  let datos = null;
  try { datos = await respuesta.json(); } catch (_) { /* respuesta sin JSON */ }

  if (respuesta.status === 401 && !window.location.pathname.includes('/login/')) {
    const mensaje = (datos && datos.error) || 'Tu sesión expiró. Vuelve a iniciar sesión.';
    manejarSesionVencida(mensaje);
    throw new ApiError(mensaje, { status: 401, datos, tipo: 'sesion' });
  }

  if (!respuesta.ok) {
    const porDefecto = respuesta.status === 403 ? 'No tienes permiso para realizar esta acción.'
      : respuesta.status >= 500 ? 'El servidor tuvo un problema. Inténtalo de nuevo en unos minutos.'
      : `Error ${respuesta.status}`;
    throw new ApiError((datos && datos.error) || porDefecto, {
      status: respuesta.status,
      datos,
      tipo: respuesta.status === 403 ? 'permiso' : 'api',
    });
  }

  return datos;
}

const apiGet = (endpoint) => apiRequest(endpoint, { method: 'GET' });
const apiPost = (endpoint, body) => apiRequest(endpoint, { method: 'POST', body: JSON.stringify(body ?? {}) });
const apiPut = (endpoint, body) => apiRequest(endpoint, { method: 'PUT', body: JSON.stringify(body ?? {}) });
const apiDelete = (endpoint) => apiRequest(endpoint, { method: 'DELETE' });

// AUTENTICACIÓN (POST /api/login, campo "accion")
async function apiLogin(usuarioOCorreo, clave) {
  const datos = await apiPost('/login', { accion: 'login', correo: usuarioOCorreo, clave });
  guardarSesion(datos);
  return datos;
}

// Paso de recuperación: envía un PIN de 6 dígitos al correo. Responde "éxito" exista o no la cuenta.
const apiSolicitarPin = (correo) => apiPost('/login', { accion: 'solicitar_pin', correo });

// Paso para validar el PIN (máx. 3 intentos) y cambia la contraseña.
const apiCambiarClave = (correo, pin, nuevaClave) =>
  apiPost('/login', { accion: 'cambiar_clave', correo, pin, nueva_clave: nuevaClave });

function apiLogout() {
  limpiarSesion();
  window.location.replace(RUTA_LOGIN);
}