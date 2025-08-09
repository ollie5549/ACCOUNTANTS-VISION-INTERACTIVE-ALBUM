// =================================================================
// Global Variables for Fossa
// =================================================================
let fossaCanvasWidth = 700;
let fossaCanvasHeight = 400;
let fossaRotationSpeed = 0.25;
let fossaHasBroken = false;
const pngImages = [{ url: './assets/dragon1.png', width: 250, height: 350 }, { url: './assets/dragon2.png', width: 400, height: 300 }, { url: './assets/dragon3.png', width: 300, height: 300 }, { url: './assets/dragon4.png', width: 500, height: 200 },];
let selectedImage;
let selectedImageWidth = 150;
let selectedImageHeight = 150;
let imageIsReady = false;
let fossaPlayers = [];
let fossaPanners = [];
const xRange = { min: -5, max: 5 };
const yRange = { min: -1, max: 1 };
const zRange = { min: 0, max: 10 };

// =================================================================
// Global Variables for Nowhere
// =================================================================
const GRID_COLS = 16;
const GRID_ROWS = 4;
let cellWidth, cellHeight, cellDepth;
let boxes = [];
let audioOffTimers = [];
let allNowherePlayers;
let pannerVelocities = [];
let currentStep = 0;
let lastDraggedCell = { row: -1, col: -1 };
let nowhereHasBroken = false;
let ambientPanners = [];
let glitchPanner, hihatPanner, snarePanner, kickPanner;
let p5CanvasElement;

// =================================================================
// Global Variables for Shared State
// =================================================================
let audioLoadedAndReady = false;
let audioContextStarted = false;
let isNowhereMode = false;
let modeToggle;

// =================================================================
// Tone.js Setup
// =================================================================
const limiter = new Tone.Limiter(-2).toDestination();
const reverb = new Tone.Reverb({ decay: 3, wet: 0.1 }).connect(limiter);
const comp = new Tone.Compressor({ threshold: -24, ratio: 3, attack: 0.02, release: 0.15 }).connect(reverb);

// Fossa Audio Players and Panners
function createFossaPlayerPlusPanner(url, initialPositionX, initialPositionY, initialPositionZ) {
    const panner = new Tone.Panner3D({
        panningModel: "HRTF",
        positionX: initialPositionX,
        positionY: initialPositionY,
        positionZ: initialPositionZ,
    }).connect(comp);
    const player = new Tone.Player({ url, loop: true, }).connect(panner);
    fossaPanners.push(panner);
    fossaPlayers.push(player);
}
createFossaPlayerPlusPanner("./audio/Fossa/FOSSADRUM1.mp3", -2, 0, 0);
createFossaPlayerPlusPanner("./audio/Fossa/FOSSADRUM2.mp3", 2, 0, 0.41086);
createFossaPlayerPlusPanner("./audio/Fossa/FOSSADRUM3.mp3", -1.5, 0, 0.82);
createFossaPlayerPlusPanner("./audio/Fossa/FOSSADRUM4.mp3", 1.5, 0, 1.2);
createFossaPlayerPlusPanner("./audio/Fossa/FOSSADRUM5.mp3", -1, 0, 1.6);
createFossaPlayerPlusPanner("./audio/Fossa/FOSSADRUM6.mp3", 1, 0, 2.06);
createFossaPlayerPlusPanner("./audio/Fossa/FOSSADRUM7.mp3", -0.5, 0, 2.47);
createFossaPlayerPlusPanner("./audio/Fossa/FOSSADRUM8.mp3", 0.5, 0, 2.8);
createFossaPlayerPlusPanner("./audio/Fossa/FOSSAguitar.mp3", 0, 0, 3.29);
createFossaPlayerPlusPanner("./audio/Fossa/FOSSAkorg.mp3", -2, 0, 3.7);
createFossaPlayerPlusPanner("./audio/Fossa/FOSSAnord.mp3", 2, 0, 4.1);
createFossaPlayerPlusPanner("./audio/Fossa/FOSSApiano.mp3", -1.2, 0, 4.5);
createFossaPlayerPlusPanner("./audio/Fossa/FOSSAsax.mp3", 1.2, 0, 4.93);
createFossaPlayerPlusPanner("./audio/Fossa/FOSSAtrumpet.mp3", -0.8, 0, 5.34);
createFossaPlayerPlusPanner("./audio/Fossa/FOSSAxylo.mp3", 0.8, 0, 6.28);

