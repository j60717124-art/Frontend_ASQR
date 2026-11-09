// MÓDULO · ASIGNACIÓN

const DIAS = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];
const ETIQUETA_DIA = { LUNES: "Lunes", MARTES: "Martes", MIERCOLES: "Miércoles", JUEVES: "Jueves", VIERNES: "Viernes", SABADO: "Sábado" };
const nombreDia = (d) => ETIQUETA_DIA[d] ?? d;
const diaISO = (offset = 0) => { const d = new Date(); d.setDate(d.getDate() + offset); return d.toLocaleDateString("en-CA"); };
const estado = {
  asignaciones: [], estudiantes: [], paralelos: [], cursos: [], niveles: [], gestiones: [], horarios: [], materias: [], aulas: [],
  pagina: 1, checks: new Set()
};
const POR_PAGINA = 15;

// UTILIDADES
const $ = (id) => document.getElementById(id);
const escapar = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const normalizar = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const hhmm = (t) => String(t).slice(0, 5);
const aSQL = (t) => (String(t).length === 5 ? `${t}:00` : String(t));
const fechaLocal = (iso) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); };
const fmtFecha = (iso) => fechaLocal(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
const est = (id) => estado.estudiantes.find(e => e.idestudiante === id);
const par = (id) => estado.paralelos.find(p => p.idparalelo === id);
const ges = (id) => estado.gestiones.find(g => g.idgestion_academica === id);
const hor = (id) => estado.horarios.find(h => h.idhorario === id);
const cur = (id) => estado.cursos.find(c => c.idcurso === id);
const niv = (id) => estado.niveles.find(n => n.idnivel === id);
const nombreEst = (e) => (e ? `${e.apellidos}, ${e.nombres}` : "Estudiante no encontrado");
const iniciales = (e) => (e ? (e.nombres.trim()[0] + e.apellidos.trim()[0]).toUpperCase() : "?");
const nombreMateriaDe = (h) => h.nombre_materia || nombreMateria(h.materia_idmateria);
const nombreAulaDe = (h) => h.aula_nombre || nombreAula(h.aula_idaula);
const nombreMateria = (id) => estado.materias.find(m => m.idmateria === id)?.nombre_materia ?? "Materia no encontrada";
const nombreAula = (id) => estado.aulas.find(a => a.idaula === id)?.nombre ?? "Aula no encontrada";
const nombreNivel = (id) => niv(id)?.nivel ?? "Sin nivel";
const cursoDe = (idParalelo) => cur(par(idParalelo)?.curso_idcurso);
const etiquetaParalelo = (idParalelo) => { const p = par(idParalelo), c = cursoDe(idParalelo); return p ? `${c?.nombre ?? "?"} ${p.nombre}` : "Paralelo no encontrado"; };
const ordenNivel = (id) => { const i = estado.niveles.findIndex(n => n.idnivel === id); return i < 0 ? 999 : i; };
const etiquetaHorario = (h) => `${nombreMateriaDe(h)} · ${nombreDia(h.dia).slice(0, 3)} ${hhmm(h.hora_inicio)}–${hhmm(h.hora_fin)}`;
const solapan = (a, b) => a.dia === b.dia && aSQL(a.hora_inicio) < aSQL(b.hora_fin) && aSQL(b.hora_inicio) < aSQL(a.hora_fin);
const hoy = () => diaISO(0);
const gestionActual = () => estado.gestiones.find(g => g.fecha_inicio <= hoy() && hoy() <= g.fecha_fin) ?? null;
const estadoGestion = (g) => (hoy() < g.fecha_inicio ? "Próxima" : hoy() > g.fecha_fin ? "Finalizada" : "En curso");

const COLORES = [
  "linear-gradient(135deg, var(--secondary-500), var(--secondary-700))",
  "linear-gradient(135deg, var(--tertiary-500), var(--tertiary-600))",
  "linear-gradient(135deg, var(--cyan-500), var(--cyan-700))",
  "linear-gradient(135deg, var(--primary-500), var(--primary-700))"
];

const ICO = {
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  del: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5"/>'
};
const icono = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[n]}</svg>`;

// LISTADO
function filtradas() {
  const q = normalizar($("fBuscar").value.trim());
  const g = $("fGestion").value, p = $("fParalelo").value;
  return estado.asignaciones
    .filter(a => {
      const e = est(a.estudiante_idestudiante), h = hor(a.horario_idhorario);
      return (!q || normalizar(`${nombreEst(e)} ${e?.ci ?? ""} ${h ? nombreMateriaDe(h) : ""} ${etiquetaParalelo(a.paralelo_idparalelo)}`).includes(q)) &&
             (!g || String(a.gestion_academica_idgestion_academica) === g) &&
             (!p || String(a.paralelo_idparalelo) === p);
    })
    .sort((a, b) => {
      const ea = est(a.estudiante_idestudiante), eb = est(b.estudiante_idestudiante);
      const ha = hor(a.horario_idhorario), hb = hor(b.horario_idhorario);
      return (ea?.apellidos ?? "").localeCompare(eb?.apellidos ?? "", "es") ||
             (ea?.nombres ?? "").localeCompare(eb?.nombres ?? "", "es") ||
             DIAS.indexOf(ha?.dia) - DIAS.indexOf(hb?.dia) ||
             aSQL(ha?.hora_inicio ?? "").localeCompare(aSQL(hb?.hora_inicio ?? ""));
    });
}

function pintar() {
  const todas = filtradas();
  const paginas = Math.max(1, Math.ceil(todas.length / POR_PAGINA));
  estado.pagina = Math.min(estado.pagina, paginas);
  const inicio = (estado.pagina - 1) * POR_PAGINA;
  const visibles = todas.slice(inicio, inicio + POR_PAGINA);

  $("vacio").hidden = todas.length > 0;

  $("tbody").innerHTML = visibles.map(a => {
    const e = est(a.estudiante_idestudiante), h = hor(a.horario_idhorario), g = ges(a.gestion_academica_idgestion_academica), c = cursoDe(a.paralelo_idparalelo);
    return `
    <tr>
      <td data-label="Estudiante">
        <div class="user">
          <span class="user__avatar" style="background:${COLORES[a.estudiante_idestudiante % COLORES.length]}">${escapar(iniciales(e))}</span>
          <div class="stack"><strong>${escapar(nombreEst(e))}</strong><span>CI ${escapar(e?.ci ?? "—")}</span></div>
        </div>
      </td>
      <td data-label="Paralelo">
        <div class="stack"><div class="pair"><span class="badge badge--next">${escapar(etiquetaParalelo(a.paralelo_idparalelo))}</span><span>${escapar(c ? nombreNivel(c.nivel_idnivel) : "")}</span></div></div>
      </td>
      <td data-label="Gestión"><span class="badge badge--term">${escapar(g?.nombre ?? "Gestión no encontrada")}</span></td>
      <td data-label="Horario" class="hcell">
        ${h ? `<div class="stack"><strong>${escapar(nombreMateriaDe(h))}</strong><span class="time">${escapar(nombreDia(h.dia).slice(0, 3))} ${hhmm(h.hora_inicio)}–${hhmm(h.hora_fin)} · ${escapar(nombreAulaDe(h))}</span></div>` : '<span class="muted">Horario no encontrado</span>'}
      </td>
      <td data-label="Asignado" class="muted">${fmtFecha(a.fecha_asignacion)}</td>
      <td>
        <div class="row-actions">
          <button class="icon-btn icon-btn--danger" data-accion="eliminar" data-id="${a.idasignacion}" title="Eliminar" aria-label="Eliminar asignación de ${escapar(nombreEst(e))}">${icono("del")}</button>
        </div>
      </td>
    </tr>`;
  }).join("");

  $("pager").hidden = todas.length <= POR_PAGINA;
  $("pagerInfo").textContent = `${inicio + 1}–${inicio + visibles.length} de ${todas.length}`;
  $("btnPrev").disabled = estado.pagina <= 1;
  $("btnNext").disabled = estado.pagina >= paginas;

  const total = estado.asignaciones.length;
  const alumnos = new Set(estado.asignaciones.map(a => a.estudiante_idestudiante)).size;
  $("resumen").textContent = `${total} ${total === 1 ? "asignación" : "asignaciones"} · ${alumnos} ${alumnos === 1 ? "estudiante" : "estudiantes"}`;
}

// COMBOS
function opcionesParalelos() {
  return estado.niveles.map(n => {
    const items = estado.paralelos
      .filter(p => cursoDe(p.idparalelo)?.nivel_idnivel === n.idnivel)
      .sort((a, b) => etiquetaParalelo(a.idparalelo).localeCompare(etiquetaParalelo(b.idparalelo), "es", { numeric: true }));
    return items.length ? `<optgroup label="${escapar(n.nivel)}">${items.map(p => `<option value="${p.idparalelo}">${escapar(etiquetaParalelo(p.idparalelo))}</option>`).join("")}</optgroup>` : "";
  }).join("");
}

function llenarCombos() {
  const gestiones = estado.gestiones.slice().sort((a, b) => b.fecha_inicio.localeCompare(a.fecha_inicio));
  const optGes = gestiones.map(g => `<option value="${g.idgestion_academica}">${escapar(g.nombre)}</option>`).join("");
  const optPar = opcionesParalelos();

  $("gestion_academica_idgestion_academica").innerHTML = '<option value="">Selecciona una gestión</option>' + optGes;
  $("paralelo_idparalelo").innerHTML = '<option value="">Selecciona un paralelo</option>' + optPar;
  $("fGestion").innerHTML = '<option value="">Todas las gestiones</option>' + optGes;
  $("fParalelo").innerHTML = '<option value="">Todos los paralelos</option>' + optPar;

  const hs = estado.horarios.slice().sort((a, b) => DIAS.indexOf(a.dia) - DIAS.indexOf(b.dia) || aSQL(a.hora_inicio).localeCompare(aSQL(b.hora_inicio)));
  $("horario_idhorario").innerHTML = '<option value="">Selecciona un horario</option>' + hs.map(h => `<option value="${h.idhorario}">${escapar(etiquetaHorario(h))}</option>`).join("");
}

// FORMULARIO
const dlg = $("dlgAsig");
const form = $("formAsig");

// Errores del backend que se muestran junto al campo correspondiente
const REGLAS_ERROR = [
  [/estudiante/i, "estudiante_idestudiante"],
  [/gesti[oó]n/i, "gestion_academica_idgestion_academica"],
  [/paralelo/i, "paralelo_idparalelo"],
  [/fecha/i, "fecha_asignacion"],
  [/horario|cruza/i, "horarios"]
];
const esEdicion = () => !!$("idasignacion").value;

function limpiarErrores() {
  limpiarErroresFormulario(form);
}

function llenarEstudiantes(actualId) {
  const lista = estado.estudiantes
    .filter(e => e.estado_estudiante === "Activo" || e.idestudiante === actualId)
    .sort((a, b) => a.apellidos.localeCompare(b.apellidos, "es"));
  $("estudiante_idestudiante").innerHTML = '<option value="">Selecciona un estudiante</option>' +
    lista.map(e => `<option value="${e.idestudiante}">${escapar(nombreEst(e))} · CI ${escapar(e.ci)}</option>`).join("");
}

function pintarChecks() {
  const idEst = Number($("estudiante_idestudiante").value);
  const idGes = Number($("gestion_academica_idgestion_academica").value);
  const caja = $("horarioChecks");

  if (!idEst || !idGes) {
    caja.innerHTML = '<div class="hbox-empty">Selecciona primero el estudiante y la gestión.</div>';
    $("hintHor").textContent = "";
    return;
  }

  const existentes = estado.asignaciones.filter(a => a.estudiante_idestudiante === idEst && a.gestion_academica_idgestion_academica === idGes);
  const hExist = existentes.map(a => hor(a.horario_idhorario)).filter(Boolean);
  const yaIds = new Set(existentes.map(a => a.horario_idhorario));
  const ordenados = estado.horarios.slice().sort((a, b) => DIAS.indexOf(a.dia) - DIAS.indexOf(b.dia) || aSQL(a.hora_inicio).localeCompare(aSQL(b.hora_inicio)));
  [...estado.checks].forEach(id => {
    const h = hor(id);
    if (!h || yaIds.has(id) || hExist.some(x => solapan(x, h))) estado.checks.delete(id);
  });
  const seleccion = [...estado.checks].map(hor);

  let html = "", diaActual = "";
  ordenados.forEach(h => {
    const marcado = estado.checks.has(h.idhorario);
    let motivo = "";
    if (yaIds.has(h.idhorario)) motivo = "Ya asignado en esta gestión";
    else {
      const c1 = hExist.find(x => solapan(x, h));
      const c2 = !marcado && seleccion.find(x => x.idhorario !== h.idhorario && solapan(x, h));
      if (c1) motivo = `Cruce con ${etiquetaHorario(c1)}`;
      else if (c2) motivo = `Cruce con ${etiquetaHorario(c2)} (seleccionado)`;
    }
    if (h.dia !== diaActual) { diaActual = h.dia; html += `<div class="hday">${escapar(nombreDia(h.dia))}</div>`; }
    html += `
      <label class="hitem${motivo ? " is-disabled" : ""}">
        <input type="checkbox" data-hor="${h.idhorario}" ${marcado ? "checked" : ""} ${motivo ? "disabled" : ""}>
        <span class="hitem__info"><strong>${escapar(nombreMateriaDe(h))} · ${hhmm(h.hora_inicio)}–${hhmm(h.hora_fin)}</strong><small>${motivo ? escapar(motivo) : escapar(nombreAulaDe(h))}</small></span>
      </label>`;
  });
  caja.innerHTML = html || '<div class="hbox-empty">Aún no hay horarios registrados.</div>';

  const n = estado.checks.size;
  $("hintHor").textContent = n ? `${n} ${n === 1 ? "horario seleccionado" : "horarios seleccionados"}` : "";
}

function pintarHintGestion() {
  const g = ges(Number($("gestion_academica_idgestion_academica").value));
  $("hintGes").textContent = g ? `${estadoGestion(g)} · ${fmtFecha(g.fecha_inicio)} – ${fmtFecha(g.fecha_fin)}` : "";
}

function abrirFormulario(a = null) {
  limpiarErrores();
  form.reset();
  const editando = !!a;
  estado.checks.clear();

  $("dlgTitulo").textContent = editando ? "Editar asignación" : "Nueva asignación";
  $("btnGuardar").textContent = editando ? "Guardar cambios" : "Guardar asignación";
  $("idasignacion").value = a?.idasignacion ?? "";
  llenarEstudiantes(a?.estudiante_idestudiante);
  $("estudiante_idestudiante").value = a?.estudiante_idestudiante ?? "";
  $("gestion_academica_idgestion_academica").value = a?.gestion_academica_idgestion_academica ?? gestionActual()?.idgestion_academica ?? "";
  $("paralelo_idparalelo").value = a?.paralelo_idparalelo ?? "";
  $("fecha_asignacion").value = a?.fecha_asignacion ?? hoy();
  $("hintPar").textContent = estado.paralelos.length ? "" : "Primero registra un paralelo en el módulo Paralelo.";
  $("hintPar").classList.toggle("is-warn", !estado.paralelos.length);
  $("horarioChecks").hidden = editando;
  $("horario_idhorario").hidden = !editando;
  $("lblHorario").textContent = editando ? "Horario" : "Horarios";
  $("lblHorario").setAttribute("for", editando ? "horario_idhorario" : "");
  if (editando) $("horario_idhorario").value = a.horario_idhorario; else pintarChecks();
  pintarHintGestion();
  dlg.showModal();
  $("estudiante_idestudiante").focus();
}

function marcarError(campo, msg) {
  marcarErrorCampo(form, campo, msg);
  if (campo === "horarios") $("horarioChecks").classList.add("is-invalid");
}

function validar() {
  limpiarErrores();
  let ok = true;
  const idAsig = Number($("idasignacion").value) || null;
  const idEst = Number($("estudiante_idestudiante").value);
  const idGes = Number($("gestion_academica_idgestion_academica").value);

  if (!idEst) { marcarError("estudiante_idestudiante", "Selecciona el estudiante."); ok = false; }
  if (!idGes) { marcarError("gestion_academica_idgestion_academica", "Selecciona la gestión."); ok = false; }
  if (!$("paralelo_idparalelo").value) { marcarError("paralelo_idparalelo", "Selecciona el paralelo."); ok = false; }
  if (!$("fecha_asignacion").value) { marcarError("fecha_asignacion", "Indica la fecha de asignación."); ok = false; }

  if (esEdicion()) {
    const idHor = Number($("horario_idhorario").value);
    if (!idHor) { marcarError("horarios", "Selecciona el horario."); ok = false; }
    else if (idEst && idGes) {
      const h = hor(idHor);
      const otras = estado.asignaciones.filter(x => x.idasignacion !== idAsig && x.estudiante_idestudiante === idEst && x.gestion_academica_idgestion_academica === idGes);
      if (otras.some(x => x.horario_idhorario === idHor)) { marcarError("horarios", "Este estudiante ya tiene ese horario en la gestión."); ok = false; }
      else {
        const choque = otras.map(x => hor(x.horario_idhorario)).find(x => x && solapan(x, h));
        if (choque) { marcarError("horarios", `Cruce con ${etiquetaHorario(choque)}.`); ok = false; }
      }
    }
  } else if (!estado.checks.size) {
    marcarError("horarios", "Marca al menos un horario."); ok = false;
  }
  return ok;
}

["estudiante_idestudiante", "gestion_academica_idgestion_academica"].forEach(id =>
  $(id).addEventListener("change", () => { if (!esEdicion()) pintarChecks(); pintarHintGestion(); }));

$("horarioChecks").addEventListener("change", (e) => {
  const c = e.target.closest("[data-hor]");
  if (!c) return;
  const id = Number(c.dataset.hor);
  c.checked ? estado.checks.add(id) : estado.checks.delete(id);
  $("horarioChecks").classList.remove("is-invalid");
  form.querySelector('[data-err="horarios"]').textContent = "";
  pintarChecks();
});

// GUARDAR

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validar()) { form.querySelector(".is-invalid")?.focus(); return; }

  const base = {
    fecha_asignacion: $("fecha_asignacion").value,
    paralelo_idparalelo: Number($("paralelo_idparalelo").value),
    gestion_academica_idgestion_academica: Number($("gestion_academica_idgestion_academica").value),
    estudiante_idestudiante: Number($("estudiante_idestudiante").value)
  };

  const ids = [...estado.checks];
  let creadas = 0;
  const avisosInscripcion = [];
  let errorFatal = null;

  setCargando($("btnGuardar"), true, "Guardando…");
  try {
    for (const idHor of ids) {
      await apiPost('/asignaciones', { ...base, horario_idhorario: idHor });
      creadas++;
      try {
        await apiPost('/inscripciones', { horario_idhorario: idHor, estudiante_idestudiante: base.estudiante_idestudiante });
      } catch (errIns) {
        // "ya está inscrito" no es un problema; cualquier otro motivo se avisa
        if (!/ya está inscrito/i.test(errIns.message || "")) avisosInscripcion.push(mensajeDeError(errIns));
      }
    }
  } catch (err) {
    errorFatal = err;
  }

  // Refrescar siempre para ver qué quedó guardado
  try { estado.asignaciones = await apiGet('/asignaciones'); } catch (errCarga) { mostrarError(errCarga, "No se pudo actualizar la lista."); }
  pintar();
  setCargando($("btnGuardar"), false);

  if (creadas) mostrarExito(`${creadas} ${creadas === 1 ? "asignación creada" : "asignaciones creadas"}`);
  if (avisosInscripcion.length) {
    mostrarAviso(`La asignación se guardó, pero no se pudo inscribir al estudiante en el horario: ${avisosInscripcion[0]}`);
  }
  if (errorFatal) {
    const extra = creadas ? ` (se crearon ${creadas} de ${ids.length})` : "";
    errorFormulario(form, errorFatal, REGLAS_ERROR, "No se pudo guardar la asignación.");
    if (extra) mostrarAviso(`Guardado parcial${extra}. Revisa la lista antes de reintentar.`);
    pintarChecks();
    return;
  }
  dlg.close();
});

// ACCIONES DE FILA
let idEliminar = null;

$("tbody").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-accion]");
  if (!btn) return;
  const a = estado.asignaciones.find(x => x.idasignacion === Number(btn.dataset.id));
  if (!a) return;

  if (btn.dataset.accion === "eliminar") {
    const h = hor(a.horario_idhorario);
    idEliminar = a.idasignacion;
    $("delTexto").textContent = `Se quitará a ${nombreEst(est(a.estudiante_idestudiante))} del horario ${h ? etiquetaHorario(h) : ""} (${ges(a.gestion_academica_idgestion_academica)?.nombre ?? "gestión"}). Esta acción no se puede deshacer. Si el estudiante ya estaba inscrito en el horario, la inscripción se mantiene (se quita desde Horarios).`;
    $("dlgEliminar").showModal();
  }
});

$("btnConfirmarEliminar").addEventListener("click", async () => {
  const btnDel = $("btnConfirmarEliminar");
  setCargando(btnDel, true, "Eliminando…");
  try {
    await apiDelete(`/asignaciones/${idEliminar}`);
    estado.asignaciones = await apiGet('/asignaciones');
    $("dlgEliminar").close();
    pintar();
    mostrarExito("Asignación eliminada");
  } catch (err) {
    $("dlgEliminar").close();
    mostrarError(err, "No se pudo eliminar la asignación.");
  } finally {
    setCargando(btnDel, false);
  }
});

// EVENTOS GENERALES
$("btnNueva").addEventListener("click", () => abrirFormulario(null));
["fBuscar", "fGestion", "fParalelo"].forEach(id => $(id).addEventListener("input", () => { estado.pagina = 1; pintar(); }));
$("btnPrev").addEventListener("click", () => { estado.pagina--; pintar(); });
$("btnNext").addEventListener("click", () => { estado.pagina++; pintar(); });

document.querySelectorAll("[data-cerrar]").forEach(b => b.addEventListener("click", () => b.closest("dialog").close()));
document.querySelectorAll("dialog").forEach(d => d.addEventListener("mousedown", (e) => { if (e.target === d) d.close(); }));

// CARGA DE DATOS DESDE EL BACKEND
async function cargarDatos() {
  try {
    [
      estado.asignaciones, estado.estudiantes, estado.paralelos, estado.cursos, estado.niveles,
      estado.gestiones, estado.horarios, estado.materias, estado.aulas
    ] = await Promise.all([
      apiGet('/asignaciones'), apiGet('/estudiantes'), apiGet('/paralelos'), apiGet('/cursos'), apiGet('/niveles'),
      apiGet('/gestiones'), apiGet('/horarios'), apiGet('/materias'), apiGet('/aulas')
    ]);
    llenarCombos();
    pintar();
  } catch (err) {
    $("resumen").textContent = "Error al cargar datos.";
    mostrarError(err, "No se pudieron cargar los datos de asignaciones.");
    mostrarErrorTabla($("tbody"), err, cargarDatos);
  }
}

(async function iniciar() {
  mostrarSkeleton($("tbody"), 6);
  $("resumen").textContent = "Cargando datos...";
  await cargarDatos();
})();

// PERMISOS
aplicarSoloLectura(puedeGestionarMatricula(), ["btnNueva"]);
