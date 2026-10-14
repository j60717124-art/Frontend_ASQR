/* =========================================================
   MÓDULO · PARALELO
   Tabla: paralelo (idparalelo, nombre char(1), curso_idcurso int)
   Un curso se divide en paralelos identificados por una letra (A, B, C…).
   ========================================================= */

/* ---------- CAPA DE DATOS ----------
   Ahora funciona en modo demostración (localStorage).
   Para conectarlo a tu backend, pon tu ruta en API_URL:
     GET    {API_URL}/paralelos
     POST   {API_URL}/paralelos
     PUT    {API_URL}/paralelos/:id
     DELETE {API_URL}/paralelos/:id   (409 si tiene estudiantes, horarios u otros registros)
     GET    {API_URL}/cursos          (idcurso, nombre, colegio_idcolegio, nivel_idnivel)
     GET    {API_URL}/niveles         (idnivel, nivel)
     GET    {API_URL}/colegios        (idcolegio, nombre) */
const API_URL = ""; // ej.: "/api"

const COLEGIOS_DEMO = [{ idcolegio: 1, nombre: "Unidad Educativa San Martín" }];
const NIVELES_DEMO = [
  { idnivel: 1, nivel: "Inicial" },
  { idnivel: 2, nivel: "Primaria" },
  { idnivel: 3, nivel: "Secundaria" }
];
const CURSOS_DEMO = [
  { idcurso: 1, nombre: "Pre-kínder", colegio_idcolegio: 1, nivel_idnivel: 1 },
  { idcurso: 2, nombre: "1.º", colegio_idcolegio: 1, nivel_idnivel: 2 },
  { idcurso: 3, nombre: "2.º", colegio_idcolegio: 1, nivel_idnivel: 2 },
  { idcurso: 4, nombre: "1.º", colegio_idcolegio: 1, nivel_idnivel: 3 },
  { idcurso: 5, nombre: "2.º", colegio_idcolegio: 1, nivel_idnivel: 3 },
  { idcurso: 6, nombre: "3.º", colegio_idcolegio: 1, nivel_idnivel: 3 }
];
const PARALELOS_DEMO = [
  { idparalelo: 1, nombre: "A", curso_idcurso: 1 },
  { idparalelo: 2, nombre: "A", curso_idcurso: 2 },
  { idparalelo: 3, nombre: "B", curso_idcurso: 2 },
  { idparalelo: 4, nombre: "A", curso_idcurso: 3 },
  { idparalelo: 5, nombre: "A", curso_idcurso: 4 },
  { idparalelo: 6, nombre: "B", curso_idcurso: 4 },
  { idparalelo: 7, nombre: "A", curso_idcurso: 5 },
  { idparalelo: 8, nombre: "A", curso_idcurso: 6 }
];

const LETRAS_SUGERIDAS = ["A", "B", "C", "D", "E", "F"];

const estado = { paralelos: [], cursos: [], niveles: [], colegios: [], pagina: 1 };
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
    if (API_URL) return (await fetch(`${API_URL}/paralelos`)).json();
    return leerLocal("paralelos_demo", PARALELOS_DEMO);
  },
  async cursos() {
    if (API_URL) return (await fetch(`${API_URL}/cursos`)).json();
    return leerLocal("cursos_demo", CURSOS_DEMO);
  },
  async niveles() {
    if (API_URL) return (await fetch(`${API_URL}/niveles`)).json();
    return leerLocal("niveles_demo", NIVELES_DEMO);
  },
  async colegios() {
    if (API_URL) return (await fetch(`${API_URL}/colegios`)).json();
    return leerLocal("colegios_demo", COLEGIOS_DEMO);
  },
  async guardar(par) {
    if (API_URL) {
      const nuevo = !par.idparalelo;
      const r = await fetch(`${API_URL}/paralelos${nuevo ? "" : "/" + par.idparalelo}`, {
        method: nuevo ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(par)
      });
      if (!r.ok) throw new Error("guardar");
      return r.json();
    }
    if (!par.idparalelo) {
      par.idparalelo = Math.max(0, ...estado.paralelos.map(x => x.idparalelo)) + 1;
      estado.paralelos.push(par);
    } else {
      const i = estado.paralelos.findIndex(x => x.idparalelo === par.idparalelo);
      estado.paralelos[i] = par;
    }
    localStorage.setItem("paralelos_demo", JSON.stringify(estado.paralelos));
    return par;
  },
  async eliminar(id) {
    if (API_URL) {
      const r = await fetch(`${API_URL}/paralelos/${id}`, { method: "DELETE" });
      if (r.status === 409) throw new Error("en_uso");
      if (!r.ok) throw new Error("eliminar");
      return;
    }
    estado.paralelos = estado.paralelos.filter(x => x.idparalelo !== id);
    localStorage.setItem("paralelos_demo", JSON.stringify(estado.paralelos));
  }
};

