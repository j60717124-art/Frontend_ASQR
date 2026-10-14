/* =========================================================
   MÓDULO · ASIGNACIÓN
   Tabla: asignacion (idasignacion, fecha_asignacion date, paralelo_idparalelo,
          gestion_academica_idgestion_academica, horario_idhorario,
          estudiante_idestudiante)
   Cada fila asigna a un estudiante, en una gestión y un paralelo, a UN horario.
   Para asignar varios horarios a la vez, el formulario crea una fila por horario.
   ========================================================= */

/* ---------- CAPA DE DATOS ----------
   Ahora funciona en modo demostración (localStorage).
   Para conectarlo a tu backend, pon tu ruta en API_URL:
     GET    {API_URL}/asignaciones
     POST   {API_URL}/asignaciones          (una fila por horario)
     PUT    {API_URL}/asignaciones/:id
     DELETE {API_URL}/asignaciones/:id
     GET    {API_URL}/estudiantes  (idestudiante, nombres, apellidos, ci, estado_estudiante)
     GET    {API_URL}/paralelos    (idparalelo, nombre, curso_idcurso)
     GET    {API_URL}/cursos       (idcurso, nombre, nivel_idnivel)
     GET    {API_URL}/niveles      (idnivel, nivel)
     GET    {API_URL}/gestiones    (idgestion_academica, nombre, fecha_inicio, fecha_fin)
     GET    {API_URL}/horarios     (idhorario, dia, hora_inicio, hora_fin, docente_iddocente, materia_idmateria, aula_idaula)
     GET    {API_URL}/materias     (idmateria, nombre_materia)
     GET    {API_URL}/aulas        (idaula, nombre)
   Las fechas se envían como "YYYY-MM-DD" (columna date). */
const API_URL = ""; // ej.: "/api"

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const diaISO = (offset = 0) => { const d = new Date(); d.setDate(d.getDate() + offset); return d.toLocaleDateString("en-CA"); };

const ESTUDIANTES_DEMO = [
  { idestudiante: 1, nombres: "María Fernanda", apellidos: "González Rojas", ci: "8456123", estado_estudiante: "Activo" },
  { idestudiante: 2, nombres: "Javier", apellidos: "Pérez Mamani", ci: "9123456", estado_estudiante: "Activo" },
  { idestudiante: 3, nombres: "Lucía", apellidos: "Ramírez Quispe", ci: "7894561", estado_estudiante: "Activo" },
  { idestudiante: 4, nombres: "Carlos Andrés", apellidos: "Torres Vargas", ci: "10234567", estado_estudiante: "Inactivo" },
  { idestudiante: 5, nombres: "Sofía", apellidos: "Aguilar Choque", ci: "6543210", estado_estudiante: "Retirado" }
];
const NIVELES_DEMO = [{ idnivel: 1, nivel: "Inicial" }, { idnivel: 2, nivel: "Primaria" }, { idnivel: 3, nivel: "Secundaria" }];
const CURSOS_DEMO = [
  { idcurso: 1, nombre: "Pre-kínder", nivel_idnivel: 1 },
  { idcurso: 2, nombre: "1.º", nivel_idnivel: 2 },
  { idcurso: 3, nombre: "2.º", nivel_idnivel: 2 },
  { idcurso: 4, nombre: "1.º", nivel_idnivel: 3 },
  { idcurso: 5, nombre: "2.º", nivel_idnivel: 3 },
  { idcurso: 6, nombre: "3.º", nivel_idnivel: 3 }
];
const PARALELOS_DEMO = [
  { idparalelo: 1, nombre: "A", curso_idcurso: 1 }, { idparalelo: 2, nombre: "A", curso_idcurso: 2 },
  { idparalelo: 3, nombre: "B", curso_idcurso: 2 }, { idparalelo: 4, nombre: "A", curso_idcurso: 3 },
  { idparalelo: 5, nombre: "A", curso_idcurso: 4 }, { idparalelo: 6, nombre: "B", curso_idcurso: 4 },
  { idparalelo: 7, nombre: "A", curso_idcurso: 5 }, { idparalelo: 8, nombre: "A", curso_idcurso: 6 }
];
const GESTIONES_DEMO = [
  { idgestion_academica: 1, nombre: "Gestión 2025", fecha_inicio: "2025-02-03", fecha_fin: "2025-12-05" },
  { idgestion_academica: 2, nombre: "Gestión 2026", fecha_inicio: "2026-02-02", fecha_fin: "2026-12-04" },
  { idgestion_academica: 3, nombre: "Gestión 2027", fecha_inicio: "2027-02-01", fecha_fin: "2027-12-03" }
];
const MATERIAS_DEMO = [
  { idmateria: 1, nombre_materia: "Matemática" }, { idmateria: 2, nombre_materia: "Lenguaje y Comunicación" },
  { idmateria: 3, nombre_materia: "Ciencias Naturales" }, { idmateria: 4, nombre_materia: "Ciencias Sociales" }
];
const AULAS_DEMO = [
  { idaula: 1, nombre: "Aula 101" }, { idaula: 2, nombre: "Aula 102" }, { idaula: 3, nombre: "Aula 201" },
  { idaula: 4, nombre: "Laboratorio de Computación" }, { idaula: 5, nombre: "Sala de Música" }
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
  { idasignacion: 1, fecha_asignacion: diaISO(-30), paralelo_idparalelo: 2, gestion_academica_idgestion_academica: 2, horario_idhorario: 1, estudiante_idestudiante: 1 },
  { idasignacion: 2, fecha_asignacion: diaISO(-30), paralelo_idparalelo: 2, gestion_academica_idgestion_academica: 2, horario_idhorario: 2, estudiante_idestudiante: 1 },
  { idasignacion: 3, fecha_asignacion: diaISO(-30), paralelo_idparalelo: 2, gestion_academica_idgestion_academica: 2, horario_idhorario: 3, estudiante_idestudiante: 1 },
  { idasignacion: 4, fecha_asignacion: diaISO(-28), paralelo_idparalelo: 2, gestion_academica_idgestion_academica: 2, horario_idhorario: 1, estudiante_idestudiante: 2 },
  { idasignacion: 5, fecha_asignacion: diaISO(-28), paralelo_idparalelo: 2, gestion_academica_idgestion_academica: 2, horario_idhorario: 2, estudiante_idestudiante: 2 },
  { idasignacion: 6, fecha_asignacion: diaISO(-20), paralelo_idparalelo: 3, gestion_academica_idgestion_academica: 2, horario_idhorario: 1, estudiante_idestudiante: 3 }
];

