/* ============================================================
   CONFIGURACIÓN — EDITA SOLO ESTA PARTE
   Formato: AAAA-MM-DDTHH:MM:SS-06:00  (-06:00 = hora de San Luis Potosí)
   ============================================================ */

const FECHAS = {
    misa:      '2026-12-21T16:00:00-06:00',   // 21 de diciembre, 4:00 p.m.
    recepcion: '2026-12-21T17:00:00-06:00'    // 21 de diciembre, 5:00 p.m.
};

const VOLUMEN_MUSICA = 0.6;   // de 0 (silencio) a 1 (máximo)

const MENOS_MOVIMIENTO =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;


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
    let primera = true;

    // Cambia el número y, si es distinto, lo hace "rodar"
    function poner(nodo, valor) {
        if (nodo.textContent === valor) return;
        nodo.textContent = valor;

        if (!primera && !MENOS_MOVIMIENTO) {
            nodo.classList.remove('cambio');
            void nodo.offsetWidth;          // reinicia la animación
            nodo.classList.add('cambio');
        }
    }

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

        poner(nodos.d, dosDigitos(dias));
        poner(nodos.h, dosDigitos(horas));
        poner(nodos.m, dosDigitos(minutos));
        poner(nodos.s, dosDigitos(segundos));

        primera = false;
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
    const elementos = document.querySelectorAll('.reveal, .arco');

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
   BARRA DE AVANCE Y PARALLAX DE LA ILUSTRACIÓN
   ============================================================ */

const barra = document.getElementById('progreso');
const arcoMarco = document.querySelector('.arco-marco');
const arcoFoto = document.querySelector('.arco-foto');

let esperandoFrame = false;

function alDesplazar() {
    if (esperandoFrame) return;
    esperandoFrame = true;

    requestAnimationFrame(function () {
        const maximo = document.documentElement.scrollHeight - window.innerHeight;
        const avance = maximo > 0 ? window.scrollY / maximo : 0;

        if (barra) barra.style.transform = 'scaleX(' + Math.min(1, Math.max(0, avance)).toFixed(4) + ')';

        if (arcoMarco && arcoFoto && !MENOS_MOVIMIENTO) {
            const r = arcoMarco.getBoundingClientRect();

            if (r.bottom > 0 && r.top < window.innerHeight) {
                const centro = r.top + r.height / 2 - window.innerHeight / 2;
                const limite = r.height * 0.055;
                const desplazamiento = Math.max(-limite, Math.min(limite, -centro * 0.07));
                arcoFoto.style.setProperty('--py', desplazamiento.toFixed(1) + 'px');
            }
        }

        esperandoFrame = false;
    });
}

window.addEventListener('scroll', alDesplazar, { passive: true });
window.addEventListener('resize', alDesplazar);


/* ============================================================
   PÉTALOS QUE CAEN
   ============================================================ */

function iniciarPetalos() {
    const lienzo = document.getElementById('petalos');
    if (!lienzo || MENOS_MOVIMIENTO || !lienzo.getContext) return;

    const ctx = lienzo.getContext('2d');
    const colores = ['#f3b6c8', '#ec9db6', '#fbd9e2', '#e58aa9', '#fff0f4'];
    const cantidad = window.innerWidth < 600 ? 12 : 22;
    const petalos = [];

    let ancho = 0;
    let alto = 0;

    function medir() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        ancho = window.innerWidth;
        alto = window.innerHeight;
        lienzo.width = ancho * dpr;
        lienzo.height = alto * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function nuevo(alAzar) {
        return {
            x: Math.random() * ancho,
            y: alAzar ? Math.random() * alto : -20,
            tam: 6 + Math.random() * 7,
            vy: 0.35 + Math.random() * 0.55,
            deriva: 0.25 + Math.random() * 0.5,
            fase: Math.random() * Math.PI * 2,
            giro: Math.random() * Math.PI * 2,
            vgiro: (Math.random() - 0.5) * 0.02,
            color: colores[Math.floor(Math.random() * colores.length)],
            alfa: 0.45 + Math.random() * 0.35
        };
    }

    function dibujar(p) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.giro);
        ctx.scale(Math.abs(Math.cos(p.fase * 1.6)) * 0.7 + 0.3, 1);   // efecto de volteo
        ctx.globalAlpha = p.alfa;
        ctx.fillStyle = p.color;

        ctx.beginPath();
        ctx.moveTo(0, -p.tam);
        ctx.bezierCurveTo(p.tam * 0.9, -p.tam * 0.6, p.tam * 0.7, p.tam * 0.5, 0, p.tam);
        ctx.bezierCurveTo(-p.tam * 0.7, p.tam * 0.5, -p.tam * 0.9, -p.tam * 0.6, 0, -p.tam);
        ctx.fill();

        ctx.restore();
    }

    function cuadro() {
        ctx.clearRect(0, 0, ancho, alto);

        petalos.forEach(function (p, i) {
            p.fase += 0.015;
            p.y += p.vy;
            p.x += Math.sin(p.fase) * p.deriva;
            p.giro += p.vgiro;

            if (p.y > alto + 20 || p.x < -30 || p.x > ancho + 30) {
                petalos[i] = nuevo(false);
            }

            dibujar(p);
        });

        requestAnimationFrame(cuadro);
    }

    medir();
    for (let i = 0; i < cantidad; i++) petalos.push(nuevo(true));

    window.addEventListener('resize', medir);
    requestAnimationFrame(cuadro);
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

    // 1) Las cortinas se abren y la ilustración se acerca
    portada.classList.add('abriendo');

    const esperaCortinas = MENOS_MOVIMIENTO ? 400 : 2300;

    // 2) La portada se desvanece y comienza la invitación
    setTimeout(function () {
        btnMusica.hidden = false;

        document.body.classList.add('abierta');
        portada.classList.add('saliendo');

        document.body.classList.remove('bloqueado');
        window.scrollTo(0, 0);

        iniciarAnimacionesScroll();
        iniciarPetalos();
        alDesplazar();
    }, esperaCortinas);

    // 3) Se retira la portada cuando termina el desvanecido
    setTimeout(function () {
        portada.hidden = true;
        portada.style.display = 'none';
    }, esperaCortinas + 1600);
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
