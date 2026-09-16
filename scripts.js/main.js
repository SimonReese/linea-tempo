// Init PixiJS application
const app = new PIXI.Application({
    resizeTo: window,
    backgroundColor: 0x050510,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    antialias: true
});
document.body.appendChild(app.view);

// --- 1. SFONDO STELLARE DINAMICO ---

// Creiamo un contenitore apposito per lo sfondo
const bgContainer = new PIXI.Container();
app.stage.addChild(bgContainer);

// TRUCCO DI PERFORMANCE: Disegniamo un cerchietto bianco UNA SOLA VOLTA...
const starGraphics = new PIXI.Graphics();
starGraphics.beginFill(0xFFFFFF);
starGraphics.drawCircle(0, 0, 3); // Raggio 3
starGraphics.endFill();
// ...e lo trasformiamo in una "Texture" (Immagine) che la GPU può copiare 400 volte a costo zero
const starTexture = app.renderer.generateTexture(starGraphics);

const stars = [];
const numStars = 400; // Quante stelle vuoi vedere a schermo

for (let i = 0; i < numStars; i++) {
    const star = new PIXI.Sprite(starTexture);
    
    // Posizione iniziale casuale per tutto lo schermo
    star.x = Math.random() * app.screen.width;
    star.y = Math.random() * app.screen.height;
    
    // La "Profondità": determinerà la grandezza e la velocità del parallasse
    // Va da 0.1 (lontanissima/piccola) a 0.8 (vicina/grande)
    const depth = 0.1 + Math.random() * 0.7; 
    star.scale.set(depth * 0.5); 
    
    // Salviamo dei parametri personalizzati dentro l'oggetto stella per usarli nell'animazione
    star.parallaxDepth = depth;
    star.alphaPhase = Math.random() * Math.PI * 2; // Punto di partenza del luccichio (sfasato per ogni stella)
    star.alphaSpeed = 0.01 + Math.random() * 0.03; // Velocità del luccichio
    
    bgContainer.addChild(star);
    stars.push(star);
}

// Variabile per calcolare di quanto si è spostato l'asse del tempo
let previousWorldX = 0; 

// --- FINE SFONDO STELLARE ---

// Timeline constants
const START_YEAR = 0; // Big Bang
const END_YEAR = 13800; // Today (in million years)
const TIMELINE_LENGTH = END_YEAR - START_YEAR;

// Main container (moved and scaled)
const world = new PIXI.Container();
app.stage.addChild(world);

// Intial container position
// vertically centered
world.y = app.screen.height / 2;

// Compute initial scale to have all the world, 5% margin left and right
const margin = app.screen.width * 0.1; 
const initialScale = (app.screen.width - margin) / TIMELINE_LENGTH;
world.scale.x = initialScale;
world.x = margin / 2; // Move container half margin to center both sides

// 1. Draw timeline axis line
// const axisLine = new PIXI.Graphics();
// axisLine.lineStyle(2, 0x333344, 1); // Width 2, grey blue
// axisLine.moveTo(START_YEAR, 0);
// axisLine.lineTo(END_YEAR, 0);
// world.addChild(axisLine);

// 1. Draw timeline axis line (Effetto Glow Arancione/Giallo)
const axisLine = new PIXI.Graphics();

const glowColor = 0xFFCC00; //0xFF8800; // Arancione luminoso

// Livello 1: Bagliore esterno (largo e quasi trasparente)
axisLine.lineStyle(15, glowColor, 0.05); 
axisLine.moveTo(START_YEAR, 0);
axisLine.lineTo(END_YEAR, 0);

// Livello 2: Bagliore intermedio
axisLine.lineStyle(8, glowColor, 0.15); 
axisLine.moveTo(START_YEAR, 0);
axisLine.lineTo(END_YEAR, 0);

// Livello 3: Bagliore interno più intenso
axisLine.lineStyle(3, glowColor, 0.4); 
axisLine.moveTo(START_YEAR, 0);
axisLine.lineTo(END_YEAR, 0);

