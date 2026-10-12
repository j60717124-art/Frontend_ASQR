/* MÓDULO · DOCENTES */

const API_URL = ""; // ej.: "/api"

const hace = (d) => new Date(Date.now() - d * 864e5).toISOString();

const ROLES_DEMO = [
  { idrol: 1, nombre_rol: "Administrador" },
  { idrol: 2, nombre_rol: "Director" },
  { idrol: 3, nombre_rol: "Docente" },
  { idrol: 4, nombre_rol: "Secretaría" },
  { idrol: 5, nombre_rol: "Portería" }
];

const CUENTAS_DEMO = [
  { idcuenta: 1, n_usuario: "admin", correo: "admin@colegio.edu", rol_idrol: 1 },
  { idcuenta: 2, n_usuario: "mgonzalez", correo: "maria.gonzalez@colegio.edu", rol_idrol: 3 },
  { idcuenta: 3, n_usuario: "jperez", correo: "javier.perez@colegio.edu", rol_idrol: 4 },
  { idcuenta: 4, n_usuario: "lramirez", correo: "lucia.ramirez@colegio.edu", rol_idrol: 5 },
  { idcuenta: 5, n_usuario: "cmendoza", correo: "carmen.mendoza@colegio.edu", rol_idrol: 3 },
  { idcuenta: 6, n_usuario: "rvargas", correo: "ricardo.vargas@colegio.edu", rol_idrol: 3 }
];

const DOCENTES_DEMO = [
  { iddocente: 1, nombres: "María Fernanda", apellidos: "González Rojas", ci: "5123456", telefono: "71234567", fecha_agregacion: hace(110), cuenta_idcuenta: 2 },
  { iddocente: 2, nombres: "Carmen", apellidos: "Mendoza Flores", ci: "4987654", telefono: "68765432", fecha_agregacion: hace(70), cuenta_idcuenta: 5 }
];

const estado = { lista: [], cuentas: [], roles: [], pagina: 1 };
const POR_PAGINA = 10;

const leerLocal = (clave, defecto) => {
  try {
    const g = JSON.parse(localStorage.getItem(clave));
    if (Array.isArray(g)) return g;
  } catch (e) {}
  return defecto.slice();
};

const api = {
  async listar() {
    if (API_URL) return (await fetch(`${API_URL}/docentes`)).json();
    return leerLocal("docentes_demo", DOCENTES_DEMO);
  },
  async cuentas() {
    if (API_URL) return (await fetch(`${API_URL}/cuentas`)).json();
    // Si ya usaste el módulo de cuentas en modo demo, se leen de ahí
    return leerLocal("cuentas_demo", CUENTAS_DEMO);
  },
  async roles() {
    if (API_URL) return (await fetch(`${API_URL}/roles`)).json();
    return leerLocal("roles_demo", ROLES_DEMO);
  },
  async guardar(doc) {
    if (API_URL) {
      const nuevo = !doc.iddocente;
      const r = await fetch(`${API_URL}/docentes${nuevo ? "" : "/" + doc.iddocente}`, {
        method: nuevo ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(doc)
      });
      if (!r.ok) throw new Error("guardar");
      return r.json();
    }
    if (!doc.iddocente) {
      doc.iddocente = Math.max(0, ...estado.lista.map(x => x.iddocente)) + 1;
      doc.fecha_agregacion = new Date().toISOString();
      estado.lista.push(doc);
    } else {
      const i = estado.lista.findIndex(x => x.iddocente === doc.iddocente);
      estado.lista[i] = { ...estado.lista[i], ...doc };
    }
    localStorage.setItem("docentes_demo", JSON.stringify(estado.lista));
    return doc;
  },
  async eliminar(id) {
    if (API_URL) {
      const r = await fetch(`${API_URL}/docentes/${id}`, { method: "DELETE" });
      if (r.status === 409) throw new Error("en_uso");
      if (!r.ok) throw new Error("eliminar");
      return;
    }
    estado.lista = estado.lista.filter(x => x.iddocente !== id);
    localStorage.setItem("docentes_demo", JSON.stringify(estado.lista));
  }
};

