const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let puntuacion = 0;
let juegoTerminado = false; //segundo cambio

class Nave {
    constructor() {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.angulo = 0;
        this.velocidadX = 0;
        this.velocidadY = 0;
        this.radio = 15;
        this.aceleracion = 0.1;
        this.friccion = 0.99;
        this.rotandoIzquierda = false;
        this.rotandoDerecha = false;
        this.acelerando = false;
        this.velocidadRotacion = 0.1;
        this.proyectiles = [];
        this.vidas = 3;
        this.invencible = false;
        this.tiempoInvencible = 0;
    }

    reiniciar() {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.velocidadX = 0;
        this.velocidadY = 0;
        this.angulo = 0;
        this.invencible = true;
        this.tiempoInvencible = 120; // 2 segundos a 60 FPS
    }

    recibirDaño() {

        if (!this.invencible) {
            this.vidas--;
            if (this.vidas > 0) {
                this.reiniciar();
            }
            return this.vidas <= 0;
        }
        return false;
    }

    dibujar() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angulo);
        
        // Parpadeo cuando es invencible
        if (!this.invencible || Math.floor(Date.now() / 100) % 2) {
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;

            // Nave
            ctx.beginPath();
            ctx.moveTo(0, -this.radio);
            ctx.lineTo(this.radio, this.radio);
            ctx.lineTo(-this.radio, this.radio);
            ctx.closePath();
            ctx.stroke();

            // Fuego del propulsor
            if (this.acelerando) {
                ctx.beginPath();
                ctx.moveTo(-this.radio/2, this.radio);
                ctx.lineTo(0, this.radio + 10);
                ctx.lineTo(this.radio/2, this.radio);
                ctx.stroke();
            }
        }

        ctx.restore();

        // Dibujar proyectiles
        this.proyectiles.forEach(proyectil => proyectil.dibujar());
    }

    mover() {
        if (this.invencible) {
            this.tiempoInvencible--;
            if (this.tiempoInvencible <= 0) {
                this.invencible = false;
            }
        }

        // Rotación
        if (this.rotandoIzquierda) this.angulo -= this.velocidadRotacion;
        if (this.rotandoDerecha) this.angulo += this.velocidadRotacion;

        // Aceleración
        if (this.acelerando) {
            this.velocidadX += this.aceleracion * Math.cos(this.angulo - Math.PI / 2);
            this.velocidadY += this.aceleracion * Math.sin(this.angulo - Math.PI / 2);
        }

        // Aplicar fricción
        this.velocidadX *= this.friccion;
        this.velocidadY *= this.friccion;

        // Actualizar posición
        this.x += this.velocidadX;
        this.y += this.velocidadY;

        // Envolver los bordes
        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;

        // Mover proyectiles
        this.proyectiles = this.proyectiles.filter(proyectil => {
            proyectil.mover();
            return proyectil.activo;
        });
    }
    disparar() {
        const proyectil = new Proyectil(
            this.x + this.radio * Math.cos(this.angulo - Math.PI / 2),
            this.y + this.radio * Math.sin(this.angulo - Math.PI / 2),
            this.angulo
        ); 
        this.proyectiles.push(proyectil);
    }
}

class Proyectil {
    constructor(x, y, angulo) {
        this.x = x;
        this.y = y;
        this.velocidad = 10;
        this.radio = 2;
        this.angulo = angulo;
        this.distanciaRecorrida = 0;
        this.alcanceMaximo = 500;
        this.activo = true;
    }

    dibujar() {
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radio, 0, Math.PI * 2);
        ctx.fill();
    }

    mover() {
        this.x += this.velocidad * Math.cos(this.angulo - Math.PI / 2);
        this.y += this.velocidad * Math.sin(this.angulo - Math.PI / 2);
        
        // Envolver los bordes
        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;

        // Controlar el alcance
        this.distanciaRecorrida += this.velocidad;
        if (this.distanciaRecorrida > this.alcanceMaximo) {
            this.activo = false;
        }
    }
}

class Asteroide {
    constructor(x, y, radio, velocidad, angulo) {
        this.x = x;
        this.y = y;
        this.radio = radio;
        this.velocidad = velocidad;
        this.angulo = angulo;
        this.vertices = Math.floor(Math.random() * 4) + 8;
        this.irregularidad = Array(this.vertices).fill(0).map(() => 0.8 + Math.random() * 0.4);
        // Puntos basados en el tamaño
        this.puntos = Math.floor((50 - this.radio) * 2);
    }

    dibujar() {
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let i = 0; i < this.vertices; i++) {
            const angle = (i * 2 * Math.PI) / this.vertices;
            const radio = this.radio * this.irregularidad[i];
            const x = this.x + Math.cos(angle) * radio;
            const y = this.y + Math.sin(angle) * radio;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.closePath();
        ctx.stroke();
    }

    mover() {
        this.x += this.velocidad * Math.cos(this.angulo);
        this.y += this.velocidad * Math.sin(this.angulo);
        
        if (this.x > canvas.width + this.radio) this.x = -this.radio;
        if (this.x < -this.radio) this.x = canvas.width + this.radio;
        if (this.y > canvas.height + this.radio) this.y = -this.radio;
        if (this.y < -this.radio) this.y = canvas.height + this.radio;
    }