// Nowhere Audio Players and Panners
const allUrls = {};
for (let i = 1; i <= 14; i++) { allUrls[`ambient${i}`] = `./audio/Nowhere/${i}.mp3`; }
for (let i = 1; i <= 64; i++) { allUrls[`glitch${i}`] = `./audio/Nowhere/glitch-${i}.mp3`; }
for (let i = 1; i <= 4; i++) { allUrls[`hihat${i}`] = `./audio/Nowhere/hihat-${i}.mp3`; }
for (let i = 1; i <= 5; i++) { allUrls[`SNARE${i}`] = `./audio/Nowhere/SNARE_${i}.wav`; }
for (let i = 1; i <= 7; i++) { allUrls[`KICK${i}`] = `./audio/Nowhere/KICK_${i}.wav`; }
for (let i = 0; i < 14; i++) {
    const panner = new Tone.Panner3D({ panningModel: "HRTF", positionX: getRandomNumber(-5, 5), positionY: getRandomNumber(-3, 3), positionZ: getRandomNumber(-2, 2), refDistance: 0.5 }).connect(comp);
    ambientPanners.push(panner);
}
glitchPanner = new Tone.Panner3D({ panningModel: "HRTF", positionX: getRandomNumber(-5, 5), positionY: getRandomNumber(-3, 3), positionZ: getRandomNumber(-2, 2), refDistance: 0.5 }).connect(comp);
hihatPanner = new Tone.Panner3D({ panningModel: "HRTF", positionX: getRandomNumber(-5, 5), positionY: getRandomNumber(-3, 3), positionZ: getRandomNumber(-2, 2), refDistance: 0.5 }).connect(comp);
snarePanner = new Tone.Panner3D({ panningModel: "HRTF", positionX: getRandomNumber(-5, 5), positionY: getRandomNumber(-3, 3), positionZ: getRandomNumber(-2, 2), refDistance: 0.5 }).connect(comp);
kickPanner = new Tone.Panner3D({ panningModel: "HRTF", positionX: getRandomNumber(-5, 5), positionY: getRandomNumber(-3, 3), positionZ: getRandomNumber(-2, 2), refDistance: 0.5 }).connect(comp);

// =================================================================
// UI and State Management
// =================================================================
function showButtons() {
    const loadingWatermark = document.getElementById('loadingWatermark');
    if (loadingWatermark) loadingWatermark.style.display = 'none';
    document.getElementById('startButton').style.display = 'block';
    document.getElementById('randomizeButton').style.display = 'block';
    modeToggle = document.getElementById('mode-toggle');
    modeToggle.style.display = 'block';
}

function hideLoadingScreen() {
    const loadingWatermark = document.getElementById('loadingWatermark');
    if (loadingWatermark) {
        loadingWatermark.style.transition = 'opacity 0.5s ease-out';
        loadingWatermark.style.opacity = '0';
        loadingWatermark.addEventListener('transitionend', () => {
            loadingWatermark.style.display = 'none';
        }, { once: true });
    }
}

function handleStartButtonClick() {
    if (!audioLoadedAndReady) {
        console.warn("Audio not yet loaded. Please wait.");
        return;
    }
    if (!audioContextStarted) {
        Tone.start().then(() => {
            audioContextStarted = true;
            Tone.Transport.start();
            if (isNowhereMode) {
                startNowhereAudio();
            } else {
                startFossaAudio();
            }
            hideLoadingScreen();
        }).catch(e => {
            console.error("Error starting Tone.context:", e);
        });
    } else {
        hideLoadingScreen();
    }
}

function handleRandomizeButtonClick() {
    if (!audioLoadedAndReady) {
        console.warn("Audio not yet loaded. Please wait.");
        return;
    }
    if (!audioContextStarted) {
        handleStartButtonClick();
    }
    if (isNowhereMode) {
        randomizeNowhere();
    } else {
        randomizeFossa();
    }
}

function toggleMode() {
    Tone.Transport.stop();
    if (isNowhereMode) {
        if (allNowherePlayers) {
            allNowherePlayers.forEach(player => player.stop());
        }
        modeToggle.textContent = 'Switch Mode (Nowhere)';
    } else {
        fossaPlayers.forEach(player => player.stop());
        modeToggle.textContent = 'Switch Mode (Fossa)';
    }
    isNowhereMode = !isNowhereMode;
    Tone.Transport.bpm.value = 120;
    if (isNowhereMode) {
        setupNowhere();
        if (audioContextStarted) startNowhereAudio();
    } else {
        setupFossa();
        if (audioContextStarted) startFossaAudio();
    }
    if ((isNowhereMode && nowhereHasBroken) || (!isNowhereMode && fossaHasBroken)) {
        invertColors();
    } else {
        document.body.style.filter = 'none';
    }
}

