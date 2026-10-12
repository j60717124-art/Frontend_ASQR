/* Barra superior a todo el ancho + pelotita + buscador */

const ICONS = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  academic: '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>',
  manage: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6M9 16h6"/>',
  building: '<path d="M3 21h18M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6M9 10h.01M15 10h.01"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  settings: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'
};

function svg(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}

const menuItems = [
  // CORRECCIÓN: Rutas absolutas desde la raíz del proyecto
  { title: "Inicio", icon: "home", link: "/modules/inicio/dashboard/inicio.html" },
  {
    title: "Académico",
    icon: "academic",
    submenu: [
      { title: "Estudiantes", link: "/modules/academico/estudiante/estudiante.html" },
      { title: "Docentes", link: "/modules/academico/docente/docente.html" },
      { title: "Materias", link: "/modules/academico/materia/materia.html" },
      { title: "Niveles", link: "/modules/academico/nivel/nivel.html" },
      { title: "Cursos", link: "/modules/academico/curso/curso.html" },
      { title: "Paralelos", link: "/modules/academico/paralelo/paralelo.html" },
      { title: "Horarios", link: "/modules/academico/horario/horario.html" },
      { title: "Asignaciones", link: "/modules/academico/asignacion/asignacion.html" }
    ]
  },
  {
    title: "Gestión",
    icon: "manage",
    // NOTA: Ajusta estas rutas si los archivos no están dentro de una carpeta "gestion"
    submenu: [
      { title: "Gestión académica", link: "/modules/gestion/gestion-academica.html" },
      { title: "Asistencia docente", link: "/modules/gestion/asistencia-docente.html" },
      { title: "QR Estudiante", link: "/modules/gestion/qr-estudiante.html" },
      { title: "QR Institucional", link: "/modules/gestion/qr-institucional.html" }
    ]
  },
  {
    title: "Institución",
    icon: "building",
    // NOTA: Ajusta estas rutas si los archivos no están dentro de una carpeta "institucion"
    submenu: [
      { title: "Colegio", link: "/modules/institucion/colegio/colegio.html" },
      { title: "Aulas", link: "/modules/institucion/aulas/aulas.html" }
    ]
  },
  {
    title: "Seguridad",
    icon: "shield",
    submenu: [
      { title: "Cuentas", link: "/modules/seguridad/cuentas/cuenta.html" },
      { title: "Roles", link: "/modules/seguridad/roles/rol.html" }
    ]
  },
  {
    title: "Configuración",
    icon: "settings",
    submenu: [
      { title: "Geocerca", link: "/modules/configuracion/geocerca/geocerca.html" }
    ]
  }
];

function crearMenu() {
  const header = document.createElement("header");
  header.className = "topnav";
  header.id = "topnav";

  header.innerHTML = `
    <nav class="topnav__bar" id="navBar" aria-label="Menú principal">
      <span class="topnav__ball no-anim" id="navBall" aria-hidden="true">
        <span class="topnav__ball-core" id="ballCore"></span>
      </span>

      <a class="topnav__brand" href="/modules/inicio/dashboard/inicio.html" aria-label="Sistema Académico">
        <span class="topnav__logo">A</span>
        <span class="topnav__brand-text">
          <strong>Sistema</strong>
          <span>Académico</span>
        </span>
      </a>

      <ul class="topnav__items" id="navItems"></ul>

      <div class="topnav__right">
        <div class="topnav__search" id="navSearch">
          <button class="topnav__tool topnav__search-toggle" id="searchToggle" type="button" aria-label="Buscar" title="Buscar">${svg("search")}</button>

          <label class="topnav__search-box">
            ${svg("search")}
            <input class="topnav__search-input" id="searchInput" type="search"
                   placeholder="Buscar páginas…" autocomplete="off" spellcheck="false"
                   aria-label="Buscar páginas">
            <kbd>/</kbd>
          </label>

          <div class="topnav__results" id="searchResults" role="listbox"></div>
        </div>

        <span class="topnav__divider"></span>

        <div class="topnav__tools">
          <button class="topnav__tool" id="themeButton" type="button" aria-label="Cambiar tema" title="Cambiar tema"></button>
          <button class="topnav__tool topnav__tool--danger" id="logoutButton" type="button" aria-label="Cerrar sesión" title="Cerrar sesión">${svg("logout")}</button>
        </div>
      </div>

      <div class="topnav__dropdown" id="navDropdown" role="menu"></div>
    </nav>
  `;

  document.body.prepend(header);

  const nav = configurarNavegacion();
  configurarBuscador(nav.cerrar);
  configurarTema();
  configurarCerrarSesion();
}