/* UTILIDADES */
const $ = (id) => document.getElementById(id);
const escapar = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const normalizar = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const limpiarEspacios = (s) => s.trim().replace(/\s+/g, " ");
const iniciales = (d) => (d.nombres.trim()[0] + d.apellidos.trim()[0]).toUpperCase();
const nombreCompleto = (d) => `${d.apellidos}, ${d.nombres}`;
const cuentaDe = (id) => estado.cuentas.find(c => c.idcuenta === id);
const nombreRol = (id) => {
  const r = estado.roles.find(x => x.idrol === id);
  return r ? (r.nombre_rol ?? r.nombre) : "Sin rol";
};

const fmtFecha = (iso) => iso
  ? new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })
  : "—";
const fmtFechaHora = (iso) => iso
  ? new Date(iso).toLocaleString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
  : "—";

const COLORES = [
  "linear-gradient(135deg, var(--secondary-500), var(--secondary-700))",
  "linear-gradient(135deg, var(--tertiary-500), var(--tertiary-600))",
  "linear-gradient(135deg, var(--cyan-500), var(--cyan-700))",
  "linear-gradient(135deg, var(--primary-500), var(--primary-700))"
];
const colorAvatar = (id) => COLORES[id % COLORES.length];

let toastTimer;
function aviso(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("is-show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("is-show"), 2800);
}

/* LISTADO */
const ICO = {
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  del: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5"/>'
};
const icono = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[n]}</svg>`;

function filtrados() {
  const q = normalizar($("fBuscar").value.trim());
  return estado.lista
    .filter(d => {
      if (!q) return true;
      const c = cuentaDe(d.cuenta_idcuenta);
      return normalizar(`${d.nombres} ${d.apellidos} ${d.ci} ${d.telefono ?? ""} ${c?.n_usuario ?? ""} ${c?.correo ?? ""}`).includes(q);
    })
    .sort((a, b) => a.apellidos.localeCompare(b.apellidos, "es") || a.nombres.localeCompare(b.nombres, "es"));
}

function pintar() {
  const lista = filtrados();
  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  estado.pagina = Math.min(estado.pagina, paginas);
  const inicio = (estado.pagina - 1) * POR_PAGINA;
  const visibles = lista.slice(inicio, inicio + POR_PAGINA);

  $("vacio").hidden = lista.length > 0;

  $("tbody").innerHTML = visibles.map(d => {
    const c = cuentaDe(d.cuenta_idcuenta);
    return `
    <tr>
      <td data-label="Docente">
        <div class="user">
          <span class="user__avatar" style="background:${colorAvatar(d.iddocente)}">${escapar(iniciales(d))}</span>
          <strong>${escapar(nombreCompleto(d))}</strong>
        </div>
      </td>
      <td data-label="CI" class="muted num">${escapar(d.ci)}</td>
      <td data-label="Teléfono" class="muted num">${d.telefono ? escapar(d.telefono) : "—"}</td>
      <td data-label="Cuenta">
        ${c ? `<div class="acct"><strong>${escapar(c.n_usuario)}</strong><span>${escapar(c.correo)}</span></div>` : '<span class="muted">Cuenta no encontrada</span>'}
      </td>
      <td data-label="Registrado" class="muted">${fmtFecha(d.fecha_agregacion)}</td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" data-accion="editar" data-id="${d.iddocente}" title="Editar" aria-label="Editar ${escapar(nombreCompleto(d))}">${icono("edit")}</button>
          <button class="icon-btn icon-btn--danger" data-accion="eliminar" data-id="${d.iddocente}" title="Eliminar" aria-label="Eliminar ${escapar(nombreCompleto(d))}">${icono("del")}</button>
        </div>
      </td>
    </tr>`;
  }).join("");

  $("pager").hidden = lista.length <= POR_PAGINA;
  $("pagerInfo").textContent = `${inicio + 1}–${inicio + visibles.length} de ${lista.length}`;
  $("btnPrev").disabled = estado.pagina <= 1;
  $("btnNext").disabled = estado.pagina >= paginas;

  const total = estado.lista.length;
  $("resumen").textContent = `${total} ${total === 1 ? "docente registrado" : "docentes registrados"}`;
}

/*  COMBO DE CUENTAS */
// Cuentas libres (sin docente), más la que ya tiene el docente que se edita.
function llenarCuentas(cuentaActual) {
  const usadas = new Set(estado.lista.map(d => d.cuenta_idcuenta));
  const libres = estado.cuentas
    .filter(c => !usadas.has(c.idcuenta) || c.idcuenta === cuentaActual)
    .sort((a, b) => a.n_usuario.localeCompare(b.n_usuario, "es"));

  const esDocente = (c) => normalizar(nombreRol(c.rol_idrol)).includes("docente");
  const opcion = (c) => `<option value="${c.idcuenta}">${escapar(c.n_usuario)} · ${escapar(c.correo)}</option>`;
  const delRol = libres.filter(esDocente);
  const otras = libres.filter(c => !esDocente(c));

  $("cuenta_idcuenta").innerHTML =
    '<option value="">Selecciona una cuenta</option>' +
    (delRol.length ? `<optgroup label="Cuentas con rol Docente">${delRol.map(opcion).join("")}</optgroup>` : "") +
    (otras.length ? `<optgroup label="Otros roles">${otras.map(opcion).join("")}</optgroup>` : "");

  const hint = $("hintCuenta");
  if (!libres.length) {
    hint.textContent = "No hay cuentas disponibles. Crea una en Seguridad › Cuentas y vuelve aquí.";
    hint.classList.add("is-warn");
  } else {
    hint.textContent = "Solo aparecen las cuentas que aún no pertenecen a otro docente.";
    hint.classList.remove("is-warn");
  }
}

/* FORMULARIO */
const dlg = $("dlgDoc");
const form = $("formDoc");

function limpiarErrores() {
  form.querySelectorAll(".err").forEach(e => (e.textContent = ""));
  form.querySelectorAll(".is-invalid").forEach(e => e.classList.remove("is-invalid"));
}

function abrirFormulario(doc) {
  limpiarErrores();
  form.reset();
  llenarCuentas(doc?.cuenta_idcuenta);
  $("dlgTitulo").textContent = doc ? "Editar docente" : "Nuevo docente";
  $("btnGuardar").textContent = doc ? "Guardar cambios" : "Guardar docente";
  $("iddocente").value = doc?.iddocente ?? "";
  $("nombres").value = doc?.nombres ?? "";
  $("apellidos").value = doc?.apellidos ?? "";
  $("ci").value = doc?.ci ?? "";
  $("telefono").value = doc?.telefono ?? "";
  $("cuenta_idcuenta").value = doc?.cuenta_idcuenta ?? "";
  $("fecha_agregacion").value = doc ? fmtFechaHora(doc.fecha_agregacion) : "Se asigna al guardar";
  dlg.showModal();
  $("nombres").focus();
}

function marcarError(campo, msg) {
  form.querySelector(`[data-err="${campo}"]`).textContent = msg;
  $(campo).classList.add("is-invalid");
}

const SOLO_LETRAS = /^\p{L}[\p{L}\s'.-]*$/u;

function validar() {
  limpiarErrores();
  let ok = true;
  const id = Number($("iddocente").value) || null;
  const nombres = limpiarEspacios($("nombres").value);
  const apellidos = limpiarEspacios($("apellidos").value);
  const ci = $("ci").value.trim().toUpperCase();
  const tel = $("telefono").value.trim();

  if (nombres.length < 2) { marcarError("nombres", "Escribe al menos 2 caracteres."); ok = false; }
  else if (!SOLO_LETRAS.test(nombres)) { marcarError("nombres", "Usa solo letras."); ok = false; }

  if (apellidos.length < 2) { marcarError("apellidos", "Escribe al menos 2 caracteres."); ok = false; }
  else if (!SOLO_LETRAS.test(apellidos)) { marcarError("apellidos", "Usa solo letras."); ok = false; }

  if (!/^[0-9A-Z-]{5,10}$/.test(ci)) { marcarError("ci", "El CI debe tener entre 5 y 10 caracteres (números, letras o guion)."); ok = false; }
  else if (estado.lista.some(d => d.iddocente !== id && d.ci.toUpperCase() === ci)) {
    marcarError("ci", "Ya hay un docente registrado con ese CI."); ok = false;
  }

  if (tel && !/^\d{8}$/.test(tel)) { marcarError("telefono", "El teléfono debe tener exactamente 8 dígitos."); ok = false; }

  const cuenta = Number($("cuenta_idcuenta").value);
  if (!cuenta) { marcarError("cuenta_idcuenta", "Selecciona la cuenta del docente."); ok = false; }
  else if (estado.lista.some(d => d.iddocente !== id && d.cuenta_idcuenta === cuenta)) {
    marcarError("cuenta_idcuenta", "Esa cuenta ya pertenece a otro docente."); ok = false;
  }
  return ok;
}

$("ci").addEventListener("input", (e) => {
  e.target.value = e.target.value.toUpperCase().replace(/[^0-9A-Z-]/g, "");
});
$("telefono").addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/\D/g, "").slice(0, 8);
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validar()) { form.querySelector(".is-invalid")?.focus(); return; }

  const doc = {
    iddocente: Number($("iddocente").value) || null,
    nombres: limpiarEspacios($("nombres").value),
    apellidos: limpiarEspacios($("apellidos").value),
    ci: $("ci").value.trim().toUpperCase(),
    telefono: $("telefono").value.trim() || null,
    cuenta_idcuenta: Number($("cuenta_idcuenta").value)
  };
  const editando = !!doc.iddocente;

  $("btnGuardar").disabled = true;
  try {
    await api.guardar(doc);
    if (API_URL) estado.lista = await api.listar();
    dlg.close();
    pintar();
    aviso(editando ? "Docente actualizado" : "Docente registrado");
  } catch (err) {
    aviso("No se pudo guardar el docente. Intenta de nuevo.");
  } finally {
    $("btnGuardar").disabled = false;
  }
});

/* ACCIONES DE FILA */
let idEliminar = null;

$("tbody").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-accion]");
  if (!btn) return;
  const doc = estado.lista.find(x => x.iddocente === Number(btn.dataset.id));
  if (!doc) return;

  if (btn.dataset.accion === "editar") abrirFormulario(doc);
  if (btn.dataset.accion === "eliminar") {
    idEliminar = doc.iddocente;
    $("delTexto").textContent = `Se eliminará a ${doc.nombres} ${doc.apellidos} (CI ${doc.ci}). Su cuenta de acceso no se borra y quedará libre para otro docente. Esta acción no se puede deshacer.`;
    $("dlgEliminar").showModal();
  }
});

$("btnConfirmarEliminar").addEventListener("click", async () => {
  try {
    await api.eliminar(idEliminar);
    if (API_URL) estado.lista = await api.listar();
    $("dlgEliminar").close();
    pintar();
    aviso("Docente eliminado");
  } catch (err) {
    $("dlgEliminar").close();
    aviso(err.message === "en_uso"
      ? "No se puede eliminar: el docente tiene registros asociados (horarios o asistencias)."
      : "No se pudo eliminar el docente. Intenta de nuevo.");
  }
});

/*  EVENTOS GENERALES */
$("btnNuevo").addEventListener("click", () => abrirFormulario(null));
$("fBuscar").addEventListener("input", () => { estado.pagina = 1; pintar(); });
$("btnPrev").addEventListener("click", () => { estado.pagina--; pintar(); });
$("btnNext").addEventListener("click", () => { estado.pagina++; pintar(); });

document.querySelectorAll("[data-cerrar]").forEach(b => b.addEventListener("click", () => b.closest("dialog").close()));
document.querySelectorAll("dialog").forEach(d => d.addEventListener("mousedown", (e) => { if (e.target === d) d.close(); }));

/* INICIO */
(async function iniciar() {
  try {
    [estado.lista, estado.cuentas, estado.roles] = await Promise.all([api.listar(), api.cuentas(), api.roles()]);
  } catch (err) {
    $("resumen").textContent = "No se pudieron cargar los docentes.";
    return;
  }
  pintar();
})();