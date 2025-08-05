// =================================================================
// Global Flags and State
// =================================================================
let paths = [];
let framesBetweenParticles = 5;
let nextParticleFrame = 0;
let previousParticlePosition;
let particleFadeFrames = 700;

const GRID_COLS = 16;
const GRID_ROWS = 4;
let cellWidth;
let cellHeight;
let cellDepth;

let sequencerGridVisual = [];
let sequencerGridAudio = [];
let audioOffTimers = [];

let keys; // Tone.Players instance
let currentStep = 0;
let lastDraggedCell = {
    row: -1,
    col: -1
};
let audioStarted = false;
let audioLoadedAndReady = false;
let hasBroken = false; // Flag to track if the 'break it' button has been clicked before

// =================================================================
// Tone.js Audio Setup
// =================================================================
const limiter = new Tone.Limiter(-2).toDestination();

const reverb = new Tone.Reverb({
    decay: 3,
    wet: 0.5
}).connect(limiter);

const comp = new Tone.Compressor({
    threshold: -24,
    ratio: 3,
    attack: 0.02,
    release: 0.15
}).connect(reverb);

const player = new Tone.Player("./audio/Nowhere/NOWHERE.mp3")
    .connect(comp);
player.sync().start(0);
player.autostart = true;

keys = new Tone.Players({
    urls: {
        0: "agogoHigh.mp3",
        1: "agogoLow.mp3",
        2: "snare.mp3",
        3: "kick.mp3",
    },
    fadeOut: "64n",
    baseUrl: `./audio/Nowhere/`,
}).connect(comp);

// --- Randomization Function for Stems ---
/**
 * Randomizes the starting time and playback rate of each player and restarts the transport.
 * @param {number} maxOffset - The maximum possible delay in seconds for a stem.
 * @param {number} minRate - The minimum playback rate.
 * @param {number} maxRate - The maximum playback rate.
 */
function randomizeAndStart(maxOffset = 0, minRate = 0.09, maxRate = 0.5) {
    if (Tone.Transport.state === 'started') {
        console.log("Audio already playing. Stopping before randomizing.");
        Tone.Transport.stop();
        player.stop();
        // Correct way to iterate over Tone.Players
        for (let i in keys.players) {
            keys.player(i).stop();
        }
    }

    const randomTempo = getRandomNumber(60, 150);
    Tone.Transport.bpm.value = randomTempo;

    player.playbackRate = getRandomNumber(minRate, maxRate);
    player.start(`+${getRandomNumber(0, maxOffset)}`);

    // Correct way to iterate over Tone.Players
    for (let i in keys.players) {
        const randomRate = getRandomNumber(minRate, maxRate);
        keys.player(i).playbackRate = randomRate;
    }

    Tone.Transport.start();
    console.log(`Randomized playback started! Tempo: ${randomTempo.toFixed(2)} BPM`);
}


// --- DOMContentLoaded for Loading & Initial Setup ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content Loaded.");

    const startButton = document.getElementById('startButton');
    const randomizeButton = document.getElementById('randomizeButton');

    if (startButton) {
        startButton.addEventListener('click', handleStartButtonClick);
        startButton.addEventListener('touchend', handleStartButtonClick);
    } else {
        console.error("Start button not found!");
    }

    if (randomizeButton) {
        randomizeButton.addEventListener('click', handleRandomizeButtonClick);
        randomizeButton.addEventListener('touchend', handleRandomizeButtonClick);
    } else {
        console.error("Randomize button not found!");
    }

    Tone.loaded().then(() => {
        console.log("All audio files loaded!");
        audioLoadedAndReady = true;
        const loadingWatermark = document.getElementById('loadingWatermark');
        const randomizeButton = document.getElementById('randomizeButton');
        const startButton = document.getElementById('startButton');
        const loadingText = document.getElementById('loadingText');

        if (loadingWatermark) {
            loadingWatermark.style.display = 'none';
        }
        if (startButton) {
            startButton.style.display = 'block';
        }
        if (randomizeButton) {
            randomizeButton.style.display = 'block';
        }
        if (loadingText) {
            loadingText.textContent = "Ready to Play!";
        }
    }).catch(error => {
        console.error("Error loading audio files:", error);
        const loadingWatermark = document.getElementById('loadingWatermark');
        if (loadingWatermark) {
            loadingWatermark.innerHTML = '<p style="color: red;">Error Loading Audio. Please refresh.</p>';
        }
    });
});

