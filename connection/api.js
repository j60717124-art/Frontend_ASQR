//const API_BASE_URL = '';
const API_BASE_URL = 'http://localhost:8000';

// SESIÓN (sessionStorage)

function obtenerTokenSesion() {
  return sessionStorage.getItem('tokenSesion') || '';
}

function obtenerCuentaActual() {
  const datos = sessionStorage.getItem('cuentaActual');
  return datos ? JSON.parse(datos) : null;
}

function obtenerTipoCuenta() {
  return sessionStorage.getItem('tipoCuenta') || '';
}

// Guarda la sesión a partir de la respuesta real de POST /api/login
function guardarSesion(respuestaLogin) {
  sessionStorage.setItem('tokenSesion', respuestaLogin.token);
  sessionStorage.setItem('tipoCuenta', respuestaLogin.tipo);
  sessionStorage.setItem('cuentaActual', JSON.stringify(respuestaLogin.usuario));
}

function manejarSesionVencida() {
  sessionStorage.removeItem('cuentaActual');
  sessionStorage.removeItem('tipoCuenta');
  sessionStorage.removeItem('tokenSesion');


  if (!window.location.pathname.includes('/login/')) {
    window.location.href = '/modules/login/login.html';
  }
}

// HEADERS Y PETICIÓN BASE

function getHeaders() {
  const token = obtenerTokenSesion();
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    // Se envía en ambos formatos; el backend acepta cualquiera de los dos (y, como último recurso, también ?token= por query string más abajo).
    headers['X-API-Key'] = token;
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  // Añadir token como query param también (último recurso, por si algún proxy intermedio llegara a descartar los headers personalizados)
  const token = obtenerTokenSesion();
  let finalUrl = url;
  if (token) {
    const separator = url.includes('?') ? '&' : '?';
    finalUrl = `${url}${separator}token=${encodeURIComponent(token)}`;
  }

  const headers = {
    ...getHeaders(),
    ...(options.headers || {})
  };

  try {
    const respuesta = await fetch(finalUrl, {
      headers: headers,
      ...options
    });

    let datos = null;
    try {
      datos = await respuesta.json();
    } catch (_) {}

    if (respuesta.status === 401) {
      manejarSesionVencida();
      const mensaje = (datos && datos.error) ? datos.error : 'Tu sesión expiró. Vuelve a iniciar sesión.';
      throw new Error(mensaje);
    }

    if (!respuesta.ok) {
      const mensaje = (datos && datos.error) ? datos.error : `Error ${respuesta.status}`;
      throw new Error(mensaje);
    }

    return datos;
  } catch (error) {
    // Si es error de red, lanzar mensaje claro
    if (error instanceof TypeError) {
      throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté encendido.');
    }
    throw error;
  }
}

function apiGet(endpoint) {
  return apiRequest(endpoint, { method: 'GET' });
}

function apiPost(endpoint, body) {
  return apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

function apiPut(endpoint, body) {
  return apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body)
  });
}

function apiDelete(endpoint) {
  return apiRequest(endpoint, { method: 'DELETE' });
}

// AUTENTICACIÓN — atajos sobre POST /api/login (campo "accion")

// Inicia sesión y guarda el token/usuario/tipo en sessionStorage.
// usuarioOCorreo puede ser el n_usuario o el correo de la cuenta.
async function apiLogin(usuarioOCorreo, clave) {
  const datos = await apiPost('/api/login', {
    accion: 'login',
    correo: usuarioOCorreo,
    clave: clave
  });
  guardarSesion(datos);
  return datos;
}

// Paso 1 de recuperación: pide que se envíe el PIN de 6 dígitos al correo (expira en 5 minutos). Siempre responde "éxito" exista o no la cuenta.
function apiSolicitarPin(correo) {
  return apiPost('/api/login', { accion: 'solicitar_pin', correo });
}

// Paso 2 de recuperación: valida el PIN y cambia la contraseña.
function apiCambiarClave(correo, pin, nuevaClave) {
  return apiPost('/api/login', {
    accion: 'cambiar_clave',
    correo: correo,
    pin: pin,
    nueva_clave: nuevaClave
  });
}

function apiLogout() {
  manejarSesionVencida();
}