// =================================================================
// Global Variables for Randomization
// =================================================================
let canvasWidth = 700; // Initial width
let canvasHeight = 400; // Initial height
let rotationSpeed = 0.25; // Initial rotation speed
let hasBroken = false; // Flag to track if the 'break it' button has been clicked before

// =================================================================
// Tone.js Setup
// =================================================================
const limiter = new Tone.Limiter(-2).toDestination();

const reverb = new Tone.Reverb({
    decay: 3,
    wet: 0.1
}).connect(limiter);

const comp = new Tone.Compressor({
    threshold: -24,
    ratio: 3,
    attack: 0.02,
    release: 0.15
}).connect(reverb);

const panners = [];
const players = [];

function getRandomNumber(min, max) {
    return Math.random() * (max - min) + min;
}

const xRange = {
    min: -5,
    max: 5
};
const yRange = {
    min: -1,
    max: 1
};
const zRange = {
    min: 0,
    max: 10
};

function createPlayerPlusPanner(url, initialPositionX, initialPositionY, initialPositionZ) {
    const panner = new Tone.Panner3D({
        panningModel: "HRTF",
        positionX: initialPositionX,
        positionY: initialPositionY,
        positionZ: initialPositionZ,
    }).connect(comp);

    const player = new Tone.Player({
        url,
        loop: true,
    }).connect(panner);

    panners.push(panner);
    players.push(player);
}

createPlayerPlusPanner("./audio/Fossa/FOSSADRUM1.mp3", -2, 0, 0);
createPlayerPlusPanner("./audio/Fossa/FOSSADRUM2.mp3", 2, 0, 0.41086);
createPlayerPlusPanner("./audio/Fossa/FOSSADRUM3.mp3", -1.5, 0, 0.82);
createPlayerPlusPanner("./audio/Fossa/FOSSADRUM4.mp3", 1.5, 0, 1.2);
createPlayerPlusPanner("./audio/Fossa/FOSSADRUM5.mp3", -1, 0, 1.6);
createPlayerPlusPanner("./audio/Fossa/FOSSADRUM6.mp3", 1, 0, 2.06);
createPlayerPlusPanner("./audio/Fossa/FOSSADRUM7.mp3", -0.5, 0, 2.47);
createPlayerPlusPanner("./audio/Fossa/FOSSADRUM8.mp3", 0.5, 0, 2.8);
createPlayerPlusPanner("./audio/Fossa/FOSSAguitar.mp3", 0, 0, 3.29);
createPlayerPlusPanner("./audio/Fossa/FOSSAkorg.mp3", -2, 0, 3.7);
createPlayerPlusPanner("./audio/Fossa/FOSSAnord.mp3", 2, 0, 4.1);
createPlayerPlusPanner("./audio/Fossa/FOSSApiano.mp3", -1.2, 0, 4.5);
createPlayerPlusPanner("./audio/Fossa/FOSSAsax.mp3", 1.2, 0, 4.93);
createPlayerPlusPanner("./audio/Fossa/FOSSAtrumpet.mp3", -0.8, 0, 5.34);
createPlayerPlusPanner("./audio/Fossa/FOSSAxylo.mp3", 0.8, 0, 6.28);

// =================================================================
// UI and State Management
// =================================================================
let audioLoadedAndReady = false;
let audioContextStarted = false;
let audioStarted = false;

function showButtons() {
    const loadingWatermark = document.getElementById('loadingWatermark');
    const loadingText = document.getElementById('loadingText');
    const startButton = document.getElementById('startButton');
    const randomizeButton = document.getElementById('randomizeButton');

    if (loadingWatermark && loadingText && startButton && randomizeButton) {
        loadingText.textContent = "Ready to Play!";
        loadingWatermark.classList.add('loaded');
        startButton.style.display = 'block';
        randomizeButton.style.display = 'block';
        console.log("Start and Randomize buttons shown, spinner hidden.");
    }
}

function hideLoadingScreen() {
    const loadingWatermark = document.getElementById('loadingWatermark');
    if (loadingWatermark) {
        loadingWatermark.style.transition = 'opacity 0.5s ease-out';
        loadingWatermark.style.opacity = '0';
        loadingWatermark.addEventListener('transitionend', () => {
            loadingWatermark.style.display = 'none';
            console.log("Loading screen hidden.");
        }, {
            once: true
        });
    } else {
        console.warn("Loading watermark element not found.");
    }
}

function startAudioContextAndPlayback() {
    if (audioLoadedAndReady && !audioContextStarted) {
        console.log("Attempting to start audio context.");
        Tone.start().then(() => {
            console.log("Tone.context resumed successfully! 🔊");
            audioContextStarted = true;
            Tone.Transport.start();
            players.forEach(player => player.start());
            hideLoadingScreen();
        }).catch(e => {
            console.error("Error resuming Tone.context:", e);
        });
    } else if (audioContextStarted) {
        console.log("Audio context already started. Hiding loading screen.");
        hideLoadingScreen();
    }
}

/**
 * Inverts all colors on the page by adding a CSS filter to the body.
 */
function invertColors() {
    const body = document.body;
    if (body) {
        body.style.filter = 'invert(1)';
        body.style.transition = 'filter 0.5s ease-in-out';
        console.log("Colors inverted!");
    }
}

