const celdas = document.querySelectorAll('.celda');
const estado = document.getElementById('estado');
const btnReiniciar = document.getElementById('reiniciar');
const btnResetMarcador = document.getElementById('reset-marcador');
const radiosModo = document.querySelectorAll('input[name="modo"]');
const selectorDificultad = document.getElementById('selector-dificultad');
const selectIA = document.getElementById('dificultad');

const scoreXEl = document.getElementById('score-x');
const scoreOEl = document.getElementById('score-o');
const scoreEmpatesEl = document.getElementById('score-empates');
const tableroDOM = document.getElementById('tablero');
const etiquetaX = document.getElementById('etiqueta-x');
const etiquetaO = document.getElementById('etiqueta-o');

let tablero = ['', '', '', '', '', '', '', '', ''];
let jugadorActual = 'X';
let juegoActivo = true;
let modoJuego = '1v1'; 
let dificultad = 'medio';

// ---- CONFIGURACIÓN PERSONALIZADA ----
let config = JSON.parse(localStorage.getItem('triki_config')) || {
    j1: { nombre: 'Jugador 1', ficha: 'X' },
    j2: { nombre: 'Jugador 2', ficha: 'O' }
};

let puntajes = JSON.parse(localStorage.getItem('triki_puntajes')) || { X: 0, O: 0, Empates: 0 };

const condicionesGanadoras = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], 
    [0, 3, 6], [1, 4, 7], [2, 5, 8], 
    [0, 4, 8], [2, 4, 6]             
];

// ---- WEB AUDIO API (Efectos de sonido) ----
let audioCtx;
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Inicializar audio en la primera interacción para sortear la restricción del navegador
document.body.addEventListener('click', initAudio, { once: true });

function playTone(frequency, type, duration, vol = 0.1) {
    if (!audioCtx) return;
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    
    gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
}

function playClick() { playTone(400, 'sine', 0.1, 0.1); }
function playWin() {
    playTone(440, 'triangle', 0.15, 0.1);
    setTimeout(() => playTone(554, 'triangle', 0.15, 0.1), 100);
    setTimeout(() => playTone(659, 'triangle', 0.15, 0.1), 200);
    setTimeout(() => playTone(880, 'triangle', 0.4, 0.15), 300);
}
function playTie() {
    playTone(300, 'sawtooth', 0.3, 0.1);
    setTimeout(() => playTone(250, 'sawtooth', 0.4, 0.1), 200);
}
function playMachineThinking() { playTone(200, 'sine', 0.1, 0.05); }

// ---- EFECTO DE CONFETI ----
function lanzarConfeti() {
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#38bdf8', '#fb7185', '#ffffff']
        });
    }
}

// ---- INTERFAZ Y EVENTOS ----
function actualizarMarcadorUI() {
    scoreXEl.textContent = puntajes.X;
    scoreOEl.textContent = puntajes.O;
    scoreEmpatesEl.textContent = puntajes.Empates;
}

function aplicarConfiguracion() {
    etiquetaX.textContent = config.j1.nombre;
    if (modoJuego === 'vsMaquina') {
        etiquetaO.textContent = config.j2.nombre + ' 🤖';
    } else {
        etiquetaO.textContent = config.j2.nombre;
    }
    actualizarMarcadorUI();
}

function guardarPuntajes() {
    localStorage.setItem('triki_puntajes', JSON.stringify(puntajes));
    actualizarMarcadorUI();
}

radiosModo.forEach(radio => {
    radio.addEventListener('change', (e) => {
        modoJuego = e.target.value;
        if (modoJuego === 'vsMaquina') {
            selectorDificultad.classList.remove('oculto');
        } else {
            selectorDificultad.classList.add('oculto');
        }
        aplicarConfiguracion();
        reiniciarJuego();
    });
});

selectIA.addEventListener('change', (e) => {
    dificultad = e.target.value;
    reiniciarJuego();
});

function manejarClickCelda(e) {
    if (modoJuego === 'vsMaquina' && jugadorActual === 'O') return;

    const celda = e.target;
    const indice = parseInt(celda.getAttribute('data-indice'));

    if (tablero[indice] !== '' || !juegoActivo) return;

    realizarMovimiento(celda, indice);
}