// --- Fossa Logic ---
function startFossaAudio() {
    fossaPlayers.forEach(player => player.start());
    Tone.Transport.bpm.value = 120;
}
function randomizeFossa() {
    if (!fossaHasBroken) { invertColors(); fossaHasBroken = true; }
    fossaCanvasWidth = getRandomNumber(400, 1000);
    fossaCanvasHeight = getRandomNumber(300, 600);
    resizeCanvas(fossaCanvasWidth, fossaCanvasHeight);
    fossaRotationSpeed = getRandomNumber(0.1, 400);
    selectRandomImage();
    if (audioContextStarted) {
        Tone.Transport.stop();
        fossaPlayers.forEach(player => {
            player.stop();
            const randomDelay = getRandomNumber(0, 0.2);
            const randomRate = getRandomNumber(0.3, 2.5);
            player.playbackRate = randomRate;
            player.start(`+${randomDelay}`);
        });
        Tone.Transport.start();
    }
}
function handleFossaCanvasPress() {
    selectRandomImage();
    const orbitRadius = 5;
    fossaPanners.forEach((panner, index) => {
        const angleOffset = (index / fossaPanners.length) * Math.PI * 2;
        const currentAngle = frameCount * 0.01 + angleOffset;
        panner.positionX.value = orbitRadius * Math.sin(currentAngle);
        panner.positionY.value = getRandomNumber(yRange.min, yRange.max);
        panner.positionZ.value = orbitRadius * Math.cos(currentAngle);
    });
}
function selectRandomImage() {
    imageIsReady = false;
    const randomIndex = floor(random(pngImages.length));
    const imageInfo = pngImages[randomIndex];
    selectedImage = loadImage(imageInfo.url, () => {
        selectedImageWidth = imageInfo.width;
        selectedImageHeight = imageInfo.height;
        imageIsReady = true;
    }, (error) => { console.error(`Failed to load image: ${error}`); });
}
function fossaDraw() {
    background(255);
    noStroke();
    scale(1.5);
    rotateX(-45);
    rotateY(frameCount * fossaRotationSpeed);
    const listenerAngle = frameCount * 0.0025;
    Tone.Listener.forwardX.value = Math.sin(listenerAngle);
    Tone.Listener.forwardY.value = 0;
    Tone.Listener.forwardZ.value = Math.cos(listenerAngle);
    lights();
    specularMaterial('white');
    shininess(100);
    if (imageIsReady) {
        texture(selectedImage);
        for (let x = -4; x <= 4; x += 1) {
            for (let z = -4; z <= 4; z += 1) {
                push();
                translate(x * (selectedImageWidth + 20), 0, z * (selectedImageHeight + 20));
                plane(selectedImageWidth, selectedImageHeight);
                pop();
            }
        }
    } else {
        fill(200);
        for (let x = -4; x <= 4; x += 1) {
            for (let z = -4; z <= 4; z += 1) {
                push();
                translate(x * (150 + 20), 0, z * (150 + 20));
                plane(150, 150);
                pop();
            }
        }
    }
}
function setupFossa() {
    resizeCanvas(fossaCanvasWidth, fossaCanvasHeight, WEBGL);
    angleMode(DEGREES);
    selectRandomImage();
}

