/* MÓDULO · ESTUDIANTES */


const API_URL = ""; // ej.: "/api"

const hace = (d) => new Date(Date.now() - d * 864e5).toISOString();

const ESTUDIANTES_DEMO = [
  { idestudiante: 1, nombres: "María Fernanda", apellidos: "González Rojas", ci: "8456123", fecha_agregacion: hace(90), estado_estudiante: "Activo" },
  { idestudiante: 2, nombres: "Javier", apellidos: "Pérez Mamani", ci: "9123456", fecha_agregacion: hace(88), estado_estudiante: "Activo" },
  { idestudiante: 3, nombres: "Lucía", apellidos: "Ramírez Quispe", ci: "7894561", fecha_agregacion: hace(60), estado_estudiante: "Activo" },
  { idestudiante: 4, nombres: "Carlos Andrés", apellidos: "Torres Vargas", ci: "10234567", fecha_agregacion: hace(45), estado_estudiante: "Inactivo" },
  { idestudiante: 5, nombres: "Sofía", apellidos: "Aguilar Choque", ci: "6543210", fecha_agregacion: hace(20), estado_estudiante: "Retirado" }
];

const estado = { lista: [], pagina: 1 };
const POR_PAGINA = 10;

const api = {
  async listar() {
    if (API_URL) return (await fetch(`${API_URL}/estudiantes`)).json();
    try {
      const g = JSON.parse(localStorage.getItem("estudiantes_demo"));
      if (Array.isArray(g)) return g;
    } catch (e) {}
    return ESTUDIANTES_DEMO.slice();
  },
  async guardar(est) {
    if (API_URL) {
      const nuevo = !est.idestudiante;
      const r = await fetch(`${API_URL}/estudiantes${nuevo ? "" : "/" + est.idestudiante}`, {
        method: nuevo ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(est)
      });
      if (!r.ok) throw new Error("guardar");
      return r.json();
    }
    if (!est.idestudiante) {
      est.idestudiante = Math.max(0, ...estado.lista.map(x => x.idestudiante)) + 1;
      est.fecha_agregacion = new Date().toISOString();
      estado.lista.push(est);
    } else {
      const i = estado.lista.findIndex(x => x.idestudiante === est.idestudiante);
      estado.lista[i] = { ...estado.lista[i], ...est };
    }
    localStorage.setItem("estudiantes_demo", JSON.stringify(estado.lista));
    return est;
  },
  async eliminar(id) {
    if (API_URL) {
      const r = await fetch(`${API_URL}/estudiantes/${id}`, { method: "DELETE" });
      if (r.status === 409) throw new Error("en_uso");
      if (!r.ok) throw new Error("eliminar");
      return;
    }
    estado.lista = estado.lista.filter(x => x.idestudiante !== id);
    localStorage.setItem("estudiantes_demo", JSON.stringify(estado.lista));
  }
};

/* UTILIDADES  */
const $ = (id) => document.getElementById(id);
const escapar = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const normalizar = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const limpiarEspacios = (s) => s.trim().replace(/\s+/g, " ");
const iniciales = (e) => (e.nombres.trim()[0] + e.apellidos.trim()[0]).toUpperCase();
const nombreCompleto = (e) => `${e.apellidos}, ${e.nombres}`;

const fmtFecha = (iso) => iso
  ? new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })
  : "—";
const fmtFechaHora = (iso) => iso
  ? new Date(iso).toLocaleString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
  : "—";

// Color estable del avatar según el id
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
  const est = $("fEstado").value;
  return estado.lista
    .filter(e =>
      (!q || normalizar(`${e.nombres} ${e.apellidos} ${e.ci}`).includes(q)) &&
      (!est || e.estado_estudiante === est))
    .sort((a, b) => a.apellidos.localeCompare(b.apellidos, "es") || a.nombres.localeCompare(b.nombres, "es"));
}

function insignia(e) {
  const clase = e.estado_estudiante === "Activo" ? "ok" : e.estado_estudiante === "Retirado" ? "out" : "off";
  return `<span class="badge badge--${clase}">${escapar(e.estado_estudiante)}</span>`;
}

function pintar() {
  const lista = filtrados();
  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  estado.pagina = Math.min(estado.pagina, paginas);
  const inicio = (estado.pagina - 1) * POR_PAGINA;
  const visibles = lista.slice(inicio, inicio + POR_PAGINA);

  $("vacio").hidden = lista.length > 0;

  $("tbody").innerHTML = visibles.map(e => `
    <tr>
      <td data-label="Estudiante">
        <div class="user">
          <span class="user__avatar" style="background:${colorAvatar(e.idestudiante)}">${escapar(iniciales(e))}</span>
          <strong>${escapar(nombreCompleto(e))}</strong>
        </div>
      </td>
      <td data-label="CI" class="muted num">${escapar(e.ci)}</td>
      <td data-label="Estado">${insignia(e)}</td>
      <td data-label="Registrado" class="muted">${fmtFecha(e.fecha_agregacion)}</td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" data-accion="editar" data-id="${e.idestudiante}" title="Editar" aria-label="Editar ${escapar(nombreCompleto(e))}">${icono("edit")}</button>
          <button class="icon-btn icon-btn--danger" data-accion="eliminar" data-id="${e.idestudiante}" title="Eliminar" aria-label="Eliminar ${escapar(nombreCompleto(e))}">${icono("del")}</button>
        </div>
      </td>
    </tr>`).join("");

  // Paginación
  $("pager").hidden = lista.length <= POR_PAGINA;
  $("pagerInfo").textContent = `${inicio + 1}–${inicio + visibles.length} de ${lista.length}`;
  $("btnPrev").disabled = estado.pagina <= 1;
  $("btnNext").disabled = estado.pagina >= paginas;

  // Resumen
  const total = estado.lista.length;
  const activos = estado.lista.filter(e => e.estado_estudiante === "Activo").length;
  $("resumen").textContent = `${total} ${total === 1 ? "estudiante" : "estudiantes"} · ${activos} ${activos === 1 ? "activo" : "activos"}`;
}