    dividir() {
        if (this.radio < 20) {
            return [];
        }

        const nuevosAsteroides = [];
        for (let i = 0; i < 2; i++) {
            const nuevoRadio = this.radio / 2;
            const nuevaVelocidad = this.velocidad * 1.3;
            const nuevoAngulo = this.angulo + Math.PI / 2 * (i * 2 - 1);
            
            nuevosAsteroides.push(new Asteroide(
                this.x,
                this.y,
                nuevoRadio,
                nuevaVelocidad,
                nuevoAngulo
            ));
        }
        return nuevosAsteroides;
    }
}
// Función para dibujar la interfaz
function dibujarInterfaz() {
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Puntuación: ${puntuacion}`, 20, 40);
    ctx.fillText(`Vidas: ${nave.vidas}`, 20, 70);

    if (juegoTerminado) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'white';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2);
        ctx.font = '24px Arial';
        ctx.fillText(`Puntuación final: ${puntuacion}`, canvas.width/2, canvas.height/2 + 50);
        ctx.fillText('Presiona ESPACIO para reiniciar', canvas.width/2, canvas.height/2 + 100);
    }

}
// Función para detectar colisiones
function detectarColision(x1, y1, r1, x2, y2, r2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distancia = Math.sqrt(dx * dx + dy * dy);
    return distancia < r1 + r2;
}
// Función para reiniciar el juego
function reiniciarJuego() {
    nave = new Nave();
    asteroides = [];
    puntuacion = 0;
    juegoTerminado = false;
    
    // Generar asteroides iniciales
    for (let i = 0; i < 5; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radio = Math.random() * 20 + 20;
        const velocidad = Math.random() * 2 + 1;
        const angulo = Math.random() * Math.PI * 2;
        asteroides.push(new Asteroide(x, y, radio, velocidad, angulo));
    }
    
}


// Crear instancias
const nave = new Nave();
const asteroides = [];

// Generar asteroides iniciales
for (let i = 0; i < 5; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const radio = Math.random() * 20 + 20;
    const velocidad = Math.random() * 2 + 1;
    const angulo = Math.random() * Math.PI * 2;
    asteroides.push(new Asteroide(x, y, radio, velocidad, angulo));
}

// Eventos de teclado
document.addEventListener('keydown', (event) => {
    if (juegoTerminado) {
        if (event.code === 'Space') {
            location.reload();
        }
        return;
    }

    switch(event.code) {
        case 'ArrowUp':
        case 'KeyW':
            nave.acelerando = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            nave.rotandoIzquierda = true;          
            break;
        case 'ArrowRight':
        case 'KeyD':
            nave.rotandoDerecha = true;
            break;
        case 'Space':
            nave.disparar();
            break;
    }
});

document.addEventListener('keyup', (event) => {
    switch(event.code) {
        case 'ArrowUp':
        case 'KeyW':
            nave.acelerando = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            nave.rotandoIzquierda = false;          
            break;
        case 'ArrowRight':
        case 'KeyD':
            nave.rotandoDerecha = false;
            break;
    }
});

// Función para dibujar la puntuación
function dibujarPuntuacion() {
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Puntuación: ${puntuacion}`, 20, 40);
}

// Bucle principal del juego
function bucleJuego() {
    // Limpiar canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (!juegoTerminado) {
        // Actualizar y dibujar nave
        nave.mover();
        nave.dibujar();
        
        // Verificar colisiones con asteroides
        asteroides.forEach((asteroide, index) => {
            if (!nave.invencible && detectarColision(
                nave.x,
                nave.y,
                nave.radio,
                asteroide.x,
                asteroide.y,
                asteroide.radio
            )) {
                if (nave.recibirDaño()) {
                    juegoTerminado = true;
                }
            }
        });
        
        // Actualizar y comprobar colisiones de proyectiles
        let nuevosAsteroides = [];
        nave.proyectiles.forEach(proyectil => {
            asteroides.forEach((asteroide, index) => {
                if (detectarColision(
                    proyectil.x,
                    proyectil.y,
                    proyectil.radio,
                    asteroide.x,
                    asteroide.y,
                    asteroide.radio
                )) {
                    proyectil.activo = false;
                    puntuacion += asteroide.puntos;
                    nuevosAsteroides = nuevosAsteroides.concat(asteroide.dividir());
                    asteroides.splice(index, 1);
                }
            });
        });
        
        asteroides.push(...nuevosAsteroides);
        
        // Actualizar y dibujar asteroides
        asteroides.forEach(asteroide => {
            asteroide.mover();
            asteroide.dibujar();
        });
        
        // Generar nuevos asteroides si quedan pocos
        if (asteroides.length < 3) {
            const x = Math.random() < 0.5 ? 0 : canvas.width;
            const y = Math.random() * canvas.height;
            const radio = Math.random() * 20 + 20;
            const velocidad = Math.random() * 2 + 1;
            const angulo = Math.random() * Math.PI * 2;
            asteroides.push(new Asteroide(x, y, radio, velocidad, angulo));
        }
    }


    // Dibujar interfaz
    dibujarInterfaz();
    requestAnimationFrame(bucleJuego);
}

// Iniciar el juego

bucleJuego();
reiniciarJuego();
