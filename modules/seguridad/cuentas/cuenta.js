/* =========================================================
   MÓDULO · CUENTAS
   Tabla: cuenta (idcuenta, n_usuario, correo, clave, estado,
          fecha_de_agregacion, rol_idrol, pin_recuperacion,
          pin_expiracion, intentos_fallidos, bloqueado_hasta)
   ========================================================= */

/* ---------- CAPA DE DATOS ----------
   Ahora funciona en modo demostración (localStorage).
   Para conectarlo a tu backend, reemplaza solo las funciones de `api`
   por fetch() a tus endpoints. El resto del archivo no cambia. */
const API_URL = ""; // ej.: "/api"

const ROLES_DEMO = [
  { idrol: 1, nombre: "Administrador" },
  { idrol: 2, nombre: "Director" },
  { idrol: 3, nombre: "Docente" },
  { idrol: 4, nombre: "Secretaría" },
  { idrol: 5, nombre: "Portería" }
];

const ahora = () => new Date();
const enDias = (d) => new Date(Date.now() + d * 864e5).toISOString();

const CUENTAS_DEMO = [
  { idcuenta: 1, n_usuario: "admin", correo: "admin@colegio.edu", estado: "Activo", fecha_de_agregacion: enDias(-120), rol_idrol: 1, pin_recuperacion: null, pin_expiracion: null, intentos_fallidos: 0, bloqueado_hasta: null },
  { idcuenta: 2, n_usuario: "mgonzalez", correo: "maria.gonzalez@colegio.edu", estado: "Activo", fecha_de_agregacion: enDias(-45), rol_idrol: 3, pin_recuperacion: null, pin_expiracion: null, intentos_fallidos: 1, bloqueado_hasta: null },
  { idcuenta: 3, n_usuario: "jperez", correo: "javier.perez@colegio.edu", estado: "Inactivo", fecha_de_agregacion: enDias(-30), rol_idrol: 4, pin_recuperacion: null, pin_expiracion: null, intentos_fallidos: 0, bloqueado_hasta: null },
  { idcuenta: 4, n_usuario: "lramirez", correo: "lucia.ramirez@colegio.edu", estado: "Bloqueado", fecha_de_agregacion: enDias(-12), rol_idrol: 5, pin_recuperacion: "482913", pin_expiracion: enDias(1), intentos_fallidos: 5, bloqueado_hasta: new Date(Date.now() + 36e5).toISOString() }
];

const api = {
  async roles() {
    if (API_URL) return (await fetch(`${API_URL}/roles`)).json();
    return ROLES_DEMO;
  },
  async listar() {
    if (API_URL) return (await fetch(`${API_URL}/cuentas`)).json();
    try {
      const g = JSON.parse(localStorage.getItem("cuentas_demo"));
      if (Array.isArray(g)) return g;
    } catch (e) {}
    return CUENTAS_DEMO.slice();
  },
  async guardar(cuenta) {
    // La clave NUNCA debe guardarse en texto plano: el backend la cifra (bcrypt/argon2).
    if (API_URL) {
      const nueva = !cuenta.idcuenta;
      const r = await fetch(`${API_URL}/cuentas${nueva ? "" : "/" + cuenta.idcuenta}`, {
        method: nueva ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuenta)
      });
      return r.json();
    }
    const { clave, ...sinClave } = cuenta; // en demo no se almacena la clave
    if (!sinClave.idcuenta) {
      sinClave.idcuenta = Math.max(0, ...estado.cuentas.map(c => c.idcuenta)) + 1;
      sinClave.fecha_de_agregacion = ahora().toISOString();
      estado.cuentas.push(sinClave);
    } else {
      const i = estado.cuentas.findIndex(c => c.idcuenta === sinClave.idcuenta);
      estado.cuentas[i] = { ...estado.cuentas[i], ...sinClave };
    }
    localStorage.setItem("cuentas_demo", JSON.stringify(estado.cuentas));
    return sinClave;
  },
  async eliminar(id) {
    if (API_URL) { await fetch(`${API_URL}/cuentas/${id}`, { method: "DELETE" }); return; }
    estado.cuentas = estado.cuentas.filter(c => c.idcuenta !== id);
    localStorage.setItem("cuentas_demo", JSON.stringify(estado.cuentas));
  }
};