/*  Navegación + pelotita + submenús  */
function configurarNavegacion() {
  const bar = document.getElementById("navBar");
  const list = document.getElementById("navItems");
  const ball = document.getElementById("navBall");
  const ballCore = document.getElementById("ballCore");
  const dropdown = document.getElementById("navDropdown");

  const paginaActual = window.location.pathname.split("/").pop() || "inicio.html";

  const items = [];
  let restIndex = 0;
  let currentIndex = 0;
  let openIndex = null;
  let pinned = false;
  let closeTimer = null;

  menuItems.forEach((data, i) => {
    const li = document.createElement("li");
    li.className = "topnav__item";

    const el = document.createElement(data.submenu ? "button" : "a");
    el.className = "topnav__link";
    el.setAttribute("aria-label", data.title);

    if (data.submenu) {
      el.type = "button";
      el.setAttribute("aria-haspopup", "true");
      el.setAttribute("aria-expanded", "false");
      if (data.submenu.some(s => s.link.endsWith(paginaActual))) {
        restIndex = i;
        li.classList.add("is-page");
      }
    } else {
      el.href = data.link;
      if (data.link.endsWith(paginaActual)) {
        restIndex = i;
        li.classList.add("is-page");
      }
    }

    el.innerHTML = `
      <span class="topnav__icon">${svg(data.icon)}</span>
      <span class="topnav__label">${data.title}</span>
    `;

    li.appendChild(el);
    list.appendChild(li);
    items.push({ data, li, el });

    const icon = document.createElement("span");
    icon.className = "ball-icon";
    icon.innerHTML = svg(data.icon);
    ballCore.appendChild(icon);
  });

  const ballIcons = ballCore.querySelectorAll(".ball-icon");

  /*  Pelotita  */
  function moverPelota(i) {
    const barRect = bar.getBoundingClientRect();
    const r = items[i].li.getBoundingClientRect();
    ball.style.transform = `translateX(${r.left + r.width / 2 - barRect.left}px)`;
  }

  function setCurrent(i) {
    currentIndex = i;
    items.forEach((it, k) => it.li.classList.toggle("is-current", k === i));
    ballIcons.forEach((ic, k) => ic.classList.toggle("is-on", k === i));
    moverPelota(i);
  }

  /*  Submenú  */
  function posicionarDropdown() {
    if (openIndex === null) return;
    const r = items[openIndex].li.getBoundingClientRect();
    const b = bar.getBoundingClientRect();
    const w = dropdown.offsetWidth;
    let left = r.left + r.width / 2 - w / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
    dropdown.style.left = `${left - b.left}px`;
  }

  function abrir(i, fijo) {
    const data = items[i].data;
    if (!data.submenu) return;

    document.dispatchEvent(new CustomEvent("nav:open"));
    openIndex = i;
    pinned = !!fijo;

    dropdown.classList.toggle("is-wide", data.submenu.length > 5);
    dropdown.innerHTML = `
      <div class="topnav__dropdown-title">${data.title}</div>
      <div class="topnav__dropdown-list">
        ${data.submenu.map(s => `
          <a class="submenu-item${s.link.endsWith(paginaActual) ? " active" : ""}" href="${s.link}" role="menuitem">${s.title}</a>
        `).join("")}
      </div>
    `;
    dropdown.classList.add("is-open");
    posicionarDropdown();

    items.forEach((it, k) => {
      if (it.data.submenu) it.el.setAttribute("aria-expanded", String(k === i));
    });
  }

  function cerrar() {
    openIndex = null;
    pinned = false;
    dropdown.classList.remove("is-open");
    items.forEach(it => {
      if (it.data.submenu) it.el.setAttribute("aria-expanded", "false");
    });
    setCurrent(restIndex);
  }

  /*  Eventos  */
  items.forEach((it, i) => {
    it.li.addEventListener("pointerenter", (e) => {
      if (e.pointerType !== "mouse") return;
      clearTimeout(closeTimer);
      pinned = false;
      setCurrent(i);
      if (it.data.submenu) {
        abrir(i, false);
      } else {
        openIndex = null;
        dropdown.classList.remove("is-open");
      }
    });

    it.el.addEventListener("focus", () => {
      if (!pinned) setCurrent(i);
    });

    if (it.data.submenu) {
      it.el.addEventListener("click", () => {
        setCurrent(i);
        if (openIndex === i && pinned) cerrar();
        else abrir(i, true);
      });
    } else {
      it.el.addEventListener("click", () => setCurrent(i));
    }
  });

  bar.addEventListener("pointerenter", () => clearTimeout(closeTimer));

  bar.addEventListener("pointerleave", (e) => {
    if (e.pointerType !== "mouse" || pinned) return;
    clearTimeout(closeTimer);
    closeTimer = setTimeout(cerrar, 180);
  });

  document.addEventListener("pointerdown", (e) => {
    if (!bar.contains(e.target) && (openIndex !== null || currentIndex !== restIndex)) cerrar();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") cerrar();
  });

  window.addEventListener("resize", () => {
    moverPelota(currentIndex);
    posicionarDropdown();
  });

  // Posición inicial sin animación
  setCurrent(restIndex);
  requestAnimationFrame(() => {
    moverPelota(currentIndex);
    requestAnimationFrame(() => ball.classList.remove("no-anim"));
  });
  window.addEventListener("load", () => moverPelota(currentIndex));

  return { cerrar };
}