// --- Nowhere Logic ---
function startNowhereAudio() {
    let startTime = Tone.now() + 0.1;
    for (let i = 1; i <= 14; i++) {
        const player = allNowherePlayers.player(`ambient${i}`);
        if(player) {
           player.connect(ambientPanners[i - 1]);
           player.loop = true;
           player.start(startTime);
        } else {
            console.warn(`Ambient player ${i} not found.`);
        }
    }
    Tone.Transport.bpm.value = 61;
    Tone.Transport.scheduleOnce((time) => { Tone.Transport.bpm.setValueAtTime(102, time); }, "4:2:0");
    Tone.Transport.start(startTime);
}
function randomizeNowhere() {
    if (!nowhereHasBroken) { invertColors(); nowhereHasBroken = true; }
    for (let b of boxes) {
        b.vx = getRandomNumber(-0.5, 0.5);
        b.vy = getRandomNumber(-0.5, 0.5);
        b.vrz = getRandomNumber(-0.01, 0.01);
    }
    const allPanners = [...ambientPanners, glitchPanner, hihatPanner, snarePanner, kickPanner];
    allPanners.forEach(panner => {
        panner.positionX.value = getRandomNumber(-5, 5);
        panner.positionY.value = getRandomNumber(-3, 3);
        panner.positionZ.value = getRandomNumber(-2, 2);
    });
    pannerVelocities = allPanners.map(() => ({
        x: getRandomNumber(-0.5, 0.5), y: getRandomNumber(-0.5, 0.5), z: getRandomNumber(-0.5, 0.5),
    }));
}
function setupNowhere() {
    resizeCanvas(700, 400, WEBGL);
    cellWidth = width / GRID_COLS;
    cellHeight = height / GRID_ROWS;
    cellDepth = 50;
    boxes = [];
    for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
            boxes.push({ x: (c * cellWidth) + cellWidth / 2, y: (r * cellHeight) + cellHeight / 2, z: 0, vx: 0, vy: 0, vz: 0, vrx: 0, vry: 0, vrz: 0, gridRow: r, gridCol: c, audioActive: false, visualActive: 0 });
        }
    }
}
function nowhereDraw() {
    background(0);
    translate(-width / 2, -height / 2);
    for (let b of boxes) {
        push();
        if (nowhereHasBroken) {
            b.x += b.vx;
            b.y += b.vy;
            b.vrz += random(-0.01, 0.01);
            if (b.x > width || b.x < 0) { b.vx *= -1; }
            if (b.y > height || b.y < 0) { b.vy *= -1; }
            translate(b.x, b.y, b.z);
            rotateZ(b.vrz);
        } else {
            translate(b.x, b.y, b.z);
            rotateX(frameCount * 0.01 * (b.gridRow + 1) / GRID_ROWS);
            rotateY(frameCount * 0.01 * (b.gridCol + 1) / GRID_COLS);
        }
        if (b.gridCol === currentStep && Tone.Transport.state === 'started') { emissiveMaterial(255, 100, 0); }
        else if (b.audioActive) { emissiveMaterial(0, 200, 200); }
        else { fill(150, 150, 150); }
        box(cellWidth * 0.9, cellHeight * 0.9, cellDepth);
        pop();
    }
    if (nowhereHasBroken) {
        const allPanners = [...ambientPanners, glitchPanner, hihatPanner, snarePanner, kickPanner];
        allPanners.forEach((panner, index) => {
            const vel = pannerVelocities[index];
            const newX = panner.positionX.value + vel.x * 0.01;
            const newY = panner.positionY.value + vel.y * 0.01;
            const newZ = panner.positionZ.value + vel.z * 0.01;
            panner.positionX.value = Math.min(Math.max(newX, -5), 5);
            panner.positionY.value = Math.min(Math.max(newY, -3), 3);
            panner.positionZ.value = Math.min(Math.max(newZ, -2), 2);
        });
    }
}
function getGridCell(x, y) {
    if (x < 0 || x > width || y < 0 || y > height) { return { col: -1, row: -1 }; }
    let col = floor(map(x, 0, width, 0, GRID_COLS));
    let row = floor(map(y, 0, height, 0, GRID_ROWS));
    return { col, row };
}
function toggleSequencerCell(col, row) {
    if (col === -1 || row === -1) return;
    const b = boxes.find(box => box.gridCol === col && box.gridRow === row);
    if (!b) return;
    b.audioActive = !b.audioActive;
    b.visualActive = b.audioActive ? 1 : 0;
}
function checkFloatingBoxClick(x, y) {
    for (let b of boxes) {
        const distance = dist(x, y, b.x, b.y);
        const hitDistance = cellWidth * 0.7;
        if (distance < hitDistance) {
            toggleSequencerCell(b.gridCol, b.gridRow);
            return true;
        }
    }
    return false;
}
function getRandomNumber(min, max) { return Math.random() * (max - min) + min; }
function invertColors() {
    const body = document.body;
    if (body) {
        body.style.filter = 'invert(1)';
        body.style.transition = 'filter 0.5s ease-in-out';
    }
}

