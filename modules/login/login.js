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

    //  ELEMENTOS DEL FORMULARIO DE LOGIN
    const loginForm = document.getElementById("loginForm");
    const usuario = document.getElementById("usuario");
    const password = document.getElementById("password");
    const showPassword = document.getElementById("showPassword");
    const loginButton = document.getElementById("loginButton");
    const message = document.getElementById("message");

    //  ELEMENTOS DE RECUPERACIÓN (paso 1: correo — paso 2: código + nueva clave)
    const recoverForm = document.getElementById("recoverForm");
    const recoverEmail = document.getElementById("recoverEmail");
    const recoverButton = document.getElementById("recoverButton");
    const recoverMessage = document.getElementById("recoverMessage");

    const recoverStepForm = document.getElementById("recoverStepForm");
    const recoverPin = document.getElementById("recoverPin");
    const recoverNewPassword = document.getElementById("recoverNewPassword");
    const recoverConfirmPassword = document.getElementById("recoverConfirmPassword");
    const recoverConfirmButton = document.getElementById("recoverConfirmButton");
    const recoverStepMessage = document.getElementById("recoverStepMessage");
    const showRecoverPassword = document.getElementById("showRecoverPassword");

    const loginBox = document.getElementById("loginBox");
    const recoverBox = document.getElementById("recoverBox");

    // Enlaces de navegación
    const forgotPasswordLink = document.getElementById("forgotPasswordLink");
    const backToLoginLink = document.getElementById("backToLoginLink");

    // Mostrar/Ocultar contraseña (login)
    showPassword.addEventListener("click", () => {
        const visible = password.type === "password";
        password.type = visible ? "text" : "password";
        showPassword.setAttribute("aria-label", visible ? "Ocultar contraseña" : "Mostrar contraseña");
    });

    // Mostrar/Ocultar contraseña (recuperación, paso 2)
    showRecoverPassword.addEventListener("click", () => {
        const visible = recoverNewPassword.type === "password";
        recoverNewPassword.type = visible ? "text" : "password";
        showRecoverPassword.setAttribute("aria-label", visible ? "Ocultar contraseña" : "Mostrar contraseña");
    });

    // Reinicia el formulario de recuperación a su estado inicial (paso 1 visible)
    function reiniciarRecuperacion() {
        recoverForm.classList.remove("paso-oculto");
        recoverStepForm.classList.add("paso-oculto");
        recoverForm.reset();
        recoverStepForm.reset();
        recoverMessage.textContent = "";
        recoverMessage.className = "message";
        recoverStepMessage.textContent = "";
        recoverStepMessage.className = "message";
        recoverButton.disabled = false;
        recoverConfirmButton.disabled = false;
    }

    // Alternar entre Login y Recuperación
    forgotPasswordLink.addEventListener("click", (e) => {
        e.preventDefault();
        reiniciarRecuperacion();
        loginBox.classList.remove("visible");
        loginBox.classList.add("hidden-box");
        recoverBox.classList.remove("hidden-box");
        setTimeout(() => {
            recoverBox.classList.add("visible");
        }, 50);
        message.textContent = "";
    });

    backToLoginLink.addEventListener("click", (e) => {
        e.preventDefault();
        recoverBox.classList.remove("visible");
        recoverBox.classList.add("hidden-box");
        loginBox.classList.remove("hidden-box");
        setTimeout(() => {
            loginBox.classList.add("visible");
        }, 50);
        reiniciarRecuperacion();
    });

    //  ENVÍO DEL FORMULARIO DE LOGIN — valida contra la base de datos vía api.js
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const usuarioValor = usuario.value.trim();
        const claveValor = password.value;

        if (!usuarioValor || !claveValor) {
            showMessage("Completa tu usuario/correo y tu contraseña.", "error", message);
            return;
        }

        loginButton.disabled = true;
        const textoBoton = loginButton.querySelector("span:first-child");
        if (textoBoton) textoBoton.textContent = "ENTRANDO...";
        message.textContent = "";

        try {
            // apiLogin ya guarda token/usuario/tipo en sessionStorage si todo sale bien
            await apiLogin(usuarioValor, claveValor);
            showMessage("Acceso correcto. Redirigiendo...", "success", message);
            setTimeout(() => {
                window.location.href = "../../modules/inicio/dashboard/inicio.html";
            }, 600);
        } catch (error) {
            showMessage(error.message, "error", message);
            loginButton.disabled = false;
            if (textoBoton) textoBoton.textContent = "INICIAR";
        }
    });

    //  PASO 1 DE RECUPERACIÓN — pide el código de 6 dígitos al correo
    recoverForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const correoValor = recoverEmail.value.trim();
        if (!correoValor) {
            showMessage("Ingresa tu correo electrónico.", "error", recoverMessage);
            return;
        }

        recoverButton.disabled = true;
        const textoBoton = recoverButton.querySelector("span:first-child");
        if (textoBoton) textoBoton.textContent = "ENVIANDO...";
        recoverMessage.textContent = "";

        try {
            await apiSolicitarPin(correoValor);
            showMessage("Si el correo existe, te enviamos un código. Revisa tu bandeja (expira en 5 minutos).", "success", recoverMessage);
            // Avanza al paso 2: código + nueva contraseña
            recoverForm.classList.add("paso-oculto");
            recoverStepForm.classList.remove("paso-oculto");
            recoverPin.focus();
        } catch (error) {
            showMessage(error.message, "error", recoverMessage);
        } finally {
            recoverButton.disabled = false;
            if (textoBoton) textoBoton.textContent = "ENVIAR CÓDIGO";
        }
    });

    //  PASO 2 DE RECUPERACIÓN — valida el código y cambia la contraseña
    recoverStepForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const correoValor = recoverEmail.value.trim();
        const pinValor = recoverPin.value.trim();
        const nuevaClave = recoverNewPassword.value;
        const confirmarClave = recoverConfirmPassword.value;

        if (!pinValor || !nuevaClave || !confirmarClave) {
            showMessage("Completa el código y la nueva contraseña.", "error", recoverStepMessage);
            return;
        }
        if (nuevaClave.length < 6) {
            showMessage("La nueva contraseña debe tener al menos 6 caracteres.", "error", recoverStepMessage);
            return;
        }
        if (nuevaClave !== confirmarClave) {
            showMessage("Las contraseñas no coinciden.", "error", recoverStepMessage);
            return;
        }

        recoverConfirmButton.disabled = true;
        const textoBoton = recoverConfirmButton.querySelector("span:first-child");
        if (textoBoton) textoBoton.textContent = "CAMBIANDO...";
        recoverStepMessage.textContent = "";

        try {
            await apiCambiarClave(correoValor, pinValor, nuevaClave);
            showMessage("Contraseña actualizada. Ya puedes iniciar sesión.", "success", recoverStepMessage);
            setTimeout(() => {
                backToLoginLink.click();
                usuario.focus();
            }, 1200);
        } catch (error) {
            showMessage(error.message, "error", recoverStepMessage);
        } finally {
            recoverConfirmButton.disabled = false;
            if (textoBoton) textoBoton.textContent = "CAMBIAR CONTRASEÑA";
        }
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