// Helper function
function getRandomNumber(min, max) {
    return Math.random() * (max - min) + min;
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

// =================================================================
// P5.js Setup
// =================================================================
function setup() {
    createCanvas(700, 400, WEBGL);

    cellWidth = width / GRID_COLS;
    cellHeight = height / GRID_ROWS;
    cellDepth = 50;

    for (let r = 0; r < GRID_ROWS; r++) {
        sequencerGridVisual[r] = [];
        sequencerGridAudio[r] = [];
        audioOffTimers[r] = [];
        for (let c = 0; c < GRID_COLS; c++) {
            sequencerGridVisual[r][c] = 0;
            sequencerGridAudio[r][c] = false;
            audioOffTimers[r][c] = 0;
        }
    }

    previousParticlePosition = createVector();
    describe(
        'A 3D grid of boxes representing a sequencer. When a box is activated, it lights up and rotates. Mouse interaction creates a trail of particles.'
    );

    Tone.Transport.scheduleRepeat((time) => {
        currentStep = (currentStep + 1) % GRID_COLS;

        for (let r = 0; r < GRID_ROWS; r++) {
            if (sequencerGridAudio[r][currentStep]) {
                keys.player(r).start(time);
            }
        }
    }, "16n");
}


function draw() {
    background(0);
    // Add some camera control for 3D effect
    // orbitControl();

    // Center the grid
    translate(-width / 2, -height / 2);

    for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
            let x = c * cellWidth;
            let y = r * cellHeight;
            let z = 0;

            if (sequencerGridVisual[r][c] > 0) {
                sequencerGridVisual[r][c]--;
            }

            if (audioOffTimers[r][c] > 0) {
                audioOffTimers[r][c]--;
                if (audioOffTimers[r][c] === 0) {
                    sequencerGridAudio[r][c] = false;
                }
            }

            let opacity = map(sequencerGridVisual[r][c], 0, particleFadeFrames, 0, 55);

            push();
            translate(x + cellWidth / 2, y + cellHeight / 2, z);
            // Rotate boxes for a more dynamic feel
            rotateX(frameCount * 0.01 * (r + 1) / GRID_ROWS);
            rotateY(frameCount * 0.01 * (c + 1) / GRID_COLS);

            if (c === currentStep && Tone.Transport.state === 'started') {
                emissiveMaterial(255, 100, 0); // Active step
            } else if (sequencerGridAudio[r][c]) {
                emissiveMaterial(0, 200, 200); // Activated cell
            } else {
                if (opacity > 0) {
                    emissiveMaterial(0, 200, 200, opacity);
                } else {
                    normalMaterial(); // Inactive cell
                }
            }

            box(cellWidth * 0.9, cellHeight * 0.9, cellDepth);
            pop();
        }
    }

    for (let path of paths) {
        path.update();
        path.display();
    }
}

function toggleSequencerCell(col, row) {
    if (!sequencerGridAudio || !sequencerGridAudio[row] || !sequencerGridVisual || !sequencerGridVisual[row] || !audioOffTimers || !audioOffTimers[row]) {
        console.warn("Grids not fully initialized yet. Ignoring interaction.");
        return;
    }

    if (col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS) {
        sequencerGridAudio[row][col] = !sequencerGridAudio[row][col];

        if (sequencerGridAudio[row][col]) {
            sequencerGridVisual[row][col] = particleFadeFrames;
            audioOffTimers[row][col] = particleFadeFrames;
        } else {
            sequencerGridVisual[row][col] = 0;
            audioOffTimers[row][col] = 0;
        }
    }
}

function getGridCell(x, y) {
    let col = floor(x / cellWidth);
    let row = floor(y / cellHeight);
    return {
        col,
        row
    };
}

function mousePressed() {
    nextParticleFrame = frameCount;
    paths.push(new Path());

    let {
        col,
        row
    } = getGridCell(mouseX, mouseY);
    toggleSequencerCell(col, row);

    lastDraggedCell = {
        row: row,
        col: col
    };

    if (!audioStarted) {
        Tone.start().then(() => {
            console.log("Audio context started by canvas click!");
            audioStarted = true;
            Tone.Transport.bpm.value = 61;
            Tone.Transport.start();
        }).catch(e => {
            console.error("Error starting Tone.js context:", e);
        });
    }

    return false;
}

