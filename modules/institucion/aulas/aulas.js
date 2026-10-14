/* =========================================================
   MÓDULO · AULA
   Tabla: aula (idaula, nombre varchar(100), ubicacion varchar(255),
          colegio_idcolegio int)
   ========================================================= */

/* ---------- CAPA DE DATOS ----------
   Ahora funciona en modo demostración (localStorage).
   Para conectarlo a tu backend, pon tu ruta en API_URL:
     GET    {API_URL}/aulas
     POST   {API_URL}/aulas
     PUT    {API_URL}/aulas/:id
     DELETE {API_URL}/aulas/:id    (409 si tiene horarios u otros registros)
     GET    {API_URL}/colegios     (campos: idcolegio, nombre) */
const API_URL = ""; // ej.: "/api"

const COLEGIOS_DEMO = [
  { idcolegio: 1, nombre: "Unidad Educativa San Martín" }
];

const AULAS_DEMO = [
  { idaula: 1, nombre: "Aula 101", ubicacion: "Bloque A · Planta baja", colegio_idcolegio: 1 },
  { idaula: 2, nombre: "Aula 102", ubicacion: "Bloque A · Planta baja", colegio_idcolegio: 1 },
  { idaula: 3, nombre: "Aula 201", ubicacion: "Bloque A · 2.º piso", colegio_idcolegio: 1 },
  { idaula: 4, nombre: "Laboratorio de Computación", ubicacion: "Bloque B · 1.er piso, junto a la biblioteca", colegio_idcolegio: 1 },
  { idaula: 5, nombre: "Sala de Música", ubicacion: null, colegio_idcolegio: 1 }
];

const estado = { aulas: [], colegios: [], pagina: 1 };
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
    if (API_URL) return (await fetch(`${API_URL}/aulas`)).json();
    return leerLocal("aulas_demo", AULAS_DEMO);
  },
  async colegios() {
    if (API_URL) return (await fetch(`${API_URL}/colegios`)).json();
    return leerLocal("colegios_demo", COLEGIOS_DEMO);
  },
  async guardar(aula) {
    if (API_URL) {
      const nueva = !aula.idaula;
      const r = await fetch(`${API_URL}/aulas${nueva ? "" : "/" + aula.idaula}`, {
        method: nueva ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aula)
      });
      if (!r.ok) throw new Error("guardar");
      return r.json();
    }
    if (!aula.idaula) {
      aula.idaula = Math.max(0, ...estado.aulas.map(x => x.idaula)) + 1;
      estado.aulas.push(aula);
    } else {
      const i = estado.aulas.findIndex(x => x.idaula === aula.idaula);
      estado.aulas[i] = aula;
    }
    localStorage.setItem("aulas_demo", JSON.stringify(estado.aulas));
    return aula;
  },
  async eliminar(id) {
    if (API_URL) {
      const r = await fetch(`${API_URL}/aulas/${id}`, { method: "DELETE" });
      if (r.status === 409) throw new Error("en_uso");
      if (!r.ok) throw new Error("eliminar");
      return;
    }
    estado.aulas = estado.aulas.filter(x => x.idaula !== id);
    localStorage.setItem("aulas_demo", JSON.stringify(estado.aulas));
  }
};

/* ---------- UTILIDADES ---------- */
const $ = (id) => document.getElementById(id);
const escapar = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const normalizar = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const limpiarEspacios = (s) => s.trim().replace(/\s+/g, " ");
const nombreColegio = (id) => estado.colegios.find(c => c.idcolegio === id)?.nombre ?? "Sin colegio";