const estado = {
  asignaciones: [], estudiantes: [], paralelos: [], cursos: [], niveles: [], gestiones: [], horarios: [], materias: [], aulas: [],
  pagina: 1, checks: new Set()
};
const POR_PAGINA = 15;

const leerLocal = (clave, defecto) => {
  try {
    const g = JSON.parse(localStorage.getItem(clave));
    if (Array.isArray(g)) return g;
  } catch (e) {}
  return defecto.slice();
};
const lista = async (ruta, clave, demo) => API_URL ? (await fetch(`${API_URL}/${ruta}`)).json() : leerLocal(clave, demo);

const api = {
  asignaciones: () => lista("asignaciones", "asignaciones_demo", ASIGNACIONES_DEMO),
  estudiantes: () => lista("estudiantes", "estudiantes_demo", ESTUDIANTES_DEMO),
  paralelos: () => lista("paralelos", "paralelos_demo", PARALELOS_DEMO),
  cursos: () => lista("cursos", "cursos_demo", CURSOS_DEMO),
  niveles: () => lista("niveles", "niveles_demo", NIVELES_DEMO),
  gestiones: () => lista("gestiones", "gestiones_demo", GESTIONES_DEMO),
  horarios: () => lista("horarios", "horarios_demo", HORARIOS_DEMO),
  materias: () => lista("materias", "materias_demo", MATERIAS_DEMO),
  aulas: () => lista("aulas", "aulas_demo", AULAS_DEMO),

  async guardar(a) {
    if (API_URL) {
      const nueva = !a.idasignacion;
      const r = await fetch(`${API_URL}/asignaciones${nueva ? "" : "/" + a.idasignacion}`, {
        method: nueva ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(a)
      });
      if (!r.ok) throw new Error("guardar");
      return r.json();
    }
    if (!a.idasignacion) {
      a.idasignacion = Math.max(0, ...estado.asignaciones.map(x => x.idasignacion)) + 1;
      estado.asignaciones.push(a);
    } else {
      estado.asignaciones[estado.asignaciones.findIndex(x => x.idasignacion === a.idasignacion)] = a;
    }
    localStorage.setItem("asignaciones_demo", JSON.stringify(estado.asignaciones));
    return a;
  },
  async eliminar(id) {
    if (API_URL) {
      const r = await fetch(`${API_URL}/asignaciones/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("eliminar");
      return;
    }
    estado.asignaciones = estado.asignaciones.filter(x => x.idasignacion !== id);
    localStorage.setItem("asignaciones_demo", JSON.stringify(estado.asignaciones));
  }
};

/* ---------- UTILIDADES ---------- */
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

const nombreEst = (e) => (e ? `${e.apellidos}, ${e.nombres}` : "Estudiante no encontrado");
const iniciales = (e) => (e ? (e.nombres.trim()[0] + e.apellidos.trim()[0]).toUpperCase() : "?");
const nombreMateria = (id) => estado.materias.find(m => m.idmateria === id)?.nombre_materia ?? "Materia no encontrada";
const nombreAula = (id) => estado.aulas.find(a => a.idaula === id)?.nombre ?? "Aula no encontrada";
const nombreNivel = (id) => estado.niveles.find(n => n.idnivel === id)?.nivel ?? "Sin nivel";
const cursoDe = (idParalelo) => estado.cursos.find(c => c.idcurso === par(idParalelo)?.curso_idcurso);
const etiquetaParalelo = (idParalelo) => { const p = par(idParalelo), c = cursoDe(idParalelo); return p ? `${c?.nombre ?? "?"} ${p.nombre}` : "Paralelo no encontrado"; };
const ordenNivel = (id) => { const i = estado.niveles.findIndex(n => n.idnivel === id); return i < 0 ? 999 : i; };

const etiquetaHorario = (h) => `${nombreMateria(h.materia_idmateria)} · ${h.dia.slice(0, 3)} ${hhmm(h.hora_inicio)}–${hhmm(h.hora_fin)}`;
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
  del: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5"/>'
};
const icono = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[n]}</svg>`;

/* ---------- LISTADO ---------- */
function filtradas() {
  const q = normalizar($("fBuscar").value.trim());
  const g = $("fGestion").value, p = $("fParalelo").value;
  return estado.asignaciones
    .filter(a => {
      const e = est(a.estudiante_idestudiante), h = hor(a.horario_idhorario);
      return (!q || normalizar(`${nombreEst(e)} ${e?.ci ?? ""} ${h ? nombreMateria(h.materia_idmateria) : ""} ${etiquetaParalelo(a.paralelo_idparalelo)}`).includes(q)) &&
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
        ${h ? `<div class="stack"><strong>${escapar(nombreMateria(h.materia_idmateria))}</strong><span class="time">${escapar(h.dia.slice(0, 3))} ${hhmm(h.hora_inicio)}–${hhmm(h.hora_fin)} · ${escapar(nombreAula(h.aula_idaula))}</span></div>` : '<span class="muted">Horario no encontrado</span>'}
      </td>
      <td data-label="Asignado" class="muted">${fmtFecha(a.fecha_asignacion)}</td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" data-accion="editar" data-id="${a.idasignacion}" title="Editar" aria-label="Editar asignación de ${escapar(nombreEst(e))}">${icono("edit")}</button>
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

/* ---------- COMBOS ---------- */
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

/* ---------- FORMULARIO ---------- */
const dlg = $("dlgAsig");
const form = $("formAsig");
const esEdicion = () => !!$("idasignacion").value;

function limpiarErrores() {
  form.querySelectorAll(".err").forEach(e => (e.textContent = ""));
  form.querySelectorAll(".is-invalid").forEach(e => e.classList.remove("is-invalid"));
}

function llenarEstudiantes(actualId) {
  const lista = estado.estudiantes
    .filter(e => e.estado_estudiante === "Activo" || e.idestudiante === actualId)
    .sort((a, b) => a.apellidos.localeCompare(b.apellidos, "es"));
  $("estudiante_idestudiante").innerHTML = '<option value="">Selecciona un estudiante</option>' +
    lista.map(e => `<option value="${e.idestudiante}">${escapar(nombreEst(e))} · CI ${escapar(e.ci)}</option>`).join("");
}

// Lista de horarios (solo al crear): marca varios; bloquea los ya asignados y los que se cruzan
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

  // Quita de la selección lo que ya no se puede elegir
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
    if (h.dia !== diaActual) { diaActual = h.dia; html += `<div class="hday">${escapar(h.dia)}</div>`; }
    html += `
      <label class="hitem${motivo ? " is-disabled" : ""}">
        <input type="checkbox" data-hor="${h.idhorario}" ${marcado ? "checked" : ""} ${motivo ? "disabled" : ""}>
        <span class="hitem__info"><strong>${escapar(nombreMateria(h.materia_idmateria))} · ${hhmm(h.hora_inicio)}–${hhmm(h.hora_fin)}</strong><small>${motivo ? escapar(motivo) : escapar(nombreAula(h.aula_idaula))}</small></span>
      </label>`;
  });
  caja.innerHTML = html || '<div class="hbox-empty">Aún no hay horarios registrados. Créalos en el módulo Horario.</div>';

  const n = estado.checks.size;
  $("hintHor").textContent = n ? `${n} ${n === 1 ? "horario seleccionado" : "horarios seleccionados"}` : "";
}

function pintarHintGestion() {
  const g = ges(Number($("gestion_academica_idgestion_academica").value));
  $("hintGes").textContent = g ? `${estadoGestion(g)} · ${fmtFecha(g.fecha_inicio)} – ${fmtFecha(g.fecha_fin)}` : "";
}

function abrirFormulario(a) {
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

  // Al crear: lista con casillas. Al editar: un solo horario.
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
  form.querySelector(`[data-err="${campo}"]`).textContent = msg;
  const el = $(campo) ?? (campo === "horarios" ? $("horarioChecks") : null);
  el?.classList.add("is-invalid");
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

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validar()) { form.querySelector(".is-invalid")?.focus(); return; }

  const base = {
    fecha_asignacion: $("fecha_asignacion").value,
    paralelo_idparalelo: Number($("paralelo_idparalelo").value),
    gestion_academica_idgestion_academica: Number($("gestion_academica_idgestion_academica").value),
    estudiante_idestudiante: Number($("estudiante_idestudiante").value)
  };

  $("btnGuardar").disabled = true;
  try {
    if (esEdicion()) {
      await api.guardar({ ...base, idasignacion: Number($("idasignacion").value), horario_idhorario: Number($("horario_idhorario").value) });
      aviso("Asignación actualizada");
    } else {
      const ids = [...estado.checks];
      for (const idHor of ids) await api.guardar({ ...base, idasignacion: null, horario_idhorario: idHor });
      aviso(`${ids.length} ${ids.length === 1 ? "asignación creada" : "asignaciones creadas"}`);
    }
    if (API_URL) estado.asignaciones = await api.asignaciones();
    dlg.close();
    pintar();
  } catch (err) {
    if (API_URL) estado.asignaciones = await api.asignaciones().catch(() => estado.asignaciones);
    pintar();
    aviso("No se pudo guardar la asignación. Intenta de nuevo.");
  } finally {
    $("btnGuardar").disabled = false;
  }
});

/* ---------- ACCIONES DE FILA ---------- */
let idEliminar = null;

$("tbody").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-accion]");
  if (!btn) return;
  const a = estado.asignaciones.find(x => x.idasignacion === Number(btn.dataset.id));
  if (!a) return;

  if (btn.dataset.accion === "editar") abrirFormulario(a);
  if (btn.dataset.accion === "eliminar") {
    const h = hor(a.horario_idhorario);
    idEliminar = a.idasignacion;
    $("delTexto").textContent = `Se quitará a ${nombreEst(est(a.estudiante_idestudiante))} del horario ${h ? etiquetaHorario(h) : ""} (${ges(a.gestion_academica_idgestion_academica)?.nombre ?? "gestión"}). Esta acción no se puede deshacer.`;
    $("dlgEliminar").showModal();
  }
});

