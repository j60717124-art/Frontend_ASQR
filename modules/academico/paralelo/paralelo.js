// MÓDULO · PARALELO

const LETRAS_SUGERIDAS = ["A", "B", "C", "D", "E", "F"];
const estado = { paralelos: [], cursos: [], niveles: [], colegios: [], pagina: 1 };
const POR_PAGINA = 10;

// UTILIDADES
const $ = (id) => document.getElementById(id);
const escapar = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const normalizar = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const cursoDe = (id) => estado.cursos.find(c => String(c.idcurso) === String(id));
const nombreNivel = (id) => estado.niveles.find(n => String(n.idnivel) === String(id))?.nivel ?? "Sin nivel";
const ordenNivel = (id) => { const i = estado.niveles.findIndex(n => String(n.idnivel) === String(id)); return i < 0 ? 999 : i; };
const nombreColegio = (id) => estado.colegios.find(c => String(c.idcolegio) === String(id))?.nombre ?? "Sin colegio";

const ICO = {
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  del: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5"/>'
};
const icono = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[n]}</svg>`;

// LISTADO
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

// COMBOS
function llenarCombos() {
  const muchosColegios = estado.colegios.length > 1;
  const grupos = estado.niveles.map(n => {
    const cursos = estado.cursos
      .filter(c => String(c.nivel_idnivel) === String(n.idnivel))
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

// FORMULARIO
const dlg = $("dlgParalelo");
const form = $("formParalelo");

// Errores del backend que se muestran junto al campo correspondiente
const REGLAS_ERROR = [[/ya tiene un paralelo|nombre del paralelo/i, "nombre"], [/curso/i, "curso_idcurso"]];

function limpiarErrores() {
  limpiarErroresFormulario(form);
}

function sincronizarLetras() {
  const curso = Number($("curso_idcurso").value);
  const id = Number($("idparalelo").value) || null;
  const actual = $("nombre").value.trim().toUpperCase();
  const usadas = new Set(estado.paralelos.filter(p => String(p.curso_idcurso) === String(curso) && String(p.idparalelo) !== String(id)).map(p => p.nombre));

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
  marcarErrorCampo(form, campo, msg);
}

function validar() {
  limpiarErrores();
  let ok = true;
  const id = Number($("idparalelo").value) || null;
  const letra = $("nombre").value.trim().toUpperCase();
  const curso = Number($("curso_idcurso").value);

  if (!curso) { marcarError("curso_idcurso", "Selecciona el curso."); ok = false; }

  if (!letra) { marcarError("nombre", "Escribe la letra del paralelo."); ok = false; }
  else if (!/^[A-Z0-9]$/.test(letra)) { marcarError("nombre", "Usa un único carácter: una letra A-Z o un número (ej.: A, B, 1)."); ok = false; }
  else if (curso && estado.paralelos.some(p => String(p.idparalelo) !== String(id) && String(p.curso_idcurso) === String(curso) && p.nombre === letra)) {
    marcarError("nombre", `El paralelo ${letra} ya existe en este curso.`); ok = false;
  }
  return ok;
}

$("nombre").addEventListener("input", (e) => {
  e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 1);
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

// GUARDAR
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validar()) { form.querySelector(".is-invalid")?.focus(); return; }

  const id = $("idparalelo").value;
  const editando = !!id;
  const payload = {
    nombre: $("nombre").value.trim().toUpperCase(),
    curso_idcurso: Number($("curso_idcurso").value)
  };

  setCargando($("btnGuardar"), true, "Guardando…");
  try {
    if (editando) {
      await apiPut(`/paralelos/${id}`, payload);
      mostrarExito("Paralelo actualizado correctamente");
    } else {
      await apiPost(`/paralelos`, payload);
      mostrarExito("Paralelo creado correctamente");
    }

    await cargarParalelos();
    dlg.close();

  } catch (err) {
    errorFormulario(form, err, REGLAS_ERROR, "No se pudo guardar el paralelo");
  } finally {
    setCargando($("btnGuardar"), false);
  }
});

// ACCIONES DE FILA (CORREGIDO)
let idEliminar = null;

$("tbody").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-accion]");
  if (!btn) return;

  const id = String(btn.dataset.id);
  // Buscamos el paralelo comparando los IDs como String
  const par = estado.paralelos.find(x => String(x.idparalelo) === id);

  if (!par) {
    console.warn("Paralelo no encontrado para id:", id);
    return;
  }

  if (btn.dataset.accion === "editar") abrirFormulario(par);

  if (btn.dataset.accion === "eliminar") {
    const c = cursoDe(par.curso_idcurso);
    idEliminar = par.idparalelo;
    $("delTexto").textContent = `Se eliminará el paralelo ${par.nombre}${c ? ` de ${c.nombre} (${nombreNivel(c.nivel_idnivel)})` : ""}. Esta acción no se puede deshacer.`;
    $("dlgEliminar").showModal();
  }
});

$("btnConfirmarEliminar").addEventListener("click", async () => {
  const btnDel = $("btnConfirmarEliminar");
  setCargando(btnDel, true, "Eliminando…");
  try {
    await apiDelete(`/paralelos/${idEliminar}`);
    await cargarParalelos();
    $("dlgEliminar").close();
    mostrarExito("Paralelo eliminado correctamente");
  } catch (err) {
    $("dlgEliminar").close();
    mostrarError(err, "No se puede eliminar: el paralelo tiene estudiantes, horarios u otros registros asociados.");
  } finally {
    setCargando(btnDel, false);
  }
});

// EVENTOS GENERALES
$("btnNuevo").addEventListener("click", () => abrirFormulario(null));
["fBuscar", "fNivel", "fColegio"].forEach(id => $(id).addEventListener("input", () => { estado.pagina = 1; pintar(); }));
$("btnPrev").addEventListener("click", () => { estado.pagina--; pintar(); });
$("btnNext").addEventListener("click", () => { estado.pagina++; pintar(); });
document.querySelectorAll("[data-cerrar]").forEach(b => b.addEventListener("click", () => b.closest("dialog").close()));
document.querySelectorAll("dialog").forEach(d => d.addEventListener("mousedown", (e) => { if (e.target === d) d.close(); }));

// CARGA DE DATOS
async function cargarParalelos() {
  try {
    estado.paralelos = await apiGet('/paralelos');
    pintar();
  } catch (err) {
    $("resumen").textContent = "Error al cargar los paralelos.";
    mostrarError(err, "Error al cargar los paralelos.");
    mostrarErrorTabla($("tbody"), err, cargarParalelos);
  }
}

async function cargarCatalogos() {
  try {
    [estado.cursos, estado.niveles, estado.colegios] = await Promise.all([
      apiGet('/cursos'),
      apiGet('/niveles'),
      apiGet('/colegios')
    ]);
    llenarCombos();
  } catch (err) {
    console.error("Error al cargar catálogos:", err);
  }
}

(async function iniciar() {
  mostrarSkeleton($("tbody"), 5);
  $("resumen").textContent = "Cargando paralelos...";
  await Promise.all([cargarCatalogos(), cargarParalelos()]);
})();

// PERMISOS
aplicarSoloLectura(esAdmin(), ["btnNuevo"]);