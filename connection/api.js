const API_BASE_URL = 'http://localhost:8000';

function obtenerTokenSesion() {
  return sessionStorage.getItem('tokenSesion') || '';
}

function manejarSesionVencida() {
  sessionStorage.removeItem('cuentaActual');
  sessionStorage.removeItem('tipoCuenta');
  sessionStorage.removeItem('tokenSesion');

  if (!window.location.pathname.includes('/login/')) {
    window.location.href = '../login/indexlogin.html';
  }
}

function getHeaders() {
  const token = obtenerTokenSesion();
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    // Enviar en ambos formatos para asegurar
    headers['X-API-Key'] = token;
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  // Añadir token como query param también (último recurso)
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