/* ---------- UTILIDADES ---------- */
const $ = (id) => document.getElementById(id);
const estado = { cuentas: [], roles: [] };

const escapar = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const normalizar = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const nombreRol = (id) => estado.roles.find(r => r.idrol === id)?.nombre ?? "Sin rol";
const iniciales = (n) => n.trim().slice(0, 2).toUpperCase();

const fmtFecha = (iso) => iso
  ? new Date(iso).toLocaleString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
  : "—";

// ISO → valor para <input type="datetime-local">
const aLocal = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};
const deLocal = (v) => (v ? new Date(v).toISOString() : null);

const estaBloqueada = (c) => c.estado === "Bloqueado" || (c.bloqueado_hasta && new Date(c.bloqueado_hasta) > ahora());

let toastTimer;
function aviso(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("is-show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("is-show"), 2600);
}

/* ---------- LISTADO ---------- */
function filtradas() {
  const q = normalizar($("fBuscar").value.trim());
  const rol = $("fRol").value;
  const est = $("fEstado").value;
  return estado.cuentas.filter(c =>
    (!q || normalizar(`${c.n_usuario} ${c.correo}`).includes(q)) &&
    (!rol || String(c.rol_idrol) === rol) &&
    (!est || (est === "Bloqueado" ? estaBloqueada(c) : c.estado === est && !estaBloqueada(c)))
  );
}

function insignia(c) {
  if (estaBloqueada(c)) return '<span class="badge badge--danger">Bloqueado</span>';
  if (c.estado === "Activo") return '<span class="badge badge--ok">Activo</span>';
  return `<span class="badge badge--off">${escapar(c.estado)}</span>`;
}

const ICO = {
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  del: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5"/>',
  unlock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/>'
};
const icono = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[n]}</svg>`;

function pintar() {
  const lista = filtradas();
  $("vacio").hidden = lista.length > 0;

  $("tbody").innerHTML = lista.map(c => `
    <tr>
      <td data-label="Usuario">
        <div class="user">
          <span class="user__avatar">${escapar(iniciales(c.n_usuario))}</span>
          <div class="user__info"><strong>${escapar(c.n_usuario)}</strong><span>${escapar(c.correo)}</span></div>
        </div>
      </td>
      <td data-label="Rol"><span class="badge badge--role">${escapar(nombreRol(c.rol_idrol))}</span></td>
      <td data-label="Estado">${insignia(c)}</td>
      <td data-label="Intentos fallidos" class="muted">${c.intentos_fallidos}</td>
      <td data-label="Bloqueado hasta" class="muted">${fmtFecha(c.bloqueado_hasta)}</td>
      <td data-label="Creada" class="muted">${fmtFecha(c.fecha_de_agregacion)}</td>
      <td>
        <div class="row-actions">
          ${estaBloqueada(c) ? `<button class="icon-btn icon-btn--ok" data-accion="desbloquear" data-id="${c.idcuenta}" title="Desbloquear" aria-label="Desbloquear ${escapar(c.n_usuario)}">${icono("unlock")}</button>` : ""}
          <button class="icon-btn" data-accion="editar" data-id="${c.idcuenta}" title="Editar" aria-label="Editar ${escapar(c.n_usuario)}">${icono("edit")}</button>
          <button class="icon-btn icon-btn--danger" data-accion="eliminar" data-id="${c.idcuenta}" title="Eliminar" aria-label="Eliminar ${escapar(c.n_usuario)}">${icono("del")}</button>
        </div>
      </td>
    </tr>`).join("");

  const total = estado.cuentas.length;
  const activas = estado.cuentas.filter(c => c.estado === "Activo" && !estaBloqueada(c)).length;
  const bloq = estado.cuentas.filter(estaBloqueada).length;
  $("resumen").textContent = `${total} cuentas · ${activas} activas · ${bloq} bloqueadas`;
}

/* ---------- COMBOS DE ROL ---------- */
function llenarRoles() {
  const opciones = estado.roles.map(r => `<option value="${r.idrol}">${escapar(r.nombre)}</option>`).join("");
  $("rol_idrol").innerHTML = '<option value="">Selecciona un rol</option>' + opciones;
  $("fRol").innerHTML = '<option value="">Todos los roles</option>' + opciones;
}

/* ---------- FORMULARIO ---------- */
const dlg = $("dlgCuenta");
const form = $("formCuenta");

function limpiarErrores() {
  form.querySelectorAll(".err").forEach(e => (e.textContent = ""));
  form.querySelectorAll(".is-invalid").forEach(e => e.classList.remove("is-invalid"));
}

function abrirFormulario(cuenta) {
  limpiarErrores();
  form.reset();
  const editando = !!cuenta;

  $("dlgTitulo").textContent = editando ? "Editar cuenta" : "Nueva cuenta";
  $("btnGuardar").textContent = editando ? "Guardar cambios" : "Guardar cuenta";
  $("hintClave").textContent = editando ? "Déjala vacía para conservar la actual." : "Mínimo 8 caracteres.";
  $("clave").type = "password";

  $("idcuenta").value = cuenta?.idcuenta ?? "";
  $("n_usuario").value = cuenta?.n_usuario ?? "";
  $("correo").value = cuenta?.correo ?? "";
  $("rol_idrol").value = cuenta?.rol_idrol ?? "";
  $("estado").value = cuenta?.estado ?? "Activo";
  $("fecha_de_agregacion").value = cuenta ? fmtFecha(cuenta.fecha_de_agregacion) : "Se asigna al guardar";
  $("pin_recuperacion").value = cuenta?.pin_recuperacion ?? "";
  $("pin_expiracion").value = aLocal(cuenta?.pin_expiracion);
  $("intentos_fallidos").value = cuenta?.intentos_fallidos ?? 0;
  $("bloqueado_hasta").value = aLocal(cuenta?.bloqueado_hasta);

  // La sección de seguridad se abre sola si ya tiene datos
  $("advanced").open = !!(cuenta && (cuenta.pin_recuperacion || cuenta.bloqueado_hasta || cuenta.intentos_fallidos));

  dlg.showModal();
  $("n_usuario").focus();
}

function error(campo, msg) {
  const el = form.querySelector(`[data-err="${campo}"]`);
  if (el) el.textContent = msg;
  $(campo)?.classList.add("is-invalid");
}

function validar() {
  limpiarErrores();
  let ok = true;
  const editando = !!$("idcuenta").value;
  const id = Number($("idcuenta").value) || null;
  const usuario = $("n_usuario").value.trim();
  const correo = $("correo").value.trim();
  const clave = $("clave").value;
  const pin = $("pin_recuperacion").value.trim();
  const intentos = $("intentos_fallidos").value;

  if (usuario.length < 3) { error("n_usuario", "Escribe al menos 3 caracteres."); ok = false; }
  else if (estado.cuentas.some(c => c.idcuenta !== id && normalizar(c.n_usuario) === normalizar(usuario))) {
    error("n_usuario", "Ese nombre de usuario ya existe."); ok = false;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) { error("correo", "Escribe un correo válido, por ejemplo nombre@colegio.edu."); ok = false; }
  else if (estado.cuentas.some(c => c.idcuenta !== id && normalizar(c.correo) === normalizar(correo))) {
    error("correo", "Ese correo ya está registrado."); ok = false;
  }

  if ((!editando || clave) && clave.length < 8) { error("clave", "La contraseña debe tener al menos 8 caracteres."); ok = false; }
  if (!$("rol_idrol").value) { error("rol_idrol", "Selecciona un rol."); ok = false; }

  if (pin && !/^\d{6}$/.test(pin)) { error("pin_recuperacion", "El PIN son exactamente 6 dígitos."); ok = false; $("advanced").open = true; }
  if (intentos === "" || Number(intentos) < 0 || !Number.isInteger(Number(intentos))) {
    error("intentos_fallidos", "Escribe un número entero de 0 o más."); ok = false; $("advanced").open = true;
  }
  return ok;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validar()) { form.querySelector(".is-invalid")?.focus(); return; }

  const cuenta = {
    idcuenta: Number($("idcuenta").value) || null,
    n_usuario: $("n_usuario").value.trim(),
    correo: $("correo").value.trim(),
    clave: $("clave").value || undefined,
    estado: $("estado").value,
    rol_idrol: Number($("rol_idrol").value),
    pin_recuperacion: $("pin_recuperacion").value.trim() || null,
    pin_expiracion: deLocal($("pin_expiracion").value),
    intentos_fallidos: Number($("intentos_fallidos").value),
    bloqueado_hasta: deLocal($("bloqueado_hasta").value)
  };

  const editando = !!cuenta.idcuenta;
  $("btnGuardar").disabled = true;
  try {
    await api.guardar(cuenta);
    if (API_URL) estado.cuentas = await api.listar();
    dlg.close();
    pintar();
    aviso(editando ? "Cuenta actualizada" : "Cuenta creada");
  } catch (err) {
    aviso("No se pudo guardar la cuenta. Intenta de nuevo.");
  } finally {
    $("btnGuardar").disabled = false;
  }
});

$("verClave").addEventListener("click", () => {
  const c = $("clave");
  const ver = c.type === "password";
  c.type = ver ? "text" : "password";
  $("verClave").setAttribute("aria-label", ver ? "Ocultar contraseña" : "Mostrar contraseña");
});

$("genPin").addEventListener("click", () => {
  $("pin_recuperacion").value = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1e6).padStart(6, "0");
  $("pin_expiracion").value = aLocal(new Date(Date.now() + 15 * 60e3).toISOString());
});

$("pin_recuperacion").addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/\D/g, "").slice(0, 6);
});

/* ---------- ACCIONES DE FILA ---------- */
let idEliminar = null;

$("tbody").addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-accion]");
  if (!btn) return;
  const cuenta = estado.cuentas.find(c => c.idcuenta === Number(btn.dataset.id));
  if (!cuenta) return;

  if (btn.dataset.accion === "editar") abrirFormulario(cuenta);

  if (btn.dataset.accion === "eliminar") {
    idEliminar = cuenta.idcuenta;
    $("delTexto").textContent = `Se eliminará la cuenta «${cuenta.n_usuario}». Esta acción no se puede deshacer.`;
    $("dlgEliminar").showModal();
  }

  if (btn.dataset.accion === "desbloquear") {
    await api.guardar({ ...cuenta, estado: "Activo", intentos_fallidos: 0, bloqueado_hasta: null });
    if (API_URL) estado.cuentas = await api.listar();
    pintar();
    aviso(`Cuenta «${cuenta.n_usuario}» desbloqueada`);
  }
});

$("btnConfirmarEliminar").addEventListener("click", async () => {
  await api.eliminar(idEliminar);
  if (API_URL) estado.cuentas = await api.listar();
  $("dlgEliminar").close();
  pintar();
  aviso("Cuenta eliminada");
});

/* ---------- EVENTOS GENERALES ---------- */
$("btnNueva").addEventListener("click", () => abrirFormulario(null));
["fBuscar", "fRol", "fEstado"].forEach(id => $(id).addEventListener("input", pintar));

// Cerrar modales: botones y clic en el fondo
document.querySelectorAll("[data-cerrar]").forEach(b => b.addEventListener("click", () => b.closest("dialog").close()));
document.querySelectorAll("dialog").forEach(d => d.addEventListener("mousedown", (e) => { if (e.target === d) d.close(); }));

/* ---------- INICIO ---------- */
(async function iniciar() {
  try {
    [estado.roles, estado.cuentas] = await Promise.all([api.roles(), api.listar()]);
  } catch (err) {
    $("resumen").textContent = "No se pudieron cargar las cuentas.";
    return;
  }
  llenarRoles();
  pintar();
})();