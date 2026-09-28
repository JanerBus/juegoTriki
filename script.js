const celdas = document.querySelectorAll('.celda');
const estado = document.getElementById('estado');
const btnReiniciar = document.getElementById('reiniciar');

let tablero = ['', '', '', '', '', '', '', '', ''];
let jugadorActual = 'X';
let juegoActivo = true;

const condicionesGanadoras = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Filas
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columnas
    [0, 4, 8], [2, 4, 6]             // Diagonales
];

function manejarClickCelda(e) {
    const celda = e.target;
    const indice = parseInt(celda.getAttribute('data-indice'));

    // Si la celda ya está ocupada o el juego terminó, no hacer nada
    if (tablero[indice] !== '' || !juegoActivo) {
        return;
    }

    actualizarCelda(celda, indice);
    verificarGanador();
}

function actualizarCelda(celda, indice) {
    tablero[indice] = jugadorActual;
    celda.textContent = jugadorActual;
    celda.classList.add(jugadorActual.toLowerCase());
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

    // Verificar empate
    if (!tablero.includes('')) {
        estado.textContent = '¡Empate! 🤝';
        estado.style.color = '#ffa502';
        juegoActivo = false;
        return;
    }

    // Si nadie ganó y no hay empate, cambiar de turno
    cambiarJugador();
}

function cambiarJugador() {
    jugadorActual = jugadorActual === 'X' ? 'O' : 'X';
    estado.textContent = `Turno de ${jugadorActual}`;
    // Cambiar color del texto dependiendo de quién es el turno
    estado.style.color = jugadorActual === 'X' ? 'var(--color-primario)' : 'var(--color-secundario)';
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

// Inicializar el color del estado
estado.style.color = 'var(--color-primario)';

// Event listeners
celdas.forEach(celda => celda.addEventListener('click', manejarClickCelda));
btnReiniciar.addEventListener('click', reiniciarJuego);
