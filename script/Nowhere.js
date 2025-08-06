// =================================================================
// Global Flags and State
// =================================================================
const GRID_COLS = 16;
const GRID_ROWS = 4;
let cellWidth;
let cellHeight;
let cellDepth;

let boxes = [];
let audioOffTimers = [];

let allPlayers; // A single Tone.Players object to load all audio files
let pannerVelocities = []; // New array for panner drift velocities

let currentStep = 0;
let lastDraggedCell = {
    row: -1,
    col: -1
};
let audioStarted = false;
let audioLoadedAndReady = false;
let hasBroken = false;

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

const allUrls = {};
// Ambient stems
for (let i = 1; i <= 14; i++) {
    allUrls[`ambient${i}`] = `./audio/Nowhere/${i}.mp3`;
}
// Glitch sounds
for (let i = 1; i <= 64; i++) {
    allUrls[`glitch${i}`] = `./audio/Nowhere/glitch-${i}.mp3`;
}
// Hi-hats
for (let i = 1; i <= 4; i++) {
    allUrls[`hihat${i}`] = `./audio/Nowhere/hihat-${i}.mp3`;
}
// Snares
for (let i = 1; i <= 5; i++) {
    allUrls[`SNARE${i}`] = `./audio/Nowhere/SNARE_${i}.wav`;
}
// Kicks
for (let i = 1; i <= 7; i++) {
    allUrls[`KICK${i}`] = `./audio/Nowhere/KICK_${i}.wav`;
}

// Separate panners for ambient tracks
let ambientPanners = [];
for (let i = 0; i < 14; i++) {
    const panner = new Tone.Panner3D({
        panningModel: "HRTF",
        // Adjusted for more extreme starting positions
        positionX: getRandomNumber(-5, 5),
        positionY: getRandomNumber(-3, 3),
        positionZ: getRandomNumber(-2, 2),
        refDistance: 0.5
    }).connect(comp);
    ambientPanners.push(panner);
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

    allPlayers = new Tone.Players({
        urls: allUrls,
        onload: () => {
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
        }
    }).toDestination();
});

// Sequencer for grid sounds
Tone.Transport.scheduleRepeat((time) => {
    currentStep = (currentStep + 1) % GRID_COLS;
    const activeBoxesInStep = boxes.filter(b => b.gridCol === currentStep && b.audioActive);

    activeBoxesInStep.forEach((b, index) => {
        const offset = index * 0.001;
        const startTime = Tone.Time(time).toSeconds() + offset;

        if (b.gridRow === 0) {
            const randomIndex = floor(random(1, 65));
            allPlayers.player(`glitch${randomIndex}`).start(startTime);
        } else if (b.gridRow === 1) {
            const randomIndex = floor(random(1, 5));
            allPlayers.player(`hihat${randomIndex}`).start(startTime);
        } else if (b.gridRow === 2) {
            const randomIndex = floor(random(1, 6));
            allPlayers.player(`SNARE${randomIndex}`).start(startTime);
        } else if (b.gridRow === 3) {
            const randomIndex = floor(random(1, 8));
            allPlayers.player(`KICK${randomIndex}`).start(startTime);
        }
    });
}, "16n");

// NEW: Loop to update the panner positions if 'break it' is active
Tone.Transport.scheduleRepeat((time) => {
    if (hasBroken) {
        ambientPanners.forEach((panner, index) => {
            const vel = pannerVelocities[index];
            const newX = panner.positionX.value + vel.x;
            const newY = panner.positionY.value + vel.y;
            const newZ = panner.positionZ.value + vel.z;

            // Adjusted for more extreme positions
            const boundedX = Math.min(Math.max(newX, -5), 5);
            const boundedY = Math.min(Math.max(newY, -3), 3);
            const boundedZ = Math.min(Math.max(newZ, -2), 2);

            // Update panner positions smoothly
            panner.positionX.linearRampToValueAtTime(boundedX, time + 0.05);
            panner.positionY.linearRampToValueAtTime(boundedY, time + 0.05);
            panner.positionZ.linearRampToValueAtTime(boundedZ, time + 0.05);
        });
    }
}, "16n");


// Helper function
function getRandomNumber(min, max) {
    return Math.random() * (max - min) + min;
}

// Helper function
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
        for (let c = 0; c < GRID_COLS; c++) {
            boxes.push({
                x: (c * cellWidth) + cellWidth / 2,
                y: (r * cellHeight) + cellHeight / 2,
                z: 0,
                vx: 0,
                vy: 0,
                vz: 0,
                vrx: 0,
                vry: 0,
                vrz: 0,
                gridRow: r,
                gridCol: c,
                audioActive: false,
                visualActive: 0
            });
        }
    }

    describe(
        'A 3D grid of boxes representing a sequencer. When a box is activated, it lights up and rotates. Mouse interaction creates a trail of particles.'
    );
}

function draw() {
    background(0);
    translate(-width / 2, -height / 2);

    for (let b of boxes) {
        push();
        if (hasBroken) {
            b.x += b.vx;
            b.y += b.vy;
            b.vrz += random(-0.01, 0.01);

            if (b.x > width || b.x < 0) {
                b.vx *= -1;
            }
            if (b.y > height || b.y < 0) {
                b.vy *= -1;
            }

            translate(b.x, b.y, b.z);
            rotateZ(b.vrz);
        } else {
            translate(b.x, b.y, b.z);
            rotateX(frameCount * 0.01 * (b.gridRow + 1) / GRID_ROWS);
            rotateY(frameCount * 0.01 * (b.gridCol + 1) / GRID_COLS);
        }

        if (b.gridCol === currentStep && Tone.Transport.state === 'started') {
            emissiveMaterial(255, 100, 0);
        } else if (b.audioActive) {
            emissiveMaterial(0, 200, 200);
        } else {
            fill(150, 150, 150);
        }

        box(cellWidth * 0.9, cellHeight * 0.9, cellDepth);
        pop();
    }
}


