/* CONFIGURACIÓN · GEOCERCA (Conectado al Backend) */

// Valores iniciales mientras no exista una configuración guardada (el backend los crea si no existen)
const DEFAULTS = {
  latitud_referencia: -17.3935,
  longitud_referencia: -66.157,
  radio_metros: 120,
  intervalo_rotacion_segundos: 30
};

const RADIOS = [50, 100, 120, 200, 300, 500];
const INTERVALOS = [15, 30, 60, 120, 300];

const normalizarRegistro = (r) => ({
  idconfiguracion_geocerca: r.idconfiguracion_geocerca ?? 1,
  latitud_referencia: Number(r.latitud_referencia),
  longitud_referencia: Number(r.longitud_referencia),
  radio_metros: Number(r.radio_metros),
  intervalo_rotacion_segundos: Number(r.intervalo_rotacion_segundos),
  actualizado_en: r.actualizado_en ?? null
});

/* UTILIDADES */
const $ = (id) => document.getElementById(id);
const estado = { guardado: null, errorCarga: false };
const fmtFechaHora = formatearFechaHora;

function fmtDuracion(s) {
  if (!Number.isFinite(s)) return "—";
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60), r = s % 60;
  return r ? `${m} min ${r} s` : `${m} min`;
}
const fmtMetros = (m) => (m >= 1000 ? `${(m / 1000).toLocaleString("es-ES", { maximumFractionDigits: 2 })} km` : `${m} m`);
function parseCoord(txt) {
  const v = String(txt).trim().replace(",", ".");
  return /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : NaN;
}
const parseEntero = (txt) => (/^\d+$/.test(String(txt).trim()) ? Number(txt) : NaN);
const leer = () => ({
  lat: parseCoord($("latitud_referencia").value),
  lon: parseCoord($("longitud_referencia").value),
  radio: parseEntero($("radio_metros").value),
  intervalo: parseEntero($("intervalo_rotacion_segundos").value)
});

const latValida = (v) => Number.isFinite(v) && v >= -90 && v <= 90;
const lonValida = (v) => Number.isFinite(v) && v >= -180 && v <= 180;
const radioValido = (v) => Number.isInteger(v) && v >= 5 && v <= 2000;
const intervaloValido = (v) => Number.isInteger(v) && v >= 10 && v <= 3600;

/* MAPA (Leaflet) */
let mapa = null, marcador = null, circulo = null;

function colorAcento() {
  return getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#2563eb";
}

function iniciarMapa(lat, lon, radio) {
  if (typeof L === "undefined") { $("mapFallback").hidden = false; return; }

  mapa = L.map("map", { zoomControl: true, attributionControl: true }).setView([lat, lon], 17);
  const teselas = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(mapa);
  let avisado = false;
  teselas.on("tileerror", () => {
    if (!avisado) { avisado = true; mostrarAviso("Algunas partes del mapa no se pudieron cargar. Revisa tu conexión."); }
  });

  const icono = L.divIcon({
    className: "",
    html: '<div class="pin"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V9l7-5 7 5v12M10 21v-6h4v6"/></svg></div>',
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });
  marcador = L.marker([lat, lon], { icon: icono, draggable: true, keyboard: false }).addTo(mapa);
  circulo = L.circle([lat, lon], { radius: radio, weight: 2, fillOpacity: 0.14, color: colorAcento(), fillColor: colorAcento() }).addTo(mapa);

  mapa.on("click", (e) => fijarCoordenadas(e.latlng.lat, e.latlng.lng));
  marcador.on("drag", (e) => {
    const p = e.latlng;
    circulo.setLatLng(p);
    $("latitud_referencia").value = p.lat.toFixed(7);
    $("longitud_referencia").value = p.lng.toFixed(7);
  });
  marcador.on("dragend", () => {
    const p = marcador.getLatLng();
    fijarCoordenadas(p.lat, p.lng);
  });

  encuadrar(false);
  setTimeout(() => mapa.invalidateSize(), 150);

  // Recolorear el círculo cuando cambia el tema
  const recolorear = () => circulo.setStyle({ color: colorAcento(), fillColor: colorAcento() });
  new MutationObserver(recolorear).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", recolorear);
}

function encuadrar(animar = true) {
  if (!mapa || !circulo) return;
  mapa.fitBounds(circulo.getBounds(), { padding: [50, 50], maxZoom: 18, animate: animar });
}

function actualizarMapaDesdeCampos() {
  if (!mapa) return;
  const { lat, lon, radio } = leer();
  if (latValida(lat) && lonValida(lon)) {
    marcador.setLatLng([lat, lon]);
    circulo.setLatLng([lat, lon]);
  }
  if (radioValido(radio)) circulo.setRadius(radio);
}

/* CAMPOS */
function limpiarError(campo) {
  const e = document.querySelector(`[data-err="${campo}"]`);
  if (e) e.textContent = "";
  $(campo)?.classList.remove("is-invalid");
}

function marcarError(campo, msg) {
  document.querySelector(`[data-err="${campo}"]`).textContent = msg;
  $(campo).classList.add("is-invalid");
}

