/* MÓDULO · DOCENTES (Conectado al Backend) */

const estado = { lista: [], pagina: 1 };
const POR_PAGINA = 10;

// UTILIDADES
const $ = (id) => document.getElementById(id);
const escapar = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const normalizar = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const limpiarEspacios = (s) => s.trim().replace(/\s+/g, " ");
const iniciales = (d) => (d.nombres.trim()[0] + d.apellidos.trim()[0]).toUpperCase();
const nombreCompleto = (d) => `${d.apellidos}, ${d.nombres}`;
const fmtFecha = formatearFecha;
const fmtFechaHora = formatearFechaHora;
const COLORES = [
  "linear-gradient(135deg, var(--secondary-500), var(--secondary-700))",
  "linear-gradient(135deg, var(--tertiary-500), var(--tertiary-600))",
  "linear-gradient(135deg, var(--cyan-500), var(--cyan-700))",
  "linear-gradient(135deg, var(--primary-500), var(--primary-700))"
];
const colorAvatar = (id) => COLORES[id % COLORES.length];
const ICO = {
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  del: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5"/>'
};
// Nos aseguramos de que el SVG no capture los clics
const icono = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;" aria-hidden="true">${ICO[n]}</svg>`;

// LISTADO
function filtrados() {
  const q = normalizar($("fBuscar").value.trim());
  return estado.lista
    .filter(d => {
      if (!q) return true;
      return normalizar(`${d.nombres} ${d.apellidos} ${d.ci} ${d.telefono ?? ""} ${d.n_usuario ?? ""} ${d.correo ?? ""}`).includes(q);
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
        <div class="acct"><strong>${escapar(d.n_usuario)}</strong><span>${escapar(d.correo)}${d.estado === "Inactivo" ? " · Inactiva" : ""}</span></div>
      </td>
      <td data-label="Registrado" class="muted">${fmtFecha(d.fecha_agregacion)}</td>
      <td>
        <div class="row-actions">
          <button type="button" class="icon-btn" data-accion="editar" data-id="${d.iddocente}" title="Editar" aria-label="Editar ${escapar(nombreCompleto(d))}">${icono("edit")}</button>
          <button type="button" class="icon-btn icon-btn--danger" data-accion="eliminar" data-id="${d.iddocente}" title="Eliminar" aria-label="Eliminar ${escapar(nombreCompleto(d))}">${icono("del")}</button>
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

/* ---------- FORMULARIO ---------- */
const dlg = $("dlgDoc");
const form = $("formDoc");

// Errores del backend que se muestran junto al campo correspondiente
const REGLAS_ERROR = [
  [/nombre de usuario/i, "n_usuario"],
  [/correo/i, "correo"],
  [/contraseña/i, "clave"],
  [/\bCI\b/, "ci"],
  [/tel[eé]fono/i, "telefono"],
  [/nombres/i, "nombres"],
  [/apellidos/i, "apellidos"],
  [/estado/i, "estado"]
];

function limpiarErrores() {
  limpiarErroresFormulario(form);
}

function abrirFormulario(doc) {
  limpiarErrores();
  form.reset();
  $("dlgTitulo").textContent = doc ? "Editar docente" : "Nuevo docente";
  $("btnGuardar").textContent = doc ? "Guardar cambios" : "Guardar docente";
  $("iddocente").value = doc?.iddocente ?? "";
  $("nombres").value = doc?.nombres ?? "";
  $("apellidos").value = doc?.apellidos ?? "";
  $("ci").value = doc?.ci ?? "";
  $("telefono").value = doc?.telefono ?? "";
  $("n_usuario").value = doc?.n_usuario ?? "";
  $("correo").value = doc?.correo ?? "";
  $("clave").value = "";
  $("hintClave").textContent = doc ? "Déjala vacía para conservar la actual." : "Mínimo 8 caracteres, con al menos una letra y un número.";
  $("estado").value = doc?.estado ?? "Activo";
  dlg.showModal();
  $("nombres").focus();
}

function marcarError(campo, msg) {
  marcarErrorCampo(form, campo, msg);
}

function validar() {
  limpiarErrores();
  let ok = true;
  const id = Number($("iddocente").value) || null;
  const ci = $("ci").value.trim().toUpperCase();
  const editando = !!id;

  const reglas = [
    ["nombres", validadores.nombrePersona($("nombres").value, "Los nombres")],
    ["apellidos", validadores.nombrePersona($("apellidos").value, "Los apellidos")],
    ["ci", validadores.ci(ci)],
    ["telefono", validadores.telefono($("telefono").value)],
    ["n_usuario", validadores.usuario($("n_usuario").value)],
    ["correo", validadores.correo($("correo").value)],
    ["clave", validadores.clave($("clave").value, !editando)]
  ];
  for (const [campo, msg] of reglas) if (msg) { marcarError(campo, msg); ok = false; }

  if (!form.querySelector('[data-err="ci"]').textContent &&
      estado.lista.some(d => String(d.iddocente) !== String(id) && d.ci.toUpperCase() === ci)) {
    marcarError("ci", "Ya hay un docente registrado con ese CI."); ok = false;
  }
  const usuario = $("n_usuario").value.trim().toLowerCase();
  if (!form.querySelector('[data-err="n_usuario"]').textContent &&
      estado.lista.some(d => String(d.iddocente) !== String(id) && String(d.n_usuario).toLowerCase() === usuario)) {
    marcarError("n_usuario", "El nombre de usuario ya existe."); ok = false;
  }
  const correo = $("correo").value.trim().toLowerCase();
  if (!form.querySelector('[data-err="correo"]').textContent &&
      estado.lista.some(d => String(d.iddocente) !== String(id) && String(d.correo).toLowerCase() === correo)) {
    marcarError("correo", "Ya existe una cuenta registrada con ese correo."); ok = false;
  }
  return ok;
}

// Validación mientras se escribe
validarEnVivo(form, "nombres", (v) => validadores.nombrePersona(v, "Los nombres"));
validarEnVivo(form, "apellidos", (v) => validadores.nombrePersona(v, "Los apellidos"));
validarEnVivo(form, "ci", (v) => validadores.ci(v));
validarEnVivo(form, "telefono", (v) => validadores.telefono(v));
validarEnVivo(form, "n_usuario", (v) => validadores.usuario(v));
validarEnVivo(form, "correo", (v) => validadores.correo(v));
validarEnVivo(form, "clave", (v) => validadores.clave(v, !$("iddocente").value));

$("ci").addEventListener("input", (e) => {
  e.target.value = e.target.value.toUpperCase().replace(/[^0-9A-Z-]/g, "").slice(0, 13);
});
$("telefono").addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/[^\d+\s-]/g, "").slice(0, 12);
});