function realizarMovimiento(celda, indice) {
    playClick();
    tablero[indice] = jugadorActual;
    
    // Ficha personalizada
    let fichaVisual = jugadorActual === 'X' ? config.j1.ficha : config.j2.ficha;
    celda.textContent = fichaVisual;
    celda.classList.add(jugadorActual.toLowerCase()); // Para el color/sombra CSS
    
    verificarGanador();
}

function verificarGanador() {
    let lineaGanadora = null;

    for (let i = 0; i < condicionesGanadoras.length; i++) {
        const [a, b, c] = condicionesGanadoras[i];
        if (tablero[a] && tablero[a] === tablero[b] && tablero[a] === tablero[c]) {
            lineaGanadora = [a, b, c];
            break;
        }
    }

    if (lineaGanadora) {
        let nombreGanador = jugadorActual === 'X' ? config.j1.nombre : (modoJuego === 'vsMaquina' ? config.j2.nombre + ' 🤖' : config.j2.nombre);
        estado.textContent = `¡Ganador: ${nombreGanador}! 🎉`;
        estado.style.color = jugadorActual === 'X' ? 'var(--color-x)' : 'var(--color-o)';
        estado.style.borderColor = jugadorActual === 'X' ? 'var(--color-x-glow)' : 'var(--color-o-glow)';
        
        tableroDOM.classList.add('finalizado');
        lineaGanadora.forEach(idx => celdas[idx].classList.add('ganadora'));

        puntajes[jugadorActual]++;
        guardarPuntajes();
        
        playWin();
        lanzarConfeti();

        juegoActivo = false;
        return;
    }

    if (!tablero.includes('')) {
        estado.textContent = '¡Es un Empate! 🤝';
        estado.style.color = 'var(--text-main)';
        estado.style.borderColor = 'var(--border-light)';
        
        puntajes.Empates++;
        guardarPuntajes();
        playTie();

        juegoActivo = false;
        return;
    }

    cambiarJugador();
}

function cambiarJugador() {
    jugadorActual = jugadorActual === 'X' ? 'O' : 'X';
    let nombreActual = jugadorActual === 'X' ? config.j1.nombre : (modoJuego === 'vsMaquina' ? config.j2.nombre + ' 🤖' : config.j2.nombre);
    
    estado.textContent = `Turno de ${nombreActual}`;
    estado.style.color = jugadorActual === 'X' ? 'var(--color-x)' : 'var(--color-o)';
    estado.style.borderColor = 'var(--border-light)';

    if (modoJuego === 'vsMaquina' && jugadorActual === 'O' && juegoActivo) {
        juegoActivo = false; 
        estado.textContent = 'IA pensando... 🤖';
        estado.style.color = 'var(--text-muted)';
        
        playMachineThinking();

        setTimeout(() => {
            juegoActivo = true;
            movimientoMaquina();
        }, 500); 
    }
}

function movimientoMaquina() {
    let indice = -1;

    if (dificultad === 'facil') {
        let vacios = obtenerCeldasVacias();
        if (vacios.length > 0) indice = vacios[Math.floor(Math.random() * vacios.length)];
    } else if (dificultad === 'medio') {
        indice = buscarMejorMovimiento('O');
        if (indice === -1) indice = buscarMejorMovimiento('X');
        if (indice === -1 && tablero[4] === '') indice = 4;
        if (indice === -1) {
            let vacios = obtenerCeldasVacias();
            if (vacios.length > 0) indice = vacios[Math.floor(Math.random() * vacios.length)];
        }
    } else if (dificultad === 'imposible') {
        let mejorPuntaje = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (tablero[i] === '') {
                tablero[i] = 'O';
                let puntaje = minimax(tablero, 0, false);
                tablero[i] = '';
                if (puntaje > mejorPuntaje) {
                    mejorPuntaje = puntaje;
                    indice = i;
                }
            }
        }
    }

    if (indice !== -1) {
        const celda = celdas[indice];
        realizarMovimiento(celda, indice);
    }
}

function buscarMejorMovimiento(jugador) {
    for (let i = 0; i < condicionesGanadoras.length; i++) {
        const [a, b, c] = condicionesGanadoras[i];
        if (tablero[a] === jugador && tablero[b] === jugador && tablero[c] === '') return c;
        if (tablero[a] === jugador && tablero[c] === jugador && tablero[b] === '') return b;
        if (tablero[b] === jugador && tablero[c] === jugador && tablero[a] === '') return a;
    }
    return -1; 
}