function fijarCoordenadas(lat, lon, { mover = false } = {}) {
  lat = Number(lat.toFixed(7));
  lon = Number(lon.toFixed(7));
  $("latitud_referencia").value = lat.toFixed(7);
  $("longitud_referencia").value = lon.toFixed(7);
  limpiarError("latitud_referencia");
  limpiarError("longitud_referencia");
  if (mapa) {
    marcador.setLatLng([lat, lon]);
    circulo.setLatLng([lat, lon]);
    if (mover) encuadrar(true);
  }
  refrescar();
}

function pintarRango(rango, valor) {
  const min = Number(rango.min), max = Number(rango.max);
  const v = Math.min(max, Math.max(min, Number.isFinite(valor) ? valor : min));
  rango.value = v;
  rango.style.setProperty("--pct", `${((v - min) / (max - min)) * 100}%`);
}

function marcarChips(contenedor, valor) {
  contenedor.querySelectorAll(".chip").forEach(c => c.setAttribute("aria-pressed", String(Number(c.dataset.v) === valor)));
}

function crearChips(contenedor, valores, etiqueta, alElegir) {
  contenedor.innerHTML = valores.map(v => `<button type="button" class="chip" data-v="${v}" aria-pressed="false">${etiqueta(v)}</button>`).join("");
  contenedor.addEventListener("click", (e) => {
    const b = e.target.closest(".chip");
    if (b) alElegir(Number(b.dataset.v));
  });
}

function fijarRadio(v, { encuadrarMapa = false } = {}) {
  $("radio_metros").value = v;
  limpiarError("radio_metros");
  pintarRango($("radioRange"), v);
  marcarChips($("chipsRadio"), v);
  if (mapa && radioValido(v)) circulo.setRadius(v);
  if (encuadrarMapa) encuadrar(true);
  refrescar();
}

function fijarIntervalo(v) {
  $("intervalo_rotacion_segundos").value = v;
  limpiarError("intervalo_rotacion_segundos");
  pintarRango($("intervaloRange"), v);
  marcarChips($("chipsIntervalo"), v);
  refrescar();
}

/* RESUMEN, ESTADO Y CAMBIOS */
function hayCambios() {
  const g = estado.guardado;
  if (!g) return true;
  const { lat, lon, radio, intervalo } = leer();
  const cerca = (a, b) => Number.isFinite(a) && Math.abs(a - b) < 5e-8;
  return !(cerca(lat, g.latitud_referencia) && cerca(lon, g.longitud_referencia) &&
           radio === g.radio_metros && intervalo === g.intervalo_rotacion_segundos);
}

function refrescar() {
  const { lat, lon, radio, intervalo } = leer();
  const okCoord = latValida(lat) && lonValida(lon);

  $("resumen").innerHTML =
    `Los registros serán válidos a <strong>${radioValido(radio) ? fmtMetros(radio) : "—"}</strong> o menos de ` +
    `<strong>${okCoord ? `${lat.toFixed(5)}, ${lon.toFixed(5)}` : "un punto sin definir"}</strong>. ` +
    `El código QR institucional cambiará cada <strong>${intervaloValido(intervalo) ? fmtDuracion(intervalo) : "—"}</strong>.`;

  const cambios = hayCambios();
  const pill = $("pill");
  pill.className = "pill";
  if (!estado.guardado) $("pillText").textContent = "Sin configurar";
  else if (cambios) { pill.classList.add("pill--dirty"); $("pillText").textContent = "Cambios sin guardar"; }
  else { pill.classList.add("pill--ok"); $("pillText").textContent = "Configuración guardada"; }

  $("btnGuardar").disabled = estado.errorCarga || (!!estado.guardado && !cambios);
  $("btnRestablecer").disabled = !cambios;
  $("actualizado").textContent = estado.guardado?.actualizado_en
    ? `Última actualización: ${fmtFechaHora(estado.guardado.actualizado_en)}`
    : "Aún no se ha guardado ninguna configuración";
}

function aplicarValores(v) {
  $("latitud_referencia").value = Number(v.latitud_referencia).toFixed(7);
  $("longitud_referencia").value = Number(v.longitud_referencia).toFixed(7);
  ["latitud_referencia", "longitud_referencia", "radio_metros", "intervalo_rotacion_segundos"].forEach(limpiarError);
  fijarRadio(v.radio_metros);
  fijarIntervalo(v.intervalo_rotacion_segundos);
  actualizarMapaDesdeCampos();
  encuadrar(false);
  refrescar();
}

/* VALIDACIÓN Y GUARDADO (CONECTADO AL BACKEND) */
function validar() {
  ["latitud_referencia", "longitud_referencia", "radio_metros", "intervalo_rotacion_segundos"].forEach(limpiarError);
  const { lat, lon, radio, intervalo } = leer();
  let ok = true;
  if (!latValida(lat)) { marcarError("latitud_referencia", "Escribe una latitud entre -90 y 90."); ok = false; }
  if (!lonValida(lon)) { marcarError("longitud_referencia", "Escribe una longitud entre -180 y 180."); ok = false; }
  if (!radioValido(radio)) { marcarError("radio_metros", "El radio debe ser un número entero entre 5 y 2000 metros."); ok = false; }
  if (!intervaloValido(intervalo)) { marcarError("intervalo_rotacion_segundos", "El intervalo debe ser un entero entre 10 y 3600 segundos."); ok = false; }
  return ok;
}

