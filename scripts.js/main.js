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

// Bg images
// const bgImagesLayer = new PIXI.Container();
// BG container
const bgContainer = new PIXI.Container();
// Main container (moved and scaled)
const world = new PIXI.Container();
// app.stage.addChild(bgImagesLayer);
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
    // Sort data by x coords
    eventsData.sort((a, b) => a.x - b.x);
    
    glowColor = 0xFFCC00;
    eventsData.forEach((event, index) => {
        // Container for single event
        const evtContainer = new PIXI.Container();
        evtContainer.x = event.x;
        world.addChild(evtContainer);

        // Compute distance to nearest neighbour
        const distPrev = index > 0 ? (event.x - eventsData[index - 1].x) : Infinity;
        const distNext = index < eventsData.length - 1 ? (eventsData[index + 1].x - event.x) : Infinity;
        const minDist = Math.min(distPrev, distNext);

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

        // Backgroud image if present
        // --- IMMAGINE MINIATURA (THUMBNAIL) ---
        let thumbnailSprite = null;
        if (event.bgImage) {
            thumbnailSprite = new PIXI.Sprite(); 
            // Ancoraggio: centro orizzontale, IN BASSO verticalmente
            thumbnailSprite.anchor.set(0.5, 1); 
            
            // La posizioniamo SOPRA il titolo (il titolo è a -15, la mettiamo a -40)
            thumbnailSprite.y = -40; 
            
            // La aggiungiamo direttamente al contenitore dell'evento!
            evtContainer.addChild(thumbnailSprite);
            
            // Caricamento asincrono
            PIXI.Assets.load(event.bgImage).then((texture) => {
                thumbnailSprite.texture = texture; 
                
                // La ridimensioniamo per essere larga 160px (come la descrizione)
                const targetWidth = 160;
                const scale = targetWidth / texture.width;
                thumbnailSprite.scale.set(scale); 
            });
        }

        // --- AGGIORNAMENTO DEL PUSH ---
        // Mettiamo in una lista tutti gli elementi che devono sfumare
        const elementsToFade = [connectorLine, descText, dateText];
        // Se l'immagine c'è, diciamo al sistema di sfumare anche quella!
        if (thumbnailSprite) elementsToFade.push(thumbnailSprite);

        invariantItems.push({   
            container: evtContainer,
            minDist: minDist,   
            elementsToFade: elementsToFade 
        });
    });

}