/*  Buscador  */
function configurarBuscador(cerrarNav) {
  const bar = document.getElementById("navBar");
  const wrapper = document.getElementById("navSearch");
  const input = document.getElementById("searchInput");
  const results = document.getElementById("searchResults");
  const toggle = document.getElementById("searchToggle");

  const normalizar = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const escapar = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Índice de todas las páginas del menú
  const indice = [];
  menuItems.forEach((m) => {
    if (m.submenu) {
      m.submenu.forEach((s) => indice.push({ title: s.title, group: m.title, link: s.link, icon: m.icon }));
    } else {
      indice.push({ title: m.title, group: "General", link: m.link, icon: m.icon });
    }
  });

  let lista = [];
  let activo = -1;

  function render() {
    const q = normalizar(input.value.trim());
    lista = q ? indice.filter((x) => normalizar(`${x.title} ${x.group}`).includes(q)) : indice.slice();
    activo = q && lista.length ? 0 : -1;

    if (!lista.length) {
      results.innerHTML = `<div class="search-empty">No encontramos «${escapar(input.value.trim())}»</div>`;
      return;
    }

    results.innerHTML = lista.map((x, i) => `
      <a class="search-result${i === activo ? " is-active" : ""}" href="${x.link}" role="option">
        <span class="search-result__icon">${svg(x.icon)}</span>
        <span class="search-result__text">
          <strong>${escapar(x.title)}</strong>
          <small>${escapar(x.group)}</small>
        </span>
      </a>
    `).join("");
  }

  function marcarActivo() {
    const nodos = results.querySelectorAll(".search-result");
    nodos.forEach((n, i) => n.classList.toggle("is-active", i === activo));
    if (nodos[activo]) nodos[activo].scrollIntoView({ block: "nearest" });
  }

  function abrirResultados() {
    render();
    results.classList.add("is-open");
  }

  function cerrarBuscador() {
    results.classList.remove("is-open");
    bar.classList.remove("is-search-open");
  }

  function enfocar() {
    // En móvil, primero se muestra el panel del buscador
    if (toggle.offsetParent !== null) bar.classList.add("is-search-open");
    input.focus();
  }

  input.addEventListener("focus", () => {
    cerrarNav();
    abrirResultados();
  });

  input.addEventListener("input", render);

  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (lista.length) { activo = (activo + 1) % lista.length; marcarActivo(); }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (lista.length) { activo = (activo - 1 + lista.length) % lista.length; marcarActivo(); }
    } else if (e.key === "Enter") {
      e.preventDefault();
      const destino = lista[activo >= 0 ? activo : 0];
      if (destino && input.value.trim()) window.location.href = destino.link;
    } else if (e.key === "Escape") {
      input.value = "";
      input.blur();
      cerrarBuscador();
    }
  });

  toggle.addEventListener("click", () => {
    if (bar.classList.contains("is-search-open")) cerrarBuscador();
    else enfocar();
  });

  // Atajos: "/" o Ctrl/Cmd + K
  document.addEventListener("keydown", (e) => {
    const escribiendo = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
    if ((e.key === "/" && !escribiendo) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k")) {
      e.preventDefault();
      enfocar();
    }
  });

  document.addEventListener("pointerdown", (e) => {
    if (!wrapper.contains(e.target)) cerrarBuscador();
  });

  // Si se abre un submenú, se cierra el buscador
  document.addEventListener("nav:open", cerrarBuscador);
}

/*  Tema claro / oscuro  */
function configurarTema() {
  const themeButton = document.getElementById("themeButton");
  const root = document.documentElement;

  let temaGuardado = null;
  try { temaGuardado = localStorage.getItem("theme"); } catch (e) {}

  const prefiereOscuro = window.matchMedia("(prefers-color-scheme: dark)").matches;
  aplicarTema(temaGuardado || (prefiereOscuro ? "dark" : "light"));

  themeButton.addEventListener("click", () => {
    const nuevo = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    aplicarTema(nuevo);
    try { localStorage.setItem("theme", nuevo); } catch (e) {}
  });

  function aplicarTema(tema) {
    root.setAttribute("data-theme", tema);
    themeButton.innerHTML = svg(tema === "dark" ? "sun" : "moon");
    const texto = tema === "dark" ? "Modo claro" : "Modo oscuro";
    themeButton.title = texto;
    themeButton.setAttribute("aria-label", texto);
  }
}

/*  Cerrar sesión  */
function configurarCerrarSesion() {
  document.getElementById("logoutButton").addEventListener("click", () => {
     // CORRECCIÓN: Ruta absoluta a la raíz para el archivo de bienvenida/login
     window.location.href = "/bienvenida.html";
  });
}

document.addEventListener("DOMContentLoaded", crearMenu);