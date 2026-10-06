const celdas = document.querySelectorAll('.celda');
const estado = document.getElementById('estado');
const btnReiniciar = document.getElementById('reiniciar');
const btnResetMarcador = document.getElementById('reset-marcador');
const radiosModo = document.querySelectorAll('input[name="modo"]');
const selectorDificultad = document.getElementById('selector-dificultad');
const selectIA = document.getElementById('dificultad');
const etiquetaO = document.getElementById('etiqueta-o');

const scoreXEl = document.getElementById('score-x');
const scoreOEl = document.getElementById('score-o');
const scoreEmpatesEl = document.getElementById('score-empates');
const tableroDOM = document.getElementById('tablero');

let tablero = ['', '', '', '', '', '', '', '', ''];
let jugadorActual = 'X';
let juegoActivo = true;
let modoJuego = '1v1'; 
let dificultad = 'medio';

// Puntajes desde LocalStorage
let puntajes = JSON.parse(localStorage.getItem('triki_puntajes')) || { X: 0, O: 0, Empates: 0 };

const condicionesGanadoras = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], 
    [0, 3, 6], [1, 4, 7], [2, 5, 8], 
    [0, 4, 8], [2, 4, 6]             
];

// Inicializar UI de marcador
function actualizarMarcadorUI() {
    scoreXEl.textContent = puntajes.X;
    scoreOEl.textContent = puntajes.O;
    scoreEmpatesEl.textContent = puntajes.Empates;
}

function guardarPuntajes() {
    localStorage.setItem('triki_puntajes', JSON.stringify(puntajes));
    actualizarMarcadorUI();
}

actualizarMarcadorUI();

// Eventos de configuración
radiosModo.forEach(radio => {
    radio.addEventListener('change', (e) => {
        modoJuego = e.target.value;
        if (modoJuego === 'vsMaquina') {
            selectorDificultad.classList.remove('oculto');
            etiquetaO.textContent = 'Máquina 🤖';
        } else {
            selectorDificultad.classList.add('oculto');
            etiquetaO.textContent = 'Jugador O';
        }
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

    if (tablero[indice] !== '' || !juegoActivo) {
        return;
    }

    realizarMovimiento(celda, indice);
}

function realizarMovimiento(celda, indice) {
    tablero[indice] = jugadorActual;
    celda.textContent = jugadorActual;
    celda.classList.add(jugadorActual.toLowerCase());
    
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
        estado.textContent = `¡Ganador: ${jugadorActual}! 🎉`;
        estado.style.color = jugadorActual === 'X' ? 'var(--color-x)' : 'var(--color-o)';
        estado.style.borderColor = jugadorActual === 'X' ? 'var(--color-x-glow)' : 'var(--color-o-glow)';
        
        // Efectos visuales de victoria
        tableroDOM.classList.add('finalizado');
        lineaGanadora.forEach(idx => {
            celdas[idx].classList.add('ganadora');
        });

        // Actualizar marcador
        puntajes[jugadorActual]++;
        guardarPuntajes();

        juegoActivo = false;
        return;
    }

    if (!tablero.includes('')) {
        estado.textContent = '¡Es un Empate! 🤝';
        estado.style.color = 'var(--text-main)';
        estado.style.borderColor = 'var(--border-light)';
        
        // Actualizar marcador
        puntajes.Empates++;
        guardarPuntajes();

        juegoActivo = false;
        return;
    }

    cambiarJugador();
}

function cambiarJugador() {
    jugadorActual = jugadorActual === 'X' ? 'O' : 'X';
    estado.textContent = `Turno de ${jugadorActual}`;
    estado.style.color = jugadorActual === 'X' ? 'var(--color-x)' : 'var(--color-o)';
    estado.style.borderColor = 'var(--border-light)';

    if (modoJuego === 'vsMaquina' && jugadorActual === 'O' && juegoActivo) {
        juegoActivo = false; 
        estado.textContent = 'IA pensando... 🤖';
        estado.style.color = 'var(--text-muted)';

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
        if (vacios.length > 0) {
            indice = vacios[Math.floor(Math.random() * vacios.length)];
        }
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

// ---- Algoritmo Minimax (Dificultad Imposible) ----
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
        // Optimización: preferir victorias más rápidas o demorar derrotas
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
// ----------------------------

function reiniciarJuego() {
    tablero = ['', '', '', '', '', '', '', '', ''];
    jugadorActual = 'X';
    juegoActivo = true;
    estado.textContent = `Turno de ${jugadorActual}`;
    estado.style.color = 'var(--color-x)';
    estado.style.borderColor = 'var(--border-light)';
    tableroDOM.classList.remove('finalizado');

    celdas.forEach(celda => {
        celda.textContent = '';
        celda.classList.remove('x', 'o', 'ganadora');
    });
}

// Botones de acciones
btnReiniciar.addEventListener('click', reiniciarJuego);

btnResetMarcador.addEventListener('click', () => {
    if (confirm("¿Estás seguro de que quieres reiniciar los puntajes a cero?")) {
        puntajes = { X: 0, O: 0, Empates: 0 };
        guardarPuntajes();
    }
});

// Inicialización
estado.style.color = 'var(--color-x)';
celdas.forEach(celda => celda.addEventListener('click', manejarClickCelda));
