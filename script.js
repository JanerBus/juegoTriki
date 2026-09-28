const celdas = document.querySelectorAll('.celda');
const estado = document.getElementById('estado');
const btnReiniciar = document.getElementById('reiniciar');
const radiosModo = document.querySelectorAll('input[name="modo"]');

let tablero = ['', '', '', '', '', '', '', '', ''];
let jugadorActual = 'X';
let juegoActivo = true;
let modoJuego = '1v1'; // '1v1' o 'vsMaquina'

const condicionesGanadoras = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Filas
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columnas
    [0, 4, 8], [2, 4, 6]             // Diagonales
];

// Cambiar modo de juego
radiosModo.forEach(radio => {
    radio.addEventListener('change', (e) => {
        modoJuego = e.target.value;
        reiniciarJuego();
    });
});

function manejarClickCelda(e) {
    // Si es modo vs máquina y el turno es de 'O', el usuario no puede hacer clic
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
    let rondaGanada = false;

    for (let i = 0; i < condicionesGanadoras.length; i++) {
        const [a, b, c] = condicionesGanadoras[i];
        if (tablero[a] && tablero[a] === tablero[b] && tablero[a] === tablero[c]) {
            rondaGanada = true;
            break;
        }
    }

    if (rondaGanada) {
        estado.textContent = `¡El jugador ${jugadorActual} ha ganado! 🎉`;
        estado.style.color = jugadorActual === 'X' ? 'var(--color-primario)' : 'var(--color-secundario)';
        juegoActivo = false;
        return;
    }

    if (!tablero.includes('')) {
        estado.textContent = '¡Empate! 🤝';
        estado.style.color = '#ffa502';
        juegoActivo = false;
        return;
    }

    cambiarJugador();
}

function cambiarJugador() {
    jugadorActual = jugadorActual === 'X' ? 'O' : 'X';
    estado.textContent = `Turno de ${jugadorActual}`;
    estado.style.color = jugadorActual === 'X' ? 'var(--color-primario)' : 'var(--color-secundario)';

    // Si es el turno de la máquina
    if (modoJuego === 'vsMaquina' && jugadorActual === 'O' && juegoActivo) {
        juegoActivo = false; // Bloquear tablero temporalmente
        estado.textContent = 'La máquina está pensando... 🤖';
        estado.style.color = '#a4b0be';

        setTimeout(() => {
            juegoActivo = true;
            movimientoMaquina();
        }, 800); // Retraso para dar la sensación de que está pensando
    }
}

function movimientoMaquina() {
    let indice = -1;

    // 1. Intentar ganar
    indice = buscarMejorMovimiento('O');
    
    // 2. Bloquear al jugador si está a punto de ganar
    if (indice === -1) {
        indice = buscarMejorMovimiento('X');
    }
    
    // 3. Tomar el centro si está libre
    if (indice === -1 && tablero[4] === '') {
        indice = 4;
    }
    
    // 4. Tomar un espacio aleatorio
    if (indice === -1) {
        let vacios = tablero.map((val, i) => val === '' ? i : null).filter(val => val !== null);
        if (vacios.length > 0) {
            indice = vacios[Math.floor(Math.random() * vacios.length)];
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
    return -1; // No se encontró un movimiento crítico
}

function reiniciarJuego() {
    tablero = ['', '', '', '', '', '', '', '', ''];
    jugadorActual = 'X';
    juegoActivo = true;
    estado.textContent = `Turno de ${jugadorActual}`;
    estado.style.color = 'var(--color-primario)';

    celdas.forEach(celda => {
        celda.textContent = '';
        celda.classList.remove('x', 'o');
    });
}

// Inicializar
estado.style.color = 'var(--color-primario)';
celdas.forEach(celda => celda.addEventListener('click', manejarClickCelda));
btnReiniciar.addEventListener('click', reiniciarJuego);
