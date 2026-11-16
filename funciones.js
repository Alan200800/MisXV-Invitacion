/* ============================================================
   CONFIGURACIÓN — EDITA SOLO ESTA PARTE
   Formato: AAAA-MM-DDTHH:MM:SS-06:00  (-06:00 = hora de San Luis Potosí)
   ============================================================ */

const FECHAS = {
    misa:      '2027-01-16T17:00:00-06:00',   // ← cambia por la fecha y hora de la misa
    recepcion: '2027-01-16T20:00:00-06:00'    // ← cambia por la fecha y hora de la recepción
};

const VOLUMEN_MUSICA = 0.6;   // de 0 (silencio) a 1 (máximo)


/* ============================================================
   CONTADORES (compactos, en una sola línea)
   ============================================================ */

function dosDigitos(n) {
    return String(n).padStart(2, '0');
}

function crearContador(idContenedor, fechaTexto) {
    const contenedor = document.getElementById(idContenedor);
    if (!contenedor) return;

    const destino = new Date(fechaTexto).getTime();

    contenedor.innerHTML =
        '<div class="cuenta" role="timer" aria-live="off">' +
            '<div class="u"><b data-u="d">00</b><small>días</small></div>' +
            '<div class="u"><b data-u="h">00</b><small>hrs</small></div>' +
            '<div class="u"><b data-u="m">00</b><small>min</small></div>' +
            '<div class="u"><b data-u="s">00</b><small>seg</small></div>' +
        '</div>';

    const nodos = {
        d: contenedor.querySelector('[data-u="d"]'),
        h: contenedor.querySelector('[data-u="h"]'),
        m: contenedor.querySelector('[data-u="m"]'),
        s: contenedor.querySelector('[data-u="s"]')
    };

    let intervalo;

    function actualizar() {
        let resto = destino - Date.now();

        if (isNaN(destino)) {
            clearInterval(intervalo);
            return;
        }

        if (resto <= 0) {
            clearInterval(intervalo);
            contenedor.innerHTML = '<p class="cuenta-fin">¡Es hoy!</p>';
            return;
        }

        const dias     = Math.floor(resto / 86400000); resto -= dias * 86400000;
        const horas    = Math.floor(resto / 3600000);  resto -= horas * 3600000;
        const minutos  = Math.floor(resto / 60000);    resto -= minutos * 60000;
        const segundos = Math.floor(resto / 1000);

        nodos.d.textContent = dosDigitos(dias);
        nodos.h.textContent = dosDigitos(horas);
        nodos.m.textContent = dosDigitos(minutos);
        nodos.s.textContent = dosDigitos(segundos);
    }

    actualizar();
    intervalo = setInterval(actualizar, 1000);
}

crearContador('contador-misa', FECHAS.misa);
crearContador('contador-recepcion', FECHAS.recepcion);


/* ============================================================
   ANIMACIONES AL DESPLAZARSE
   ============================================================ */

function iniciarAnimacionesScroll() {
    const elementos = document.querySelectorAll('.reveal');

    // Navegadores antiguos o sin soporte: se muestra todo directamente
    if (!('IntersectionObserver' in window)) {
        elementos.forEach(function (el) { el.classList.add('visible'); });
        return;
    }

    const observador = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (entrada) {
            if (entrada.isIntersecting) {
                entrada.target.classList.add('visible');
                observador.unobserve(entrada.target);   // se anima una sola vez
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -8% 0px'
    });

    elementos.forEach(function (el) { observador.observe(el); });
}


/* ============================================================
   PORTADA Y MÚSICA
   ============================================================ */

const portada   = document.getElementById('portada');
const btnAbrir  = document.getElementById('btn-abrir');
const btnMusica = document.getElementById('btn-musica');
const audio     = document.getElementById('musica');

let musicaActiva = false;      // si la persona quiere música (no la pausó a mano)
let fadeIntervalo = null;

function fadeAudio(objetivo, duracion) {
    clearInterval(fadeIntervalo);

    const pasos = 20;
    const delta = (objetivo - audio.volume) / pasos;
    let paso = 0;

    fadeIntervalo = setInterval(function () {
        paso++;
        audio.volume = Math.min(1, Math.max(0, audio.volume + delta));

        if (paso >= pasos) {
            audio.volume = objetivo;
            clearInterval(fadeIntervalo);
            if (objetivo === 0) audio.pause();
        }
    }, duracion / pasos);
}

function reproducir() {
    if (!audio) return;

    audio.volume = 0;

    const promesa = audio.play();

    if (promesa && typeof promesa.then === 'function') {
        promesa.then(function () {
            musicaActiva = true;
            btnMusica.classList.remove('silencio');
            btnMusica.setAttribute('aria-label', 'Pausar música');
            fadeAudio(VOLUMEN_MUSICA, 2500);
        }).catch(function () {
            // El navegador bloqueó el audio o falta el archivo: la invitación sigue funcionando
            musicaActiva = false;
            btnMusica.classList.add('silencio');
            btnMusica.setAttribute('aria-label', 'Activar música');
        });
    }
}

function pausar() {
    musicaActiva = false;
    btnMusica.classList.add('silencio');
    btnMusica.setAttribute('aria-label', 'Activar música');
    fadeAudio(0, 600);
}

function abrirInvitacion() {
    btnAbrir.disabled = true;

    // La música debe empezar dentro del clic para que el navegador la permita
    reproducir();

    btnMusica.hidden = false;

    document.body.classList.add('abierta');
    portada.classList.add('saliendo');

    // Se libera el desplazamiento y se activan las animaciones de aparición
    document.body.classList.remove('bloqueado');
    window.scrollTo(0, 0);
    iniciarAnimacionesScroll();

    // Se retira la portada cuando termina el desvanecido
    setTimeout(function () {
        portada.hidden = true;
        portada.style.display = 'none';
    }, 1400);
}

if (btnAbrir) {
    btnAbrir.addEventListener('click', abrirInvitacion);
}

if (btnMusica) {
    btnMusica.addEventListener('click', function () {
        if (musicaActiva) {
            pausar();
        } else {
            reproducir();
        }
    });
}

// Si se cambia de pestaña o se bloquea el teléfono, la música se pausa y se retoma al volver
let pausadaPorSalir = false;

document.addEventListener('visibilitychange', function () {
    if (!audio) return;

    if (document.hidden) {
        if (musicaActiva && !audio.paused) {
            pausadaPorSalir = true;
            audio.pause();
        }
    } else if (pausadaPorSalir) {
        pausadaPorSalir = false;
        audio.play().catch(function () {});
    }
});