function obtenerCeldasVacias() {
    return tablero.map((val, i) => val === '' ? i : null).filter(val => val !== null);
}

// ---- Minimax Algoritmo ----
const puntajesMinimax = { 'O': 10, 'X': -10, 'empate': 0 };

function verificarGanadorMinimax(tableroTemp) {
    for (let i = 0; i < condicionesGanadoras.length; i++) {
        const [a, b, c] = condicionesGanadoras[i];
        if (tableroTemp[a] && tableroTemp[a] === tableroTemp[b] && tableroTemp[a] === tableroTemp[c]) {
            return tableroTemp[a];
        }
    }
    if (!tableroTemp.includes('')) return 'empate';
    return null;
}

function minimax(tableroTemp, profundidad, esMaximizador) {
    let resultado = verificarGanadorMinimax(tableroTemp);
    if (resultado !== null) {
        if (resultado === 'O') return puntajesMinimax[resultado] - profundidad;
        if (resultado === 'X') return puntajesMinimax[resultado] + profundidad;
        return puntajesMinimax[resultado];
    }

    if (esMaximizador) {
        let mejorPuntaje = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (tableroTemp[i] === '') {
                tableroTemp[i] = 'O';
                let puntaje = minimax(tableroTemp, profundidad + 1, false);
                tableroTemp[i] = '';
                mejorPuntaje = Math.max(puntaje, mejorPuntaje);
            }
        }
        return mejorPuntaje;
    } else {
        let mejorPuntaje = Infinity;
        for (let i = 0; i < 9; i++) {
            if (tableroTemp[i] === '') {
                tableroTemp[i] = 'X';
                let puntaje = minimax(tableroTemp, profundidad + 1, true);
                tableroTemp[i] = '';
                mejorPuntaje = Math.min(puntaje, mejorPuntaje);
            }
        }
        return mejorPuntaje;
    }
}

// ---- Reset ----
function reiniciarJuego() {
    tablero = ['', '', '', '', '', '', '', '', ''];
    jugadorActual = 'X';
    juegoActivo = true;
    
    let nombreActual = config.j1.nombre;
    estado.textContent = `Turno de ${nombreActual}`;
    estado.style.color = 'var(--color-x)';
    estado.style.borderColor = 'var(--border-light)';
    tableroDOM.classList.remove('finalizado');

    celdas.forEach(celda => {
        celda.textContent = '';
        celda.classList.remove('x', 'o', 'ganadora');
    });
}

// ---- Eventos ----
btnReiniciar.addEventListener('click', reiniciarJuego);

btnResetMarcador.addEventListener('click', () => {
    if (confirm("¿Estás seguro de que quieres reiniciar los puntajes a cero?")) {
        puntajes = { X: 0, O: 0, Empates: 0 };
        guardarPuntajes();
    }
});

// Modal Configuración
const modalConfig = document.getElementById('modal-config');
const btnAbreConfig = document.getElementById('btn-config');
const btnCierraConfig = document.getElementById('btn-cerrar-config');
const btnGuardarConfig = document.getElementById('btn-guardar-config');

const inputNom1 = document.getElementById('nombre-j1');
const inputNom2 = document.getElementById('nombre-j2');
const selectFicha1 = document.getElementById('ficha-j1');
const selectFicha2 = document.getElementById('ficha-j2');

function cargarModal() {
    inputNom1.value = config.j1.nombre;
    inputNom2.value = config.j2.nombre;
    selectFicha1.value = config.j1.ficha;
    selectFicha2.value = config.j2.ficha;
}

btnAbreConfig.addEventListener('click', () => {
    cargarModal();
    modalConfig.classList.add('activo');
});

btnCierraConfig.addEventListener('click', () => {
    modalConfig.classList.remove('activo');
});

btnGuardarConfig.addEventListener('click', () => {
    config.j1.nombre = inputNom1.value.trim() || 'Jugador 1';
    config.j1.ficha = selectFicha1.value;
    config.j2.nombre = inputNom2.value.trim() || 'Jugador 2';
    config.j2.ficha = selectFicha2.value;
    
    localStorage.setItem('triki_config', JSON.stringify(config));
    
    aplicarConfiguracion();
    modalConfig.classList.remove('activo');
    reiniciarJuego();
});

// Inicialización final
aplicarConfiguracion();
reiniciarJuego();
celdas.forEach(celda => celda.addEventListener('click', manejarClickCelda));
