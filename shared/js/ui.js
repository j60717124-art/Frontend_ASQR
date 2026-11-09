(() => {
  'use strict';

  const escaparHTML = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  const soportaPopover = typeof HTMLElement !== 'undefined' && 'showPopover' in HTMLElement.prototype;

  // Un "popover" vive en la capa superior del navegador, queda por encima de los <dialog> abiertos.
  function subirAlFrente(el) {
    if (!soportaPopover || !el) return;
    try {
      if (el.matches(':popover-open')) el.hidePopover();
      el.showPopover();
    } catch (_) { /* se queda con z-index */ }
  }
  function bajarDeCapa(el) {
    if (!soportaPopover || !el) return;
    try { if (el.matches(':popover-open')) el.hidePopover(); } catch (_) {}
  }

  // ESTILOS
  function inyectarEstilos() {
    if (document.getElementById('ui-styles')) return;
    const style = document.createElement('style');
    style.id = 'ui-styles';
    style.textContent = `
      .ui-toasts { position: fixed; top: 16px; right: 16px; z-index: 2147483000; display: flex; flex-direction: column; gap: 10px;
        width: min(400px, calc(100vw - 32px)); pointer-events: none; margin: 0; padding: 0; border: 0; background: transparent; overflow: visible; color: inherit; }
      .ui-toasts[popover] { inset: 16px 16px auto auto; }
      .ui-toast { --c: var(--accent, #2563eb); display: flex; align-items: flex-start; gap: 12px; padding: 12px 12px 12px 14px;
        background: var(--surface, #fff); color: var(--text, #0f172a); border: 1px solid var(--border, #e2e8f0); border-left: 4px solid var(--c);
        border-radius: 12px; box-shadow: var(--card-shadow, 0 10px 40px rgb(0 0 0 / .18)); font: 500 14px/1.4 'Segoe UI', Arial, sans-serif;
        pointer-events: auto; transform: translateX(24px); opacity: 0; transition: transform .28s cubic-bezier(.4,0,.2,1), opacity .28s ease; }
      .ui-toast.is-in { transform: none; opacity: 1; }
      .ui-toast--success { --c: var(--success, #10b981); }
      .ui-toast--error   { --c: var(--danger, #dc2626); }
      .ui-toast--warning { --c: #f59e0b; }
      .ui-toast__ico { flex: none; display: inline-grid; place-items: center; width: 24px; height: 24px; border-radius: 50%;
        background: var(--c); color: #fff; font-weight: 800; font-size: 13px; }
      .ui-toast__msg { flex: 1; min-width: 0; overflow-wrap: anywhere; padding-top: 2px; }
      .ui-toast__x { flex: none; border: 0; background: transparent; color: var(--text-muted, #64748b); cursor: pointer; font-size: 18px; line-height: 1;
        width: 26px; height: 26px; border-radius: 8px; }
      .ui-toast__x:hover { background: var(--surface-alt, #f1f5f9); color: var(--text, #0f172a); }

      .ui-loader { position: fixed; inset: 0; margin: 0; padding: 0; border: 0; max-width: none; max-height: none; width: 100%; height: 100%;
        background: var(--overlay, rgb(15 23 42 / .45)); backdrop-filter: blur(3px); display: none; align-items: center; justify-content: center;
        z-index: 2147482000; opacity: 0; transition: opacity .2s ease; color: var(--text, #0f172a); }
      .ui-loader.is-on { display: flex; }
      .ui-loader.is-in { opacity: 1; }
      .ui-loader__box { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 24px 32px; border-radius: 16px;
        background: var(--surface, #fff); box-shadow: var(--card-shadow, 0 20px 60px rgb(0 0 0 / .3)); font: 500 14px 'Segoe UI', Arial, sans-serif; }
      .ui-spinner { display: inline-block; width: 1em; height: 1em; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%;
        animation: ui-spin .7s linear infinite; vertical-align: -.15em; }
      .ui-loader__box .ui-spinner { width: 38px; height: 38px; border-width: 3px; color: var(--accent, #2563eb); }
      @keyframes ui-spin { to { transform: rotate(360deg); } }

      .is-loading { cursor: progress; opacity: .85; }
      .is-loading .ui-spinner { margin-right: 6px; }

      @keyframes ui-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      .skeleton { height: 14px; border-radius: 6px; background: linear-gradient(90deg, var(--surface-alt, #e2e8f0) 25%, var(--border, #f1f5f9) 50%, var(--surface-alt, #e2e8f0) 75%);
        background-size: 200% 100%; animation: ui-shimmer 1.4s ease-in-out infinite; }
      .skeleton-row td { padding: 14px 20px; border-top: 1px solid var(--border, #f1f5f9); }

      .ui-error-box { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 28px 16px; text-align: center; color: var(--text-muted, #64748b); }
      .ui-error-box strong { color: var(--danger, #dc2626); font-size: 15px; }
      .ui-error-box button { margin-top: 8px; }
      td.ui-error-cell { padding: 0 !important; }

      .ui-form-alert { display: flex; gap: 10px; align-items: flex-start; padding: 10px 12px; margin-bottom: 14px; border-radius: 10px; font-size: 13.5px; line-height: 1.4;
        color: var(--danger, #dc2626); background: color-mix(in srgb, var(--danger, #dc2626) 10%, transparent);
        border: 1px solid color-mix(in srgb, var(--danger, #dc2626) 35%, transparent); }
      .ui-form-alert::before { content: '!'; flex: none; display: grid; place-items: center; width: 20px; height: 20px; border-radius: 50%;
        background: var(--danger, #dc2626); color: #fff; font-weight: 800; font-size: 12px; }
      input.is-invalid, select.is-invalid, textarea.is-invalid { border-color: var(--danger, #dc2626) !important; }
      .ui-ok { border-color: var(--success, #10b981) !important; }

      body.solo-lectura .row-actions, body.solo-lectura [data-requiere-escritura] { display: none !important; }
      .ui-readonly-note { margin: 0 0 14px; padding: 10px 14px; border-radius: 10px; font-size: 13px; color: var(--text-muted, #475569);
        background: var(--surface-alt, #f1f5f9); border: 1px dashed var(--border-strong, #cbd5e1); }

      .ui-confirm { border: 0; padding: 0; border-radius: 16px; width: min(420px, calc(100vw - 32px)); background: var(--surface, #fff); color: var(--text, #0f172a);
        box-shadow: var(--card-shadow, 0 20px 60px rgb(0 0 0 / .3)); }
      .ui-confirm::backdrop { background: var(--overlay, rgb(15 23 42 / .5)); }
      .ui-confirm__body { padding: 22px 22px 8px; }
      .ui-confirm__body h2 { margin: 0 0 8px; font-size: 18px; }
      .ui-confirm__body p { margin: 0; color: var(--text-muted, #475569); line-height: 1.5; font-size: 14px; }
      .ui-confirm__foot { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 22px 20px; }
      .ui-confirm__foot button { font: 600 14px 'Segoe UI', Arial, sans-serif; padding: 10px 16px; border-radius: 10px; cursor: pointer; border: 1px solid var(--border-strong, #cbd5e1);
        background: transparent; color: var(--text, #0f172a); }
      .ui-confirm__foot button[data-ok] { border-color: transparent; background: var(--accent, #2563eb); color: var(--on-accent, #fff); }
      .ui-confirm--danger .ui-confirm__foot button[data-ok] { background: var(--danger, #dc2626); color: #fff; }

      @media (prefers-reduced-motion: reduce) { .ui-toast, .ui-loader, .skeleton, .ui-spinner { transition: none; animation-duration: 2s; } }
    `;
    document.head.appendChild(style);
  }

  // TOAST
  const TIPOS = {
    success: { icono: '✓', base: 3500, rol: 'status' },
    error:   { icono: '✕', base: 6000, rol: 'alert' },
    warning: { icono: '!', base: 5000, rol: 'alert' },
    info:    { icono: 'i', base: 4000, rol: 'status' }
  };
  const ALIAS = { ok: 'success', exito: 'success', err: 'error', danger: 'error', warn: 'warning', aviso: 'warning' };
  const MAX_TOASTS = 4;
  let cajaToasts = null;
  const activos = new Map();

  function contenedorToasts() {
    if (cajaToasts && document.body.contains(cajaToasts)) return cajaToasts;
    inyectarEstilos();
    cajaToasts = document.createElement('div');
    cajaToasts.className = 'ui-toasts';
    cajaToasts.setAttribute('role', 'region');
    cajaToasts.setAttribute('aria-label', 'Notificaciones');
    if (soportaPopover) cajaToasts.setAttribute('popover', 'manual');
    document.body.appendChild(cajaToasts);
    return cajaToasts;
  }

  // Muestra un toast. El mensaje se inserta como texto
  function mostrarToast(mensaje, tipo = 'info', duracion) {
    tipo = ALIAS[tipo] || tipo;
    if (!TIPOS[tipo]) tipo = 'info';
    const cfg = TIPOS[tipo];
    mensaje = String(mensaje ?? '').trim();
    if (!mensaje) return;

    const caja = contenedorToasts();
    const ms = duracion ?? Math.max(cfg.base, Math.min(12000, mensaje.length * 55));
    const clave = `${tipo}|${mensaje}`;

    if (activos.has(clave)) {
      activos.get(clave).reiniciar(ms);
      subirAlFrente(caja);
      return;
    }

    const el = document.createElement('div');
    el.className = `ui-toast ui-toast--${tipo}`;
    el.setAttribute('role', cfg.rol);

    const ico = document.createElement('span');
    ico.className = 'ui-toast__ico';
    ico.setAttribute('aria-hidden', 'true');
    ico.textContent = cfg.icono;

    const msg = document.createElement('span');
    msg.className = 'ui-toast__msg';
    msg.textContent = mensaje;

    const x = document.createElement('button');
    x.type = 'button';
    x.className = 'ui-toast__x';
    x.setAttribute('aria-label', 'Cerrar notificación');
    x.textContent = '×';

    el.append(ico, msg, x);

    let timer = null;
    let cerrado = false;
    const cerrar = () => {
      if (cerrado) return;
      cerrado = true;
      clearTimeout(timer);
      activos.delete(clave);
      el.classList.remove('is-in');
      setTimeout(() => {
        el.remove();
        if (!caja.children.length) bajarDeCapa(caja);
      }, 280);
    };
    const reiniciar = (nuevo) => { clearTimeout(timer); timer = setTimeout(cerrar, nuevo); };

    x.addEventListener('click', cerrar);
    el.addEventListener('mouseenter', () => clearTimeout(timer));
    el.addEventListener('mouseleave', () => reiniciar(1800));

    while (caja.children.length >= MAX_TOASTS) {
      const viejo = [...activos.values()][0];
      if (viejo) viejo.cerrar(); else caja.firstElementChild.remove();
    }

    caja.appendChild(el);
    activos.set(clave, { el, cerrar, reiniciar });
    subirAlFrente(caja);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-in')));
    reiniciar(ms);
  }

  const mostrarExito = (m, d) => mostrarToast(m, 'success', d);
  const mostrarAviso = (m, d) => mostrarToast(m, 'warning', d);
  const mostrarInfo = (m, d) => mostrarToast(m, 'info', d);

  // Convierte cualquier error en un texto entendible para el usuario.
  function mensajeDeError(err, fallback = 'Ocurrió un error inesperado. Intenta de nuevo.') {
    if (!err) return fallback;
    if (typeof err === 'string') return err.trim() || fallback;
    const msg = err.message ? String(err.message).trim() : '';
    if (!msg) return fallback;
    if (/^(failed to fetch|networkerror|load failed)/i.test(msg)) {
      return 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
    }
    // Errores técnicos de JavaScript (no de la API) no se muestran tal cual
    if (err.name !== 'ApiError' && /(is not defined|is not a function|cannot read|of undefined|of null)/i.test(msg)) {
      return fallback;
    }
    return msg;
  }

  // Muestra un error como toast y lo deja en consola
  function mostrarError(err, fallback) {
    const texto = mensajeDeError(err, fallback);
    if (err && typeof err === 'object') console.error('[ASQR]', err);
    if (window.__redirigiendo || (err && err.tipo === 'sesion')) return texto;
    mostrarToast(texto, 'error');
    return texto;
  }

  // LOADER GLOBAL
  let loader = null;
  let loaderPendientes = 0;
  let loaderTimer = null;

  function crearLoader() {
    if (loader && document.body.contains(loader)) return loader;
    inyectarEstilos();
    loader = document.createElement('div');
    loader.className = 'ui-loader';
    loader.setAttribute('role', 'status');
    loader.setAttribute('aria-live', 'polite');
    if (soportaPopover) loader.setAttribute('popover', 'manual');
    loader.innerHTML = '<div class="ui-loader__box"><span class="ui-spinner" aria-hidden="true"></span><span class="ui-loader__text">Cargando…</span></div>';
    document.body.appendChild(loader);
    return loader;
  }

  function mostrarLoader(mensaje = 'Cargando…') {
    loaderPendientes++;
    const el = crearLoader();
    el.querySelector('.ui-loader__text').textContent = mensaje;
    if (el.classList.contains('is-on') || loaderTimer) return;
    loaderTimer = setTimeout(() => {
      loaderTimer = null;
      if (!loaderPendientes) return;
      el.classList.add('is-on');
      subirAlFrente(el);
      requestAnimationFrame(() => el.classList.add('is-in'));
    }, 250);
  }

  function ocultarLoader(forzar = false) {
    loaderPendientes = forzar ? 0 : Math.max(0, loaderPendientes - 1);
    if (loaderPendientes > 0 || !loader) return;
    clearTimeout(loaderTimer);
    loaderTimer = null;
    loader.classList.remove('is-in');
    setTimeout(() => {
      if (loaderPendientes > 0) return;
      loader.classList.remove('is-on');
      bajarDeCapa(loader);
    }, 200);
  }

  async function conLoader(fn, mensaje) {
    mostrarLoader(mensaje);
    try { return await fn(); } finally { ocultarLoader(); }
  }

  // SKELETONS Y ERRORES DE CARGA
  function generarSkeletonFilas(cantidad = 5, columnas = 4) {
    let html = '';
    for (let i = 0; i < cantidad; i++) {
      html += '<tr class="skeleton-row" aria-hidden="true">';
      for (let j = 0; j < columnas; j++) {
        html += `<td><div class="skeleton" style="width:${60 + Math.round(Math.random() * 30)}%"></div></td>`;
      }
      html += '</tr>';
    }
    return html;
  }

  const columnasDe = (tbody) => tbody.closest('table')?.querySelectorAll('thead th').length || 4;

  function mostrarSkeleton(tbody, filas = 5, columnas) {
    if (!tbody) return;
    inyectarEstilos();
    tbody.setAttribute('aria-busy', 'true');
    tbody.innerHTML = generarSkeletonFilas(filas, columnas || columnasDe(tbody));
  }

  // Estado de error con botón "Reintentar" dentro de un <tbody> o de cualquier contenedor.
  function mostrarErrorTabla(contenedor, err, reintentar) {
    if (!contenedor) return;
    inyectarEstilos();
    contenedor.removeAttribute('aria-busy');
    const texto = mensajeDeError(err, 'No se pudieron cargar los datos.');
    const caja = `
      <div class="ui-error-box" role="alert">
        <strong>No se pudieron cargar los datos</strong>
        <span>${escaparHTML(texto)}</span>
        ${reintentar ? '<button type="button" class="btn btn--ghost btn--sm" data-ui-reintentar>Reintentar</button>' : ''}
      </div>`;
    contenedor.innerHTML = contenedor.tagName === 'TBODY'
      ? `<tr><td class="ui-error-cell" colspan="${columnasDe(contenedor)}">${caja}</td></tr>`
      : caja;
    const btn = contenedor.querySelector('[data-ui-reintentar]');
    if (btn && reintentar) btn.addEventListener('click', () => reintentar());
  }

  // BOTONES "CARGANDO"
  function setCargando(boton, cargando, texto) {
    if (!boton) return;
    inyectarEstilos();
    if (cargando) {
      if (boton.dataset.uiTexto === undefined) boton.dataset.uiTexto = boton.innerHTML;
      boton.disabled = true;
      boton.classList.add('is-loading');
      boton.setAttribute('aria-busy', 'true');
      if (texto) boton.innerHTML = `<span class="ui-spinner" aria-hidden="true"></span>${escaparHTML(texto)}`;
    } else {
      boton.disabled = false;
      boton.classList.remove('is-loading');
      boton.removeAttribute('aria-busy');
      if (boton.dataset.uiTexto !== undefined) {
        boton.innerHTML = boton.dataset.uiTexto;
        delete boton.dataset.uiTexto;
      }
    }
  }

  // FORMULARIOS
  const campoDe = (form, id) => form.querySelector(`#${CSS.escape(id)}`) || document.getElementById(id);
  const quitarAlertaFormulario = (form) => form.querySelectorAll('.ui-form-alert').forEach((a) => a.remove());

  function limpiarErroresFormulario(form) {
    if (!form) return;
    form.querySelectorAll('.err').forEach((e) => { e.textContent = ''; });
    form.querySelectorAll('.is-invalid').forEach((e) => { e.classList.remove('is-invalid'); e.removeAttribute('aria-invalid'); });
    quitarAlertaFormulario(form);
  }

  function marcarErrorCampo(form, campo, mensaje) {
    const msg = form.querySelector(`[data-err="${campo}"]`);
    if (msg) msg.textContent = mensaje;
    const input = campoDe(form, campo);
    if (input) { input.classList.add('is-invalid'); input.setAttribute('aria-invalid', 'true'); }
  }

  function limpiarErrorCampo(form, campo) {
    const msg = form.querySelector(`[data-err="${campo}"]`);
    if (msg) msg.textContent = '';
    const input = campoDe(form, campo);
    if (input) { input.classList.remove('is-invalid'); input.removeAttribute('aria-invalid'); }
  }

  function mostrarAlertaFormulario(form, mensaje) {
    inyectarEstilos();
    quitarAlertaFormulario(form);
    const alerta = document.createElement('div');
    alerta.className = 'ui-form-alert';
    alerta.setAttribute('role', 'alert');
    alerta.textContent = mensaje;
    (form.querySelector('.modal__body') || form).prepend(alerta);
    alerta.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  // Muestra un error del backend dentro de un formulario.

  function errorFormulario(form, err, reglas = [], fallback = 'No se pudo guardar. Intenta de nuevo.') {
    const texto = mensajeDeError(err, fallback);
    if (err && typeof err === 'object') console.error('[ASQR]', err);
    if (!form) { mostrarToast(texto, 'error'); return texto; }

    limpiarErroresFormulario(form);
    for (const [regla, campo] of reglas) {
      if (regla.test(texto) && campoDe(form, campo)) {
        marcarErrorCampo(form, campo, texto);
        campoDe(form, campo).focus();
        return texto;
      }
    }
    if (!(window.__redirigiendo || (err && err.tipo === 'sesion'))) {
      mostrarAlertaFormulario(form, texto);
      mostrarToast(texto, 'error');
    }
    return texto;
  }

  function validarEnVivo(form, campo, validador) {
    const input = campoDe(form, campo);
    if (!input) return;
    let tocado = false;
    const revisar = () => {
      const mensaje = validador(input.value);
      if (mensaje) marcarErrorCampo(form, campo, mensaje); else limpiarErrorCampo(form, campo);
    };
    input.addEventListener('blur', () => { tocado = true; if (input.value !== '') revisar(); });
    input.addEventListener('input', () => {
      if (input.value === '') { limpiarErrorCampo(form, campo); return; }
      if (tocado) revisar();
    });
  }

  function validarCampoEnTiempoReal(input, validadorFn) {
    inyectarEstilos();
    const feedback = document.createElement('small');
    feedback.className = 'campo-feedback';
    feedback.style.cssText = 'display:block;font-size:12px;margin-top:4px;min-height:16px;';
    input.parentNode.insertBefore(feedback, input.nextSibling);
    const validar = () => {
      const r = validadorFn(input.value);
      input.classList.remove('is-invalid', 'ui-ok');
      if (r === true) {
        input.classList.add('ui-ok');
        feedback.textContent = '✓ Correcto';
        feedback.style.color = 'var(--success, #10b981)';
      } else if (r === false || typeof r === 'string') {
        input.classList.add('is-invalid');
        feedback.textContent = typeof r === 'string' ? r : '';
        feedback.style.color = 'var(--danger, #dc2626)';
      }
    };
    input.addEventListener('blur', validar);
    input.addEventListener('input', () => {
      if (input.value === '') { input.classList.remove('is-invalid', 'ui-ok'); feedback.textContent = ''; }
    });
  }

  // Validadores = reglas de helpers.php del backend. Devuelven '' si es válido o el mensaje.
  const validadores = {
    nombrePersona(valor, campo = 'El nombre') {
      const v = String(valor).trim().replace(/\s+/g, ' ');
      if (!v) return `${campo} es obligatorio.`;
      if (v.length < 2 || v.length > 70) return `${campo} debe tener entre 2 y 70 caracteres.`;
      if (!/^[\p{L}\s.'\-]+$/u.test(v)) return `${campo} solo puede contener letras y espacios.`;
      return '';
    },
    ci(valor, obligatorio = true) {
      const v = String(valor).trim().toUpperCase();
      if (!v) return obligatorio ? 'El CI (carnet de identidad) es obligatorio.' : '';
      if (!/^\d{5,10}(-?[A-Z]{2})?$/.test(v)) return 'El CI no tiene un formato válido. Ejemplo: 1234567 o 1234567-SC.';
      return '';
    },
    telefono(valor, obligatorio = false) {
      let v = String(valor).trim();
      if (!v) return obligatorio ? 'El número telefónico es obligatorio.' : '';
      v = v.replace(/[\s\-()]/g, '').replace(/^\+?591/, '');
      if (!/^[67]\d{7}$/.test(v)) return 'El teléfono no es válido. Debe tener 8 dígitos y empezar con 6 o 7.';
      return '';
    },
    correo(valor, obligatorio = true) {
      const v = String(valor).trim().toLowerCase();
      if (!v) return obligatorio ? 'El correo electrónico es obligatorio.' : '';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'El correo electrónico no tiene un formato válido.';
      if (v.length > 80) return 'El correo electrónico es demasiado largo (máximo 80 caracteres).';
      return '';
    },
    usuario(valor) {
      const v = String(valor).trim();
      if (!v) return 'El nombre de usuario es obligatorio.';
      if (v.length < 4 || v.length > 50) return 'El nombre de usuario debe tener entre 4 y 50 caracteres.';
      if (!/^[A-Za-z0-9_.\-]+$/.test(v)) return 'El nombre de usuario solo puede contener letras, números, puntos, guiones y guion bajo, sin espacios.';
      return '';
    },
    clave(valor, obligatoria = true) {
      const v = String(valor);
      if (!v.trim()) return obligatoria ? 'La contraseña es obligatoria.' : '';
      if (v.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
      if (v.length > 72) return 'La contraseña no puede superar los 72 caracteres.';
      if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) return 'La contraseña debe incluir al menos una letra y un número.';
      return '';
    },
    pin(valor) {
      return /^\d{6}$/.test(String(valor).trim()) ? '' : 'El código de verificación debe tener 6 dígitos.';
    }
  };

  // CONFIRMACIÓN
  function confirmarAccion(mensaje, callback, opciones = {}) {
    inyectarEstilos();
    const { titulo = 'Confirmar acción', aceptar = 'Aceptar', cancelar = 'Cancelar', peligro = true } = opciones;
    return new Promise((resolve) => {
      const dlg = document.createElement('dialog');
      dlg.className = `ui-confirm${peligro ? ' ui-confirm--danger' : ''}`;
      dlg.innerHTML = `
        <div class="ui-confirm__body"><h2>${escaparHTML(titulo)}</h2><p>${escaparHTML(mensaje)}</p></div>
        <div class="ui-confirm__foot">
          <button type="button" data-cancel>${escaparHTML(cancelar)}</button>
          <button type="button" data-ok>${escaparHTML(aceptar)}</button>
        </div>`;
      document.body.appendChild(dlg);
      let aceptado = false;
      dlg.querySelector('[data-ok]').addEventListener('click', () => { aceptado = true; dlg.close(); });
      dlg.querySelector('[data-cancel]').addEventListener('click', () => dlg.close());
      dlg.addEventListener('close', async () => {
        dlg.remove();
        if (aceptado && typeof callback === 'function') {
          try { await callback(); } catch (e) { mostrarError(e); }
        }
        resolve(aceptado);
      });
      dlg.showModal();
      dlg.querySelector('[data-cancel]').focus();
    });
  }

  // SOLO LECTURA
  function aplicarSoloLectura(puedeEscribir, idsBotones = []) {
    if (puedeEscribir) return;
    inyectarEstilos();
    document.body.classList.add('solo-lectura');
    idsBotones.forEach((id) => { const b = document.getElementById(id); if (b) b.hidden = true; });
    if (!document.querySelector('.ui-readonly-note')) {
      const nota = document.createElement('p');
      nota.className = 'ui-readonly-note';
      nota.textContent = 'Tu rol tiene acceso de solo lectura en esta sección.';
      const destino = document.querySelector('main .panel') || document.querySelector('main');
      if (destino) destino.parentNode.insertBefore(nota, destino);
    }
  }

  // FECHAS
  function parseFecha(valor) {
    if (!valor) return null;
    if (valor instanceof Date) return isNaN(valor) ? null : valor;
    const s = String(valor).trim();
    let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0));
    const d = new Date(s);
    return isNaN(d) ? null : d;
  }

  // Fecha/hora generada por PHP con hora de Bolivia
  function parseFechaBolivia(valor) {
    if (!valor) return null;
    const m = String(valor).trim().match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(?::(\d{2}))?$/);
    if (m) {
      const d = new Date(`${m[1]}T${m[2]}:${m[3] || '00'}-04:00`);
      return isNaN(d) ? null : d;
    }
    return parseFecha(valor);
  }

  const formatearFecha = (v) => {
    const d = parseFecha(v);
    return d ? d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  };
  const formatearFechaHora = (v) => {
    const d = parseFecha(v);
    return d ? d.toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
  };
  const formatearHora = (v) => (v ? String(v).slice(0, 5) : '—');

  // MENSAJES ENTRE PÁGINAS Y EVENTOS GLOBALES
  function mostrarMensajePendiente() {
    let flash = null;
    try {
      flash = JSON.parse(sessionStorage.getItem('flashMensaje') || 'null');
      sessionStorage.removeItem('flashMensaje');
    } catch (_) { /* nada */ }
    if (flash && flash.texto) mostrarToast(flash.texto, flash.tipo || 'info');
  }

  window.addEventListener('unhandledrejection', (ev) => {
    const err = ev.reason;
    if (window.__redirigiendo || !err) return;
    if (err.name === 'ApiError') mostrarError(err);
    else {
      console.error('[ASQR] Error no controlado:', err);
      mostrarToast('Ocurrió un error inesperado. Si se repite, recarga la página.', 'error');
    }
  });

  window.addEventListener('offline', () => mostrarToast('Sin conexión a internet. Los cambios no se guardarán hasta que vuelva.', 'warning', 8000));
  window.addEventListener('online', () => mostrarToast('Conexión restablecida.', 'success'));

  document.addEventListener('DOMContentLoaded', () => {
    inyectarEstilos();
    mostrarMensajePendiente();
  });

  Object.assign(window, {
    escaparHTML,
    mostrarToast, mostrarExito, mostrarError, mostrarAviso, mostrarInfo, mensajeDeError,
    mostrarLoader, ocultarLoader, conLoader,
    generarSkeletonFilas, mostrarSkeleton, mostrarErrorTabla,
    setCargando,
    limpiarErroresFormulario, marcarErrorCampo, limpiarErrorCampo, errorFormulario,
    validarEnVivo, validarCampoEnTiempoReal, validadores,
    confirmarAccion,
    aplicarSoloLectura,
    parseFecha, parseFechaBolivia, formatearFecha, formatearFechaHora, formatearHora,
    mostrarMensajePendiente,
    activarSkeletons: inyectarEstilos,
    aviso: (mensaje, tipo = 'info') => mostrarToast(mensaje, tipo)   // compatibilidad con módulos antiguos
  });
})();