// Livello 4: Il "nucleo" della linea (sottile, giallo chiarissimo/bianco)
axisLine.lineStyle(1, 0xFFEEDD, 1); 
axisLine.moveTo(START_YEAR, 0);
axisLine.lineTo(END_YEAR, 0);

world.addChild(axisLine);

// 2. Event data
// const eventsData = [
//     { x: 0, label: "Big Bang", color: 0xFFD700 },
//     { x: 9260, label: "Nascita Sistema Solare", color: 0x00FFFF },
//     { x: 13800, label: "Oggi", color: 0x00FF00 }
// ];
// ####### Will be loaded from data.js file

// Array to store items to redraw (Text and Graphics)
const invariantItems = [];

// 3. Placing events on canvas
eventsData.forEach(event => {
    // Container for single event
    const evtContainer = new PIXI.Container();
    evtContainer.x = event.x;
    world.addChild(evtContainer);

    // Draw marker (ball)
    // const marker = new PIXI.Graphics();
    // marker.beginFill(event.color);
    // marker.drawCircle(0, 0, 6); // Radius 6
    // marker.endFill();
    // evtContainer.addChild(marker);

    // Invece di disegnare un solo cerchio...
    const marker = new PIXI.Graphics();
    
    // Alone del cerchio
    marker.beginFill(glowColor, 0.2); // event.color // Colore dell'evento, opacità 20%
    marker.drawCircle(0, 0, 12); // Raggio doppio
    marker.endFill();
    // Centro del cerchio
    marker.beginFill(0xFFEEDD, 1); // Opacità 100%
    marker.drawCircle(0, 0, 5); // Raggio normale
    marker.endFill();
    evtContainer.addChild(marker);

    // Event Text
    const text = new PIXI.Text(event.label, {
        fontFamily: 'Inter, sans-serif',
        fontSize: 14,
        fill: 0xFFFFFF,
        align: 'center'
    });
    text.anchor.set(0.5, 1); // Anchor point of textbox, middle bottom 
    text.y = -15; // Set text relative to parent y (y downwards so is above)
    evtContainer.addChild(text);

    // Date indication
    const dateText = new PIXI.Text(event.dateLabel, {
        fontFamily: 'Arial',
        fontSize: 11, // smaller
        fill: 0xAAAAAA, // light gray
        align: 'center'
    });
    
    dateText.anchor.set(0.5, 0);
    dateText.y = 35; // lower
    evtContainer.addChild(dateText);

    // Description
    // 1. Disegna la barretta verticale |
    const connectorLine = new PIXI.Graphics();
    connectorLine.lineStyle(1, 0x555555, 1); // Spessore 1, colore grigio scuro
    connectorLine.moveTo(0, 55); // Parte da Y=55 (sotto la data)
    connectorLine.lineTo(0, 75); // Arriva a Y=75 (lunga 20 pixel)
    evtContainer.addChild(connectorLine);

    // 2. Testo descrittivo con "Rettangolo invisibile" (Word Wrap)
    const descText = new PIXI.Text(event.description || "", {
        fontFamily: 'Inter, sans-serif',
        fontSize: 10,
        fill: 0x888888, // Grigio ancora più tenue
        align: 'center',
        wordWrap: true, // ABILITA L'A CAPO AUTOMATICO
        wordWrapWidth: 160, // LARGHEZZA DEL "RETTANGOLO INVISIBILE" (in pixel)
        lineHeight: 14 // Distanza tra le righe di testo
    });
    
    descText.anchor.set(0.5, 0); // Centrato orizzontalmente
    descText.x = 0;
    descText.y = 85; // Posizionato sotto la barretta
    
    evtContainer.addChild(descText);

    // Add container to list of element to inverse scale when zooming (if zoom in -> reduce element)
    invariantItems.push(evtContainer);
});

// Set stage to intercept clicks
app.stage.eventMode = 'static';
// Set hit area as whole screen (update during resize to match again)
app.stage.hitArea = new PIXI.Rectangle(0, 0, app.screen.width, app.screen.height);

