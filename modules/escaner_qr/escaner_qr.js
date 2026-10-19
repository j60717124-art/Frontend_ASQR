/* ============================================================
   ESCÁNER QR · Sistema de Asistencia QR
   Lógica de cámara, detección QR, registro y UI
   ============================================================ */
(() => {
  'use strict';

  /* ----------------------------------------------------------
     CONFIGURACIÓN
     ---------------------------------------------------------- */
  const CONFIG = {
    horaEntrada:        '08:00',  // después de esta hora = tardanza
    cooldownMs:         3000,     // evita escanear el mismo QR dos veces seguidas
    jsqrIntervalMs:     220,      // frecuencia de escaneo con jsQR
    storageKey:         'asis_qr_registros_hoy',
    storageKeyFecha:    'asis_qr_registros_fecha'
  };

  // Catálogo de estudiantes de ejemplo.
  // En producción, reemplázalo por un fetch a tu backend:
  //   GET /api/estudiantes  →  { "12345678": { nombre, curso, ... }, ... }
  const ESTUDIANTES = {
    '12345678': { nombre: 'María González',  curso: '4° Medio A' },
    '87654321': { nombre: 'Javier Pérez',    curso: '3° Medio B' },
    '11223344': { nombre: 'Lucía Ramírez',   curso: '2° Medio A' },
    '44332211': { nombre: 'Carlos Torres',   curso: '1° Medio C' },
    '55667788': { nombre: 'Sofía Aguilar',   curso: '5° Medio A' },
    '99887766': { nombre: 'Diego Fernández', curso: '4° Medio B' },
    '33445566': { nombre: 'Valentina Rojas', curso: '3° Medio A' },
    '22113344': { nombre: 'Mateo Silva',     curso: '2° Medio C' }
  };

  /* ----------------------------------------------------------
     REFERENCIAS AL DOM
     ---------------------------------------------------------- */
  const $ = (sel) => document.querySelector(sel);

  const viewport     = $('#viewport');
  const video        = $('#video');
  const canvas       = $('#canvas');
  const ctx          = canvas.getContext('2d', { willReadFrequently: true });

  const btnActivar   = $('#btnActivar');
  const btnReintentar= $('#btnReintentar');
  const btnApagar    = $('#btnApagar');
  const btnGirar     = $('#btnGirar');
  const btnLuz       = $('#btnLuz');
  const btnSonido    = $('#btnSonido');

  const camIdle      = $('#camIdle');
  const camError     = $('#camError');
  const errTitulo    = $('#errTitulo');
  const errTexto     = $('#errTexto');
  const chipTexto    = $('#chipTexto');
  const flash        = $('#flash');

  const resultado    = $('#resultado');
  const resIcono     = $('#resIcono');
  const resTitulo    = $('#resTitulo');
  const resMensaje   = $('#resMensaje');
  const resEstudiante= $('#resEstudiante');

  const formManual   = $('#formManual');
  const manualCodigo = $('#manualCodigo');

  const logLista     = $('#logLista');
  const logVacio     = $('#logVacio');
  const logResumen   = $('#logResumen');
  const stOk         = $('#stOk');
  const stNo         = $('#stNo');

  const reloj        = $('#reloj');
  const fechaHoy     = $('#fechaHoy');
  const toastEl      = $('#toast');

  /* ----------------------------------------------------------
     ESTADO
     ---------------------------------------------------------- */
  const state = {
    stream:        null,
    detector:      null,   // BarcodeDetector
    track:         null,
    facingMode:    'environment',
    scanning:      false,
    jsqrTimer:     null,
    rafId:         null,
    sonido:        true,
    luz:           false,
    ultimoCodigo:  null,
    ultimoTs:      0,
    registros:     []      // { codigo, nombre, curso, hora, estado }
  };

  /* ----------------------------------------------------------
     UTILIDADES DE FECHA
     ---------------------------------------------------------- */
  const hoyISO = () => new Date().toISOString().slice(0, 10);

  const fmtHora = (d = new Date()) =>
    d.toLocaleTimeString('es-ES', { hour12: false });

  const fmtFechaLarga = (d = new Date()) => {
    const t = d.toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    return t.charAt(0).toUpperCase() + t.slice(1);
  };

  const esTarde = (d = new Date()) => {
    const [h, m] = CONFIG.horaEntrada.split(':').map(Number);
    return d.getHours() > h || (d.getHours() === h && d.getMinutes() > m);
  };

  /* ----------------------------------------------------------
     RELOJ EN VIVO
     ---------------------------------------------------------- */
  function tickReloj() {
    reloj.textContent    = fmtHora();
    fechaHoy.textContent = fmtFechaLarga();
  }
  tickReloj();
  setInterval(tickReloj, 1000);

  /* ----------------------------------------------------------
     TOAST
     ---------------------------------------------------------- */
  let toastTimer = null;
  function toast(msg, tipo = 'info', ms = 2800) {
    toastEl.textContent = msg;
    toastEl.dataset.tipo = tipo;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), ms);
  }

  /* ----------------------------------------------------------
     SONIDO (WebAudio, sin archivos externos)
     ---------------------------------------------------------- */
  let audioCtx = null;
  function beep(ok = true) {
    if (!state.sonido) return;
    try {
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      const osc  = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = ok ? 880 : 220;
      gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, audioCtx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.18);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    } catch { /* silencio */ }
  }

  /* ----------------------------------------------------------
     PERSISTENCIA (localStorage por día)
     ---------------------------------------------------------- */
  function guardarRegistros() {
    try {
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(state.registros));
      localStorage.setItem(CONFIG.storageKeyFecha, hoyISO());
    } catch { /* modo privado */ }
  }

  function cargarRegistros() {
    try {
      if (localStorage.getItem(CONFIG.storageKeyFecha) === hoyISO()) {
        state.registros = JSON.parse(localStorage.getItem(CONFIG.storageKey)) || [];
      }
    } catch { state.registros = []; }
  }

  /* ----------------------------------------------------------
     UI · RESULTADO
     ---------------------------------------------------------- */
  const ICONOS = {
    idle:     '⌛',
    scanning: '🔍',
    ok:       '✓',
    tarde:    '⏱',
    error:    '✕'
  };

  function pintarResultado(estado, titulo, mensaje, estudiante = null) {
    resultado.dataset.estado = estado;
    resIcono.textContent     = ICONOS[estado] || '•';
    resTitulo.textContent    = titulo;
    resMensaje.textContent   = mensaje;

    if (estudiante) {
      const iniciales = estudiante.nombre
        .split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

      const badgeCls =
        estado === 'ok'    ? 'badge badge--ok'  :
        estado === 'tarde' ? 'badge badge--late':
                             'badge badge--out';
      const badgeTxt =
        estado === 'ok'    ? 'Presente' :
        estado === 'tarde' ? 'Tardanza' : 'Rechazado';

      resEstudiante.innerHTML = `
        <strong>${iniciales} · ${estudiante.nombre}</strong>
        <span>${estudiante.curso} · CI ${estudiante.ci || '—'}</span>
        <span class="${badgeCls}">${badgeTxt}</span>
      `;
      resEstudiante.hidden = false;
    } else {
      resEstudiante.hidden = true;
      resEstudiante.innerHTML = '';
    }
  }

  /* ----------------------------------------------------------
     UI · LISTA DE REGISTROS
     ---------------------------------------------------------- */
  function pintarRegistros() {
    logLista.innerHTML = '';

    const total  = state.registros.length;
    const ok     = state.registros.filter(r => r.estado === 'ok').length;
    const tarde  = state.registros.filter(r => r.estado === 'tarde').length;
    const out    = state.registros.filter(r => r.estado === 'error').length;

    stOk.textContent  = `${ok + tarde} aceptados`;
    stNo.textContent  = `${out} rechazados`;

    logResumen.textContent = total
      ? `${total} registro${total === 1 ? '' : 's'} hoy · ${tarde} tardanza${tarde === 1 ? '' : 's'}`
      : 'Aún no hay registros.';

    logVacio.hidden = total > 0;

    // Más recientes arriba
    [...state.registros].reverse().forEach(r => {
      const iniciales = (r.nombre || r.codigo)
        .split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

      const avatarCls =
        r.estado === 'ok'    ? 'log__avatar log__avatar--ok'  :
        r.estado === 'tarde' ? 'log__avatar log__avatar--late':
                               'log__avatar log__avatar--out';

      const badgeCls =
        r.estado === 'ok'    ? 'badge badge--ok'  :
        r.estado === 'tarde' ? 'badge badge--late':
                               'badge badge--out';

      const badgeTxt =
        r.estado === 'ok'    ? 'Presente' :
        r.estado === 'tarde' ? 'Tardanza' : 'Rechazado';

      const li = document.createElement('li');
      li.innerHTML = `
        <div class="${avatarCls}">${iniciales}</div>
        <div class="log__info">
          <strong>${r.nombre || 'Desconocido'}</strong>
          <span>${r.curso || '—'} · CI ${r.codigo}</span>
        </div>
        <span class="badge ${badgeCls.replace('badge ', '')}">${badgeTxt}</span>
        <span class="log__hora">${r.hora}</span>
      `;
      logLista.appendChild(li);
    });
  }

  /* ----------------------------------------------------------
     REGISTRO DE ASISTENCIA
     ---------------------------------------------------------- */
  function registrar(codigo, origen = 'qr') {
    const ahora = new Date();
    const estudiante = ESTUDIANTES[codigo];
    const hora = fmtHora(ahora);

    let estado, titulo, mensaje;

    if (!estudiante) {
      estado  = 'error';
      titulo  = 'Código no reconocido';
      mensaje = `El código "${codigo}" no pertenece a ningún estudiante registrado.`;
      pintarResultado(estado, titulo, mensaje, { nombre: 'Desconocido', curso: '—', ci: codigo });
      beep(false);
      flashRojo();
      toast('Código no reconocido', 'err');
    } else if (esTarde(ahora)) {
      estado  = 'tarde';
      titulo  = 'Tardanza registrada';
      mensaje = `${estudiante.nombre} llegó a las ${hora}.`;
      pintarResultado(estado, titulo, mensaje, { ...estudiante, ci: codigo });
      beep(true);
      flashBlanco();
      toast(`Tardanza · ${estudiante.nombre}`, 'info');
    } else {
      estado  = 'ok';
      titulo  = 'Asistencia registrada';
      mensaje = `${estudiante.nombre} marcó entrada a las ${hora}.`;
      pintarResultado(estado, titulo, mensaje, { ...estudiante, ci: codigo });
      beep(true);
      flashBlanco();
      toast(`Presente · ${estudiante.nombre}`, 'ok');
    }

    state.registros.push({
      codigo,
      nombre: estudiante?.nombre || 'Desconocido',
      curso:  estudiante?.curso  || '—',
      hora,
      estado,
      origen
    });
    guardarRegistros();
    pintarRegistros();
  }

  /* ----------------------------------------------------------
     FLASH VISUAL
     ---------------------------------------------------------- */
  function flashBlanco() {
    flash.style.background = '#fff';
    flash.classList.add('is-active');
    setTimeout(() => flash.classList.remove('is-active'), 180);
  }
  function flashRojo() {
    flash.style.background = '#ef4444';
    flash.classList.add('is-active');
    setTimeout(() => flash.classList.remove('is-active'), 220);
  }

  /* ----------------------------------------------------------
     HANDLER DEL CÓDIGO DETECTADO
     ---------------------------------------------------------- */
  function onCodigoDetectado(codigo) {
    if (!codigo) return;
    codigo = String(codigo).trim();

    const ahora = Date.now();
    if (codigo === state.ultimoCodigo && (ahora - state.ultimoTs) < CONFIG.cooldownMs) {
      return; // mismo QR en ráfaga → ignorar
    }
    state.ultimoCodigo = codigo;
    state.ultimoTs     = ahora;

    registrar(codigo, 'qr');
  }

  /* ----------------------------------------------------------
     CÁMARA
     ---------------------------------------------------------- */
  function mostrarEstadoChip(txt, activo = false) {
    chipTexto.textContent = txt;
    viewport.dataset.state = activo ? 'scanning' : 'idle';
  }

  function mostrarError(titulo, texto) {
    errTitulo.textContent = titulo;
    errTexto.textContent  = texto;
    camError.hidden = false;
    camIdle.hidden  = true;
    mostrarEstadoChip('Cámara apagada', false);
  }

  function ocultarMensajes() {
    camIdle.hidden  = true;
    camError.hidden = true;
  }

  async function iniciarCamara() {
    ocultarMensajes();
    mostrarEstadoChip('Iniciando cámara…', false);
    viewport.dataset.state = 'starting';

    try {
      state.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: state.facingMode },
          width:  { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      video.srcObject = state.stream;
      await video.play();

      state.track = state.stream.getVideoTracks()[0];

      // Botones contextuales
      btnApagar.hidden = false;
      btnGirar.hidden  = (state.stream.getVideoTracks().length <= 1);

      // Linterna disponible?
      const caps = state.track.getCapabilities?.() || {};
      btnLuz.hidden = !caps.torch;

      mostrarEstadoChip('Cámara activa · Buscando QR…', true);
      viewport.dataset.state = 'scanning';

      // Elegir motor de detección
      await prepararDetector();
      arrancarEscaneo();

      pintarResultado('scanning', 'Esperando QR…',
        'Acerca la tarjeta del estudiante al marco.');
      toast('Cámara activada', 'ok');

    } catch (err) {
      console.error('[escáner]', err);
      detenerCamara();
      const msg = (() => {
        switch (err.name) {
          case 'NotAllowedError':   return 'Permiso denegado. Habilita la cámara en el navegador.';
          case 'NotFoundError':     return 'No se encontró ninguna cámara en el dispositivo.';
          case 'NotReadableError':  return 'La cámara está en uso por otra aplicación.';
          case 'OverconstrainedError': return 'La cámara no soporta la configuración solicitada.';
          default:                  return err.message || 'Error desconocido al acceder a la cámara.';
        }
      })();
      mostrarError('No se pudo usar la cámara', msg);
    }
  }

  async function prepararDetector() {
    if ('BarcodeDetector' in window) {
      try {
        const formatos = await BarcodeDetector.getSupportedFormats();
        if (formatos.includes('qr_code')) {
          state.detector = new BarcodeDetector({ formats: ['qr_code'] });
          return;
        }
      } catch { /* cae a jsQR */ }
    }
    state.detector = null; // usaremos jsQR
    if (typeof window.jsQR !== 'function') {
      console.warn('[escáner] jsQR no cargó; solo BarcodeDetector disponible.');
    }
  }

  function arrancarEscaneo() {
    if (!state.stream) return;
    state.scanning = true;
    if (state.detector) {
      bucleBarcodeDetector();
    } else {
      bucleJsQR();
    }
  }

  /* ---------- Motor 1: BarcodeDetector ---------- */
  async function bucleBarcodeDetector() {
    if (!state.scanning || !state.detector) return;
    try {
      if (video.readyState >= 2 && video.videoWidth) {
        const codes = await state.detector.detect(video);
        if (codes && codes.length) {
          onCodigoDetectado(codes[0].rawValue);
        }
      }
    } catch { /* detect() puede fallar en frames; ignorar */ }
    state.rafId = requestAnimationFrame(bucleBarcodeDetector);
  }

  /* ---------- Motor 2: jsQR ---------- */
  function bucleJsQR() {
    if (!state.scanning) return;

    const paso = () => {
      if (!state.scanning) return;

      if (video.readyState >= 2 && video.videoWidth) {
        const w = video.videoWidth;
        const h = video.videoHeight;

        // Escalar a máx 640px de ancho para rendimiento
        const escala = Math.min(1, 640 / w);
        canvas.width  = Math.round(w * escala);
        canvas.height = Math.round(h * escala);

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);

        if (typeof window.jsQR === 'function') {
          const res = window.jsQR(img.data, img.width, img.height, {
            inversionAttempts: 'dontInvert'
          });
          if (res && res.data) {
            onCodigoDetectado(res.data);
          }
        }
      }
      state.jsqrTimer = setTimeout(paso, CONFIG.jsqrIntervalMs);
    };
    paso();
  }

  function detenerCamara() {
    state.scanning = false;
    clearTimeout(state.jsqrTimer);
    cancelAnimationFrame(state.rafId);

    if (state.stream) {
      state.stream.getTracks().forEach(t => t.stop());
      state.stream = null;
    }
    if (video.srcObject) video.srcObject = null;
    state.track = null;
    state.luz  = false;

    btnApagar.hidden = true;
    btnGirar.hidden  = true;
    btnLuz.hidden    = true;
    btnLuz.setAttribute('aria-pressed', 'false');

    camIdle.hidden  = false;
    camError.hidden = true;

    mostrarEstadoChip('Cámara apagada', false);
    pintarResultado('idle', 'Esperando escaneo',
      'Acerca la tarjeta del estudiante al marco de la cámara.');
  }

  async function girarCamara() {
    if (!state.stream) return;
    state.facingMode = state.facingMode === 'environment' ? 'user' : 'environment';
    detenerCamara();
    await iniciarCamara();
  }

  async function alternarLinterna() {
    if (!state.track) return;
    try {
      state.luz = !state.luz;
      await state.track.applyConstraints({ advanced: [{ torch: state.luz }] });
      btnLuz.setAttribute('aria-pressed', String(state.luz));
    } catch (err) {
      console.warn('[linterna]', err);
      toast('Linterna no disponible', 'err');
      state.luz = false;
      btnLuz.setAttribute('aria-pressed', 'false');
    }
  }

  /*
     EVENTOS
      */
  btnActivar.addEventListener('click', iniciarCamara);
  btnReintentar.addEventListener('click', iniciarCamara);
  btnApagar.addEventListener('click', detenerCamara);
  btnGirar.addEventListener('click', girarCamara);
  btnLuz.addEventListener('click', alternarLinterna);

  btnSonido.addEventListener('click', () => {
    state.sonido = !state.sonido;
    btnSonido.setAttribute('aria-pressed', String(state.sonido));
    toast(state.sonido ? 'Sonido activado' : 'Sonido silenciado', 'info', 1500);
  });

  formManual.addEventListener('submit', (e) => {
    e.preventDefault();
    const codigo = manualCodigo.value.trim();
    if (!codigo) return;

    if (!ESTUDIANTES[codigo]) {
      toast('CI o código no encontrado', 'err');
      return;
    }
    onCodigoDetectado(codigo);
    manualCodigo.value = '';
    manualCodigo.blur();
  });

  // Al salir de la página, apaga la cámara
  window.addEventListener('pagehide', detenerCamara);
  window.addEventListener('beforeunload', detenerCamara);

  // Si la pestaña se oculta, detén el escaneo (ahorra batería)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.stream) {
      state.scanning = false;
      clearTimeout(state.jsqrTimer);
      cancelAnimationFrame(state.rafId);
    } else if (!document.hidden && state.stream && !state.scanning) {
      arrancarEscaneo();
    }
  });

  /*
     INICIALIZACIÓN
      */
  cargarRegistros();
  pintarRegistros();
  pintarResultado('idle', 'Esperando escaneo',
    'Acerca la tarjeta del estudiante al marco de la cámara.');

  if (!navigator.mediaDevices?.getUserMedia) {
    mostrarError('Navegador no compatible',
      'Este navegador no soporta acceso a la cámara. Usa Chrome, Edge, Safari o Firefox actualizados.');
  }
})();