function setupInteractions() {
    app.stage.eventMode = 'static';
    app.stage.hitArea = new PIXI.Rectangle(0, 0, app.screen.width, app.screen.height);

    // --- NUOVO: MAPPA DEI TOCCHI ATTIVI ---
    const activePointers = new Map();

    // Variabili per il Drag (1 dito o mouse)
    let dragStartX = 0;
    let worldStartX = 0;

    // Variabili per il Pinch Zoom (2 dita)
    let initialPinchDistance = 0;
    let initialPinchScale = 0;
    let pinchPointToZoom = 0;

    app.stage.on('pointerdown', (e) => {
        // Registra il dito (o il click del mouse)
        activePointers.set(e.pointerId, { x: e.global.x, y: e.global.y });

        if (activePointers.size === 1) {
            // Inizia il trascinamento
            dragStartX = e.global.x;
            worldStartX = world.x;
            document.body.style.cursor = 'grabbing';
        } 
        else if (activePointers.size === 2) {
            // Inizia lo zoom
            const pointers = Array.from(activePointers.values());
            const p1 = pointers[0];
            const p2 = pointers[1];
            
            // Teorema di Pitagora per trovare la distanza iniziale tra le due dita
            initialPinchDistance = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            initialPinchScale = world.scale.x;
            
            // Trova il punto esatto in mezzo alle due dita (per zoomare lì)
            const pinchMidpointX = (p1.x + p2.x) / 2;
            pinchPointToZoom = (pinchMidpointX - world.x) / world.scale.x;
        }
    });

    app.stage.on('pointermove', (e) => {
        if (!activePointers.has(e.pointerId)) return;

        // Aggiorna la posizione di questo specifico dito
        activePointers.set(e.pointerId, { x: e.global.x, y: e.global.y });

        if (activePointers.size === 1) {
            // --- MODALITA' TRASCINAMENTO ---
            const dx = e.global.x - dragStartX;
            world.x = worldStartX + dx;
            world.previousX = world.x; // Previene il teletrasporto delle stelle
        } 
        else if (activePointers.size === 2) {
            // --- MODALITA' ZOOM A DUE DITA ---
            const pointers = Array.from(activePointers.values());
            const p1 = pointers[0];
            const p2 = pointers[1];
            
            const currentDistance = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            const scaleMultiplier = currentDistance / initialPinchDistance;
            
            // Applica e limita la scala
            let newScale = initialPinchScale * scaleMultiplier;
            const maxScale = 500000000000000000;
            if(newScale < initialScale / 2) newScale = initialScale / 2;
            if(newScale > maxScale) newScale = maxScale;
            
            world.scale.x = newScale;

            // Sposta l'asse per tenere fermo il punto tra le dita mentre si allargano
            const currentMidpointX = (p1.x + p2.x) / 2;
            world.x = currentMidpointX - (pinchPointToZoom * world.scale.x);
            world.previousX = world.x;
        }
    });

    const removePointer = (e) => {
        // Elimina il dito dalla mappa quando lo sollevi
        activePointers.delete(e.pointerId);
        
        if (activePointers.size === 1) {
            // "Recupero fluido": se sollevi un dito mentre zoomavi,
            // l'altro dito riprende istantaneamente a trascinare senza salti.
            const remainingPointer = Array.from(activePointers.values())[0];
            dragStartX = remainingPointer.x;
            worldStartX = world.x;
        } else if (activePointers.size === 0) {
            document.body.style.cursor = 'default';
        }
    };

    app.stage.on('pointerup', removePointer);
    app.stage.on('pointerupoutside', removePointer);
    app.stage.on('pointercancel', removePointer); // Cruciale su mobile (se appare una notifica o esci)

    // --- IL VECCHIO CODICE DELLO ZOOM CON LA ROTELLINA DEL MOUSE RESTA UGUALE ---
    app.view.addEventListener('wheel', (e) => {
        e.preventDefault(); 
        
        const zoomFactor = 1.1;
        const isZoomingIn = e.deltaY < 0;
        const scaleMultiplier = isZoomingIn ? zoomFactor : (1 / zoomFactor);
        const mouseX = e.offsetX;
        const pointToZoom = (mouseX - world.x) / world.scale.x;

        world.scale.x *= scaleMultiplier;

        const maxScale = 500000000000000000;
        if(world.scale.x < initialScale / 2) world.scale.x = initialScale / 2; 
        if(world.scale.x > maxScale) world.scale.x = maxScale; 

        world.x = mouseX - (pointToZoom * world.scale.x);
        world.previousX = world.x;
    });

    // Ridimensionamento finestra
    window.addEventListener('resize', () => {
        world.y = app.screen.height / 2; 
        app.stage.hitArea = new PIXI.Rectangle(0, 0, app.screen.width, app.screen.height);
    });
}


function updateScene() {
    // Invariant scaling: since we scale along X, the items would be streched horizontally
    // to avoid this, we apply them an inverse scaling factor
    const inverseScaleX = 1 / world.scale.x;

    const screenCenter = app.screen.width / 2;
    // NUOVO: Un corridoio di zoom invece di un limite netto
    const zoomFadeStart = initialScale * 10; // Inizia a comparire dolcemente qui
    const zoomFadeEnd = initialScale * 30;   // Arriva al 100% di visibilità qui

    
    invariantItems.forEach(item => {
        item.container.scale.x = inverseScaleX;

        // --- LOGICA DISSOLVENZA UNIFICATA (Testi e Immagini) ---
        const screenDist = item.minDist * world.scale.x;
        
        let targetAlpha = 0;
        if (screenDist > 160) {
            targetAlpha = 1;
        } else if (screenDist > 80) {
            targetAlpha = (screenDist - 80) / 80; 
        }
        
        // Applica l'opacità a tutto (descrizioni, barrette e miniature!)
        item.elementsToFade.forEach(el => el.alpha = targetAlpha);
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
