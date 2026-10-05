const LOGIN_URL = "../modules/login/login.html";

// QR decorativo del logo: cuadrícula 15x15 con 3 cuadros de posición
(function dibujarQR() {
  const grupo = document.getElementById("qr-modules");
  const NS = "http://www.w3.org/2000/svg";

  const N = 15;
  const celda = 12;
  const x0 = 70;
  const y0 = 110;

  // Cuadros de posición (5x5) en tres esquinas
  const origenes = [[0, 0], [N - 5, 0], [0, N - 5]];

  const enFinder = (r, c, margen = 0) =>
    origenes.some(([oc, or]) =>
      c >= oc - margen && c < oc + 5 + margen &&
      r >= or - margen && r < or + 5 + margen);

  const esFinderOn = (r, c) => {
    for (const [oc, or] of origenes) {
      if (c >= oc && c < oc + 5 && r >= or && r < or + 5) {
        const dr = r - or, dc = c - oc;
        const borde = dr === 0 || dr === 4 || dc === 0 || dc === 4;
        const centro = dr === 2 && dc === 2;
        return { on: borde || centro, centro };
      }
    }
    return null;
  };

  // Datos pseudoaleatorios pero fijos (misma imagen en cada carga)
  let semilla = 7;
  const azar = () => (semilla = (semilla * 48271) % 2147483647) / 2147483647;

  let n = 0;
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      let encendido, esCentro = false;

      const f = esFinderOn(r, c);
      if (f) {
        encendido = f.on;
        esCentro = f.centro;
      } else if (enFinder(r, c, 1)) {
        encendido = false;               // separador alrededor de los cuadros
      } else {
        encendido = azar() > 0.48;
      }
      if (!encendido) continue;

      const rect = document.createElementNS(NS, "rect");
      rect.setAttribute("x", x0 + c * celda + 0.7);
      rect.setAttribute("y", y0 + r * celda + 0.7);
      rect.setAttribute("width", celda - 1.4);
      rect.setAttribute("height", celda - 1.4);
      rect.setAttribute("rx", 2.2);
      if (esCentro) rect.setAttribute("class", "centro");
      // Aparición escalonada
      rect.style.animationDelay = (0.15 + n * 0.012).toFixed(3) + "s";
      grupo.appendChild(rect);
      n++;
    }
  }
})();

// Botón Continuar
const boton = document.getElementById("btn-continuar");
const sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

boton.addEventListener("click", () => {
  boton.disabled = true;
  document.body.classList.add("saliendo");
  setTimeout(() => { window.location.href = LOGIN_URL; }, sinMovimiento ? 0 : 450);
});