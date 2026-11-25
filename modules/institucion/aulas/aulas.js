// MÓDULO  AULA

const estado = { aulas: [], colegios: [], pagina: 1 };
const POR_PAGINA = 12; // 12 aulas por página se ve bien en tarjetas

const $ = (id) => document.getElementById(id);
const escapar = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const normalizar = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const limpiarEspacios = (s) => s.trim().replace(/\s+/g, " ");
const nombreColegio = (id) => estado.colegios.find(c => String(c.idcolegio) === String(id))?.nombre ?? "Sin colegio";

// LISTADO
const ICO = {
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  del: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5"/>',
  room: '<path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16M2 21h20M15 9h4a1 1 0 0 1 1 1v11M10 12v.01"/>'
};
const icono = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[n]}</svg>`;

// Obtener ubicaciones únicas para el filtro
function obtenerUbicaciones() {
  const set = new Set();
  estado.aulas.forEach(a => { if (a.ubicacion) set.add(a.ubicacion); });
  return Array.from(set).sort();
}

function filtradas() {
  const q = normalizar($("fBuscar").value.trim());
  const col = $("fColegio").value;
  const ubi = $("fUbicacion").value;

  return estado.aulas.filter(a => {
    const nombreCol = normalizar(nombreColegio(a.colegio_idcolegio));
    const texto = normalizar(`${a.nombre} ${a.ubicacion ?? ""} ${nombreCol}`);

    return (!q || texto.includes(q)) &&
           (!col || String(a.colegio_idcolegio) === col) &&
           (!ubi || a.ubicacion === ubi);
  }).sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { numeric: true }));
}

function pintar() {
  const lista = filtradas();
  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  estado.pagina = Math.min(estado.pagina, paginas);
  const inicio = (estado.pagina - 1) * POR_PAGINA;
  const visibles = lista.slice(inicio, inicio + POR_PAGINA);

  $("vacio").hidden = lista.length > 0;

  $("contenedorAulas").innerHTML = visibles.map(a => `
    <div class="aula-card">
      <div class="aula-card__head">
        <div class="room">
          <span class="room__ico">${icono("room")}</span>
          <strong title="${escapar(a.nombre)}">${escapar(a.nombre)}</strong>
        </div>
      </div>

      <div class="aula-card__body">
        <div class="aula-info">
          <span class="aula-label">Colegio</span>
          <span class="badge badge--school" title="${escapar(a.colegio_nombre || nombreColegio(a.colegio_idcolegio))}">
            <span>${escapar(a.colegio_nombre || nombreColegio(a.colegio_idcolegio))}</span>
          </span>
        </div>
        <div class="aula-info">
          <span class="aula-label">Ubicación</span>
          <span class="muted">${a.ubicacion ? escapar(a.ubicacion) : "—"}</span>
        </div>
      </div>

      <div class="aula-card__foot">
        <button class="icon-btn" data-accion="editar" data-id="${a.idaula}" title="Editar" aria-label="Editar ${escapar(a.nombre)}">${icono("edit")}</button>
        <button class="icon-btn icon-btn--danger" data-accion="eliminar" data-id="${a.idaula}" title="Eliminar" aria-label="Eliminar ${escapar(a.nombre)}">${icono("del")}</button>
      </div>
    </div>
  `).join("");

  $("pager").hidden = lista.length <= POR_PAGINA;
  $("pagerInfo").textContent = `${inicio + 1}–${inicio + visibles.length} de ${lista.length}`;
  $("btnPrev").disabled = estado.pagina <= 1;
  $("btnNext").disabled = estado.pagina >= paginas;

  const n = estado.aulas.length;
  $("resumen").textContent = `${n} ${n === 1 ? "aula registrada" : "aulas registradas"}`;
}

// COMBOS DE COLEGIO Y UBICACIÓN
function llenarFiltros() {
  // Colegios
  const ordenados = estado.colegios.slice().sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  const opcionesCol = ordenados.map(c => `<option value="${c.idcolegio}">${escapar(c.nombre)}</option>`).join("");

  $("colegio_idcolegio").innerHTML = '<option value="">Selecciona un colegio</option>' + opcionesCol;
  $("fColegio").innerHTML = '<option value="">Todos los colegios</option>' + opcionesCol;
  $("fColegio").hidden = ordenados.length < 2;

  // Ubicaciones
  const ubicaciones = obtenerUbicaciones();
  $("fUbicacion").innerHTML = '<option value="">Todas las ubicaciones</option>' + ubicaciones.map(u => `<option value="${escapar(u)}">${escapar(u)}</option>`).join("");
  $("fUbicacion").hidden = ubicaciones.length < 1;
}

// FORMULARIO
const dlg = $("dlgAula");
const form = $("formAula");

const REGLAS_ERROR = [[/colegio/i, "colegio_idcolegio"], [/ubicaci/i, "ubicacion"], [/aula/i, "nombre"]];

function contadores() {
  $("cntNombre").textContent = `${$("nombre").value.length}/100`;
  $("cntUbic").textContent = `${$("ubicacion").value.length}/255`;
}

function limpiarErrores() {
  limpiarErroresFormulario(form);
}

function abrirFormulario(aula) {
  limpiarErrores();
  form.reset();
  $("dlgTitulo").textContent = aula ? "Editar aula" : "Nueva aula";
  $("btnGuardar").textContent = aula ? "Guardar cambios" : "Guardar aula";
  $("idaula").value = aula?.idaula ?? "";
  $("nombre").value = aula?.nombre ?? "";
  $("ubicacion").value = aula?.ubicacion ?? "";

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
  marcarErrorCampo(form, campo, msg);
}

function validar() {
  limpiarErrores();
  let ok = true;
  const id = Number($("idaula").value) || null;
  const nombre = limpiarEspacios($("nombre").value);
  const colegio = Number($("colegio_idcolegio").value);

  if (nombre.length < 1) { marcarError("nombre", "Escribe al menos 1 caracter."); ok = false; }
  if (!colegio) { marcarError("colegio_idcolegio", "Selecciona el colegio al que pertenece el aula."); ok = false; }

  if (nombre.length >= 1 && colegio &&
      estado.aulas.some(a => a.idaula !== id && String(a.colegio_idcolegio) === String(colegio) && normalizar(a.nombre) === normalizar(nombre))) {
    marcarError("nombre", "Ya existe un aula con ese nombre en este colegio."); ok = false;
  }
  return ok;
}

$("nombre").addEventListener("input", contadores);
$("ubicacion").addEventListener("input", contadores);

// GUARDAR AULA
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validar()) { form.querySelector(".is-invalid")?.focus(); return; }

  const id = $("idaula").value;
  const editando = !!id;

  const payload = {
    nombre: limpiarEspacios($("nombre").value),
    ubicacion: limpiarEspacios($("ubicacion").value) || null,
    colegio_idcolegio: Number($("colegio_idcolegio").value)
  };

  setCargando($("btnGuardar"), true, "Guardando…");
  try {
    if (editando) {
      await apiPut(`/aulas/${id}`, payload);
      mostrarExito("Aula actualizada correctamente");
    } else {
      await apiPost(`/aulas`, payload);
      mostrarExito("Aula creada correctamente");
    }

    await cargarAulas(); // Recargar lista
    dlg.close();

  } catch (err) {
    errorFormulario(form, err, REGLAS_ERROR, "No se pudo guardar el aula");
  } finally {
    setCargando($("btnGuardar"), false);
  }
});

// ACCIONES DE FILA (EDITAR / ELIMINAR)
let idEliminar = null;

// Delegación de eventos corregida usando String() para evitar problemas de tipo
$("contenedorAulas").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-accion]");
  if (!btn) return;

  const id = String(btn.dataset.id);
  const aula = estado.aulas.find(x => String(x.idaula) === id);

  if (!aula) {
    console.warn("Aula no encontrada para id:", id);
    return;
  }

  if (btn.dataset.accion === "editar") abrirFormulario(aula);

  if (btn.dataset.accion === "eliminar") {
    idEliminar = aula.idaula;
    $("delTexto").textContent = `Se eliminará «${aula.nombre}». Esta acción no se puede deshacer.`;
    $("dlgEliminar").showModal();
  }
});

$("btnConfirmarEliminar").addEventListener("click", async () => {
  const btnDel = $("btnConfirmarEliminar");
  setCargando(btnDel, true, "Eliminando…");
  try {
    await apiDelete(`/aulas/${idEliminar}`);
    await cargarAulas();
    $("dlgEliminar").close();
    mostrarExito("Aula eliminada correctamente");
  } catch (err) {
    $("dlgEliminar").close();
    mostrarError(err, "No se puede eliminar: el aula tiene horarios u otros registros asociados.");
  } finally {
    setCargando(btnDel, false);
  }
});

// EVENTOS GENERALES
$("btnNueva").addEventListener("click", () => abrirFormulario(null));
["fBuscar", "fColegio", "fUbicacion"].forEach(id => $(id).addEventListener("input", () => { estado.pagina = 1; pintar(); }));
$("btnPrev").addEventListener("click", () => { estado.pagina--; pintar(); });
$("btnNext").addEventListener("click", () => { estado.pagina++; pintar(); });

document.querySelectorAll("[data-cerrar]").forEach(b => b.addEventListener("click", () => b.closest("dialog").close()));
document.querySelectorAll("dialog").forEach(d => d.addEventListener("mousedown", (e) => { if (e.target === d) d.close(); }));

// INICIO Y CARGA DE DATOS
async function cargarAulas() {
  try {
    estado.aulas = await apiGet('/aulas');
    llenarFiltros(); // Actualizamos filtros de ubicación
    pintar();
  } catch (err) {
    $("resumen").textContent = "Error al cargar las aulas.";
    mostrarError(err, "Error al cargar las aulas.");
    mostrarErrorTabla($("contenedorAulas"), err, cargarAulas);
  }
}

async function cargarColegios() {
  try {
    estado.colegios = await apiGet('/colegios');
    llenarFiltros();
  } catch (err) {
    console.error("Error al cargar colegios:", err);
  }
}

(async function iniciar() {
  mostrarSkeleton($("contenedorAulas"), 5);
  $("resumen").textContent = "Cargando datos...";
  await Promise.all([cargarColegios(), cargarAulas()]);
})();

// PERMISOS
aplicarSoloLectura(esAdmin(), ["btnNueva"]);