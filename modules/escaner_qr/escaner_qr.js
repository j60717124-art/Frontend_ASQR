// ESCÁNER QR · Conectado al Backend
(() => {
  'use strict';

  const CONFIG = {
    cooldownMs: 3000,
    jsqrIntervalMs: 220,
  };

  const $ = (sel) => document.querySelector(sel);
  const viewport = $('#viewport'), video = $('#video'), canvas = $('#canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const btnActivar = $('#btnActivar'), btnReintentar = $('#btnReintentar');
  const btnApagar = $('#btnApagar'), btnGirar = $('#btnGirar'), btnSonido = $('#btnSonido');
  const camIdle = $('#camIdle'), camError = $('#camError'), errTitulo = $('#errTitulo'), errTexto = $('#errTexto');
  const chipTexto = $('#chipTexto'), flash = $('#flash');
  const resultado = $('#resultado'), resIcono = $('#resIcono'), resTitulo = $('#resTitulo'), resMensaje = $('#resMensaje'), resEstudiante = $('#resEstudiante');
  const formManual = $('#formManual'), manualCodigo = $('#manualCodigo');
  const logLista = $('#logLista'), logVacio = $('#logVacio'), logResumen = $('#logResumen'), stOk = $('#stOk'), stNo = $('#stNo');
  const reloj = $('#reloj'), fechaHoy = $('#fechaHoy');
  const selectHorario = $('#selectHorario');
  const state = {
    stream: null, detector: null, track: null, facingMode: 'environment',
    scanning: false, jsqrTimer: null, rafId: null, sonido: true,
    ultimoCodigo: null, ultimoTs: 0,
    registros: [], horarios: [], horarioSeleccionado: null,
    procesando: false,
    inscritos: {}
  };

  // UTILIDADES
  const fmtHora = (d = new Date()) => d.toLocaleTimeString('es-ES', { hour12: false });
  const fmtFechaLarga = (d = new Date()) => {
    const t = d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return t.charAt(0).toUpperCase() + t.slice(1);
  };

  function tickReloj() { reloj.textContent = fmtHora(); fechaHoy.textContent = fmtFechaLarga(); }
  tickReloj(); setInterval(tickReloj, 1000);

  function toast(msg, tipo = 'info', ms) {
    if (typeof mostrarToast === 'function') {
      mostrarToast(msg, tipo === 'ok' ? 'success' : tipo === 'err' ? 'error' : 'info', ms);
    } else {
      console.log(`[Toast ${tipo}] ${msg}`);
    }
  }

  let audioCtx = null;
  function beep(ok = true) {
    if (!state.sonido) return;
    try {
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
      osc.type = 'sine'; osc.frequency.value = ok ? 880 : 220;
      gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, audioCtx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.18);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(); osc.stop(audioCtx.currentTime + 0.2);
    } catch { }
  }

  const inicialesDe = (nombre) => String(nombre || '?').trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase() || '?';
  const escaparHTML = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ICONOS = { idle: '⌛', scanning: '🔍', ok: '✓', tarde: '⏱', error: '✕' };

  function pintarResultado(estado, titulo, mensaje, estudiante = null) {
    resultado.dataset.estado = estado;
    resIcono.textContent = ICONOS[estado] || '•';
    resTitulo.textContent = titulo;
    resMensaje.textContent = mensaje;

    if (estudiante) {
      const iniciales = inicialesDe(estudiante.nombre);
      const badgeCls = estado === 'ok' ? 'badge badge--ok' : estado === 'tarde' ? 'badge badge--late' : 'badge badge--out';
      const badgeTxt = estado === 'ok' ? 'Presente' : estado === 'tarde' ? 'Tardanza' : 'Rechazado';
      resEstudiante.innerHTML = `<strong>${escaparHTML(iniciales)} · ${escaparHTML(estudiante.nombre)}</strong><span>${escaparHTML(estudiante.curso || '—')}</span><span class="${badgeCls}">${badgeTxt}</span>`;
      resEstudiante.hidden = false;
    } else {
      resEstudiante.hidden = true; resEstudiante.innerHTML = '';
    }
  }

  function pintarRegistros() {
    logLista.innerHTML = '';
    const total = state.registros.length;
    const ok = state.registros.filter(r => r.estado === 'ok').length;
    const tarde = state.registros.filter(r => r.estado === 'tarde').length;
    const out = state.registros.filter(r => r.estado === 'error').length;
    stOk.textContent = `${ok + tarde} aceptados`; stNo.textContent = `${out} rechazados`;
    logResumen.textContent = total ? `${total} registro${total === 1 ? '' : 's'} hoy · ${tarde} tardanza${tarde === 1 ? '' : 's'}` : 'Aún no hay registros.';
    logVacio.hidden = total > 0;
    [...state.registros].reverse().forEach(r => {
      const iniciales = inicialesDe(r.nombre || r.codigo);
      const avatarCls = r.estado === 'ok' ? 'log__avatar log__avatar--ok' : r.estado === 'tarde' ? 'log__avatar log__avatar--late' : 'log__avatar log__avatar--out';
      const badgeCls = r.estado === 'ok' ? 'badge badge--ok' : r.estado === 'tarde' ? 'badge badge--late' : 'badge badge--out';
      const badgeTxt = r.estado === 'ok' ? 'Presente' : r.estado === 'tarde' ? 'Tardanza' : 'Rechazado';
      const li = document.createElement('li');
      const detalle = r.origen === 'docente' ? (r.curso || '—') : `${r.curso || '—'} · ${r.origen === 'manual' ? 'Manual' : 'QR'}`;
      li.innerHTML = `<div class="${avatarCls}">${escaparHTML(iniciales)}</div><div class="log__info"><strong>${escaparHTML(r.nombre || 'Desconocido')}</strong><span>${escaparHTML(detalle)}</span></div><span class="badge ${badgeCls.replace('badge ', '')}">${badgeTxt}</span><span class="log__hora">${escaparHTML(r.hora)}</span>`;
      logLista.appendChild(li);
    });
  }

  //  REGISTRO DE ASISTENCIA
  async function registrar(codigo) {
    if (codigo.startsWith('QRI:')) return registrarAsistenciaDocente(codigo);

    if (!state.horarioSeleccionado) {
      toast('Selecciona una materia primero', 'err');
      pintarResultado('error', 'Sin materia seleccionada', 'Elige el horario arriba antes de escanear a un estudiante.');
      selectHorario.focus();
      return;
    }
    return registrarAsistenciaEstudiante(codigo);
  }

  async function registrarAsistenciaEstudiante(codigoQr) {
    if (state.procesando) return;
    state.procesando = true;
    const hora = fmtHora();
    try {
      const response = await apiPost('/asistencia-estudiantes', {
        codigo_qr: codigoQr,
        horario_idhorario: state.horarioSeleccionado
      });

      const estadoBackend = response.estado || 'Presente';
      const estadoUi = estadoBackend === 'Tardanza' ? 'tarde' : 'ok';
      const nombre = response.estudiante_nombre || 'Estudiante';

      pintarResultado(estadoUi, `Asistencia: ${estadoBackend}`, `Registrado a las ${hora}`, {
        nombre, curso: response.materia_nombre || '—'
      });
      beep(true); flashBlanco();
      toast(`${estadoBackend} · ${nombre}`, 'ok');

      state.registros.push({ codigo: codigoQr, nombre, curso: response.materia_nombre || '—', hora, estado: estadoUi, origen: 'qr' });
      pintarRegistros();
    } catch (err) {
      beep(false); flashRojo();
      const msg = typeof mensajeDeError === 'function' ? mensajeDeError(err, 'No se pudo registrar la asistencia.') : 'Error de conexión.';
      pintarResultado('error', 'No se registró la asistencia', msg);
      if (typeof mostrarError === 'function') mostrarError(err, 'No se pudo registrar la asistencia.');
      state.registros.push({ codigo: codigoQr, nombre: 'No identificado', curso: msg, hora, estado: 'error', origen: 'qr' });
      pintarRegistros();
    } finally {
      state.procesando = false;
    }
  }

  function obtenerUbicacion() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Tu navegador no permite obtener la ubicación.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, (e) => {
        const msg = e.code === 1 ? 'Debes permitir el acceso a tu ubicación para marcar tu asistencia.'
          : e.code === 3 ? 'Se agotó el tiempo para obtener tu ubicación. Sal a un lugar abierto e intenta de nuevo.'
          : 'No se pudo obtener tu ubicación. Activa el GPS e intenta de nuevo.';
        reject(new Error(msg));
      }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
    });
  }

  async function registrarAsistenciaDocente(codigoCompleto) {
    if (state.procesando) return;

    const partes = codigoCompleto.split(':');
    if (partes.length !== 3 || !partes[1] || !partes[2]) {
      beep(false); flashRojo();
      pintarResultado('error', 'QR institucional inválido', 'El código no tiene el formato esperado.');
      toast('QR institucional inválido', 'err');
      return;
    }
    const [, codigo, firma] = partes;

    state.procesando = true;
    if (typeof mostrarLoader === 'function') mostrarLoader('Obteniendo tu ubicación…');
    let pos;
    try {
      pos = await obtenerUbicacion();
    } catch (e) {
      if (typeof ocultarLoader === 'function') ocultarLoader();
      state.procesando = false;
      beep(false); flashRojo();
      pintarResultado('error', 'No se pudo marcar tu asistencia', e.message);
      if (typeof mostrarError === 'function') mostrarError(e);
      return;
    }

    try {
      const response = await apiPost('/asistencia-docentes', {
        codigo_qr: codigo, firma_qr: firma,
        latitud: pos.coords.latitude, longitud: pos.coords.longitude
      });
      registrarResultadoDocente(response);
    } catch (err) {
      if (err.datos && err.datos.resultado === 'Rechazado') {
        registrarResultadoDocente(err.datos);
      } else {
        beep(false); flashRojo();
        const msg = typeof mensajeDeError === 'function' ? mensajeDeError(err) : 'Error de conexión.';
        pintarResultado('error', 'No se pudo marcar tu asistencia', msg);
        if (typeof mostrarError === 'function') mostrarError(err, 'No se pudo marcar tu asistencia.');
      }
    } finally {
      if (typeof ocultarLoader === 'function') ocultarLoader();
      state.procesando = false;
    }
  }

  function registrarResultadoDocente(response) {
    const aceptado = response.resultado === 'Aceptado';
    const motivo = response.motivo_rechazo || 'Asistencia rechazada.';
    pintarResultado(aceptado ? 'ok' : 'error',
      aceptado ? 'Asistencia docente registrada' : 'Asistencia rechazada',
      aceptado ? `Marcada a las ${fmtHora()}` : motivo,
      { nombre: 'Asistencia institucional', curso: aceptado ? 'Dentro de la geocerca' : motivo }
    );
    beep(aceptado); aceptado ? flashBlanco() : flashRojo();
    toast(aceptado ? 'Asistencia docente registrada' : motivo, aceptado ? 'ok' : 'err');

    state.registros.push({
      codigo: 'DOCENTE', nombre: 'Asistencia docente', curso: aceptado ? 'Aceptada' : motivo, hora: fmtHora(),
      estado: aceptado ? 'ok' : 'error', origen: 'docente'
    });
    pintarRegistros();
  }

  function flashBlanco() { flash.style.background = '#fff'; flash.classList.add('is-active'); setTimeout(() => flash.classList.remove('is-active'), 180); }
  function flashRojo() { flash.style.background = '#ef4444'; flash.classList.add('is-active'); setTimeout(() => flash.classList.remove('is-active'), 220); }
  function onCodigoDetectado(codigo) {
    if (!codigo) return;
    codigo = String(codigo).trim();
    const ahora = Date.now();
    if (codigo === state.ultimoCodigo && (ahora - state.ultimoTs) < CONFIG.cooldownMs) return;
    state.ultimoCodigo = codigo; state.ultimoTs = ahora;
    registrar(codigo);
  }

  function mostrarEstadoChip(txt, activo = false) { chipTexto.textContent = txt; viewport.dataset.state = activo ? 'scanning' : 'idle'; }
  function mostrarErrorCamara(titulo, texto) { errTitulo.textContent = titulo; errTexto.textContent = texto; camError.hidden = false; camIdle.hidden = true; mostrarEstadoChip('Cámara apagada', false); }
  function ocultarMensajes() { camIdle.hidden = true; camError.hidden = true; }

  // CÁMARA
  async function iniciarCamara() {
    ocultarMensajes(); mostrarEstadoChip('Iniciando cámara…', false); viewport.dataset.state = 'starting';

    //  Verificar si estamos en un entorno seguro
    if (!window.isSecureContext) {
      mostrarErrorCamara('Se requiere conexión segura (HTTPS)', 'La cámara solo funciona en "localhost" o en sitios con "https://". Si estás accediendo desde una IP de red local (ej. 192.168...), el navegador bloqueará la cámara por seguridad.');
      return;
    }

    //  Verificar si el navegador soporta la API de cámara
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      mostrarErrorCamara('Cámara no soportada', 'Tu navegador no permite usar la cámara. Prueba actualizando a la última versión de Chrome o Edge.');
      return;
    }

    try {
      //  Intentar obtener el permiso de la cámara
      state.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: state.facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false
      });

      video.srcObject = state.stream;
      await video.play();

      state.track = state.stream.getVideoTracks()[0];
      btnApagar.hidden = false;
      btnGirar.hidden = (state.stream.getVideoTracks().length <= 1);
      mostrarEstadoChip('Cámara activa · Buscando QR…', true);
      viewport.dataset.state = 'scanning';
      await prepararDetector();
      arrancarEscaneo();
      pintarResultado('scanning', 'Esperando QR…', 'Acerca la tarjeta al marco.');
      toast('Cámara activada', 'ok');

    } catch (err) {
      console.error('[escáner]', err);
      detenerCamara();

      //  Traducir errores a mensajes útiles
      const mensajes = {
        NotAllowedError: 'Permiso denegado. Haz clic en el candado (🔒) en la barra de direcciones y permite el acceso a la cámara.',
        SecurityError: 'Permiso denegado. Habilita la cámara para este sitio.',
        NotFoundError: 'No se encontró ninguna cámara. Si estás en una laptop, verifica que la tapa esté abierta. Si estás en PC, conecta una webcam.',
        NotReadableError: 'La cámara está siendo usada por otra aplicación (Zoom, Teams, etc.). Ciérrala e intenta de nuevo.',
        OverconstrainedError: 'La cámara no soporta la resolución solicitada. Intenta con otra cámara.'
      };

      mostrarErrorCamara('No se pudo usar la cámara', mensajes[err.name] || err.message || 'Error desconocido.');
    }
  }

  async function prepararDetector() {
    if ('BarcodeDetector' in window) {
      try {
        const formatos = await BarcodeDetector.getSupportedFormats();
        if (formatos.includes('qr_code')) { state.detector = new BarcodeDetector({ formats: ['qr_code'] }); return; }
      } catch { }
    }
    state.detector = null;
  }

  function arrancarEscaneo() {
    if (!state.stream) return;
    state.scanning = true;
    state.detector ? bucleBarcodeDetector() : bucleJsQR();
  }

  async function bucleBarcodeDetector() {
    if (!state.scanning || !state.detector) return;
    try {
      if (video.readyState >= 2 && video.videoWidth) {
        const codes = await state.detector.detect(video);
        if (codes && codes.length) onCodigoDetectado(codes[0].rawValue);
      }
    } catch { }
    state.rafId = requestAnimationFrame(bucleBarcodeDetector);
  }

  function bucleJsQR() {
    if (!state.scanning) return;
    const paso = () => {
      if (!state.scanning) return;
      if (video.readyState >= 2 && video.videoWidth) {
        const w = video.videoWidth, h = video.videoHeight;
        const escala = Math.min(1, 640 / w);
        canvas.width = Math.round(w * escala); canvas.height = Math.round(h * escala);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        if (typeof window.jsQR === 'function') {
          const res = window.jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
          if (res && res.data) onCodigoDetectado(res.data);
        }
      }
      state.jsqrTimer = setTimeout(paso, CONFIG.jsqrIntervalMs);
    };
    paso();
  }

  function detenerCamara() {
    state.scanning = false;
    clearTimeout(state.jsqrTimer); cancelAnimationFrame(state.rafId);
    if (state.stream) { state.stream.getTracks().forEach(t => t.stop()); state.stream = null; }
    if (video.srcObject) video.srcObject = null;
    state.track = null;
    btnApagar.hidden = true; btnGirar.hidden = true;
    camIdle.hidden = false; camError.hidden = true;
    mostrarEstadoChip('Cámara apagada', false);
    pintarResultado('idle', 'Esperando escaneo', 'Acerca la tarjeta del estudiante al marco.');
  }

  async function girarCamara() {
    if (!state.stream) return;
    state.facingMode = state.facingMode === 'environment' ? 'user' : 'environment';
    detenerCamara(); await iniciarCamara();
  }

  //  CARGA DE HORARIOS
  const ETIQUETA_DIA = { LUNES: 'Lunes', MARTES: 'Martes', MIERCOLES: 'Miércoles', JUEVES: 'Jueves', VIERNES: 'Viernes', SABADO: 'Sábado', DOMINGO: 'Domingo' };
  const diaHoyBolivia = () => {
    const nombre = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'America/La_Paz' }).format(new Date());
    return { Sunday: 'DOMINGO', Monday: 'LUNES', Tuesday: 'MARTES', Wednesday: 'MIERCOLES', Thursday: 'JUEVES', Friday: 'VIERNES', Saturday: 'SABADO' }[nombre];
  };

  const opcionHorario = (h, deshabilitada = false) =>
    `<option value="${h.idhorario}"${deshabilitada ? ' disabled' : ''}>${escaparHTML(ETIQUETA_DIA[h.dia] ?? h.dia)} ${escaparHTML(String(h.hora_inicio).slice(0, 5))}-${escaparHTML(String(h.hora_fin).slice(0, 5))} · ${escaparHTML(h.nombre_materia)} (${escaparHTML(h.aula_nombre)})</option>`;

  async function cargarHorarios() {
    selectHorario.disabled = true;
    selectHorario.innerHTML = '<option value="">Cargando horarios…</option>';
    try {
      const lista = await apiGet('/mis-horarios');
      state.horarios = lista || [];

      if (!state.horarios.length) {
        selectHorario.innerHTML = '<option value="">No tienes horarios asignados</option>';
        toast('Todavía no tienes horarios asignados. Consulta con Dirección.', 'info');
        return;
      }

      const hoy = diaHoyBolivia();
      const deHoy = state.horarios.filter(h => h.dia === hoy);
      const otras = state.horarios.filter(h => h.dia !== hoy);
      selectHorario.innerHTML = '<option value="">-- Selecciona una materia --</option>' +
        (deHoy.length ? `<optgroup label="Hoy (${ETIQUETA_DIA[hoy]})">${deHoy.map(opcionHorario).join('')}</optgroup>` : '') +
        (otras.length ? `<optgroup label="Otros días (no disponibles hoy)">${otras.map((h) => opcionHorario(h, true)).join('')}</optgroup>` : '');

      if (deHoy.length === 1) {
        selectHorario.value = String(deHoy[0].idhorario);
        state.horarioSeleccionado = deHoy[0].idhorario;
        pintarResultado('idle', 'Esperando escaneo', 'Acerca la tarjeta del estudiante al marco.');
      }
    } catch (err) {
      selectHorario.innerHTML = '<option value="">No se pudieron cargar los horarios</option>';
      toast('No se pudieron cargar tus horarios. Recarga la página.', 'err');
    } finally {
      selectHorario.disabled = false;
    }
  }

  selectHorario.addEventListener('change', (e) => {
    state.horarioSeleccionado = e.target.value ? Number(e.target.value) : null;
    if (state.horarioSeleccionado) {
      toast('Materia seleccionada', 'ok', 1500);
      pintarResultado('idle', 'Esperando escaneo', 'Acerca la tarjeta del estudiante al marco.');
    }
  });

  // EVENTOS
  btnActivar.addEventListener('click', iniciarCamara);
  btnReintentar.addEventListener('click', iniciarCamara);
  btnApagar.addEventListener('click', detenerCamara);
  btnGirar.addEventListener('click', girarCamara);
  btnSonido.addEventListener('click', () => {
    state.sonido = !state.sonido;
    btnSonido.setAttribute('aria-pressed', String(state.sonido));
    toast(state.sonido ? 'Sonido activado' : 'Sonido silenciado', 'info', 1500);
  });

  async function inscritosDelHorario(idHorario) {
    if (!state.inscritos[idHorario]) {
      state.inscritos[idHorario] = await apiGet(`/horarios/${idHorario}/estudiantes`);
    }
    return state.inscritos[idHorario];
  }

  formManual.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ci = manualCodigo.value.trim().toUpperCase();
    if (!ci) { toast('Escribe el CI del estudiante', 'err'); manualCodigo.focus(); return; }
    if (!state.horarioSeleccionado) { toast('Selecciona una materia primero', 'err'); selectHorario.focus(); return; }
    if (state.procesando) return;

    const boton = formManual.querySelector('button[type="submit"]');
    state.procesando = true;
    if (typeof setCargando === 'function') setCargando(boton, true, 'Registrando…');
    const hora = fmtHora();

    try {
      const inscritos = await inscritosDelHorario(state.horarioSeleccionado);
      const est = inscritos.find(i => String(i.ci).toUpperCase() === ci);

      if (!est) {
        delete state.inscritos[state.horarioSeleccionado];
        const actualizados = await inscritosDelHorario(state.horarioSeleccionado);
        const reintento = actualizados.find(i => String(i.ci).toUpperCase() === ci);
        if (!reintento) throw new Error(`No hay ningún estudiante con CI ${ci} inscrito en esta materia.`);
        return await enviarManual(reintento, hora);
      }
      await enviarManual(est, hora);
    } catch (err) {
      beep(false); flashRojo();
      const msg = typeof mensajeDeError === 'function' ? mensajeDeError(err) : 'Error de conexión.';
      pintarResultado('error', 'No se registró la asistencia', msg);
      toast(msg, 'err');
    } finally {
      if (typeof setCargando === 'function') setCargando(boton, false);
      state.procesando = false;
    }
  });

  async function enviarManual(est, hora) {
    const response = await apiPost('/asistencia-estudiantes/manual', {
      estudiante_idestudiante: est.estudiante_idestudiante,
      horario_idhorario: state.horarioSeleccionado,
      motivo: 'Registro manual desde escáner'
    });
    const estadoBackend = response.estado || 'Presente';
    const estadoUi = estadoBackend === 'Tardanza' ? 'tarde' : 'ok';
    const nombre = response.estudiante_nombre || `${est.nombres} ${est.apellidos}`;

    beep(true); flashBlanco();
    toast(`${estadoBackend} · ${nombre}`, 'ok');
    pintarResultado(estadoUi, `Asistencia: ${estadoBackend}`, 'Registro manual exitoso', { nombre, curso: response.materia_nombre || '—' });
    state.registros.push({ codigo: est.ci, nombre, curso: response.materia_nombre || '—', hora, estado: estadoUi, origen: 'manual' });
    pintarRegistros();
    manualCodigo.value = ''; manualCodigo.blur();
  }

  window.addEventListener('pagehide', detenerCamara);
  window.addEventListener('beforeunload', detenerCamara);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.stream) { state.scanning = false; clearTimeout(state.jsqrTimer); cancelAnimationFrame(state.rafId); }
    else if (!document.hidden && state.stream && !state.scanning) { arrancarEscaneo(); }
  });

  (async function iniciar() {
    pintarResultado('idle', 'Esperando escaneo', 'Selecciona una materia primero.');
    await cargarHorarios();
  })();
})();