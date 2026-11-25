// MÓDULO · GESTIÓN ACADÉMICA

const estado = { lista: [], pagina: 1 };
const POR_PAGINA = 10;

// UTILIDADES
const $ = (id) => document.getElementById(id);
const escapar = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const normalizar = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const limpiarEspacios = (s) => s.trim().replace(/\s+/g, " ");
const hoyISO = () => new Date().toLocaleDateString("en-CA");
const fechaLocal = (iso) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); };
const fmtFecha = (iso) => fechaLocal(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
const diasEntre = (a, b) => Math.round((fechaLocal(b) - fechaLocal(a)) / 864e5) + 1;

function fmtDuracion(inicio, fin) {
  const d = diasEntre(inicio, fin);
  const meses = Math.round(d / 30.4);
  return `${d.toLocaleString("es-ES")} días${meses >= 1 ? ` · ≈ ${meses} ${meses === 1 ? "mes" : "meses"}` : ""}`;
}

function estadoDe(g) {
  const hoy = hoyISO();
  if (hoy < g.fecha_inicio) return "Próxima";
  if (hoy > g.fecha_fin) return "Finalizada";
  return "En curso";
}

const ICO = {
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  del: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'
};
const icono = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[n]}</svg>`;

// LISTADO
function filtradas() {
  const q = normalizar($("fBuscar").value.trim());
  const est = $("fEstado").value;
  return estado.lista
    .filter(g => (!q || normalizar(g.nombre).includes(q)) && (!est || estadoDe(g) === est))
    .sort((a, b) => b.fecha_inicio.localeCompare(a.fecha_inicio));
}

function insignia(g) {
  const e = estadoDe(g);
  const clase = e === "En curso" ? "ok" : e === "Próxima" ? "next" : "off";
  return `<span class="badge badge--${clase}">${e}</span>`;
}

function progreso(g) {
  if (estadoDe(g) !== "En curso") return "";
  const total = diasEntre(g.fecha_inicio, g.fecha_fin);
  const pasados = diasEntre(g.fecha_inicio, hoyISO());
  const pct = Math.min(100, Math.max(0, Math.round((pasados / total) * 100)));
  return `<div class="progress" title="Día ${pasados} de ${total}"><div class="progress__bar"><i style="width:${pct}%"></i></div><small>${pct} % transcurrido</small></div>`;
}

function pintar() {
  const lista = filtradas();
  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  estado.pagina = Math.min(estado.pagina, paginas);
  const inicio = (estado.pagina - 1) * POR_PAGINA;
  const visibles = lista.slice(inicio, inicio + POR_PAGINA);

  $("vacio").hidden = lista.length > 0;

  $("tbody").innerHTML = visibles.map(g => `
    <tr>
      <td data-label="Gestión">
        <div class="term">
          <span class="term__ico">${icono("cal")}</span>
          <strong>${escapar(g.nombre)}</strong>
        </div>
      </td>
      <td data-label="Inicio" class="muted">${fmtFecha(g.fecha_inicio)}</td>
      <td data-label="Fin" class="muted">${fmtFecha(g.fecha_fin)}</td>
      <td data-label="Duración" class="muted">${fmtDuracion(g.fecha_inicio, g.fecha_fin)}</td>
      <td data-label="Estado"><div>${insignia(g)}${progreso(g)}</div></td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" data-accion="editar" data-id="${g.idgestion_academica}" title="Editar" aria-label="Editar ${escapar(g.nombre)}">${icono("edit")}</button>
          <button class="icon-btn icon-btn--danger" data-accion="eliminar" data-id="${g.idgestion_academica}" title="Eliminar" aria-label="Eliminar ${escapar(g.nombre)}">${icono("del")}</button>
        </div>
      </td>
    </tr>`).join("");

  $("pager").hidden = lista.length <= POR_PAGINA;
  $("pagerInfo").textContent = `${inicio + 1}–${inicio + visibles.length} de ${lista.length}`;
  $("btnPrev").disabled = estado.pagina <= 1;
  $("btnNext").disabled = estado.pagina >= paginas;

  const total = estado.lista.length;
  const actual = estado.lista.find(g => estadoDe(g) === "En curso");
  $("resumen").textContent = `${total} ${total === 1 ? "gestión registrada" : "gestiones registradas"}` +
    (actual ? ` · En curso: ${actual.nombre}` : total ? " · Ninguna en curso" : "");
}

// FORMULARIO
const dlg = $("dlgGestion");
const form = $("formGestion");

const REGLAS_ERROR = [[/nombre de la gesti/i, "nombre"], [/fecha de fin/i, "fecha_fin"], [/fecha de inicio/i, "fecha_inicio"]];

function limpiarErrores() {
  limpiarErroresFormulario(form);
}

function actualizarDuracion() {
  const h = $("hintDuracion");
  const a = $("fecha_inicio").value, b = $("fecha_fin").value;
  h.classList.remove("is-info");
  if (a && b && b >= a) {
    h.textContent = `Duración: ${fmtDuracion(a, b)}`;
    h.classList.add("is-info");
  } else {
    h.textContent = "Indica las fechas para calcular la duración.";
  }
}

function abrirFormulario(ges) {
  limpiarErrores();
  form.reset();
  $("dlgTitulo").textContent = ges ? "Editar gestión" : "Nueva gestión";
  $("btnGuardar").textContent = ges ? "Guardar cambios" : "Guardar gestión";
  $("idgestion_academica").value = ges?.idgestion_academica ?? "";
  $("nombre").value = ges?.nombre ?? "";
  $("fecha_inicio").value = ges?.fecha_inicio ?? "";
  $("fecha_fin").value = ges?.fecha_fin ?? "";
  actualizarDuracion();
  dlg.showModal();
  $("nombre").focus();
}

function marcarError(campo, msg) {
  marcarErrorCampo(form, campo, msg);
}

function validar() {
  limpiarErrores();
  let ok = true;
  const id = Number($("idgestion_academica").value) || null;
  const nombre = limpiarEspacios($("nombre").value);
  const ini = $("fecha_inicio").value, fin = $("fecha_fin").value;

  if (nombre.length < 3) { marcarError("nombre", "Escribe al menos 3 caracteres."); ok = false; }
  else if (estado.lista.some(g => String(g.idgestion_academica) !== String(id) && normalizar(g.nombre) === normalizar(nombre))) {
    marcarError("nombre", "Ya existe una gestión con ese nombre."); ok = false;
  }

  if (!ini) { marcarError("fecha_inicio", "Indica la fecha de inicio."); ok = false; }
  if (!fin) { marcarError("fecha_fin", "Indica la fecha de fin."); ok = false; }

  if (ini && fin) {
    if (fin <= ini) { marcarError("fecha_fin", "La fecha de fin debe ser posterior a la de inicio."); ok = false; }
    else {
      const cruce = estado.lista.find(g => String(g.idgestion_academica) !== String(id) && ini <= g.fecha_fin && g.fecha_inicio <= fin);
      if (cruce) { marcarError("fecha_inicio", `Estas fechas se cruzan con «${cruce.nombre}» (${fmtFecha(cruce.fecha_inicio)} – ${fmtFecha(cruce.fecha_fin)}).`); ok = false; }
    }
  }
  return ok;
}

["fecha_inicio", "fecha_fin"].forEach(id => $(id).addEventListener("input", actualizarDuracion));

// GUARDAR GESTIÓN
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validar()) { form.querySelector(".is-invalid")?.focus(); return; }

  const id = $("idgestion_academica").value;
  const editando = !!id;
  const payload = {
    nombre: limpiarEspacios($("nombre").value),
    fecha_inicio: $("fecha_inicio").value,
    fecha_fin: $("fecha_fin").value
  };

  setCargando($("btnGuardar"), true, "Guardando…");
  try {
    if (editando) {
      await apiPut(`/gestiones/${id}`, payload);
      mostrarExito("Gestión actualizada correctamente");
    } else {
      await apiPost(`/gestiones`, payload);
      mostrarExito("Gestión creada correctamente");
    }

    await cargarGestiones();
    dlg.close();

  } catch (err) {
    errorFormulario(form, err, REGLAS_ERROR, "No se pudo guardar la gestión");
  } finally {
    setCargando($("btnGuardar"), false);
  }
});

// ACCIONES DE FILA (CORREGIDO: Usando String para evitar fallos de tipo)
let idEliminar = null;

$("tbody").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-accion]");
  if (!btn) return;

  const id = String(btn.dataset.id);
  // Buscamos comparando ambos como String
  const ges = estado.lista.find(x => String(x.idgestion_academica) === id);

  if (!ges) {
    console.warn("Gestión no encontrada para id:", id);
    return;
  }

  if (btn.dataset.accion === "editar") abrirFormulario(ges);

  if (btn.dataset.accion === "eliminar") {
    idEliminar = ges.idgestion_academica;
    $("delTexto").textContent = `Se eliminará «${ges.nombre}». Esta acción no se puede deshacer.`;
    $("dlgEliminar").showModal();
  }
});

$("btnConfirmarEliminar").addEventListener("click", async () => {
  const btnDel = $("btnConfirmarEliminar");
  setCargando(btnDel, true, "Eliminando…");
  try {
    await apiDelete(`/gestiones/${idEliminar}`);
    await cargarGestiones();
    $("dlgEliminar").close();
    mostrarExito("Gestión eliminada correctamente");
  } catch (err) {
    $("dlgEliminar").close();
    mostrarError(err, "No se puede eliminar: la gestión tiene registros asociados.");
  } finally {
    setCargando(btnDel, false);
  }
});

// EVENTOS GENERALES
$("btnNueva").addEventListener("click", () => abrirFormulario(null));
["fBuscar", "fEstado"].forEach(id => $(id).addEventListener("input", () => { estado.pagina = 1; pintar(); }));
$("btnPrev").addEventListener("click", () => { estado.pagina--; pintar(); });
$("btnNext").addEventListener("click", () => { estado.pagina++; pintar(); });

document.querySelectorAll("[data-cerrar]").forEach(b => b.addEventListener("click", () => b.closest("dialog").close()));
document.querySelectorAll("dialog").forEach(d => d.addEventListener("mousedown", (e) => { if (e.target === d) d.close(); }));

// CARGA DE DATOS DESDE EL BACKEND
async function cargarGestiones() {
  try {
    estado.lista = await apiGet('/gestiones');
    pintar();
  } catch (err) {
    $("resumen").textContent = "Error al cargar las gestiones.";
    mostrarError(err, "Error al cargar las gestiones.");
    mostrarErrorTabla($("tbody"), err, cargarGestiones);
  }
}

(async function iniciar() {
  mostrarSkeleton($("tbody"), 5);
  $("resumen").textContent = "Cargando gestiones...";
  await cargarGestiones();
})();

// PERMISOS
aplicarSoloLectura(esAdmin(), ["btnNueva"]);