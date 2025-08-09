

// ==================================================================================================================
//
//                              CONSOLIDATED & FINAL JS SCRIPT - OPTIMIZED
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
            // console.log(`Image loaded successfully: ${imagePath}`);
        }, (e) => {
            console.error(`Failed to load image: ${imagePath}`, e);
        });
        boatImages.push(img);
    }
}


// =================================================================
// Tone.js Audio Setup
// =================================================================
const limiter = new Tone.Limiter(-4).toDestination();
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
    }).connect(panner);

    audioPlayers.push(player);
    panners.push(panner);
}

function getRandomNumber(min, max) {
    return Math.random() * (max - min) + min;
}

const xRange = { min: -5, max: 5 };
const yRange = { min: -1, max: 1 };
const zRange = { min: 0, max: 10 };

// Loop to load all 10 stems dynamically
for (let i = 1; i <= 10; i++) {
    const filePath = `./audio/ThreeBoats/${i}.mp3`;
    createPlayerPlusPanner(filePath, getRandomNumber(-5, 5), getRandomNumber(-1, 1), getRandomNumber(0, 10));
}

// =================================================================
// P5.js Sketch Logic
// =================================================================
function setup() {
    const canvasContainer = document.getElementById('canvas-container');
    const p5Canvas = createCanvas(canvasContainer.offsetWidth, 400); // Set initial canvas size
    p5Canvas.parent('canvas-container');

    // Attach event listeners directly to the canvas element
    p5Canvas.canvas.addEventListener('mousedown', handleInteraction);
    p5Canvas.canvas.addEventListener('touchstart', handleInteraction);

    // Resize canvas on window resize to make it responsive
    window.addEventListener('resize', () => {
        resizeCanvas(canvasContainer.offsetWidth, 400);
    });

    imageMode(CENTER);
    spawnBoats();

    // OPTIMIZATION: Reduce the frame rate to lessen the CPU load
    frameRate(30);

    describe(
        '10 unique boat images whose position and color changes with the audio stems they are linked to.'
    );

    // OPTIMIZATION: Update tints separately and less frequently
    setInterval(updateBoatTints, 100); // Update every 100ms (10 times per second)
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
            velocity: createVector(random(-0.5, 0.5), random(-0.5, 0.5)),
            // OPTIMIZATION: Store tint color directly
            tintColor: color(50, 100, 50) 
        };

        boats.push(newBoat);
    }
}

// OPTIMIZATION: New function to update boat tints based on audio levels
function updateBoatTints() {
    if (!audioStarted) return;
    colorMode(HSB, 100);
    boats.forEach(boat => {
        const rmsValue = boat.meter.getValue();
        const dynamicBrightness = map(rmsValue, -60, -10, 20, 100, true);
        boat.tintColor = color(50, 100, dynamicBrightness);
    });
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
            
            // OPTIMIZATION: Use the pre-calculated tint color
            tint(boat.tintColor);

            image(boat.image, 0, 0, boat.size, boat.size);

            pop();

            // Update boat position based on its velocity
            boat.x += boat.velocity.x;
            boat.y += boat.velocity.y;

            // Wrap-around boundary logic
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

// Combined function to handle mouse and touch input
function handleInteraction() {
    // Only proceed if the audio has started, to prevent interaction before the user clicks "Start"
    if (audioStarted) {
        regenerateBoats();
        updatePannerPositions();
    }
}

// The following global p5 functions are now handled by direct event listeners on the canvas.
// function mousePressed() { handleInteraction(); }
// function touchStarted() { handleInteraction(); return false; }


function regenerateBoats() {
    spawnBoats();
}

function updatePannerPositions() {
    const boatCount = boats.length;
    panners.forEach((panner, index) => {
        const boat = boats[index];
        if (boat) {
            // Map boat's screen position to 3D audio space
            const pannerX = map(boat.x, 0, width, xRange.min, xRange.max);
            const pannerY = map(boat.y, 0, height, yRange.min, yRange.max);
            const pannerZ = map(index, 0, boatCount, zRange.min, zRange.max); // Spread boats out in Z
            
            panner.positionX.value = pannerX;
            panner.positionY.value = pannerY;
            panner.positionZ.value = pannerZ;
        }
    });
}

function startAudioContext() {
    if (!audioStarted) {
        Tone.start().then(() => {
            console.log("Audio context started!");
            audioStarted = true;
            // The `p5.js` setup will handle spawning boats and starting the animation loop.
            // Start the Tone.Transport and players here.
            Tone.Transport.start();
            audioPlayers.forEach(player => player.sync().start(0));
            // Hide loading screen after everything is ready
            hideLoadingScreen();
        }).catch(e => {
            console.error("Error starting Tone.js context:", e);
        });
    }
}

function hideLoadingScreen() {
    const loadingWatermark = document.getElementById('loadingWatermark');
    if (loadingWatermark) {
        loadingWatermark.style.opacity = '0';
        loadingWatermark.addEventListener('transitionend', () => {
            loadingWatermark.style.display = 'none';
        }, {
            once: true
        });
    }
}

// Handle initial audio loading and UI state on page load
document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('startButton');
    if (startButton) {
        startButton.addEventListener('click', startAudioContext);
    } else {
        console.error("Start button not found!");
    }

    // Wait for all audio to load before showing the start button
    Tone.loaded().then(() => {
        console.log("All audio files loaded!");
        const loadingWatermark = document.getElementById('loadingWatermark');
        const spinner = loadingWatermark.querySelector('.spinner');
        const startBtn = document.getElementById('startButton');
        
        if (spinner && startBtn) {
            spinner.style.display = 'none';
            startBtn.style.display = 'block';
        }
    }).catch(error => {
        console.error("Error loading audio files:", error);
        const loadingWatermark = document.getElementById('loadingWatermark');
        if (loadingWatermark) {
            loadingWatermark.innerHTML = '<p style="color: red;">Error Loading Audio. Please refresh.</p>';
        }
    });
});