//MÓDULO · HORARIO
// El backend guarda el día en MAYÚSCULAS y sin tilde (LUNES … SABADO); aquí se traduce solo para mostrarlo
const DIAS = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];
const ETIQUETA_DIA = { LUNES: "Lunes", MARTES: "Martes", MIERCOLES: "Miércoles", JUEVES: "Jueves", VIERNES: "Viernes", SABADO: "Sábado" };
const nombreDia = (d) => ETIQUETA_DIA[d] ?? d;
const estado = {
  horarios: [], asignaciones: [], docentes: [], materias: [], aulas: [], estudiantes: [],
  pagina: 1, vista: "lista",
  detalleId: null, seleccion: new Set()
};
const POR_PAGINA = 10;

// UTILIDADES
const $ = (id) => document.getElementById(id);
const escapar = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const normalizar = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const hhmm = (t) => String(t).slice(0, 5);
const aSQL = (t) => (String(t).length === 5 ? `${t}:00` : String(t));
const rango = (h) => `${hhmm(h.hora_inicio)} – ${hhmm(h.hora_fin)}`;
const docente = (id) => estado.docentes.find(d => d.iddocente === id);
const materia = (id) => estado.materias.find(m => m.idmateria === id);
const aula = (id) => estado.aulas.find(a => a.idaula === id);
const estudiante = (id) => estado.estudiantes.find(e => e.idestudiante === id);
const horario = (id) => estado.horarios.find(h => h.idhorario === id);
const nombreDocente = (id) => { const d = docente(id); return d ? `${d.apellidos}, ${d.nombres}` : "Docente no encontrado"; };
const nombreMateria = (id) => materia(id)?.nombre_materia ?? "Materia no encontrada";
const nombreAula = (id) => aula(id)?.nombre ?? "Aula no encontrada";
const docDe = (h) => h.docente_nombre || docDe(h);
const matDe = (h) => h.nombre_materia || matDe(h);
const aulaDe = (h) => h.aula_nombre || aulaDe(h);
const nombreEst = (e) => `${e.apellidos}, ${e.nombres}`;
const inicialesEst = (e) => (e.nombres.trim()[0] + e.apellidos.trim()[0]).toUpperCase();
const etiqueta = (h) => `${matDe(h)} · ${nombreDia(h.dia).slice(0, 3)} ${rango(h)}`;
const solapan = (a, b) => a.dia === b.dia && aSQL(a.hora_inicio) < aSQL(b.hora_fin) && aSQL(b.hora_inicio) < aSQL(a.hora_fin);
const asignadosDe = (idHorario) => estado.asignaciones.filter(a => a.horario_idhorario === idHorario);
const horariosDeEstudiante = (idEst) => estado.asignaciones.filter(a => a.estudiante_idestudiante === idEst).map(a => horario(a.horario_idhorario)).filter(Boolean);
const COLORES = ["var(--secondary-500)", "var(--tertiary-500)", "var(--cyan-500)", "var(--primary-500)", "var(--secondary-700)", "var(--tertiary-700)"];
const colorMateria = (id) => COLORES[id % COLORES.length];
const COLORES_AVATAR = [
  "linear-gradient(135deg, var(--secondary-500), var(--secondary-700))",
  "linear-gradient(135deg, var(--tertiary-500), var(--tertiary-600))",
  "linear-gradient(135deg, var(--cyan-500), var(--cyan-700))",
  "linear-gradient(135deg, var(--primary-500), var(--primary-700))"
];

