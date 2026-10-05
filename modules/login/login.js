document.addEventListener("DOMContentLoaded", () => {
    //  SECUENCIA DE ANIMACIÓN DE ENTRADA
    const fondo = document.querySelector(".background");
    const lampWrapper = document.getElementById("lampWrapper");
    const bulb = document.getElementById("lampBulb");
    const beam = document.getElementById("lightBeam");
    const prefiereMenosMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let secuenciaIniciada = false;

    function iniciarSecuencia() {
        if (secuenciaIniciada) return;
        secuenciaIniciada = true;

        if (prefiereMenosMovimiento) {
            encenderDeFormaEstable();
            return;
        }

        secuenciaCortoCircuito();
    }

    function chispazo(duracionEncendido, duracionApagado) {
        return new Promise((resolve) => {
            bulb.classList.add("spark");
            beam.classList.add("spark");
            setTimeout(() => {
                bulb.classList.remove("spark");
                beam.classList.remove("spark");
                setTimeout(resolve, duracionApagado);
            }, duracionEncendido);
        });
    }

    async function secuenciaCortoCircuito() {
        const patron = [
            [50, 90], [30, 40], [70, 25], [25, 140],
            [90, 30], [20, 200], [55, 45], [35, 300],
        ];

        for (const [encendido, apagado] of patron) {
            await chispazo(encendido, apagado);
        }

        encenderDeFormaEstable();
    }

    function encenderDeFormaEstable() {
        bulb.classList.add("on");
        beam.classList.add("on");
        fondo.classList.add("lit");

        const retraso = prefiereMenosMovimiento ? 150 : 450;
        setTimeout(revelarEscena, retraso);
    }

    function revelarEscena() {
        document.querySelector(".book-illustration").classList.add("visible");
        document.querySelector(".floor-light").classList.add("visible");
        document.querySelector(".illustration-text").classList.add("visible");
        document.getElementById("loginContainer").classList.add("visible");
        document.getElementById("loginBox").classList.add("visible");
    }

    if (prefiereMenosMovimiento) {
        iniciarSecuencia();
    } else {
        lampWrapper.addEventListener("animationend", (evento) => {
            if (evento.animationName === "lamp-drop-swing") iniciarSecuencia();
        });
        setTimeout(iniciarSecuencia, 2700);
    }

    //  LÓGICA DE FORMULARIOS
    const loginForm = document.getElementById("loginForm");
    const usuario = document.getElementById("usuario");
    const password = document.getElementById("password");
    const showPassword = document.getElementById("showPassword");
    const loginButton = document.getElementById("loginButton");
    const message = document.getElementById("message");

    // Elementos de Recuperación
    const recoverForm = document.getElementById("recoverForm");
    const recoverEmail = document.getElementById("recoverEmail");
    const recoverButton = document.getElementById("recoverButton");
    const recoverMessage = document.getElementById("recoverMessage");
    const loginBox = document.getElementById("loginBox");
    const recoverBox = document.getElementById("recoverBox");

    // Enlaces de navegación
    const forgotPasswordLink = document.getElementById("forgotPasswordLink");
    const backToLoginLink = document.getElementById("backToLoginLink");

    // Mostrar/Ocultar contraseña
    showPassword.addEventListener("click", () => {
        const visible = password.type === "password";
        password.type = visible ? "text" : "password";
        showPassword.setAttribute("aria-label", visible ? "Ocultar contraseña" : "Mostrar contraseña");
    });

    // Alternar entre Login y Recuperación
    forgotPasswordLink.addEventListener("click", (e) => {
        e.preventDefault();
        loginBox.classList.remove("visible");
        loginBox.classList.add("hidden-box");
        recoverBox.classList.remove("hidden-box");
        setTimeout(() => {
            recoverBox.classList.add("visible");
        }, 50);
        recoverMessage.textContent = "";
    });

    backToLoginLink.addEventListener("click", (e) => {
        e.preventDefault();
        recoverBox.classList.remove("visible");
        recoverBox.classList.add("hidden-box");
        loginBox.classList.remove("hidden-box");
        setTimeout(() => {
            loginBox.classList.add("visible");
        }, 50);
        message.textContent = "";
    });

    //  ENVÍO DEL FORMULARIO DE LOGIN (SIN VALIDACIONES, REDIRIGE DIRECTO)
    loginForm.addEventListener("submit", (event) => {
        event.preventDefault();

        // Feedback visual breve (opcional)
        loginButton.disabled = true;
        const textoBoton = loginButton.querySelector("span:first-child");
        if (textoBoton) textoBoton.textContent = "ENTRANDO...";

        // Redirige directo al inicio
        window.location.href = "../inicio/inicio.html";
    });

    //  ENVÍO DEL FORMULARIO DE RECUPERACIÓN (SIN VALIDACIONES)
    recoverForm.addEventListener("submit", (event) => {
        event.preventDefault();

        recoverButton.disabled = true;
        const textoBoton = recoverButton.querySelector("span:first-child");
        if (textoBoton) textoBoton.textContent = "ENVIANDO...";

        setTimeout(() => {
            showMessage("Enlace enviado. Revisa tu correo.", "success", recoverMessage);
            recoverEmail.value = "";
            recoverButton.disabled = false;
            if (textoBoton) textoBoton.textContent = "ENVIAR ENLACE";
        }, 1200);
    });

    //  MODO CLARO / OSCURO
    const themeToggle = document.getElementById("themeToggle");
    const raiz = document.documentElement;

    function temaActual() {
        return raiz.getAttribute("data-theme") ||
            (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    }

    function actualizarBotonTema() {
        const oscuro = temaActual() === "dark";
        const texto = oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
        themeToggle.setAttribute("aria-label", texto);
        themeToggle.title = texto;
    }

    themeToggle.addEventListener("click", () => {
        const nuevo = temaActual() === "dark" ? "light" : "dark";
        raiz.setAttribute("data-theme", nuevo);
        try { localStorage.setItem("theme", nuevo); } catch (e) {}
        actualizarBotonTema();
    });

    actualizarBotonTema();

    // Función auxiliar para mostrar mensajes (los colores están en login.css)
    function showMessage(text, type, element) {
        element.textContent = text;
        element.className = "message " + (type || "");
    }
});