/* =========================================================
   MÓDULO · HORARIO (+ horario_estudiante)
   Tabla: horario (idhorario, dia varchar(10), hora_inicio time, hora_fin time,
          docente_iddocente, materia_idmateria, aula_idaula)
   Tabla: horario_estudiante (idhorario_estudiante, horario_idhorario,
          estudiante_idestudiante)  → qué estudiantes asisten a cada horario
   ========================================================= */

/* ---------- CAPA DE DATOS ----------
   Ahora funciona en modo demostración (localStorage).
   Para conectarlo a tu backend, pon tu ruta en API_URL:
     GET    {API_URL}/horarios
     POST   {API_URL}/horarios
     PUT    {API_URL}/horarios/:id
     DELETE {API_URL}/horarios/:id        (el servidor debe borrar también sus horario_estudiante)
     GET    {API_URL}/horario-estudiantes
     POST   {API_URL}/horario-estudiantes  body: { horario_idhorario, estudiante_idestudiante }
     DELETE {API_URL}/horario-estudiantes/:id
     GET    {API_URL}/docentes   (iddocente, nombres, apellidos)
     GET    {API_URL}/materias   (idmateria, nombre_materia)
     GET    {API_URL}/aulas      (idaula, nombre)
     GET    {API_URL}/estudiantes (idestudiante, nombres, apellidos, ci, estado_estudiante)
   Las horas se envían como "HH:MM:SS" (columna time). */
const API_URL = ""; // ej.: "/api"

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const DOCENTES_DEMO = [
  { iddocente: 1, nombres: "María Fernanda", apellidos: "González Rojas" },
  { iddocente: 2, nombres: "Carmen", apellidos: "Mendoza Flores" }
];
const MATERIAS_DEMO = [
  { idmateria: 1, nombre_materia: "Matemática" },
  { idmateria: 2, nombre_materia: "Lenguaje y Comunicación" },
  { idmateria: 3, nombre_materia: "Ciencias Naturales" },
  { idmateria: 4, nombre_materia: "Ciencias Sociales" }
];
const AULAS_DEMO = [
  { idaula: 1, nombre: "Aula 101" },
  { idaula: 2, nombre: "Aula 102" },
  { idaula: 3, nombre: "Aula 201" },
  { idaula: 4, nombre: "Laboratorio de Computación" },
  { idaula: 5, nombre: "Sala de Música" }
];
const ESTUDIANTES_DEMO = [
  { idestudiante: 1, nombres: "María Fernanda", apellidos: "González Rojas", ci: "8456123", estado_estudiante: "Activo" },
  { idestudiante: 2, nombres: "Javier", apellidos: "Pérez Mamani", ci: "9123456", estado_estudiante: "Activo" },
  { idestudiante: 3, nombres: "Lucía", apellidos: "Ramírez Quispe", ci: "7894561", estado_estudiante: "Activo" },
  { idestudiante: 4, nombres: "Carlos Andrés", apellidos: "Torres Vargas", ci: "10234567", estado_estudiante: "Inactivo" },
  { idestudiante: 5, nombres: "Sofía", apellidos: "Aguilar Choque", ci: "6543210", estado_estudiante: "Retirado" }
];

const HORARIOS_DEMO = [
  { idhorario: 1, dia: "Lunes", hora_inicio: "08:00:00", hora_fin: "09:30:00", docente_iddocente: 1, materia_idmateria: 1, aula_idaula: 1 },
  { idhorario: 2, dia: "Lunes", hora_inicio: "09:45:00", hora_fin: "11:15:00", docente_iddocente: 2, materia_idmateria: 2, aula_idaula: 2 },
  { idhorario: 3, dia: "Martes", hora_inicio: "08:00:00", hora_fin: "09:30:00", docente_iddocente: 1, materia_idmateria: 1, aula_idaula: 1 },
  { idhorario: 4, dia: "Martes", hora_inicio: "09:45:00", hora_fin: "11:15:00", docente_iddocente: 2, materia_idmateria: 3, aula_idaula: 3 },
  { idhorario: 5, dia: "Miércoles", hora_inicio: "08:00:00", hora_fin: "09:30:00", docente_iddocente: 2, materia_idmateria: 2, aula_idaula: 2 },
  { idhorario: 6, dia: "Miércoles", hora_inicio: "10:00:00", hora_fin: "11:30:00", docente_iddocente: 1, materia_idmateria: 4, aula_idaula: 4 },
  { idhorario: 7, dia: "Jueves", hora_inicio: "08:00:00", hora_fin: "09:30:00", docente_iddocente: 1, materia_idmateria: 1, aula_idaula: 1 },
  { idhorario: 8, dia: "Viernes", hora_inicio: "08:00:00", hora_fin: "09:30:00", docente_iddocente: 2, materia_idmateria: 3, aula_idaula: 3 }
];
const ASIGNACIONES_DEMO = [
  { idhorario_estudiante: 1, horario_idhorario: 1, estudiante_idestudiante: 1 },
  { idhorario_estudiante: 2, horario_idhorario: 1, estudiante_idestudiante: 2 },
  { idhorario_estudiante: 3, horario_idhorario: 1, estudiante_idestudiante: 3 },
  { idhorario_estudiante: 4, horario_idhorario: 2, estudiante_idestudiante: 1 },
  { idhorario_estudiante: 5, horario_idhorario: 2, estudiante_idestudiante: 2 },
  { idhorario_estudiante: 6, horario_idhorario: 3, estudiante_idestudiante: 1 }
];