function checkFloatingBoxClick(x, y) {
    const mouseX_adjusted = x;
    const mouseY_adjusted = y;
    for (let b of boxes) {
        const distance = dist(mouseX_adjusted, mouseY_adjusted, b.x, b.y);
        const hitDistance = cellWidth * 0.7;
        if (distance < hitDistance) {
            toggleSequencerCell(b.gridCol, b.gridRow);
            return true;
        }
    }
    return false;
}

function getGridCell(x, y) {
    if (x < 0 || x > width || y < 0 || y > height) {
        return {
            col: -1,
            row: -1
        };
    }
    let col = floor(map(x, 0, width, 0, GRID_COLS));
    let row = floor(map(y, 0, height, 0, GRID_ROWS));
    return {
        col,
        row
    };
}

function toggleSequencerCell(col, row) {
    if (col === -1 || row === -1) {
        return;
    }
    const b = boxes.find(box => box.gridCol === col && box.gridRow === row);
    if (!b) {
        console.warn("Box not found for grid cell:", col, row);
        return;
    }
    b.audioActive = !b.audioActive;
    if (b.audioActive) {
        b.visualActive = 1;
    } else {
        b.visualActive = 0;
    }
}

function startSequencerAndAmbientPlayers() {
    let startTime = Tone.now() + 0.1;

    for (let i = 1; i <= 14; i++) {
        const player = allPlayers.player(`ambient${i}`);
        const panner = ambientPanners[i - 1];
        player.connect(panner);
        player.loop = true;
        player.start(startTime);
    }
    
    Tone.Transport.bpm.value = 61;
    Tone.Transport.scheduleOnce((time) => {
        Tone.Transport.bpm.setValueAtTime(102, time);
    }, "4:2:0");
    Tone.Transport.scheduleOnce((time) => {
        Tone.Transport.bpm.setValueAtTime(144, time);
    }, "19:2:0");
    Tone.Transport.scheduleOnce((time) => {
        Tone.Transport.bpm.setValueAtTime(161, time);
    }, "35:2:0");
        Tone.Transport.scheduleOnce((time) => {
        Tone.Transport.bpm.setValueAtTime(144, time);
    }, "49:2:0");
        Tone.Transport.scheduleOnce((time) => {
        Tone.Transport.bpm.setValueAtTime(155, time);
    }, "57:2:0");
        Tone.Transport.scheduleOnce((time) => {
        Tone.Transport.bpm.setValueAtTime(134, time);
    }, "65:2:0");
        Tone.Transport.scheduleOnce((time) => {
        Tone.Transport.bpm.setValueAtTime(120, time);
    }, "73:2:0");
        Tone.Transport.scheduleOnce((time) => {
        Tone.Transport.bpm.setValueAtTime(151, time);
    }, "81:2:0");
        Tone.Transport.scheduleOnce((time) => {
        Tone.Transport.bpm.setValueAtTime(90, time);
    }, "95:2:0");
        Tone.Transport.scheduleOnce((time) => {
        Tone.Transport.bpm.setValueAtTime(161, time);
    }, "99:2:0");
        Tone.Transport.scheduleOnce((time) => {
        Tone.Transport.bpm.setValueAtTime(180, time);
    }, "113:2:0");
   

    Tone.Transport.start(startTime);
}

function mousePressed() {
    if (hasBroken) {
        checkFloatingBoxClick(mouseX, mouseY);
    } else {
        let {
            col,
            row
        } = getGridCell(mouseX, mouseY);
        toggleSequencerCell(col, row);
        lastDraggedCell = {
            row: row,
            col: col
        };
    }
    if (!audioStarted) {
        Tone.start().then(() => {
            console.log("Audio context started by canvas click!");
            audioStarted = true;
            startSequencerAndAmbientPlayers();
        }).catch(e => {
            console.error("Error starting Tone.js context:", e);
        });
    }
    return false;
}

function touchStarted() {
    if (touches.length > 0) {
        if (hasBroken) {
            checkFloatingBoxClick(touches[0].x, touches[0].y);
        } else {
            let {
                col,
                row
            } = getGridCell(touches[0].x, touches[0].y);
            toggleSequencerCell(col, row);
            lastDraggedCell = {
                row: row,
                col: col
            };
        }
        if (!audioStarted) {
            Tone.start().then(() => {
                console.log("Audio context started by canvas touch!");
                audioStarted = true;
                startSequencerAndAmbientPlayers();
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
            startSequencerAndAmbientPlayers();
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

    if (!hasBroken) {
        invertColors();
        hasBroken = true;

        for (let b of boxes) {
            b.vx = getRandomNumber(-0.5, 0.5);
            b.vy = getRandomNumber(-0.5, 0.5);
            b.vrz = getRandomNumber(-0.01, 0.01);
        }

        // Adjusted for more extreme drift velocity
        pannerVelocities = ambientPanners.map(() => ({
            x: getRandomNumber(-0.5, 0.5),
            y: getRandomNumber(-0.5, 0.5),
            z: getRandomNumber(-0.5, 0.5),
        }));
    }

    if (!audioStarted) {
        Tone.start().then(() => {
            console.log("Audio context started by randomize button!");
            audioStarted = true;
            startSequencerAndAmbientPlayers();
        }).catch(e => {
            console.error("Error starting Tone.js context:", e);
        });
    } else {
        console.log("Audio is already running. Randomize button only changes visuals.");
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
}