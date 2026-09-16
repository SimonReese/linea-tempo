// Global variables
// Timeline constants
const START_YEAR = 0; // Big Bang
const END_YEAR = 13800; // Today (in million years)
const TIMELINE_LENGTH = END_YEAR - START_YEAR;
// Array to store items to redraw (Text and Graphics)
const invariantItems = [];
// Stars
const stars = [];

// Init PixiJS application
const app = new PIXI.Application({
    resizeTo: window,
    backgroundColor: 0x050510,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    antialias: true
});
document.body.appendChild(app.view);

// BG container
const bgContainer = new PIXI.Container();
// Main container (moved and scaled)
const world = new PIXI.Container();
app.stage.addChild(bgContainer);
app.stage.addChild(world);

// Compute initial scale to have all the world, 5% margin left and right
const margin = app.screen.width * 0.1; 
const initialScale = (app.screen.width - margin) / TIMELINE_LENGTH;
// Intial container position
// vertically centered
world.y = app.screen.height / 2;
world.scale.x = initialScale;
world.x = margin / 2; // Move container half margin to center both sides
// Track axis movement
world.previousX = world.x; 

// Execute functions
createStarfield();
drawGlowingAxis();
drawEventsOnTimeline();
setupInteractions();
// Ticker (loop for every frame) (es. 60 fps)
app.ticker.add(updateScene);

/**
 * Creates stars backgound
 */
function createStarfield(numStars = 400) {
    // Perfomance trick: create a circle once and bake it as a texture to copy
    const starGraphics = new PIXI.Graphics();
    starGraphics.beginFill(0xFFFFFF);
    starGraphics.drawCircle(0, 0, 3); // Radius 3
    starGraphics.endFill();
    const starTexture = app.renderer.generateTexture(starGraphics);

    for (let i = 0; i < numStars; i++) {
        const star = new PIXI.Sprite(starTexture);
        
        // Random initial position of the sprite
        star.x = Math.random() * app.screen.width;
        star.y = Math.random() * app.screen.height;
        
        // Use depth to select size and speed of parallaxis movement
        // From 0.1 (further) to 0.8 (near)
        const depth = 0.1 + Math.random() * 0.7; 
        star.scale.set(depth * 0.5); 
        
        // Store star parameter inside sprite to use when moving the star
        star.parallaxDepth = depth;
        star.alphaPhase = Math.random() * Math.PI * 2; // Glow starting point
        star.alphaSpeed = 0.01 + Math.random() * 0.03; // Glow speed
        bgContainer.addChild(star);
        stars.push(star);
    }
}

function drawGlowingAxis(glowColor = 0xFFCC00) { // or 0xFF8800 for bright orange
    // 1. Draw timeline axis line
    const axisLine = new PIXI.Graphics();

    // Level 1: Outer glow (larger and almost transparent)
    axisLine.lineStyle(15, glowColor, 0.05); 
    axisLine.moveTo(START_YEAR, 0);
    axisLine.lineTo(END_YEAR, 0);

    // Level 2: Middle glow
    axisLine.lineStyle(8, glowColor, 0.15); 
    axisLine.moveTo(START_YEAR, 0);
    axisLine.lineTo(END_YEAR, 0);

    // Level 3: Inner intense glow
    axisLine.lineStyle(3, glowColor, 0.4); 
    axisLine.moveTo(START_YEAR, 0);
    axisLine.lineTo(END_YEAR, 0);

    // Level 4: Line core, thin and lighter yellow/ white
    axisLine.lineStyle(1, 0xFFEEDD, 1); 
    axisLine.moveTo(START_YEAR, 0);
    axisLine.lineTo(END_YEAR, 0);

    world.addChild(axisLine);
}

function drawEventsOnTimeline() {    
    glowColor = 0xFFCC00;
    eventsData.forEach(event => {
        // Container for single event
        const evtContainer = new PIXI.Container();
        evtContainer.x = event.x;
        world.addChild(evtContainer);

        // We draw two circles
        const marker = new PIXI.Graphics();
        // Outer
        marker.beginFill(glowColor, 0.2); // or event.color opacity 20%
        marker.drawCircle(0, 0, 12); // double radius
        marker.endFill();
        // Inner
        marker.beginFill(0xFFEEDD, 1); // Opacity 100%
        marker.drawCircle(0, 0, 5); // Normal radius
        marker.endFill();
        evtContainer.addChild(marker);

        // Event Text
        const text = new PIXI.Text(event.label, {
            fontFamily: 'Inter, sans-serif',
            fontSize: 20,
            fill: 0xFFFFFF,
            align: 'center'
        });
        text.anchor.set(0.5, 1); // Anchor point of textbox, middle bottom 
        text.y = -15; // Set text relative to parent y (y downwards so is above)
        evtContainer.addChild(text);

        // Date indication
        const dateText = new PIXI.Text(event.dateLabel, {
            fontFamily: 'Arial',
            fontSize: 16, // smaller
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
            fontSize: 16,
            fill: 0x888888, // Grigio ancora più tenue
            align: 'center',
            wordWrap: true, // ABILITA L'A CAPO AUTOMATICO
            wordWrapWidth: 160, // LARGHEZZA DEL "RETTANGOLO INVISIBILE" (in pixel)
            lineHeight: 18 // Distanza tra le righe di testo
        });
        
        descText.anchor.set(0.5, 0); // Centrato orizzontalmente
        descText.x = 0;
        descText.y = 85; // Posizionato sotto la barretta
        
        evtContainer.addChild(descText);

        // Add container to list of element to inverse scale when zooming (if zoom in -> reduce element)
        invariantItems.push(evtContainer);
    });

}

function setupInteractions() {
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

        world.previousX = world.x;
    });

    // Manage window resize
    window.addEventListener('resize', () => {
        world.y = app.screen.height / 2; // Ricentra verticalmente
        app.stage.hitArea = new PIXI.Rectangle(0, 0, app.screen.width, app.screen.height);
    });
}


function updateScene() {
    // Invariant scaling: since we scale along X, the items would be streched horizontally
    // to avoid this, we apply them an inverse scaling factor
    const inverseScaleX = 1 / world.scale.x;
    
    invariantItems.forEach(item => {
        item.scale.x = inverseScaleX;
    });
    // Axis Y is fixed at scale 1

    // --- ANIMAZIONE STELLE ---
    
    // Calcoliamo di quanto l'utente ha trascinato l'asse in questo preciso millisecondo
    const deltaWorldX = world.x - world.previousX;
    world.previousX = world.x;

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
}