const estado = {
  horarios: [], asignaciones: [], docentes: [], materias: [], aulas: [], estudiantes: [],
  pagina: 1, vista: "lista",
  detalleId: null, seleccion: new Set()
};
const POR_PAGINA = 10;

const leerLocal = (clave, defecto) => {
  try {
    const g = JSON.parse(localStorage.getItem(clave));
    if (Array.isArray(g)) return g;
  } catch (e) {}
  return defecto.slice();
};
const guardarLocal = () => {
  localStorage.setItem("horarios_demo", JSON.stringify(estado.horarios));
  localStorage.setItem("horario_estudiante_demo", JSON.stringify(estado.asignaciones));
};

const api = {
  async horarios() { return API_URL ? (await fetch(`${API_URL}/horarios`)).json() : leerLocal("horarios_demo", HORARIOS_DEMO); },
  async asignaciones() { return API_URL ? (await fetch(`${API_URL}/horario-estudiantes`)).json() : leerLocal("horario_estudiante_demo", ASIGNACIONES_DEMO); },
  async docentes() { return API_URL ? (await fetch(`${API_URL}/docentes`)).json() : leerLocal("docentes_demo", DOCENTES_DEMO); },
  async materias() { return API_URL ? (await fetch(`${API_URL}/materias`)).json() : leerLocal("materias_demo", MATERIAS_DEMO); },
  async aulas() { return API_URL ? (await fetch(`${API_URL}/aulas`)).json() : leerLocal("aulas_demo", AULAS_DEMO); },
  async estudiantes() { return API_URL ? (await fetch(`${API_URL}/estudiantes`)).json() : leerLocal("estudiantes_demo", ESTUDIANTES_DEMO); },

  async guardar(h) {
    if (API_URL) {
      const nuevo = !h.idhorario;
      const r = await fetch(`${API_URL}/horarios${nuevo ? "" : "/" + h.idhorario}`, {
        method: nuevo ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(h)
      });
      if (!r.ok) throw new Error("guardar");
      return r.json();
    }
    if (!h.idhorario) {
      h.idhorario = Math.max(0, ...estado.horarios.map(x => x.idhorario)) + 1;
      estado.horarios.push(h);
    } else {
      estado.horarios[estado.horarios.findIndex(x => x.idhorario === h.idhorario)] = h;
    }
    guardarLocal();
    return h;
  },
  async eliminar(id) {
    if (API_URL) {
      const r = await fetch(`${API_URL}/horarios/${id}`, { method: "DELETE" });
      if (r.status === 409) throw new Error("en_uso");
      if (!r.ok) throw new Error("eliminar");
      return;
    }
    estado.horarios = estado.horarios.filter(x => x.idhorario !== id);
    estado.asignaciones = estado.asignaciones.filter(x => x.horario_idhorario !== id);
    guardarLocal();
  },
  async asignar(idHorario, idEstudiante) {
    if (API_URL) {
      const r = await fetch(`${API_URL}/horario-estudiantes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ horario_idhorario: idHorario, estudiante_idestudiante: idEstudiante })
      });
      if (!r.ok) throw new Error("asignar");
      return r.json();
    }
    const nuevo = {
      idhorario_estudiante: Math.max(0, ...estado.asignaciones.map(x => x.idhorario_estudiante)) + 1,
      horario_idhorario: idHorario,
      estudiante_idestudiante: idEstudiante
    };
    estado.asignaciones.push(nuevo);
    guardarLocal();
    return nuevo;
  },
  async quitar(idAsignacion) {
    if (API_URL) {
      const r = await fetch(`${API_URL}/horario-estudiantes/${idAsignacion}`, { method: "DELETE" });
      if (!r.ok) throw new Error("quitar");
      return;
    }
    estado.asignaciones = estado.asignaciones.filter(x => x.idhorario_estudiante !== idAsignacion);
    guardarLocal();
  }
};

/* ---------- UTILIDADES ---------- */
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
const nombreEst = (e) => `${e.apellidos}, ${e.nombres}`;
const inicialesEst = (e) => (e.nombres.trim()[0] + e.apellidos.trim()[0]).toUpperCase();

const etiqueta = (h) => `${nombreMateria(h.materia_idmateria)} · ${h.dia.slice(0, 3)} ${rango(h)}`;

// Dos horarios se cruzan si son el mismo día y sus horas se pisan
const solapan = (a, b) =>
  a.dia === b.dia && aSQL(a.hora_inicio) < aSQL(b.hora_fin) && aSQL(b.hora_inicio) < aSQL(a.hora_fin);

const asignadosDe = (idHorario) => estado.asignaciones.filter(a => a.horario_idhorario === idHorario);
const horariosDeEstudiante = (idEst) =>
  estado.asignaciones.filter(a => a.estudiante_idestudiante === idEst).map(a => horario(a.horario_idhorario)).filter(Boolean);

const COLORES = ["var(--secondary-500)", "var(--tertiary-500)", "var(--cyan-500)", "var(--primary-500)", "var(--secondary-700)", "var(--tertiary-700)"];
const colorMateria = (id) => COLORES[id % COLORES.length];
const COLORES_AVATAR = [
  "linear-gradient(135deg, var(--secondary-500), var(--secondary-700))",
  "linear-gradient(135deg, var(--tertiary-500), var(--tertiary-600))",
  "linear-gradient(135deg, var(--cyan-500), var(--cyan-700))",
  "linear-gradient(135deg, var(--primary-500), var(--primary-700))"
];

let toastTimer;
function aviso(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("is-show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("is-show"), 3200);
}

const ICO = {
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  del: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0M16 5.2a3.2 3.2 0 0 1 0 5.6M18 14.5A6 6 0 0 1 21 20"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>'
};
const icono = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[n]}</svg>`;

/* ---------- FILTROS Y ORDEN ---------- */
function filtrados() {
  const q = normalizar($("fBuscar").value.trim());
  const dia = $("fDia").value, doc = $("fDocente").value, aul = $("fAula").value;
  return estado.horarios
    .filter(h =>
      (!q || normalizar(`${nombreMateria(h.materia_idmateria)} ${nombreDocente(h.docente_iddocente)} ${nombreAula(h.aula_idaula)}`).includes(q)) &&
      (!dia || h.dia === dia) &&
      (!doc || String(h.docente_iddocente) === doc) &&
      (!aul || String(h.aula_idaula) === aul))
    .sort((a, b) => DIAS.indexOf(a.dia) - DIAS.indexOf(b.dia) || aSQL(a.hora_inicio).localeCompare(aSQL(b.hora_inicio)));
}

/* ---------- VISTA LISTA ---------- */
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
      <td data-label="Día" class="day-tag">${escapar(h.dia)}</td>
      <td data-label="Horario" class="time">${rango(h)}</td>
      <td data-label="Materia"><strong>${escapar(nombreMateria(h.materia_idmateria))}</strong></td>
      <td data-label="Docente" class="muted">${escapar(nombreDocente(h.docente_iddocente))}</td>
      <td data-label="Aula"><span class="badge badge--school"><span>${escapar(nombreAula(h.aula_idaula))}</span></span></td>
      <td data-label="Estudiantes"><span class="badge ${n ? "badge--next" : "badge--off"}">${n} ${n === 1 ? "estudiante" : "estudiantes"}</span></td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" data-accion="estudiantes" data-id="${h.idhorario}" title="Estudiantes" aria-label="Estudiantes de ${escapar(etiqueta(h))}">${icono("users")}</button>
          <button class="icon-btn" data-accion="editar" data-id="${h.idhorario}" title="Editar" aria-label="Editar ${escapar(etiqueta(h))}">${icono("edit")}</button>
          <button class="icon-btn icon-btn--danger" data-accion="eliminar" data-id="${h.idhorario}" title="Eliminar" aria-label="Eliminar ${escapar(etiqueta(h))}">${icono("del")}</button>
        </div>
      </td>
    </tr>`;
  }).join("");

  $("pager").hidden = lista.length <= POR_PAGINA;
  $("pagerInfo").textContent = `${inicio + 1}–${inicio + visibles.length} de ${lista.length}`;
  $("btnPrev").disabled = estado.pagina <= 1;
  $("btnNext").disabled = estado.pagina >= paginas;
}

/* ---------- VISTA SEMANA ---------- */
function pintarSemana(lista) {
  $("vistaSemana").innerHTML = DIAS.map(dia => {
    const delDia = lista.filter(h => h.dia === dia);
    return `
    <div class="day">
      <div class="day__head">${dia}<span>${delDia.length} ${delDia.length === 1 ? "clase" : "clases"}</span></div>
      ${delDia.length ? delDia.map(h => `
        <button class="blk" type="button" data-id="${h.idhorario}" style="--c:${colorMateria(h.materia_idmateria)}" aria-label="Ver ${escapar(etiqueta(h))}">
          <span class="blk__time">${rango(h)}</span>
          <strong>${escapar(nombreMateria(h.materia_idmateria))}</strong>
          <span>${escapar(nombreDocente(h.docente_iddocente))}</span>
          <div class="blk__foot"><span>${escapar(nombreAula(h.aula_idaula))}</span><span>${asignadosDe(h.idhorario).length} est.</span></div>
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

/* ---------- COMBOS ---------- */
function llenarCombos() {
  const docentes = estado.docentes.slice().sort((a, b) => a.apellidos.localeCompare(b.apellidos, "es"));
  const materias = estado.materias.slice().sort((a, b) => a.nombre_materia.localeCompare(b.nombre_materia, "es"));
  const aulas = estado.aulas.slice().sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { numeric: true }));

  const oDoc = docentes.map(d => `<option value="${d.iddocente}">${escapar(d.apellidos)}, ${escapar(d.nombres)}</option>`).join("");
  const oMat = materias.map(m => `<option value="${m.idmateria}">${escapar(m.nombre_materia)}</option>`).join("");
  const oAul = aulas.map(a => `<option value="${a.idaula}">${escapar(a.nombre)}</option>`).join("");
  const oDia = DIAS.map(d => `<option>${d}</option>`).join("");

  $("docente_iddocente").innerHTML = '<option value="">Selecciona un docente</option>' + oDoc;
  $("materia_idmateria").innerHTML = '<option value="">Selecciona una materia</option>' + oMat;
  $("aula_idaula").innerHTML = '<option value="">Selecciona un aula</option>' + oAul;
  $("dia").innerHTML = '<option value="">Selecciona un día</option>' + oDia;

  $("fDia").innerHTML = '<option value="">Todos los días</option>' + oDia;
  $("fDocente").innerHTML = '<option value="">Todos los docentes</option>' + oDoc;
  $("fAula").innerHTML = '<option value="">Todas las aulas</option>' + oAul;
}

/* ---------- FORMULARIO DE HORARIO ---------- */
const dlg = $("dlgHorario");
const form = $("formHorario");

function limpiarErrores() {
  form.querySelectorAll(".err").forEach(e => (e.textContent = ""));
  form.querySelectorAll(".is-invalid").forEach(e => e.classList.remove("is-invalid"));
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
  form.querySelector(`[data-err="${campo}"]`).textContent = msg;
  $(campo).classList.add("is-invalid");
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

  // Cruces de docente y de aula en el mismo día y hora
  const otros = estado.horarios.filter(h => h.idhorario !== id);
  const choqueDoc = otros.find(h => h.docente_iddocente === candidato.docente_iddocente && solapan(h, candidato));
  if (choqueDoc) { marcarError("docente_iddocente", `Ya tiene clase: ${etiqueta(choqueDoc)}.`); ok = false; }
  const choqueAula = otros.find(h => h.aula_idaula === candidato.aula_idaula && solapan(h, candidato));
  if (choqueAula) { marcarError("aula_idaula", `Aula ocupada: ${etiqueta(choqueAula)}.`); ok = false; }

  // Al editar: los estudiantes ya asignados no pueden quedar con dos clases a la vez
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

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validar()) { form.querySelector(".is-invalid")?.focus(); return; }

  const h = {
    idhorario: Number($("idhorario").value) || null,
    dia: $("dia").value,
    hora_inicio: aSQL($("hora_inicio").value),
    hora_fin: aSQL($("hora_fin").value),
    docente_iddocente: Number($("docente_iddocente").value),
    materia_idmateria: Number($("materia_idmateria").value),
    aula_idaula: Number($("aula_idaula").value)
  };
  const editando = !!h.idhorario;

  $("btnGuardar").disabled = true;
  try {
    await api.guardar(h);
    if (API_URL) estado.horarios = await api.horarios();
    dlg.close();
    pintar();
    aviso(editando ? "Horario actualizado" : "Horario creado");
  } catch (err) {
    aviso("No se pudo guardar el horario. Intenta de nuevo.");
  } finally {
    $("btnGuardar").disabled = false;
  }
});

/* ---------- DETALLE Y ESTUDIANTES DEL HORARIO ---------- */
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

  $("detTitulo").textContent = nombreMateria(h.materia_idmateria);
  $("detInfo").innerHTML = `
    <div class="info"><small>Día y hora</small><strong>${escapar(h.dia)} · ${rango(h)}</strong></div>
    <div class="info"><small>Docente</small><strong>${escapar(nombreDocente(h.docente_iddocente))}</strong></div>
    <div class="info"><small>Aula</small><strong>${escapar(nombreAula(h.aula_idaula))}</strong></div>`;

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

// Estudiantes activos que todavía no están en el horario; se bloquean los que tienen otra clase a esa hora
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
  // Si un seleccionado quedó bloqueado, se saca de la selección
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

$("btnAddOk").addEventListener("click", async () => {
  const ids = [...estado.seleccion];
  if (!ids.length) return;
  $("btnAddOk").disabled = true;
  let agregados = 0;
  try {
    for (const idEst of ids) { await api.asignar(estado.detalleId, idEst); agregados++; }
    aviso(`${agregados} ${agregados === 1 ? "estudiante agregado" : "estudiantes agregados"}`);
  } catch (err) {
    aviso("No se pudieron agregar todos los estudiantes. Intenta de nuevo.");
  }
  if (API_URL) estado.asignaciones = await api.asignaciones();
  estado.seleccion.clear();
  pintarDetalle();
  pintar();
});

$("detLista").addEventListener("click", async (e) => {
  const b = e.target.closest("[data-quitar]");
  if (!b) return;
  try {
    await api.quitar(Number(b.dataset.quitar));
    if (API_URL) estado.asignaciones = await api.asignaciones();
    pintarDetalle();
    pintar();
    aviso("Estudiante quitado del horario");
  } catch (err) {
    aviso("No se pudo quitar al estudiante. Intenta de nuevo.");
  }
});

$("btnEditarDesdeDetalle").addEventListener("click", () => {
  const h = horario(estado.detalleId);
  dlgDet.close();
  if (h) abrirFormulario(h);
});

/* ---------- ELIMINAR HORARIO ---------- */
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
  try {
    await api.eliminar(idEliminar);
    if (API_URL) [estado.horarios, estado.asignaciones] = await Promise.all([api.horarios(), api.asignaciones()]);
    $("dlgEliminar").close();
    pintar();
    aviso("Horario eliminado");
  } catch (err) {
    $("dlgEliminar").close();
    aviso(err.message === "en_uso"
      ? "No se puede eliminar: el horario tiene asistencias u otros registros asociados."
      : "No se pudo eliminar el horario. Intenta de nuevo.");
  }
});

/* ---------- EVENTOS GENERALES ---------- */
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

/* ---------- INICIO ---------- */
(async function iniciar() {
  try {
    [estado.horarios, estado.asignaciones, estado.docentes, estado.materias, estado.aulas, estado.estudiantes] =
      await Promise.all([api.horarios(), api.asignaciones(), api.docentes(), api.materias(), api.aulas(), api.estudiantes()]);
  } catch (err) {
    $("resumen").textContent = "No se pudieron cargar los horarios.";
    return;
  }
  llenarCombos();
  pintar();
})();