function touchStarted() {
    if (touches.length > 0) {
        nextParticleFrame = frameCount;
        paths.push(new Path());

        let {
            col,
            row
        } = getGridCell(touches[0].x, touches[0].y);
        toggleSequencerCell(col, row);

        lastDraggedCell = {
            row: row,
            col: col
        };

        if (!audioStarted) {
            Tone.start().then(() => {
                console.log("Audio context started by canvas touch!");
                audioStarted = true;
                Tone.Transport.bpm.value = 61;
                Tone.Transport.start();
            }).catch(e => {
                console.error("Error starting Tone.js context:", e);
            });
        }
    }

    return false;
}

function handleStartButtonClick() {
    if (!audioLoadedAndReady) {
        console.warn("Start button clicked, but audio not yet loaded. Please wait.");
        return;
    }

    if (!audioStarted) {
        Tone.start().then(() => {
            console.log("Audio context started by start button!");
            audioStarted = true;
            Tone.Transport.start();
            player.start();
        }).catch(e => {
            console.error("Error starting Tone.js context:", e);
        });
    } else {
        console.log("Audio is already started.");
    }
}

function handleRandomizeButtonClick() {
    if (!audioLoadedAndReady) {
        console.warn("Randomize button clicked, but audio not yet loaded. Please wait.");
        return;
    }

    // Invert colors on the first click
    if (!hasBroken) {
        invertColors();
        hasBroken = true;
    }

    if (!audioStarted) {
        Tone.start().then(() => {
            console.log("Audio context started by randomize button!");
            audioStarted = true;
            randomizeAndStart();
        }).catch(e => {
            console.error("Error starting Tone.js context:", e);
        });
    } else {
        randomizeAndStart();
    }
}

function mouseDragged() {
    let {
        col,
        row
    } = getGridCell(mouseX, mouseY);

    if (col !== lastDraggedCell.col || row !== lastDraggedCell.row) {
        toggleSequencerCell(col, row);
        lastDraggedCell = {
            row: row,
            col: col
        };
    }

    if (frameCount >= nextParticleFrame) {
        createParticle();
    }
}

function createParticle() {
    let mousePosition = createVector(mouseX, mouseY);
    let velocity = p5.Vector.sub(mousePosition, previousParticlePosition);
    velocity.mult(0.05);

    let lastPath = paths[paths.length - 1];
    if (lastPath) {
        lastPath.addParticle(mousePosition, velocity);
    }

    nextParticleFrame = frameCount + framesBetweenParticles;
    previousParticlePosition.set(mouseX, mouseY);
}

class Path {
    constructor() {
        this.particles = [];
    }

    addParticle(position, velocity) {
        let particleHue = (this.particles.length * 30) % 360;
        this.particles.push(new Particle(position, velocity, particleHue));
    }

    update() {
        for (let particle of this.particles) {
            particle.update();
        }
    }

    connectParticles(particleA, particleB) {
        let opacity = particleA.framesRemaining / particleFadeFrames;
        stroke(255, opacity);
        line(
            particleA.position.x,
            particleA.position.y,
            particleB.position.x,
            particleB.position.y
        );
    }

    display() {
        for (let i = this.particles.length - 1; i >= 0; i -= 1) {
            if (this.particles[i].framesRemaining <= 0) {
                this.particles.splice(i, 1);
            } else {
                this.particles[i].display();
                if (i < this.particles.length - 1) {
                    this.connectParticles(this.particles[i], this.particles[i + 1]);
                }
            }
        }
    }
}

class Particle {
    constructor(position, velocity, hue) {
        this.position = position.copy();
        this.velocity = velocity.copy();
        this.hue = hue;
        this.drag = 0.95;
        this.framesRemaining = particleFadeFrames;
    }

    update() {
        this.position.add(this.velocity);
        this.velocity.mult(this.drag);
        this.framesRemaining = this.framesRemaining - 1;
    }

    display() {
        let opacity = this.framesRemaining / particleFadeFrames;
        noStroke();
        colorMode(HSB, 360, 100, 100, 1);
        fill(this.hue, 80, 90, opacity);
        circle(this.position.x, this.position.y, 24);
        colorMode(RGB, 255, 255, 255, 255);
    }
}