let isDragging = false;
let dragStartX = 0;
let worldStartX = 0;

app.stage.on('pointerdown', (e) => {
    isDragging = true;
    dragStartX = e.global.x;
    worldStartX = world.x;
    document.body.style.cursor = 'grabbing';
});

app.stage.on('pointermove', (e) => {
    if (!isDragging) return;
    const dx = e.global.x - dragStartX;
    world.x = worldStartX + dx; // Muove solo sull'asse X
});

app.stage.on('pointerup', stopDrag);
app.stage.on('pointerupoutside', stopDrag);

function stopDrag() {
    isDragging = false;
    document.body.style.cursor = 'default';
}

// Zoom management
app.view.addEventListener('wheel', (e) => {
    e.preventDefault(); // Avoid page scroll
    
    // Zoom Intensity
    const zoomFactor = 1.1;
    const isZoomingIn = e.deltaY < 0;
    const scaleMultiplier = isZoomingIn ? zoomFactor : (1 / zoomFactor);

    // Where to zoom
    const mouseX = e.offsetX;
    
    // Compute at which coords the current pointer is (mouse position - world container position) / current scale
    const pointToZoom = (mouseX - world.x) / world.scale.x;

    // Applay new scale only along X, keep Y at scale 1 to avoid fatness of line
    world.scale.x *= scaleMultiplier;

    // Set zoom max scale to avoi crash
    const maxScale = 500000000000000000 //500000
    if(world.scale.x < initialScale / 2) world.scale.x = initialScale / 2; // Zoom out max
    if(world.scale.x > maxScale) world.scale.x = maxScale; // Zoom in max

    // Compute world container x position to avoid shift when zooming (mouse position - (pointed coordinate * world scale))
    // Formula: PosizioneMouseSchermo - (PuntoMondiale * NuovaScala)
    world.x = mouseX - (pointToZoom * world.scale.x);

    previousWorldX = world.x;
});

// Manage window resize
window.addEventListener('resize', () => {
    world.y = app.screen.height / 2; // Ricentra verticalmente
    app.stage.hitArea = new PIXI.Rectangle(0, 0, app.screen.width, app.screen.height);
});

// Ticker (loop for every frame) (es. 60 fps)
app.ticker.add(() => {
    // Invariant scaling: since we scale along X, the items would be streched horizontally
    // to avoid this, we apply them an inverse scaling factor
    const inverseScaleX = 1 / world.scale.x;
    
    invariantItems.forEach(item => {
        item.scale.x = inverseScaleX;
    });
    // Axis Y is fixed at scale 1

    // --- ANIMAZIONE STELLE ---
    
    // Calcoliamo di quanto l'utente ha trascinato l'asse in questo preciso millisecondo
    const deltaWorldX = world.x - previousWorldX;
    previousWorldX = world.x;

    stars.forEach(star => {
        // A. Sbrilluccichio (Twinkling) usando una funzione matematica seno
        star.alphaPhase += star.alphaSpeed;
        // L'opacità oscillerà fluidamente tra 0.2 e 1.0
        star.alpha = 0.2 + (Math.sin(star.alphaPhase) + 1) * 0.5 * 0.8; 

        // B. Movimento Parallasse
        // Le stelle si muovono seguendo il trascinamento (deltaWorldX), ma moltiplicato 
        // per la loro profondità. Le stelle grandi sembreranno più vicine e veloci.
        // Il "- 0.05" finale dà un piccolissimo movimento autonomo all'universo verso sinistra 
        // anche se l'utente è fermo.
        star.x += (deltaWorldX * star.parallaxDepth) - 0.05;

        // C. Effetto Pac-Man (Se escono dallo schermo tornano dal lato opposto)
        if (star.x < -10) {
            star.x = app.screen.width + 10; // Appare a destra
            star.y = Math.random() * app.screen.height; // Ad un'altezza nuova
        } else if (star.x > app.screen.width + 10) {
            star.x = -10; // Appare a sinistra
            star.y = Math.random() * app.screen.height;
        }
    });
});