// =================================================================
// Unified p5.js Sketch
// =================================================================
function preload() {
    selectRandomImage();
}

function setup() {
    const canvasContainer = document.getElementById('canvas-container');
    const p5Canvas = createCanvas(700, 400, WEBGL);
    if (canvasContainer) {
        p5Canvas.parent(canvasContainer);
        p5CanvasElement = p5Canvas.elt;
        p5CanvasElement.addEventListener('touchstart', (event) => {
            event.preventDefault();
            if (isNowhereMode) {
                if (nowhereHasBroken) checkFloatingBoxClick(touches[0].x, touches[0].y);
                else { let { col, row } = getGridCell(touches[0].x, touches[0].y); toggleSequencerCell(col, row); }
            } else {
                handleFossaCanvasPress();
            }
            if (!audioContextStarted) handleStartButtonClick();
        }, { passive: false });
    }
    angleMode(DEGREES);
    setupFossa();
}

function draw() {
    if (isNowhereMode) {
        nowhereDraw();
    } else {
        fossaDraw();
    }
}

function mousePressed() {
    if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
        if (isNowhereMode) {
            if (nowhereHasBroken) { checkFloatingBoxClick(mouseX, mouseY); }
            else { let { col, row } = getGridCell(mouseX, mouseY); toggleSequencerCell(col, row); lastDraggedCell = { row: row, col: col }; }
        } else {
            handleFossaCanvasPress();
        }
        if (!audioContextStarted) handleStartButtonClick();
    }
    return false;
}

function touchStarted() {
    return false;
}

function mouseDragged() {
    if (isNowhereMode && !nowhereHasBroken) {
        let { col, row } = getGridCell(mouseX, mouseY);
        if (col !== lastDraggedCell.col || row !== lastDraggedCell.row) {
            toggleSequencerCell(col, row);
            lastDraggedCell = { row: row, col: col };
        }
    }
}
// ... (all the global variables, Tone.js setup, and Fossa/Nowhere logic remain the same) ...

// =================================================================
// DOM and Event Listeners
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('startButton');
    const randomizeButton = document.getElementById('randomizeButton');
    const modeToggle = document.getElementById('mode-toggle');

    if (startButton) {
        startButton.addEventListener('click', handleStartButtonClick);
        startButton.addEventListener('touchend', handleStartButtonClick);
    }
    if (randomizeButton) {
        randomizeButton.addEventListener('click', handleRandomizeButtonClick);
        randomizeButton.addEventListener('touchend', handleRandomizeButtonClick);
    }
    if (modeToggle) {
        modeToggle.addEventListener('click', toggleMode);
        modeToggle.addEventListener('touchend', toggleMode);
    }

    allNowherePlayers = new Tone.Players({ urls: allUrls, }).connect(comp);

    // CRITICAL FIX: The sequencer logic is now inside the .then() block.
    // This guarantees that all audio players are loaded before being used.
    Tone.loaded().then(() => {
        console.log("All audio files for both Fossa and Nowhere loaded!");
        audioLoadedAndReady = true;
        showButtons();

        Tone.Transport.scheduleRepeat((time) => {
            if (!isNowhereMode || !audioContextStarted || !allNowherePlayers) return;
            currentStep = (currentStep + 1) % GRID_COLS;
            const activeBoxesInStep = boxes.filter(b => b.gridCol === currentStep && b.audioActive);
            activeBoxesInStep.forEach((b, index) => {
                const offset = index * 0.001;
                const startTime = Tone.Time(time).toSeconds() + offset;
                let playerToPlay, pannerToUse;
                if (b.gridRow === 0) { playerToPlay = allNowherePlayers.player(`glitch${floor(random(1, 65))}`); pannerToUse = glitchPanner; }
                else if (b.gridRow === 1) { playerToPlay = allNowherePlayers.player(`hihat${floor(random(1, 5))}`); pannerToUse = hihatPanner; }
                else if (b.gridRow === 2) { playerToPlay = allNowherePlayers.player(`SNARE${floor(random(1, 6))}`); pannerToUse = snarePanner; }
                else if (b.gridRow === 3) { playerToPlay = allNowherePlayers.player(`KICK${floor(random(1, 8))}`); pannerToUse = kickPanner; }
                if (playerToPlay) { playerToPlay.connect(pannerToUse); playerToPlay.start(startTime); }
            });
        }, "16n");

    }).catch(error => {
        console.error("Error loading audio files:", error);
    });
});