// ==================================================================================================================
//
//                              CONSOLIDATED & FINAL JS SCRIPT
//
// ==================================================================================================================

// =================================================================
// Global Flags and State
// =================================================================
let audioStarted = false;

// Tone.js variables
const panners = [];
const rmsMeters = [];
let audioPlayers = [];
let audioUpdateNeeded = false;
let previousBoidCount = 0;

// p5.js variables
const boatImages = [];
let boats = [];
const boatFiles = ['boat1.png', 'boat2.png', 'boat3.png', 'boat4.png', 'boat5.png', 'boat6.png', 'boat7.png', 'boat8.png'];


// =================================================================
// P5.js Preload Function
// =================================================================
function preload() {
    for (let i = 0; i < boatFiles.length; i++) {
        const imagePath = `./assets/boats/${boatFiles[i]}`;
        const img = loadImage(imagePath, () => {
            console.log(`Image loaded successfully: ${imagePath}`);
        }, (e) => {
            console.error(`Failed to load image: ${imagePath}`, e);
        });
        boatImages.push(img);
    }
}


// =================================================================
// Tone.js Audio Setup
// =================================================================
const limiter = new Tone.Limiter(-2).toDestination();
const reverb = new Tone.Reverb({
    decay: 3,
    wet: 0.2
}).connect(limiter);

const comp = new Tone.Compressor({
    threshold: -24,
    ratio: 3,
    attack: 0.02,
    release: 0.15
}).connect(reverb);

function createPlayerPlusPanner(url, initialPositionX, initialPositionY, initialPositionZ) {
    const panner = new Tone.Panner3D({
        panningModel: "HRTF",
        positionX: initialPositionX,
        positionY: initialPositionY,
        positionZ: initialPositionZ,
    }).connect(comp);
    
    const meter = new Tone.Meter({
        channels: 1,
        smoothing: 0.8
    });
    panner.connect(meter);
    rmsMeters.push(meter);

    const player = new Tone.Player({
        url,
        loop: true,
    }).connect(panner).sync().start(0);
    
    audioPlayers.push(player);
    panners.push(panner);
}

function getRandomNumber(min, max) {
    return Math.random() * (max - min) + min;
}

const xRange = { min: -5, max: 5 };
const yRange = { min: -1, max: 1 };
const zRange = { min: 0, max: 10 };

// Loop to load all 19 stems dynamically
for (let i = 1; i <= 19; i++) {
    const filePath = `./audio/ThreeBoats/${i}.mp3`;
    createPlayerPlusPanner(filePath, getRandomNumber(-5, 5), getRandomNumber(-1, 1), getRandomNumber(0, 10));
}

function setRotation(angle) {
    Tone.Listener.forwardX.value = Math.sin(angle);
    Tone.Listener.forwardY.value = 0;
    Tone.Listener.forwardZ.value = -Math.cos(angle);
}

// =================================================================
// P5.js Sketch Logic
// =================================================================
function setup() {
    createCanvas(700, 400);

    imageMode(CENTER);
    spawnBoats();

    describe(
        '19 unique boat images whose position and color changes with the audio stems they are linked to.'
    );

    Tone.loaded().then(() => {
        console.log("All audio files loaded!");
        const loadingWatermark = document.getElementById('loadingWatermark');
        if (loadingWatermark) {
            loadingWatermark.style.display = 'none';
        }
    }).catch(error => {
        console.error("Error loading audio files:", error);
        const loadingWatermark = document.getElementById('loadingWatermark');
        if (loadingWatermark) {
            loadingWatermark.innerHTML = '<p style="color: red;">Error Loading Audio. Please refresh.</p>';
        }
    });
}

function spawnBoats() {
    boats = [];
    
    let availableImages = shuffle([...boatImages]);

    for (let i = 0; i < panners.length; i++) {
        const uniqueImage = availableImages[i % availableImages.length];
        
        const newBoat = {
            image: uniqueImage,
            panner: panners[i],
            meter: rmsMeters[i],
            x: random(width),
            y: random(height),
            size: random(50, 150),
            isFlipped: random() > 0.5,
            // NEW: Add a velocity vector for slow drifting
            velocity: createVector(random(-0.5, 0.5), random(-0.5, 0.5))
        };

        boats.push(newBoat);
    }
}

function draw() {
    background(10);
    
    for (let i = 0; i < boats.length; i++) {
        const boat = boats[i];
        if (boat.image) {
            push();
            translate(boat.x, boat.y);
            
            if (boat.isFlipped) {
                scale(-1, 1);
            }
            
            const rmsValue = boat.meter.getValue();
            const dynamicBrightness = map(rmsValue, -60, -10, 20, 100, true);
            
            colorMode(HSB, 100);
            
            tint(50, 100, dynamicBrightness);
            
            image(boat.image, 0, 0, boat.size, boat.size);
            
            pop();

            // NEW: Update boat position based on its velocity
            boat.x += boat.velocity.x;
            boat.y += boat.velocity.y;

            // NEW: Wrap-around boundary logic
            if (boat.x > width + boat.size / 2) {
                boat.x = -boat.size / 2;
            } else if (boat.x < -boat.size / 2) {
                boat.x = width + boat.size / 2;
            }
            if (boat.y > height + boat.size / 2) {
                boat.y = -boat.size / 2;
            } else if (boat.y < -boat.size / 2) {
                boat.y = height + boat.size / 2;
            }
        }
    }
}

function mousePressed() {
    regenerateBoats();
    updatePannerPositions();
    startAudioContext();
}

function touchStarted() {
    regenerateBoats();
    updatePannerPositions();
    startAudioContext();
    return false;
}

function regenerateBoats() {
    spawnBoats();
}

function updatePannerPositions() {
    panners.forEach(panner => {
        panner.positionX.value = getRandomNumber(xRange.min, xRange.max);
        panner.positionY.value = getRandomNumber(yRange.min, yRange.max);
        panner.positionZ.value = getRandomNumber(zRange.min, zRange.max);
    });
}

function startAudioContext() {
    if (!audioStarted) {
        Tone.start().then(() => {
            console.log("Audio context started by canvas click!");
            audioStarted = true;
            Tone.Transport.start();
        }).catch(e => {
            console.error("Error starting Tone.js context:", e);
        });
    }
}