const ICO = {
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  del: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0M16 5.2a3.2 3.2 0 0 1 0 5.6M18 14.5A6 6 0 0 1 21 20"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>'
};
const icono = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[n]}</svg>`;

// FILTROS Y ORDEN
function filtrados() {
  const q = normalizar($("fBuscar").value.trim());
  const dia = $("fDia").value, doc = $("fDocente").value, aul = $("fAula").value;
  return estado.horarios
    .filter(h =>
      (!q || normalizar(`${matDe(h)} ${docDe(h)} ${aulaDe(h)}`).includes(q)) &&
      (!dia || h.dia === dia) &&
      (!doc || String(h.docente_iddocente) === doc) &&
      (!aul || String(h.aula_idaula) === aul))
    .sort((a, b) => DIAS.indexOf(a.dia) - DIAS.indexOf(b.dia) || aSQL(a.hora_inicio).localeCompare(aSQL(b.hora_inicio)));
}

// VISTA LISTA
function pintarLista(lista) {
  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  estado.pagina = Math.min(estado.pagina, paginas);
  const inicio = (estado.pagina - 1) * POR_PAGINA;
  const visibles = lista.slice(inicio, inicio + POR_PAGINA);

  $("vacio").hidden = lista.length > 0;

  $("tbody").innerHTML = visibles.map(h => {
    const n = asignadosDe(h.idhorario).length;
    return `
    <tr class="row-click" data-id="${h.idhorario}">
      <td data-label="Día" class="day-tag">${escapar(nombreDia(h.dia))}</td>
      <td data-label="Horario" class="time">${rango(h)}</td>
      <td data-label="Materia"><strong>${escapar(matDe(h))}</strong></td>
      <td data-label="Docente" class="muted">${escapar(docDe(h))}</td>
      <td data-label="Aula"><span class="badge badge--school"><span>${escapar(aulaDe(h))}</span></span></td>
      <td data-label="Estudiantes"><span class="badge ${n ? "badge--next" : "badge--off"}">${n} ${n === 1 ? "estudiante" : "estudiantes"}</span></td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" data-accion="estudiantes" data-id="${h.idhorario}" title="Estudiantes" aria-label="Estudiantes de ${escapar(etiqueta(h))}">${icono("users")}</button>
          ${esAdmin() ? `<button class="icon-btn" data-accion="editar" data-id="${h.idhorario}" title="Editar" aria-label="Editar ${escapar(etiqueta(h))}">${icono("edit")}</button>
          <button class="icon-btn icon-btn--danger" data-accion="eliminar" data-id="${h.idhorario}" title="Eliminar" aria-label="Eliminar ${escapar(etiqueta(h))}">${icono("del")}</button>` : ""}
        </div>
      </td>
    </tr>`;
  }).join("");

  $("pager").hidden = lista.length <= POR_PAGINA;
  $("pagerInfo").textContent = `${inicio + 1}–${inicio + visibles.length} de ${lista.length}`;
  $("btnPrev").disabled = estado.pagina <= 1;
  $("btnNext").disabled = estado.pagina >= paginas;
}

// VISTA SEMANA
function pintarSemana(lista) {
  $("vistaSemana").innerHTML = DIAS.map(dia => {
    const delDia = lista.filter(h => h.dia === dia);
    return `
    <div class="day">
      <div class="day__head">${nombreDia(dia)}<span>${delDia.length} ${delDia.length === 1 ? "clase" : "clases"}</span></div>
      ${delDia.length ? delDia.map(h => `
        <button class="blk" type="button" data-id="${h.idhorario}" style="--c:${colorMateria(h.materia_idmateria)}" aria-label="Ver ${escapar(etiqueta(h))}">
          <span class="blk__time">${rango(h)}</span>
          <strong>${escapar(matDe(h))}</strong>
          <span>${escapar(docDe(h))}</span>
          <div class="blk__foot"><span>${escapar(aulaDe(h))}</span><span>${asignadosDe(h.idhorario).length} est.</span></div>
        </button>`).join("") : '<div class="day__empty">Sin clases</div>'}
    </div>`;
  }).join("");
}

function pintar() {
  const lista = filtrados();
  const verLista = estado.vista === "lista";
  $("vistaLista").hidden = !verLista;
  $("vistaSemana").hidden = verLista;
  $("vLista").setAttribute("aria-pressed", String(verLista));
  $("vSemana").setAttribute("aria-pressed", String(!verLista));

  if (verLista) pintarLista(lista); else pintarSemana(lista);

  const n = estado.horarios.length;
  $("resumen").textContent = `${n} ${n === 1 ? "horario" : "horarios"} · ${estado.asignaciones.length} ${estado.asignaciones.length === 1 ? "asignación" : "asignaciones"} de estudiantes`;
}

// COMBOS
function llenarCombos() {
  const docentes = estado.docentes.slice().sort((a, b) => a.apellidos.localeCompare(b.apellidos, "es"));
  const materias = estado.materias.slice().sort((a, b) => a.nombre_materia.localeCompare(b.nombre_materia, "es"));
  const aulas = estado.aulas.slice().sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { numeric: true }));
  const oDoc = docentes.map(d => `<option value="${d.iddocente}">${escapar(d.apellidos)}, ${escapar(d.nombres)}</option>`).join("");
  const oMat = materias.map(m => `<option value="${m.idmateria}">${escapar(m.nombre_materia)}</option>`).join("");
  const oAul = aulas.map(a => `<option value="${a.idaula}">${escapar(a.nombre)}</option>`).join("");
  const oDia = DIAS.map(d => `<option value="${d}">${nombreDia(d)}</option>`).join("");

  $("docente_iddocente").innerHTML = '<option value="">Selecciona un docente</option>' + oDoc;
  $("materia_idmateria").innerHTML = '<option value="">Selecciona una materia</option>' + oMat;
  $("aula_idaula").innerHTML = '<option value="">Selecciona un aula</option>' + oAul;
  $("dia").innerHTML = '<option value="">Selecciona un día</option>' + oDia;
  $("fDia").innerHTML = '<option value="">Todos los días</option>' + oDia;
  $("fDocente").innerHTML = '<option value="">Todos los docentes</option>' + oDoc;
  $("fAula").innerHTML = '<option value="">Todas las aulas</option>' + oAul;
}

// FORMULARIO DE HORARIO
const dlg = $("dlgHorario");
const form = $("formHorario");

// Errores del backend que se muestran junto al campo correspondiente
const REGLAS_ERROR = [
  [/hora de fin/i, "hora_fin"],
  [/hora de inicio|se cruza/i, "hora_inicio"],
  [/docente/i, "docente_iddocente"],
  [/materia/i, "materia_idmateria"],
  [/aula/i, "aula_idaula"],
  [/d[ií]a/i, "dia"]
];

function limpiarErrores() {
  limpiarErroresFormulario(form);
}

function abrirFormulario(h) {
  limpiarErrores();
  form.reset();
  $("dlgTitulo").textContent = h ? "Editar horario" : "Nuevo horario";
  $("btnGuardar").textContent = h ? "Guardar cambios" : "Guardar horario";
  $("idhorario").value = h?.idhorario ?? "";
  $("dia").value = h?.dia ?? "";
  $("hora_inicio").value = h ? hhmm(h.hora_inicio) : "";
  $("hora_fin").value = h ? hhmm(h.hora_fin) : "";
  $("materia_idmateria").value = h?.materia_idmateria ?? "";
  $("docente_iddocente").value = h?.docente_iddocente ?? "";
  $("aula_idaula").value = h?.aula_idaula ?? "";
  dlg.showModal();
  $("dia").focus();
}

function marcarError(campo, msg) {
  marcarErrorCampo(form, campo, msg);
}

function validar() {
  limpiarErrores();
  let ok = true;
  const id = Number($("idhorario").value) || null;
  const candidato = {
    idhorario: id,
    dia: $("dia").value,
    hora_inicio: $("hora_inicio").value,
    hora_fin: $("hora_fin").value,
    docente_iddocente: Number($("docente_iddocente").value),
    materia_idmateria: Number($("materia_idmateria").value),
    aula_idaula: Number($("aula_idaula").value)
  };

  if (!candidato.dia) { marcarError("dia", "Selecciona el día."); ok = false; }
  if (!candidato.hora_inicio) { marcarError("hora_inicio", "Indica la hora de inicio."); ok = false; }
  if (!candidato.hora_fin) { marcarError("hora_fin", "Indica la hora de fin."); ok = false; }
  if (!candidato.materia_idmateria) { marcarError("materia_idmateria", "Selecciona la materia."); ok = false; }
  if (!candidato.docente_iddocente) { marcarError("docente_iddocente", "Selecciona el docente."); ok = false; }
  if (!candidato.aula_idaula) { marcarError("aula_idaula", "Selecciona el aula."); ok = false; }

  if (candidato.hora_inicio && candidato.hora_fin && candidato.hora_fin <= candidato.hora_inicio) {
    marcarError("hora_fin", "La hora de fin debe ser posterior a la de inicio."); ok = false;
  }
  if (!ok) return false;

  const otros = estado.horarios.filter(h => h.idhorario !== id);
  const choqueDoc = otros.find(h => h.docente_iddocente === candidato.docente_iddocente && solapan(h, candidato));
  if (choqueDoc) { marcarError("docente_iddocente", `Ya tiene clase: ${etiqueta(choqueDoc)}.`); ok = false; }
  const choqueAula = otros.find(h => h.aula_idaula === candidato.aula_idaula && solapan(h, candidato));
  if (choqueAula) { marcarError("aula_idaula", `Aula ocupada: ${etiqueta(choqueAula)}.`); ok = false; }

  if (id) {
    const afectados = asignadosDe(id).filter(a =>
      horariosDeEstudiante(a.estudiante_idestudiante).some(h => h.idhorario !== id && solapan(h, candidato)));
    if (afectados.length) {
      marcarError("hora_inicio", `${afectados.length} ${afectados.length === 1 ? "estudiante asignado tendría" : "estudiantes asignados tendrían"} otra clase a esa hora.`);
      ok = false;
    }
  }
  return ok;
}

//  GUARDAR HORARIO
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validar()) { form.querySelector(".is-invalid")?.focus(); return; }

  const id = $("idhorario").value;
  const editando = !!id;
  const payload = {
    dia: $("dia").value,
    hora_inicio: aSQL($("hora_inicio").value),
    hora_fin: aSQL($("hora_fin").value),
    docente_iddocente: Number($("docente_iddocente").value),
    materia_idmateria: Number($("materia_idmateria").value),
    aula_idaula: Number($("aula_idaula").value)
  };

  setCargando($("btnGuardar"), true, "Guardando…");
  try {
    if (editando) {
      await apiPut(`/horarios/${id}`, payload);
      mostrarExito("Horario actualizado correctamente");
    } else {
      await apiPost(`/horarios`, payload);
      mostrarExito("Horario creado correctamente");
    }

    await cargarHorarios();
    dlg.close();

  } catch (err) {
    errorFormulario(form, err, REGLAS_ERROR, "No se pudo guardar el horario");
  } finally {
    setCargando($("btnGuardar"), false);
  }
});

// DETALLE Y ESTUDIANTES DEL HORARIO
const dlgDet = $("dlgDetalle");

function abrirDetalle(id) {
  estado.detalleId = id;
  estado.seleccion.clear();
  $("detBuscar").value = "";
  $("addBuscar").value = "";
  $("detAdd").hidden = true;
  pintarDetalle();
  dlgDet.showModal();
}

function pintarDetalle() {
  const h = horario(estado.detalleId);
  if (!h) return;

  $("detTitulo").textContent = matDe(h);
  $("detInfo").innerHTML = `
    <div class="info"><small>Día y hora</small><strong>${escapar(nombreDia(h.dia))} · ${rango(h)}</strong></div>
    <div class="info"><small>Docente</small><strong>${escapar(docDe(h))}</strong></div>
    <div class="info"><small>Aula</small><strong>${escapar(aulaDe(h))}</strong></div>`;

  pintarAsignados();
  pintarCandidatos();
}

function pintarAsignados() {
  const h = horario(estado.detalleId);
  const q = normalizar($("detBuscar").value.trim());
  const todos = asignadosDe(h.idhorario)
    .map(a => ({ a, e: estudiante(a.estudiante_idestudiante) }))
    .filter(x => x.e)
    .sort((x, y) => x.e.apellidos.localeCompare(y.e.apellidos, "es"));
  const lista = todos.filter(x => !q || normalizar(`${x.e.nombres} ${x.e.apellidos} ${x.e.ci}`).includes(q));

  $("detCount").textContent = todos.length;
  $("detLista").innerHTML = lista.length
    ? lista.map(({ a, e }) => `
      <li class="sitem">
        <span class="user__avatar" style="background:${COLORES_AVATAR[e.idestudiante % COLORES_AVATAR.length]}">${escapar(inicialesEst(e))}</span>
        <div class="sitem__info"><strong>${escapar(nombreEst(e))}</strong><small>CI ${escapar(e.ci)}</small></div>
        <button class="icon-btn icon-btn--danger" type="button" data-quitar="${a.idhorario_estudiante}" title="Quitar del horario" aria-label="Quitar a ${escapar(nombreEst(e))} del horario">${icono("x")}</button>
      </li>`).join("")
    : `<li class="slist-empty">${todos.length ? "Ningún estudiante coincide con la búsqueda." : "Aún no hay estudiantes asignados a este horario."}</li>`;
}

function candidatos() {
  const h = horario(estado.detalleId);
  const yaEstan = new Set(asignadosDe(h.idhorario).map(a => a.estudiante_idestudiante));
  const q = normalizar($("addBuscar").value.trim());
  return estado.estudiantes
    .filter(e => e.estado_estudiante === "Activo" && !yaEstan.has(e.idestudiante) &&
      (!q || normalizar(`${e.nombres} ${e.apellidos} ${e.ci}`).includes(q)))
    .sort((a, b) => a.apellidos.localeCompare(b.apellidos, "es"))
    .map(e => ({ e, choque: horariosDeEstudiante(e.idestudiante).find(x => x.idhorario !== h.idhorario && solapan(x, h)) }));
}

function pintarCandidatos() {
  if ($("detAdd").hidden) return;
  const lista = candidatos();
  lista.forEach(({ e, choque }) => { if (choque) estado.seleccion.delete(e.idestudiante); });

  $("addLista").innerHTML = lista.length
    ? lista.map(({ e, choque }) => `
      <label class="sitem${choque ? " is-disabled" : ""}">
        <input type="checkbox" data-pick="${e.idestudiante}" ${choque ? "disabled" : ""} ${estado.seleccion.has(e.idestudiante) ? "checked" : ""}>
        <span class="user__avatar" style="background:${COLORES_AVATAR[e.idestudiante % COLORES_AVATAR.length]}">${escapar(inicialesEst(e))}</span>
        <div class="sitem__info"><strong>${escapar(nombreEst(e))}</strong><small>${choque ? `Cruce con ${escapar(etiqueta(choque))}` : `CI ${escapar(e.ci)}`}</small></div>
      </label>`).join("")
    : '<li class="slist-empty">No hay estudiantes disponibles para agregar.</li>';

  const n = estado.seleccion.size;
  $("btnAddOk").disabled = n === 0;
  $("btnAddOk").textContent = n ? `Agregar seleccionados (${n})` : "Agregar seleccionados";
}

$("detBuscar").addEventListener("input", pintarAsignados);
$("addBuscar").addEventListener("input", pintarCandidatos);

$("btnAgregar").addEventListener("click", () => {
  $("detAdd").hidden = false;
  pintarCandidatos();
  $("addBuscar").focus();
});
$("btnCerrarAdd").addEventListener("click", () => { $("detAdd").hidden = true; estado.seleccion.clear(); });

$("addLista").addEventListener("change", (e) => {
  const c = e.target.closest("[data-pick]");
  if (!c) return;
  const id = Number(c.dataset.pick);
  c.checked ? estado.seleccion.add(id) : estado.seleccion.delete(id);
  const n = estado.seleccion.size;
  $("btnAddOk").disabled = n === 0;
  $("btnAddOk").textContent = n ? `Agregar seleccionados (${n})` : "Agregar seleccionados";
});

// AGREGAR ESTUDIANTES
$("btnAddOk").addEventListener("click", async () => {
  const ids = [...estado.seleccion];
  if (!ids.length) return;

  const idHorario = estado.detalleId;
  const btn = $("btnAddOk");
  setCargando(btn, true, "Agregando…");

  let agregados = 0;
  const errores = [];

  for (const idEst of ids) {
    try {
      await apiPost('/inscripciones', { horario_idhorario: idHorario, estudiante_idestudiante: idEst });
      agregados++;
    } catch (err) {
      const e = estudiante(idEst);
      errores.push(`${e ? nombreEst(e) : "Estudiante #" + idEst}: ${mensajeDeError(err)}`);
    }
  }

  if (agregados > 0) mostrarExito(`${agregados} ${agregados === 1 ? "estudiante agregado" : "estudiantes agregados"} al horario`);
  if (errores.length) {
    mostrarError(`No se pudo agregar a ${errores.length} ${errores.length === 1 ? "estudiante" : "estudiantes"}. ${errores[0]}`);
  }

  estado.seleccion.clear();
  await cargarInscripciones();
  pintarDetalle();
  pintar();
  setCargando(btn, false);
});

// QUITAR ESTUDIANTE
$("detLista").addEventListener("click", async (e) => {
  const b = e.target.closest("[data-quitar]");
  if (!b) return;

  const idInscripcion = Number(b.dataset.quitar);
  const ins = estado.asignaciones.find(a => a.idhorario_estudiante === idInscripcion);
  const est = ins && estudiante(ins.estudiante_idestudiante);
  const ok = await confirmarAccion(
    `Se quitará a ${est ? nombreEst(est) : "este estudiante"} del horario. Si ya tiene asistencias registradas, el sistema no lo permitirá.`,
    null, { titulo: "Quitar estudiante", aceptar: "Quitar" });
  if (!ok) return;

  setCargando(b, true);
  try {
    await apiDelete(`/inscripciones/${idInscripcion}`);
    await cargarInscripciones();
    pintarDetalle();
    pintar();
    mostrarExito("Estudiante quitado del horario");
  } catch (err) {
    mostrarError(err, "No se pudo quitar al estudiante.");
  } finally {
    setCargando(b, false);
  }
});

$("btnEditarDesdeDetalle").hidden = !esAdmin();
$("btnAgregar").hidden = !puedeGestionarMatricula();
$("btnEditarDesdeDetalle").addEventListener("click", () => {
  const h = horario(estado.detalleId);
  dlgDet.close();
  if (h) abrirFormulario(h);
});

// ELIMINAR HORARIO
let idEliminar = null;

function pedirEliminar(h) {
  const n = asignadosDe(h.idhorario).length;
  idEliminar = h.idhorario;
  $("delTexto").textContent = `Se eliminará ${etiqueta(h)}.` +
    (n ? ` También se quitará a ${n} ${n === 1 ? "estudiante asignado" : "estudiantes asignados"} de este horario.` : "") +
    " Esta acción no se puede deshacer.";
  $("dlgEliminar").showModal();
}

$("btnConfirmarEliminar").addEventListener("click", async () => {
  const btnDel = $("btnConfirmarEliminar");
  setCargando(btnDel, true, "Eliminando…");
  try {
    await apiDelete(`/horarios/${idEliminar}`);
    await Promise.all([cargarHorarios(), cargarInscripciones()]);
    $("dlgEliminar").close();
    pintar();
    mostrarExito("Horario eliminado correctamente");
  } catch (err) {
    $("dlgEliminar").close();
    mostrarError(err, "No se puede eliminar: el horario tiene asistencias u otros registros asociados.");
  } finally {
    setCargando(btnDel, false);
  }
});

// EVENTOS GENERALES
$("tbody").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-accion]");
  const fila = e.target.closest("tr[data-id]");
  const h = horario(Number((btn ?? fila)?.dataset.id));
  if (!h) return;
  if (!btn) return abrirDetalle(h.idhorario);
  if (btn.dataset.accion === "estudiantes") abrirDetalle(h.idhorario);
  if (btn.dataset.accion === "editar") abrirFormulario(h);
  if (btn.dataset.accion === "eliminar") pedirEliminar(h);
});

$("vistaSemana").addEventListener("click", (e) => {
  const b = e.target.closest(".blk");
  if (b) abrirDetalle(Number(b.dataset.id));
});

$("vLista").addEventListener("click", () => { estado.vista = "lista"; pintar(); });
$("vSemana").addEventListener("click", () => { estado.vista = "semana"; pintar(); });
$("btnNuevo").addEventListener("click", () => abrirFormulario(null));
["fBuscar", "fDia", "fDocente", "fAula"].forEach(id => $(id).addEventListener("input", () => { estado.pagina = 1; pintar(); }));
$("btnPrev").addEventListener("click", () => { estado.pagina--; pintar(); });
$("btnNext").addEventListener("click", () => { estado.pagina++; pintar(); });

document.querySelectorAll("[data-cerrar]").forEach(b => b.addEventListener("click", () => b.closest("dialog").close()));
document.querySelectorAll("dialog").forEach(d => d.addEventListener("mousedown", (e) => { if (e.target === d) d.close(); }));

// CARGA DE DATOS
async function cargarHorarios() {
  try {
    estado.horarios = await apiGet('/horarios');
    pintar();
  } catch (err) {
    $("resumen").textContent = "Error al cargar horarios.";
    mostrarError(err, "No se pudieron cargar los horarios.");
    mostrarErrorTabla($("tbody"), err, iniciar);
    throw err;
  }
}

async function cargarInscripciones() {
  const resultado = [];
  let fallos = 0;
  const horarios = estado.horarios.slice();

  for (let i = 0; i < horarios.length; i += 6) {
    const lote = horarios.slice(i, i + 6);
    const respuestas = await Promise.allSettled(lote.map(h => apiGet(`/horarios/${h.idhorario}/estudiantes`)));
    respuestas.forEach((r, k) => {
      if (r.status === "fulfilled" && Array.isArray(r.value)) {
        r.value.forEach(ins => resultado.push({
          idhorario_estudiante: ins.idhorario_estudiante,
          horario_idhorario: lote[k].idhorario,
          estudiante_idestudiante: ins.estudiante_idestudiante
        }));
      } else if (r.status === "rejected") {
        fallos++;
      }
    });
  }

  estado.asignaciones = resultado;
  if (fallos) mostrarAviso(`No se pudo leer los estudiantes de ${fallos} ${fallos === 1 ? "horario" : "horarios"}. Los conteos pueden estar incompletos.`);
  pintar();
}

async function cargarCatalogos() {
  const pedidos = [
    puedeGestionarMatricula() ? apiGet('/estudiantes') : Promise.resolve([]),
    esAdmin() ? apiGet('/docentes') : Promise.resolve([]),
    apiGet('/materias'),
    apiGet('/aulas')
  ];
  const [est, doc, mat, aul] = await Promise.allSettled(pedidos);
  estado.estudiantes = est.status === "fulfilled" ? est.value : [];
  estado.docentes = doc.status === "fulfilled" ? doc.value : [];
  estado.materias = mat.status === "fulfilled" ? mat.value : [];
  estado.aulas = aul.status === "fulfilled" ? aul.value : [];
  const fallo = [est, doc, mat, aul].find(r => r.status === "rejected");
  if (fallo) mostrarError(fallo.reason, "No se pudieron cargar algunos datos auxiliares (docentes, materias, aulas o estudiantes).");
  llenarCombos();
}

async function iniciar() {
  mostrarSkeleton($("tbody"), 5);
  $("resumen").textContent = "Cargando datos...";
  try {
    await cargarCatalogos();
    await cargarHorarios();
    await cargarInscripciones();
  } catch (_) { /* ya se mostró el error */ }
}

if (!esAdmin()) $("btnNuevo").hidden = true;
iniciar();