const celdas = document.querySelectorAll('.celda');
const estado = document.getElementById('estado');
const btnReiniciar = document.getElementById('reiniciar');
const radiosModo = document.querySelectorAll('input[name="modo"]');

let tablero = ['', '', '', '', '', '', '', '', ''];
let jugadorActual = 'X';
let juegoActivo = true;
let modoJuego = '1v1'; 

const condicionesGanadoras = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], 
    [0, 3, 6], [1, 4, 7], [2, 5, 8], 
    [0, 4, 8], [2, 4, 6]             
];

radiosModo.forEach(radio => {
    radio.addEventListener('change', (e) => {
        modoJuego = e.target.value;
        reiniciarJuego();
    });
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
    let rondaGanada = false;

    for (let i = 0; i < condicionesGanadoras.length; i++) {
        const [a, b, c] = condicionesGanadoras[i];
        if (tablero[a] && tablero[a] === tablero[b] && tablero[a] === tablero[c]) {
            rondaGanada = true;
            break;
        }
    }

    if (rondaGanada) {
        estado.textContent = `¡Ganador: ${jugadorActual}! 🎉`;
        estado.style.color = jugadorActual === 'X' ? 'var(--color-x)' : 'var(--color-o)';
        estado.style.borderColor = jugadorActual === 'X' ? 'var(--color-x-glow)' : 'var(--color-o-glow)';
        juegoActivo = false;
        return;
    }

    if (!tablero.includes('')) {
        estado.textContent = '¡Es un Empate! 🤝';
        estado.style.color = 'var(--text-main)';
        estado.style.borderColor = 'var(--border-light)';
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
        }, 600); 
    }
}

function movimientoMaquina() {
    let indice = -1;

    indice = buscarMejorMovimiento('O');
    
    if (indice === -1) {
        indice = buscarMejorMovimiento('X');
    }
    
    if (indice === -1 && tablero[4] === '') {
        indice = 4;
    }
    
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
    return -1; 
}

function reiniciarJuego() {
    tablero = ['', '', '', '', '', '', '', '', ''];
    jugadorActual = 'X';
    juegoActivo = true;
    estado.textContent = `Turno de ${jugadorActual}`;
    estado.style.color = 'var(--color-x)';
    estado.style.borderColor = 'var(--border-light)';

    celdas.forEach(celda => {
        celda.textContent = '';
        celda.classList.remove('x', 'o');
    });
}

// Inicialización
estado.style.color = 'var(--color-x)';
celdas.forEach(celda => celda.addEventListener('click', manejarClickCelda));
btnReiniciar.addEventListener('click', reiniciarJuego);