// GUARDAR
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validar()) { form.querySelector(".is-invalid")?.focus(); return; }

  const id = $("iddocente").value;
  const editando = !!id;
  const payload = {
    nombres: limpiarEspacios($("nombres").value),
    apellidos: limpiarEspacios($("apellidos").value),
    ci: $("ci").value.trim().toUpperCase(),
    telefono: $("telefono").value.trim() || null,
    n_usuario: $("n_usuario").value.trim(),
    correo: $("correo").value.trim().toLowerCase(),
    estado: $("estado").value
  };
  if ($("clave").value) payload.clave = $("clave").value;
  setCargando($("btnGuardar"), true, "Guardando…");
  try {
    if (editando) {
      await apiPut(`/docentes/${id}`, payload);
      mostrarExito("Docente actualizado correctamente");
    } else {
      await apiPost(`/docentes`, payload);
      mostrarExito("Docente registrado correctamente");
    }

    await cargarDocentes();
    dlg.close();

  } catch (err) {
    errorFormulario(form, err, REGLAS_ERROR, "No se pudo guardar el docente");
  } finally {
    setCargando($("btnGuardar"), false);
  }
});

// ACCIONES DE FILA (CORREGIDO)
let idEliminar = null;

$("tbody").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-accion]");
  if (!btn) return;

  const id = String(btn.dataset.id);
  // Buscamos comparando ambos lados como String
  const doc = estado.lista.find(x => String(x.iddocente) === id);

  if (!doc) {
    console.warn("Docente no encontrado para id:", id);
    return;
  }

  if (btn.dataset.accion === "editar") {
    abrirFormulario(doc);
  }

  if (btn.dataset.accion === "eliminar") {
    idEliminar = doc.iddocente;
    $("delTexto").textContent = `Se eliminará a ${doc.nombres} ${doc.apellidos} (CI ${doc.ci}). También se eliminará su cuenta de acceso. Esta acción no se puede deshacer.`;
    $("dlgEliminar").showModal();
  }
});

$("btnConfirmarEliminar").addEventListener("click", async () => {
  const btnDel = $("btnConfirmarEliminar");
  setCargando(btnDel, true, "Eliminando…");
  try {
    await apiDelete(`/docentes/${idEliminar}`);
    await cargarDocentes();
    $("dlgEliminar").close();
    mostrarExito("Docente eliminado correctamente");
  } catch (err) {
    $("dlgEliminar").close();
    mostrarError(err, "No se puede eliminar: el docente tiene horarios o asistencias asociadas.");
  } finally {
    setCargando(btnDel, false);
  }
});

// EVENTOS GENERALES
$("btnNuevo").addEventListener("click", () => abrirFormulario(null));
$("fBuscar").addEventListener("input", () => { estado.pagina = 1; pintar(); });
$("btnPrev").addEventListener("click", () => { estado.pagina--; pintar(); });
$("btnNext").addEventListener("click", () => { estado.pagina++; pintar(); });
document.querySelectorAll("[data-cerrar]").forEach(b => b.addEventListener("click", () => b.closest("dialog").close()));
document.querySelectorAll("dialog").forEach(d => d.addEventListener("mousedown", (e) => { if (e.target === d) d.close(); }));

// CARGA DE DATOS
async function cargarDocentes() {
  try {
    estado.lista = await apiGet('/docentes');
    pintar();
  } catch (err) {
    $("resumen").textContent = "Error al cargar docentes.";
    mostrarError(err, "Error al cargar docentes.");
    mostrarErrorTabla($("tbody"), err, cargarDocentes);
  }
}

(async function iniciar() {
  mostrarSkeleton($("tbody"), 5);
  $("resumen").textContent = "Cargando docentes...";
  await cargarDocentes();
})();

// PERMISOS
aplicarSoloLectura(esAdmin(), ["btnNuevo"]);