/* FORMULARIO */
const dlg = $("dlgEst");
const form = $("formEst");

function limpiarErrores() {
  form.querySelectorAll(".err").forEach(e => (e.textContent = ""));
  form.querySelectorAll(".is-invalid").forEach(e => e.classList.remove("is-invalid"));
}

function abrirFormulario(est) {
  limpiarErrores();
  form.reset();
  $("dlgTitulo").textContent = est ? "Editar estudiante" : "Nuevo estudiante";
  $("btnGuardar").textContent = est ? "Guardar cambios" : "Guardar estudiante";
  $("idestudiante").value = est?.idestudiante ?? "";
  $("nombres").value = est?.nombres ?? "";
  $("apellidos").value = est?.apellidos ?? "";
  $("ci").value = est?.ci ?? "";
  $("estado_estudiante").value = est?.estado_estudiante ?? "Activo";
  $("fecha_agregacion").value = est ? fmtFechaHora(est.fecha_agregacion) : "Se asigna al guardar";
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
  const id = Number($("idestudiante").value) || null;
  const nombres = limpiarEspacios($("nombres").value);
  const apellidos = limpiarEspacios($("apellidos").value);
  const ci = $("ci").value.trim().toUpperCase();

  if (nombres.length < 2) { marcarError("nombres", "Escribe al menos 2 caracteres."); ok = false; }
  else if (!SOLO_LETRAS.test(nombres)) { marcarError("nombres", "Usa solo letras."); ok = false; }

  if (apellidos.length < 2) { marcarError("apellidos", "Escribe al menos 2 caracteres."); ok = false; }
  else if (!SOLO_LETRAS.test(apellidos)) { marcarError("apellidos", "Usa solo letras."); ok = false; }

  if (!/^[0-9A-Z-]{5,10}$/.test(ci)) { marcarError("ci", "El CI debe tener entre 5 y 10 caracteres (números, letras o guion)."); ok = false; }
  else if (estado.lista.some(e => e.idestudiante !== id && e.ci.toUpperCase() === ci)) {
    marcarError("ci", "Ya hay un estudiante registrado con ese CI."); ok = false;
  }
  return ok;
}

$("ci").addEventListener("input", (e) => {
  e.target.value = e.target.value.toUpperCase().replace(/[^0-9A-Z-]/g, "");
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validar()) { form.querySelector(".is-invalid")?.focus(); return; }

  const est = {
    idestudiante: Number($("idestudiante").value) || null,
    nombres: limpiarEspacios($("nombres").value),
    apellidos: limpiarEspacios($("apellidos").value),
    ci: $("ci").value.trim().toUpperCase(),
    estado_estudiante: $("estado_estudiante").value
  };
  const editando = !!est.idestudiante;

  $("btnGuardar").disabled = true;
  try {
    await api.guardar(est);
    if (API_URL) estado.lista = await api.listar();
    dlg.close();
    pintar();
    aviso(editando ? "Estudiante actualizado" : "Estudiante registrado");
  } catch (err) {
    aviso("No se pudo guardar el estudiante. Intenta de nuevo.");
  } finally {
    $("btnGuardar").disabled = false;
  }
});

/* ACCIONES DE FILA */
let idEliminar = null;

$("tbody").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-accion]");
  if (!btn) return;
  const est = estado.lista.find(x => x.idestudiante === Number(btn.dataset.id));
  if (!est) return;

  if (btn.dataset.accion === "editar") abrirFormulario(est);
  if (btn.dataset.accion === "eliminar") {
    idEliminar = est.idestudiante;
    $("delTexto").textContent = `Se eliminará a ${est.nombres} ${est.apellidos} (CI ${est.ci}). Esta acción no se puede deshacer. Si solo dejó el colegio, cambia su estado a Retirado.`;
    $("dlgEliminar").showModal();
  }
});

$("btnConfirmarEliminar").addEventListener("click", async () => {
  try {
    await api.eliminar(idEliminar);
    if (API_URL) estado.lista = await api.listar();
    $("dlgEliminar").close();
    pintar();
    aviso("Estudiante eliminado");
  } catch (err) {
    $("dlgEliminar").close();
    aviso(err.message === "en_uso"
      ? "No se puede eliminar: tiene registros asociados. Cambia su estado a Retirado."
      : "No se pudo eliminar el estudiante. Intenta de nuevo.");
  }
});

/* EVENTOS GENERALES */
$("btnNuevo").addEventListener("click", () => abrirFormulario(null));
["fBuscar", "fEstado"].forEach(id => $(id).addEventListener("input", () => { estado.pagina = 1; pintar(); }));
$("btnPrev").addEventListener("click", () => { estado.pagina--; pintar(); });
$("btnNext").addEventListener("click", () => { estado.pagina++; pintar(); });

document.querySelectorAll("[data-cerrar]").forEach(b => b.addEventListener("click", () => b.closest("dialog").close()));
document.querySelectorAll("dialog").forEach(d => d.addEventListener("mousedown", (e) => { if (e.target === d) d.close(); }));

/*  INICIO */
(async function iniciar() {
  try {
    estado.lista = await api.listar();
  } catch (err) {
    $("resumen").textContent = "No se pudieron cargar los estudiantes.";
    return;
  }
  pintar();
})();