let toastTimer;
function aviso(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("is-show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("is-show"), 2800);
}

/* ---------- LISTADO ---------- */
const ICO = {
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  del: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5"/>',
  room: '<path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16M2 21h20M15 9h4a1 1 0 0 1 1 1v11M10 12v.01"/>'
};
const icono = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[n]}</svg>`;

function filtradas() {
  const q = normalizar($("fBuscar").value.trim());
  const col = $("fColegio").value;
  return estado.aulas
    .filter(a =>
      (!q || normalizar(`${a.nombre} ${a.ubicacion ?? ""} ${nombreColegio(a.colegio_idcolegio)}`).includes(q)) &&
      (!col || String(a.colegio_idcolegio) === col))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { numeric: true }));
}

function pintar() {
  const lista = filtradas();
  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  estado.pagina = Math.min(estado.pagina, paginas);
  const inicio = (estado.pagina - 1) * POR_PAGINA;
  const visibles = lista.slice(inicio, inicio + POR_PAGINA);

  $("vacio").hidden = lista.length > 0;

  $("tbody").innerHTML = visibles.map(a => `
    <tr>
      <td data-label="Aula">
        <div class="room">
          <span class="room__ico">${icono("room")}</span>
          <strong>${escapar(a.nombre)}</strong>
        </div>
      </td>
      <td data-label="Ubicación" class="muted loc">${a.ubicacion ? escapar(a.ubicacion) : "—"}</td>
      <td data-label="Colegio"><span class="badge badge--school" title="${escapar(nombreColegio(a.colegio_idcolegio))}"><span>${escapar(nombreColegio(a.colegio_idcolegio))}</span></span></td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" data-accion="editar" data-id="${a.idaula}" title="Editar" aria-label="Editar ${escapar(a.nombre)}">${icono("edit")}</button>
          <button class="icon-btn icon-btn--danger" data-accion="eliminar" data-id="${a.idaula}" title="Eliminar" aria-label="Eliminar ${escapar(a.nombre)}">${icono("del")}</button>
        </div>
      </td>
    </tr>`).join("");

  $("pager").hidden = lista.length <= POR_PAGINA;
  $("pagerInfo").textContent = `${inicio + 1}–${inicio + visibles.length} de ${lista.length}`;
  $("btnPrev").disabled = estado.pagina <= 1;
  $("btnNext").disabled = estado.pagina >= paginas;

  const n = estado.aulas.length;
  $("resumen").textContent = `${n} ${n === 1 ? "aula registrada" : "aulas registradas"}`;
}

/* ---------- COMBOS DE COLEGIO ---------- */
function llenarColegios() {
  const ordenados = estado.colegios.slice().sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  const opciones = ordenados.map(c => `<option value="${c.idcolegio}">${escapar(c.nombre)}</option>`).join("");
  $("colegio_idcolegio").innerHTML = '<option value="">Selecciona un colegio</option>' + opciones;
  $("fColegio").innerHTML = '<option value="">Todos los colegios</option>' + opciones;
  $("fColegio").hidden = ordenados.length < 2; // con un solo colegio el filtro no aporta nada
}

/* ---------- FORMULARIO ---------- */
const dlg = $("dlgAula");
const form = $("formAula");

function contadores() {
  $("cntNombre").textContent = `${$("nombre").value.length}/100`;
  $("cntUbic").textContent = `${$("ubicacion").value.length}/255`;
}

function limpiarErrores() {
  form.querySelectorAll(".err").forEach(e => (e.textContent = ""));
  form.querySelectorAll(".is-invalid").forEach(e => e.classList.remove("is-invalid"));
}

function abrirFormulario(aula) {
  limpiarErrores();
  form.reset();
  $("dlgTitulo").textContent = aula ? "Editar aula" : "Nueva aula";
  $("btnGuardar").textContent = aula ? "Guardar cambios" : "Guardar aula";
  $("idaula").value = aula?.idaula ?? "";
  $("nombre").value = aula?.nombre ?? "";
  $("ubicacion").value = aula?.ubicacion ?? "";

  // Con un solo colegio se preselecciona; sin colegios se avisa
  $("colegio_idcolegio").value = aula?.colegio_idcolegio ?? (estado.colegios.length === 1 ? estado.colegios[0].idcolegio : "");
  const hint = $("hintColegio");
  if (!estado.colegios.length) {
    hint.textContent = "Primero registra un colegio en el módulo Colegio.";
    hint.classList.add("is-warn");
  } else {
    hint.textContent = "";
    hint.classList.remove("is-warn");
  }

  contadores();
  dlg.showModal();
  $("nombre").focus();
}

function marcarError(campo, msg) {
  form.querySelector(`[data-err="${campo}"]`).textContent = msg;
  $(campo).classList.add("is-invalid");
}

function validar() {
  limpiarErrores();
  let ok = true;
  const id = Number($("idaula").value) || null;
  const nombre = limpiarEspacios($("nombre").value);
  const colegio = Number($("colegio_idcolegio").value);

  if (nombre.length < 2) { marcarError("nombre", "Escribe al menos 2 caracteres."); ok = false; }
  if (!colegio) { marcarError("colegio_idcolegio", "Selecciona el colegio al que pertenece el aula."); ok = false; }
  if (nombre.length >= 2 && colegio &&
      estado.aulas.some(a => a.idaula !== id && a.colegio_idcolegio === colegio && normalizar(a.nombre) === normalizar(nombre))) {
    marcarError("nombre", "Ya existe un aula con ese nombre en este colegio."); ok = false;
  }
  return ok;
}

$("nombre").addEventListener("input", contadores);
$("ubicacion").addEventListener("input", contadores);

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validar()) { form.querySelector(".is-invalid")?.focus(); return; }

  const aula = {
    idaula: Number($("idaula").value) || null,
    nombre: limpiarEspacios($("nombre").value),
    ubicacion: limpiarEspacios($("ubicacion").value) || null,
    colegio_idcolegio: Number($("colegio_idcolegio").value)
  };
  const editando = !!aula.idaula;

  $("btnGuardar").disabled = true;
  try {
    await api.guardar(aula);
    if (API_URL) estado.aulas = await api.listar();
    dlg.close();
    pintar();
    aviso(editando ? "Aula actualizada" : "Aula creada");
  } catch (err) {
    aviso("No se pudo guardar el aula. Intenta de nuevo.");
  } finally {
    $("btnGuardar").disabled = false;
  }
});

/* ---------- ACCIONES DE FILA ---------- */
let idEliminar = null;

$("tbody").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-accion]");
  if (!btn) return;
  const aula = estado.aulas.find(x => x.idaula === Number(btn.dataset.id));
  if (!aula) return;

  if (btn.dataset.accion === "editar") abrirFormulario(aula);
  if (btn.dataset.accion === "eliminar") {
    idEliminar = aula.idaula;
    $("delTexto").textContent = `Se eliminará «${aula.nombre}». Esta acción no se puede deshacer.`;
    $("dlgEliminar").showModal();
  }
});

$("btnConfirmarEliminar").addEventListener("click", async () => {
  try {
    await api.eliminar(idEliminar);
    if (API_URL) estado.aulas = await api.listar();
    $("dlgEliminar").close();
    pintar();
    aviso("Aula eliminada");
  } catch (err) {
    $("dlgEliminar").close();
    aviso(err.message === "en_uso"
      ? "No se puede eliminar: el aula tiene horarios u otros registros asociados."
      : "No se pudo eliminar el aula. Intenta de nuevo.");
  }
});

/* ---------- EVENTOS GENERALES ---------- */
$("btnNueva").addEventListener("click", () => abrirFormulario(null));
["fBuscar", "fColegio"].forEach(id => $(id).addEventListener("input", () => { estado.pagina = 1; pintar(); }));
$("btnPrev").addEventListener("click", () => { estado.pagina--; pintar(); });
$("btnNext").addEventListener("click", () => { estado.pagina++; pintar(); });

document.querySelectorAll("[data-cerrar]").forEach(b => b.addEventListener("click", () => b.closest("dialog").close()));
document.querySelectorAll("dialog").forEach(d => d.addEventListener("mousedown", (e) => { if (e.target === d) d.close(); }));

/* ---------- INICIO ---------- */
(async function iniciar() {
  try {
    [estado.aulas, estado.colegios] = await Promise.all([api.listar(), api.colegios()]);
  } catch (err) {
    $("resumen").textContent = "No se pudieron cargar las aulas.";
    return;
  }
  llenarColegios();
  pintar();
})();