function randomizeAll() {
    // Invert colors on the first click
    if (!hasBroken) {
        invertColors();
        hasBroken = true;
    }

    // 1. Randomize Canvas Size
    canvasWidth = getRandomNumber(400, 1000);
    canvasHeight = getRandomNumber(300, 600);
    resizeCanvas(canvasWidth, canvasHeight);

    // 2. Randomize Rotation Speed
    rotationSpeed = getRandomNumber(0.1, 400);

    // 3. Randomize Audio Playback
    if (!audioContextStarted) {
        Tone.start().then(() => {
            audioContextStarted = true;
            randomizeAndStart(0, 0.1, 10.2);
            hideLoadingScreen();
        });
    } else {
        randomizeAndStart(0, 0.2, 20.2);
    }

    console.log(`Canvas resized to: ${canvasWidth}x${canvasHeight}`);
    console.log(`Rotation speed set to: ${rotationSpeed}`);
}

/**
 * Randomizes the starting time and playback rate of each player and starts the transport.
 * @param {number} maxOffset - The maximum possible delay in seconds for a stem.
 * @param {number} minRate - The minimum playback rate (e.g., 0.5 for half speed).
 * @param {number} maxRate - The maximum playback rate (e.g., 2 for double speed).
 */
function randomizeAndStart(maxOffset, minRate, maxRate) {
    if (Tone.Transport.state === 'started') {
        console.log("Audio already playing. Stopping before randomizing.");
        Tone.Transport.stop();
        players.forEach(player => player.stop());
    }

    players.forEach(player => {
        const randomDelay = getRandomNumber(0, maxOffset);
        const randomRate = getRandomNumber(minRate, maxRate);

        player.playbackRate = randomRate;
        player.start(`+${randomDelay}`);
        console.log(`Player starting at: +${randomDelay.toFixed(2)} seconds with speed: ${randomRate.toFixed(2)}x`);
    });

    Tone.Transport.start();
    console.log("Randomized playback started!");
}

// =================================================================
// DOM and Event Listeners
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content Loaded.");

    const startButton = document.getElementById('startButton');
    const randomizeButton = document.getElementById('randomizeButton');

    if (startButton) {
        startButton.addEventListener('click', startAudioContextAndPlayback);
        startButton.addEventListener('touchend', startAudioContextAndPlayback);
        console.log("Start button listeners attached.");
    } else {
        console.error("Start button not found!");
    }

    if (randomizeButton) {
        randomizeButton.addEventListener('click', randomizeAll);
        randomizeButton.addEventListener('touchend', randomizeAll);
        console.log("Randomize button listeners attached.");
    } else {
        console.error("Randomize button not found!");
    }

    Tone.loaded().then(() => {
        console.log("All Tone.Player audio files loaded!");
        audioLoadedAndReady = true;
        showButtons();
    }).catch(error => {
        console.error("Error loading audio files (Tone.loaded()):", error);
        showButtons();
        const loadingText = document.getElementById('loadingText');
        if (loadingText) loadingText.textContent = "Error loading audio. Try again?";
    });
});

// =================================================================
// p5.js Sketch
// =================================================================
let frameCount = 0;

function setRotation(angle) {
    Tone.Listener.forwardX.value = Math.sin(angle);
    Tone.Listener.forwardY.value = 0;
    Tone.Listener.forwardZ.value = Math.cos(angle);
}

let snake;

function setup() {
    createCanvas(canvasWidth, canvasHeight, WEBGL);
    angleMode(DEGREES);
    buildSnake();
    describe('A tiled plane of snake models');
}

function buildSnake() {
    if (snake) {
        freeGeometry(snake);
    }

    snake = buildGeometry(() => {
        colorMode(HSB, 100);
        fill(random(100), 50, 100);

        push();
        scale(1, 0.5, 1.4);
        sphere(50);
        pop();

        for (let mirrorX of [-1, 1]) {
            push();
            scale(mirrorX, 1, 1);
            fill('black');
            translate(20, -20, 10);
            sphere(10);
            pop();
        }
        translate(0, 0, 50);

        let numSegments = ceil(random(10, 30));
        for (let segment = 0; segment < numSegments; segment++) {
            rotateY(random(-60, 60));
            translate(0, 0, 50);
            push();
            rotateX(90);
            scale(1, 1, 0.5);
            let radius = map(segment, numSegments - 5, numSegments, 50, 0, true);
            cylinder(radius, 100);
            pop();
            translate(0, 0, 50);
        }
    });

    snake.normalize();
}

function draw() {
    background(255);
    noStroke();
    scale(1.5);
    rotateX(-45);
    rotateY(frameCount * rotationSpeed); // Use the global variable here
    frameCount++;

    const listenerAngle = frameCount * 0.0025;
    setRotation(listenerAngle);

    lights();
    specularMaterial('white');
    shininess(100);

    for (let x = -4; x <= 4; x += 1) {
        for (let z = -4; z <= 4; z += 1) {
            push();
            translate(x * 200, 0, z * 200);
            model(snake);
            pop();
        }
    }
}

function mousePressed() {
    buildSnake();

    const orbitRadius = 5;

    panners.forEach((panner, index) => {
        const angleOffset = (index / panners.length) * Math.PI * 2;
        const currentAngle = frameCount * 0.01 + angleOffset;

        panner.positionX.value = orbitRadius * Math.sin(currentAngle);
        panner.positionY.value = getRandomNumber(yRange.min, yRange.max);
        panner.positionZ.value = orbitRadius * Math.cos(currentAngle);
    });

    if (!audioContextStarted) {
        Tone.start().then(() => {
            console.log("Audio context started by canvas click!");
            audioContextStarted = true;
            Tone.Transport.start();
        }).catch(e => {
            console.error("Error starting Tone.js context:", e);
        });
    }
}