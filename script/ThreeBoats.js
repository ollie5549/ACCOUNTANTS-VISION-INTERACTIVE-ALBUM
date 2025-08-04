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

    const player = new Tone.Player({
        url,
        loop: true,
    }).connect(panner).sync().start(0);

    panners.push(panner);
}

createPlayerPlusPanner("./audio/ThreeBoats/acoustic.mp3", -2, 0, 0);
createPlayerPlusPanner("./audio/ThreeBoats/electronic.mp3", 2, 0, 1);


function getRandomNumber(min, max) {
    return Math.random() * (max - min) + min;
}

const xRange = { min: -5, max: 5 };
const yRange = { min: -1, max: 1 };
const zRange = { min: 0, max: 10 };

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
        'Three unique, randomly chosen boat images whose position, size, and orientation changes on click or touch.'
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
    
    // Create a temporary, shuffled copy of the images array
    let availableImages = shuffle([...boatImages]);

    // Spawn 3 boats with unique images
    for (let i = 0; i < 3; i++) {
        // We can now safely pick the first item from the shuffled array
        const uniqueImage = availableImages[i];
        
        const newBoat = {
            image: uniqueImage,
            x: random(width),
            y: random(height),
            size: random(50, 150),
            isFlipped: random() > 0.5
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
            
            image(boat.image, 0, 0, boat.size, boat.size);
            
            pop();
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
    // This function will respawn all the boats with new, unique images,
    // as well as new positions, sizes, and flips.
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