$("btnConfirmarEliminar").addEventListener("click", async () => {
  try {
    await api.eliminar(idEliminar);
    if (API_URL) estado.asignaciones = await api.asignaciones();
    $("dlgEliminar").close();
    pintar();
    aviso("Asignación eliminada");
  } catch (err) {
    $("dlgEliminar").close();
    aviso("No se pudo eliminar la asignación. Intenta de nuevo.");
  }
});

/* ---------- EVENTOS GENERALES ---------- */
$("btnNueva").addEventListener("click", () => abrirFormulario(null));
["fBuscar", "fGestion", "fParalelo"].forEach(id => $(id).addEventListener("input", () => { estado.pagina = 1; pintar(); }));
$("btnPrev").addEventListener("click", () => { estado.pagina--; pintar(); });
$("btnNext").addEventListener("click", () => { estado.pagina++; pintar(); });

document.querySelectorAll("[data-cerrar]").forEach(b => b.addEventListener("click", () => b.closest("dialog").close()));
document.querySelectorAll("dialog").forEach(d => d.addEventListener("mousedown", (e) => { if (e.target === d) d.close(); }));

/* ---------- INICIO ---------- */
(async function iniciar() {
  try {
    [estado.asignaciones, estado.estudiantes, estado.paralelos, estado.cursos, estado.niveles, estado.gestiones, estado.horarios, estado.materias, estado.aulas] =
      await Promise.all([api.asignaciones(), api.estudiantes(), api.paralelos(), api.cursos(), api.niveles(), api.gestiones(), api.horarios(), api.materias(), api.aulas()]);
  } catch (err) {
    $("resumen").textContent = "No se pudieron cargar las asignaciones.";
    return;
  }
  llenarCombos();
  pintar();
})();