$("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validar()) { document.querySelector(".is-invalid")?.focus(); return; }

  const { lat, lon, radio, intervalo } = leer();
  const cfg = {
    latitud_referencia: Number(lat.toFixed(7)),
    longitud_referencia: Number(lon.toFixed(7)),
    radio_metros: radio,
    intervalo_rotacion_segundos: intervalo
  };

  setCargando($("btnGuardar"), true, "Guardando…");
  try {
    const respuesta = await apiPut('/configuracion-geocerca', cfg);
    estado.guardado = normalizarRegistro(respuesta);
    aplicarValores(estado.guardado);
    mostrarExito("Configuración guardada correctamente");
  } catch (err) {
    mostrarError(err, "No se pudo guardar la configuración.");
  } finally {
    setCargando($("btnGuardar"), false);
    refrescar();
  }
});

$("btnRestablecer").addEventListener("click", () => {
  aplicarValores(estado.guardado ?? DEFAULTS);
  mostrarInfo(estado.guardado ? "Se restauraron los valores guardados" : "Se restauraron los valores iniciales");
});

/* EVENTOS */
["latitud_referencia", "longitud_referencia"].forEach(id => {
  $(id).addEventListener("input", () => { limpiarError(id); actualizarMapaDesdeCampos(); refrescar(); });
  $(id).addEventListener("change", () => {
    const { lat, lon } = leer();
    if (latValida(lat) && lonValida(lon)) fijarCoordenadas(lat, lon, { mover: true });
  });
});

$("radio_metros").addEventListener("input", () => {
  const v = parseEntero($("radio_metros").value);
  limpiarError("radio_metros");
  pintarRango($("radioRange"), v);
  marcarChips($("chipsRadio"), v);
  if (mapa && radioValido(v)) circulo.setRadius(v);
  refrescar();
});
$("radio_metros").addEventListener("change", () => { if (radioValido(parseEntero($("radio_metros").value))) encuadrar(true); });

$("radioRange").addEventListener("input", (e) => fijarRadio(Number(e.target.value)));
$("radioRange").addEventListener("change", () => encuadrar(true));

$("intervalo_rotacion_segundos").addEventListener("input", () => {
  const v = parseEntero($("intervalo_rotacion_segundos").value);
  limpiarError("intervalo_rotacion_segundos");
  pintarRango($("intervaloRange"), v);
  marcarChips($("chipsIntervalo"), v);
  refrescar();
});
$("intervaloRange").addEventListener("input", (e) => fijarIntervalo(Number(e.target.value)));

crearChips($("chipsRadio"), RADIOS, (v) => `${v} m`, (v) => fijarRadio(v, { encuadrarMapa: true }));
crearChips($("chipsIntervalo"), INTERVALOS, fmtDuracion, fijarIntervalo);

$("btnUbicacion").addEventListener("click", () => {
  if (!navigator.geolocation) { mostrarError("Tu navegador no permite obtener la ubicación."); return; }
  const btn = $("btnUbicacion");
  const textoOriginal = btn.innerHTML;
  btn.disabled = true;
  btn.textContent = "Buscando ubicación…";
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      fijarCoordenadas(pos.coords.latitude, pos.coords.longitude, { mover: true });
      btn.disabled = false; btn.innerHTML = textoOriginal;
      mostrarExito("Ubicación actual aplicada");
    },
    (err) => {
      btn.disabled = false; btn.innerHTML = textoOriginal;
      mostrarError(err.code === 1 ? "Permite el acceso a tu ubicación en el navegador para usar esta opción." : err.code === 3 ? "Se agotó el tiempo para obtener tu ubicación. Intenta de nuevo." : "No se pudo obtener tu ubicación.");
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
});

/* INICIO Y CARGA DE DATOS DESDE EL BACKEND */
async function cargarConfiguracion() {
  try {
    const datos = await apiGet('/configuracion-geocerca');
    if (datos) {
      estado.guardado = normalizarRegistro(datos);
    } else {
      estado.guardado = null;
    }
  } catch (err) {
    estado.errorCarga = true;
    mostrarError(err, "No se pudo cargar la configuración guardada. Recarga la página antes de guardar cambios.");
  }

  const inicial = estado.guardado ?? DEFAULTS;
  iniciarMapa(inicial.latitud_referencia, inicial.longitud_referencia, inicial.radio_metros);
  aplicarValores(inicial);
}

(async function iniciar() {
  await conLoader(cargarConfiguracion, "Cargando configuración…");
  refrescar();
})();

//  PERMISOS
aplicarSoloLectura(esAdmin(), []);
if (!esAdmin()) { $("btnGuardar").hidden = true; $("btnRestablecer").hidden = true; }