/* ---------- UTILIDADES ---------- */
const $ = (id) => document.getElementById(id);
const escapar = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const normalizar = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const cursoDe = (id) => estado.cursos.find(c => c.idcurso === id);
const nombreNivel = (id) => estado.niveles.find(n => n.idnivel === id)?.nivel ?? "Sin nivel";
const ordenNivel = (id) => { const i = estado.niveles.findIndex(n => n.idnivel === id); return i < 0 ? 999 : i; };
const nombreColegio = (id) => estado.colegios.find(c => c.idcolegio === id)?.nombre ?? "Sin colegio";

let toastTimer;
function aviso(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("is-show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("is-show"), 2800);
}

const ICO = {
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  del: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5"/>'
};
const icono = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[n]}</svg>`;

/* ---------- LISTADO ---------- */
function filtrados() {
  const q = normalizar($("fBuscar").value.trim());
  const niv = $("fNivel").value;
  const col = $("fColegio").value;
  return estado.paralelos
    .filter(p => {
      const c = cursoDe(p.curso_idcurso);
      if (!c) return !q && !niv && !col;
      return (!q || normalizar(`${p.nombre} ${c.nombre} ${nombreNivel(c.nivel_idnivel)}`).includes(q)) &&
             (!niv || String(c.nivel_idnivel) === niv) &&
             (!col || String(c.colegio_idcolegio) === col);
    })
    // Por nivel, luego curso y luego letra
    .sort((a, b) => {
      const ca = cursoDe(a.curso_idcurso), cb = cursoDe(b.curso_idcurso);
      return ordenNivel(ca?.nivel_idnivel) - ordenNivel(cb?.nivel_idnivel) ||
             (ca?.nombre ?? "").localeCompare(cb?.nombre ?? "", "es", { numeric: true }) ||
             a.nombre.localeCompare(b.nombre, "es");
    });
}

function pintar() {
  const lista = filtrados();
  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  estado.pagina = Math.min(estado.pagina, paginas);
  const inicio = (estado.pagina - 1) * POR_PAGINA;
  const visibles = lista.slice(inicio, inicio + POR_PAGINA);

  $("vacio").hidden = lista.length > 0;

  $("tbody").innerHTML = visibles.map(p => {
    const c = cursoDe(p.curso_idcurso);
    return `
    <tr>
      <td data-label="Paralelo">
        <div class="room">
          <span class="letter">${escapar(p.nombre)}</span>
          <strong>Paralelo ${escapar(p.nombre)}</strong>
        </div>
      </td>
      <td data-label="Curso">${c ? escapar(c.nombre) : '<span class="muted">Curso no encontrado</span>'}</td>
      <td data-label="Nivel">${c ? `<span class="badge badge--level">${escapar(nombreNivel(c.nivel_idnivel))}</span>` : "—"}</td>
      <td data-label="Colegio">${c ? `<span class="badge badge--school" title="${escapar(nombreColegio(c.colegio_idcolegio))}"><span>${escapar(nombreColegio(c.colegio_idcolegio))}</span></span>` : "—"}</td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" data-accion="editar" data-id="${p.idparalelo}" title="Editar" aria-label="Editar paralelo ${escapar(p.nombre)}">${icono("edit")}</button>
          <button class="icon-btn icon-btn--danger" data-accion="eliminar" data-id="${p.idparalelo}" title="Eliminar" aria-label="Eliminar paralelo ${escapar(p.nombre)}">${icono("del")}</button>
        </div>
      </td>
    </tr>`;
  }).join("");

  $("pager").hidden = lista.length <= POR_PAGINA;
  $("pagerInfo").textContent = `${inicio + 1}–${inicio + visibles.length} de ${lista.length}`;
  $("btnPrev").disabled = estado.pagina <= 1;
  $("btnNext").disabled = estado.pagina >= paginas;

  const n = estado.paralelos.length;
  $("resumen").textContent = `${n} ${n === 1 ? "paralelo registrado" : "paralelos registrados"}`;
}

/* ---------- COMBOS ---------- */
function llenarCombos() {
  const muchosColegios = estado.colegios.length > 1;

  // Cursos agrupados por nivel; si hay varios colegios, se indica a cuál pertenece cada curso
  const grupos = estado.niveles.map(n => {
    const cursos = estado.cursos
      .filter(c => c.nivel_idnivel === n.idnivel)
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { numeric: true }));
    if (!cursos.length) return "";
    return `<optgroup label="${escapar(n.nivel)}">${cursos.map(c =>
      `<option value="${c.idcurso}">${escapar(c.nombre)}${muchosColegios ? ` · ${escapar(nombreColegio(c.colegio_idcolegio))}` : ""}</option>`).join("")}</optgroup>`;
  }).join("");
  $("curso_idcurso").innerHTML = '<option value="">Selecciona un curso</option>' + grupos;

  $("fNivel").innerHTML = '<option value="">Todos los niveles</option>' +
    estado.niveles.map(n => `<option value="${n.idnivel}">${escapar(n.nivel)}</option>`).join("");

  const colegios = estado.colegios.slice().sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  $("fColegio").innerHTML = '<option value="">Todos los colegios</option>' +
    colegios.map(c => `<option value="${c.idcolegio}">${escapar(c.nombre)}</option>`).join("");
  $("fColegio").hidden = colegios.length < 2;
}

/* ---------- FORMULARIO ---------- */
const dlg = $("dlgParalelo");
const form = $("formParalelo");

function limpiarErrores() {
  form.querySelectorAll(".err").forEach(e => (e.textContent = ""));
  form.querySelectorAll(".is-invalid").forEach(e => e.classList.remove("is-invalid"));
}

// Marca la letra elegida y avisa cuáles ya existen en el curso seleccionado
function sincronizarLetras() {
  const curso = Number($("curso_idcurso").value);
  const id = Number($("idparalelo").value) || null;
  const actual = $("nombre").value.trim().toUpperCase();
  const usadas = new Set(estado.paralelos.filter(p => p.curso_idcurso === curso && p.idparalelo !== id).map(p => p.nombre));

  $("letras").innerHTML = LETRAS_SUGERIDAS.map(l =>
    `<button type="button" data-l="${l}" aria-pressed="${l === actual}" ${usadas.has(l) ? 'disabled title="Ya existe en este curso" style="opacity:.4;cursor:not-allowed"' : ""}>${l}</button>`).join("");

  $("hintLetra").textContent = curso && usadas.size ? `Ya existen: ${[...usadas].sort().join(", ")}` : "";
}

function abrirFormulario(par) {
  limpiarErrores();
  form.reset();
  $("dlgTitulo").textContent = par ? "Editar paralelo" : "Nuevo paralelo";
  $("btnGuardar").textContent = par ? "Guardar cambios" : "Guardar paralelo";
  $("idparalelo").value = par?.idparalelo ?? "";
  $("curso_idcurso").value = par?.curso_idcurso ?? "";
  $("nombre").value = par?.nombre ?? "";

  const hint = $("hintCurso");
  hint.textContent = estado.cursos.length ? "" : "Primero registra un curso en el módulo Curso.";
  hint.classList.toggle("is-warn", !estado.cursos.length);

  sincronizarLetras();
  dlg.showModal();
  (par ? $("nombre") : $("curso_idcurso")).focus();
}

function marcarError(campo, msg) {
  form.querySelector(`[data-err="${campo}"]`).textContent = msg;
  $(campo).classList.add("is-invalid");
}

function validar() {
  limpiarErrores();
  let ok = true;
  const id = Number($("idparalelo").value) || null;
  const letra = $("nombre").value.trim().toUpperCase();
  const curso = Number($("curso_idcurso").value);

  if (!curso) { marcarError("curso_idcurso", "Selecciona el curso."); ok = false; }

  if (!letra) { marcarError("nombre", "Escribe la letra del paralelo."); ok = false; }
  else if (!/^\p{L}$/u.test(letra)) { marcarError("nombre", "Usa una sola letra."); ok = false; }
  else if (curso && estado.paralelos.some(p => p.idparalelo !== id && p.curso_idcurso === curso && p.nombre === letra)) {
    marcarError("nombre", `El paralelo ${letra} ya existe en este curso.`); ok = false;
  }
  return ok;
}

$("nombre").addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/[^\p{L}]/gu, "").toUpperCase().slice(0, 1);
  sincronizarLetras();
});
$("curso_idcurso").addEventListener("change", sincronizarLetras);
$("letras").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-l]");
  if (!b || b.disabled) return;
  $("nombre").value = b.dataset.l;
  $("nombre").classList.remove("is-invalid");
  form.querySelector('[data-err="nombre"]').textContent = "";
  sincronizarLetras();
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validar()) { form.querySelector(".is-invalid")?.focus(); return; }

  const par = {
    idparalelo: Number($("idparalelo").value) || null,
    nombre: $("nombre").value.trim().toUpperCase(),
    curso_idcurso: Number($("curso_idcurso").value)
  };
  const editando = !!par.idparalelo;

  $("btnGuardar").disabled = true;
  try {
    await api.guardar(par);
    if (API_URL) estado.paralelos = await api.listar();
    dlg.close();
    pintar();
    aviso(editando ? "Paralelo actualizado" : "Paralelo creado");
  } catch (err) {
    aviso("No se pudo guardar el paralelo. Intenta de nuevo.");
  } finally {
    $("btnGuardar").disabled = false;
  }
});

/* ---------- ACCIONES DE FILA ---------- */
let idEliminar = null;

$("tbody").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-accion]");
  if (!btn) return;
  const par = estado.paralelos.find(x => x.idparalelo === Number(btn.dataset.id));
  if (!par) return;

  if (btn.dataset.accion === "editar") abrirFormulario(par);
  if (btn.dataset.accion === "eliminar") {
    const c = cursoDe(par.curso_idcurso);
    idEliminar = par.idparalelo;
    $("delTexto").textContent = `Se eliminará el paralelo ${par.nombre}${c ? ` de ${c.nombre} (${nombreNivel(c.nivel_idnivel)})` : ""}. Esta acción no se puede deshacer.`;
    $("dlgEliminar").showModal();
  }
});

$("btnConfirmarEliminar").addEventListener("click", async () => {
  try {
    await api.eliminar(idEliminar);
    if (API_URL) estado.paralelos = await api.listar();
    $("dlgEliminar").close();
    pintar();
    aviso("Paralelo eliminado");
  } catch (err) {
    $("dlgEliminar").close();
    aviso(err.message === "en_uso"
      ? "No se puede eliminar: el paralelo tiene estudiantes, horarios u otros registros asociados."
      : "No se pudo eliminar el paralelo. Intenta de nuevo.");
  }
});

/* ---------- EVENTOS GENERALES ---------- */
$("btnNuevo").addEventListener("click", () => abrirFormulario(null));
["fBuscar", "fNivel", "fColegio"].forEach(id => $(id).addEventListener("input", () => { estado.pagina = 1; pintar(); }));
$("btnPrev").addEventListener("click", () => { estado.pagina--; pintar(); });
$("btnNext").addEventListener("click", () => { estado.pagina++; pintar(); });

document.querySelectorAll("[data-cerrar]").forEach(b => b.addEventListener("click", () => b.closest("dialog").close()));
document.querySelectorAll("dialog").forEach(d => d.addEventListener("mousedown", (e) => { if (e.target === d) d.close(); }));

/* ---------- INICIO ---------- */
(async function iniciar() {
  try {
    [estado.paralelos, estado.cursos, estado.niveles, estado.colegios] =
      await Promise.all([api.listar(), api.cursos(), api.niveles(), api.colegios()]);
  } catch (err) {
    $("resumen").textContent = "No se pudieron cargar los paralelos.";
    return;
  }
  llenarCombos();
  pintar();
})();