// --- TONE.JS AUDIO SETUP ---

const limiter = new Tone.Limiter(-2).toDestination();

// Use Tone.Player with URL directly.
const AcousticPlayer = new Tone.Player({
    url: "./audio/COLOURS/ACOUSTIC.mp3", // Ensure .mp3 path
    loop: true,
}).sync();
const AtmosPlayer = new Tone.Player({
    url: "./audio/COLOURS/ATMOS.mp3", // Ensure .mp3 path
    loop: true,
}).sync();
const ElectronicPlayer = new Tone.Player({
    url: "./audio/COLOURS/ELECTRONIC.mp3", // Ensure .mp3 path
    loop: true,
}).sync();

// Create a list of players for easier iteration
const players = [AcousticPlayer, AtmosPlayer, ElectronicPlayer];

// Create separate Tone.Channels for each player to control their individual volumes
const AcousticVolumeChannel = new Tone.Channel();
const AtmosVolumeChannel = new Tone.Channel();
const ElectronicVolumeChannel = new Tone.Channel();

// This channel will sum the "dry" signals from all players BEFORE effects
const DryVolumeChannel = new Tone.Channel();

// Crossfade between the summed FX signal (crossFade.a) and the summed Dry signal (crossFade.b)
const crossFade = new Tone.CrossFade().connect(limiter);

// Effects Chain
const chorus = new Tone.Chorus().start(); // Start LFO effects immediately
const autoFilter = new Tone.AutoFilter().start(); // Start LFO effects immediately
const reverb = new Tone.Reverb(); // Reverb's output will connect to crossFade.a

// --- Corrected Signal Flow ---
// 1. Players send their signal to their individual volume channels
AcousticPlayer.connect(AcousticVolumeChannel);
AtmosPlayer.connect(AtmosVolumeChannel);
ElectronicPlayer.connect(ElectronicVolumeChannel);

// 2. Individual volume channels send their signal to the DryVolumeChannel for the dry mix
AcousticVolumeChannel.connect(DryVolumeChannel);
AtmosVolumeChannel.connect(DryVolumeChannel);
ElectronicVolumeChannel.connect(DryVolumeChannel);

// 3. Individual volume channels also send their signal into the effects chain
AcousticVolumeChannel.connect(chorus);
AtmosVolumeChannel.connect(chorus);
ElectronicVolumeChannel.connect(chorus);

// 4. Effects are chained together
chorus.connect(autoFilter);
autoFilter.connect(reverb);

// 5. Reverb (wet signal) goes to crossFade.a
reverb.connect(crossFade.a);

// 6. DryVolumeChannel (dry signal) goes to crossFade.b
DryVolumeChannel.connect(crossFade.b);

// Set initial crossfade value (e.g., balanced dry/wet)
crossFade.fade.value = 0.5;

// --- Function to generate a random number within a specified range ---
function getRandomNumber(min, max) {
    return Math.random() * (max - min) + min;
}

// --- Randomization Function for Stems ---
/**
 * Randomizes the starting time and playback rate of each player and starts the transport.
 * @param {number} maxOffset - The maximum possible delay in seconds for a stem.
 * @param {number} minRate - The minimum playback rate (e.g., 0.8 for half speed).
 * @param {number} maxRate - The maximum playback rate (e.g., 1.2 for double speed).
 */
function randomizeAndStart(maxOffset = 4, minRate = 0.8, maxRate = 1.2) {
    if (Tone.Transport.state === 'started') {
        console.log("Audio already playing. Stopping before randomizing.");
        Tone.Transport.stop();
        // Stop all players to reset them
        players.forEach(player => player.stop());
    }

    // Set a random tempo for the entire transport
    const randomTempo = getRandomNumber(40, 120);
    Tone.Transport.bpm.value = randomTempo;

    // Start all players with a random delay and a random playback rate
    players.forEach(player => {
        const randomDelay = getRandomNumber(0, maxOffset);
        const randomRate = getRandomNumber(minRate, maxRate);

        // Set the random playback rate
        player.playbackRate = randomRate;

        // Use `start()` with a time offset relative to the transport's start
        player.start(`+${randomDelay}`);
        console.log(`Player starting at: +${randomDelay.toFixed(2)}s with speed: ${randomRate.toFixed(2)}x`);
    });

    Tone.Transport.start();
    console.log("Randomized playback started!");
}


// --- Loading Screen & Start Button Management ---
let audioLoadedAndReady = false; // Flag for when Tone.js buffers are loaded
let audioContextStarted = false; // Flag for when Tone.context has resumed

function showButtons() {
    const loadingWatermark = document.getElementById('loadingWatermark');
    const loadingText = document.getElementById('loadingText');
    const startButton = document.getElementById('startButton');
    const randomizeButton = document.getElementById('randomizeButton');

    if (loadingWatermark && loadingText && startButton && randomizeButton) {
        loadingText.textContent = "Ready to Play!";
        loadingWatermark.classList.add('loaded'); // Add 'loaded' class to hide spinner
        startButton.style.display = 'block'; // Show the button
        randomizeButton.style.display = 'block'; // Show the new button
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

function handleStartButtonClick() {
    // Only attempt to start if audio files are loaded and context hasn't been started yet
    if (audioLoadedAndReady && !audioContextStarted) {
        console.log("Start button clicked. Attempting to start audio context.");
        Tone.start().then(() => {
            console.log("Tone.context resumed successfully! 🔊");
            audioContextStarted = true; // Mark context as started
            startPlayersAndTransport(); // Start playback now
            hideLoadingScreen(); // Hide the entire loading overlay after audio starts
        }).catch(e => {
            console.error("Error resuming Tone.context:", e);
            alert("Failed to start audio. Please ensure your device's media volume is up and try again.");
        });
    } else if (audioContextStarted) {
        console.log("Audio context already started. Hiding loading screen.");
        hideLoadingScreen(); // Just hide the loading screen if context is already running
    } else {
        console.warn("Start button clicked but audio not yet loaded. Please wait.");
    }
}

let hasBroken = false; // Flag to track if the 'break it' button has been clicked before

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


/**
 * Main function for the "break it" button.
 * It randomizes both the audio stems and the visual positions of the shapes.
 */
function handleRandomizeButtonClick() {
    if (!audioLoadedAndReady) {
        console.warn("Randomize button clicked, but audio not yet loaded. Please wait.");
        return;
    }

    if (!hasBroken) {
        invertColors();
        hasBroken = true;
    }

    if (!audioContextStarted) {
        Tone.start().then(() => {
            console.log("Tone.context resumed successfully! 🔊");
            audioContextStarted = true;
            randomizeAndStart();
            randomizeShapePositions(); // NEW: Randomize shape positions
            hideLoadingScreen();
        }).catch(e => {
            console.error("Error resuming Tone.context:", e);
        });
    } else {
        randomizeAndStart();
        randomizeShapePositions(); // NEW: Randomize shape positions
    }
}

function startPlayersAndTransport() {
    if (Tone.Transport.state !== 'started') {
        Tone.Transport.start();
        players.forEach(player => player.start());
        console.log("Audio playback (Tone.Transport and Players) started! ▶️");
    } else {
        console.log("Tone.Transport and Players were already started.");
    }
}

// --- DOMContentLoaded for Loading & Initial Setup ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content Loaded.");

    const startButton = document.getElementById('startButton');
    const randomizeButton = document.getElementById('randomizeButton');

    if (startButton) {
        startButton.addEventListener('click', handleStartButtonClick);
        startButton.addEventListener('touchend', handleStartButtonClick);
        console.log("Start button listeners attached.");
    } else {
        console.error("Start button not found!");
    }

    if (randomizeButton) {
        randomizeButton.addEventListener('click', handleRandomizeButtonClick);
        randomizeButton.addEventListener('touchend', handleRandomizeButtonClick);
        console.log("Randomize button listeners attached.");
    } else {
        console.error("Randomize button not found!");
    }

    // Wait for all Tone.Player buffers to load
    Tone.loaded().then(() => {
        console.log("All Tone.Player audio files loaded!");
        audioLoadedAndReady = true; // Set flag
        showButtons(); // Display the start and randomize buttons
    }).catch(error => {
        console.error("Error loading audio files (Tone.loaded()):", error);
        alert("Failed to load audio files. Please check paths and network console for errors.");
        showButtons();
        const loadingText = document.getElementById('loadingText');
        if (loadingText) loadingText.textContent = "Error loading audio. Try again?";
    });
});


// --- p5.js SKETCH LOGIC ---

let shapes = [];
let draggedShape = null;
let prevMouseX, prevMouseY; // For desktop mouse tracking
let prevTouchX, prevTouchY; // For mobile touch tracking

function setup() {
    // Canvas fills the entire window and is set to WEBGL mode
    const canvas = createCanvas(700, 400, WEBGL);
    canvas.parent('canvas-container');

    angleMode(DEGREES);
    normalMaterial();

    initializeShapes();

    describe(
        'Four 3D shapes: a plane, box, torus, and sphere. Each shape is static. ' +
        'Clicking/Touching and dragging a shape rotates it in 3D. ' +
        'Rotating specific shapes controls audio effects: box for reverb, torus for auto-filter, plane for chorus, and sphere for dry/wet mix.'
    );
}

// NEW: Function to initialize or reset shapes to their default positions
function initializeShapes() {
    shapes = [{
        name: 'plane',
        x: -width / 4,
        y: -height / 8,
        size: 100,
        rotX: 0,
        rotY: 0,
        rotZ: 0
    }, {
        name: 'box',
        x: width / 4,
        y: -height / 8,
        size: 80,
        rotX: 0,
        rotY: 0,
        rotZ: 0
    }, {
        name: 'torus',
        x: -width / 4,
        y: height / 8,
        size: 100,
        rotX: 0,
        rotY: 0,
        rotZ: 0
    }, {
        name: 'sphere',
        x: width / 4,
        y: height / 8,
        size: 120,
        rotX: 0,
        rotY: 0,
        rotZ: 0
    }, ];
}

// NEW: Function to randomize the positions of the shapes
function randomizeShapePositions() {
    const margin = 50; // Ensure shapes don't go off screen
    const xPositions = [-width / 4, width / 4];
    const yPositions = [-height / 8, height / 8];
    const shuffledPositions = shuffle([
        [xPositions[0], yPositions[0]],
        [xPositions[1], yPositions[0]],
        [xPositions[0], yPositions[1]],
        [xPositions[1], yPositions[1]],
    ]);

    for (let i = 0; i < shapes.length; i++) {
        shapes[i].x = shuffledPositions[i][0];
        shapes[i].y = shuffledPositions[i][1];
        shapes[i].rotX = random(-180, 180);
        shapes[i].rotY = random(-180, 180);
        shapes[i].rotZ = random(-180, 180);
    }
    console.log("Shapes randomized.");
}

function draw() {
    background(250);

    function applyShapeRotation(shapeIndex) {
        let s = shapes[shapeIndex];
        rotateX(s.rotX);
        rotateY(s.rotY);
        rotateZ(s.rotZ);
    }

    push();
    translate(shapes[0].x, shapes[0].y, 0);
    applyShapeRotation(0);
    plane(shapes[0].size);
    pop();
    push();
    translate(shapes[1].x, shapes[1].y, 0);
    applyShapeRotation(1);
    box(shapes[1].size);
    pop();
    push();
    translate(shapes[2].x, shapes[2].y, 0);
    applyShapeRotation(2);
    torus(shapes[2].size / 2 - 10, shapes[2].size / 5);
    pop();
    push();
    translate(shapes[3].x, shapes[3].y, 0);
    applyShapeRotation(3);
    stroke(0);
    sphere(shapes[3].size / 2);
    pop();
}

// --- Unified Interaction Handlers for Mouse and Touch ---

function handleInteractionStart(inputX, inputY) {
    // Only allow interaction if audio context has successfully started
    if (!audioContextStarted) {
        console.warn("Audio context not started yet. Ignoring interaction on canvas.");
        return false; // Do not process interaction if audio isn't ready
    }

    let xAdjusted = inputX - width / 2;
    let yAdjusted = inputY - height / 2;

    for (let i = 0; i < shapes.length; i++) {
        let shape = shapes[i];
        if (
            xAdjusted > shape.x - shape.size / 2 &&
            xAdjusted < shape.x + shape.size / 2 &&
            yAdjusted > shape.y - shape.size / 2 &&
            yAdjusted < shape.y + shape.size / 2
        ) {
            draggedShape = i;
            if (mouseIsPressed && typeof mouseX !== 'undefined') {
                prevMouseX = inputX;
                prevMouseY = inputY;
            } else {
                prevTouchX = inputX;
                prevTouchY = inputY;
            }
            console.log(`Interaction started on ${shape.name}.`);
            return false; // Prevent default behavior
        }
    }
    return true; // Allow default behavior
}

function handleInteractionDrag(currentX, currentY) {
    // Only allow interaction if audio context has successfully started
    if (!audioContextStarted) {
        return false;
    }

    if (draggedShape !== null) {
        let currentShape = shapes[draggedShape];
        let deltaX, deltaY;

        if (mouseIsPressed && typeof mouseX !== 'undefined') {
            deltaX = currentX - prevMouseX;
            deltaY = currentY - prevMouseY;
            prevMouseX = currentX;
            prevMouseY = currentY;
        } else if (touches.length > 0) {
            deltaX = currentX - prevTouchX;
            deltaY = currentY - prevTouchY;
            prevTouchX = currentX;
            prevTouchY = currentY;
        } else {
            return false;
        }

        currentShape.rotY += deltaX * 0.5;
        currentShape.rotX -= deltaY * 0.5;

        const audioSensitivity = 5.0;

        if (currentShape.name === 'box') {
            const decayMin = 0.5,
                decayMax = 20;
            const wetMin = 0.,
                wetMax = 1.;
            const partialMin = 0.,
                partialMax = 1.;

            let mappedDecay = map(currentShape.rotY % 360, -180, 180, decayMin, decayMax);
            reverb.decay = constrain(mappedDecay, decayMin, decayMax);

            let mappedWet = map(currentShape.rotY % 360, -180, 180, wetMin, wetMax);
            reverb.wet.value = constrain(mappedWet, wetMin, wetMax);

            let mappedPartial = map(currentShape.rotX % 360, -180, 180, partialMin, partialMax);
            reverb.partial = constrain(mappedPartial, partialMin, partialMax); // Corrected: should be partialMax here

            // console.log(`Reverb - Decay: ${reverb.decay.toFixed(2)}, Partial: ${reverb.partial.toFixed(2)}, Wet: ${reverb.wet.value.toFixed(2)}`);
        }

        if (currentShape.name === 'torus') {
            const depthMin = 0.0,
                depthMax = 1.0;
            const freqMin = 0.1,
                freqMax = 20.0;
            const baseFreqMin = 100,
                baseFreqMax = 2000;
            const octavesMin = 0,
                octavesMax = 6;

            let mappedDepth = map(currentShape.rotY % 360, -180, 180, depthMin, depthMax);
            autoFilter.depth.value = constrain(mappedDepth, depthMin, depthMax);

            let mappedFrequency = map(currentShape.rotY % 360, -180, 180, freqMin, freqMax);
            autoFilter.frequency.value = constrain(mappedFrequency, freqMin, freqMax);

            let mappedBaseFrequency = map(currentShape.rotX % 360, -180, 180, baseFreqMin, baseFreqMax);
            autoFilter.baseFrequency = constrain(mappedBaseFrequency, baseFreqMin, baseFreqMax);

            let mappedOctaves = map(currentShape.rotX % 360, -180, 180, octavesMin, octavesMax);
            autoFilter.octaves = constrain(mappedOctaves, octavesMin, octavesMax);

            // console.log(`Autofilter - Depth: ${autoFilter.depth.value.toFixed(2)}, Freq: ${autoFilter.frequency.value.toFixed(2)}, BaseFreq: ${autoFilter.baseFrequency.toFixed(2)}, Octaves: ${autoFilter.octaves.toFixed(2)}`);
        }

        if (currentShape.name === 'plane') {
            const freqMin = 0.1,
                freqMax = 10.0;
            const feedbackMin = 0.0,
                feedbackMax = 0.9;
            const delayMin = 0.001,
                delayMax = 0.05;

            let mappedFrequency = map(currentShape.rotY % 360, -180, 180, freqMin, freqMax);
            chorus.frequency.value = constrain(mappedFrequency, freqMin, freqMax);

            let mappedFeedback = map(currentShape.rotX % 360, -180, 180, feedbackMin, feedbackMax);
            chorus.feedback.value = constrain(mappedFeedback, feedbackMin, feedbackMax);

            let mappedDelay = map(currentShape.rotX % 360, -180, 180, delayMin, delayMax);
            chorus.delayTime = constrain(mappedDelay, delayMin, delayMax);

            // console.log(`Chorus - Freq: ${chorus.frequency.value.toFixed(2)}, Feedback: ${chorus.feedback.value.toFixed(2)}, Delay: ${chorus.delayTime.toFixed(4)}`);
        }

        if (currentShape.name === 'sphere') {
            const fadeMin = 0.,
                fadeMax = 1.;

            let mappedFade = map(currentShape.rotY % 360, -180, 180, fadeMin, fadeMax);
            crossFade.fade.value = constrain(mappedFade, fadeMin, fadeMax);

            // console.log(`CrossFade (Dry/Wet) - Fade: ${crossFade.fade.value.toFixed(2)}`);
        }
        return false;
    }
    return true;
}

function handleInteractionEnd() {
    if (!audioContextStarted) {
        return false;
    }
    draggedShape = null;
    console.log("Interaction ended. Dragged shape reset.");
    return false;
}

function mousePressed() {
    // Only return false (prevent default) if handleInteractionStart actually found a shape.
    return handleInteractionStart(mouseX, mouseY);
}

function mouseDragged() {
    return handleInteractionDrag(mouseX, mouseY);
}

function mouseReleased() {
    return handleInteractionEnd();
}

function touchStarted() {
    if (touches.length > 0) {
        // Same logic: if a shape is hit, prevent default. Otherwise, allow.
        return handleInteractionStart(touches[0].x, touches[0].y);
    }
    return true; // Allow default if no shape was touched or if touches.length is 0
}

function touchMoved() {
    if (touches.length > 0) {
        return handleInteractionDrag(touches[0].x, touches[0].y);
    }
    return true;
}

function touchEnded() {
    if (touches.length == 0) {
        return handleInteractionEnd();
    }
    return true;
}


// --- Responsive Canvas Handling ---
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    // When the window is resized, maintain the current shapes but adjust their positions
    // based on the new canvas dimensions.
    const newShapes = shapes.map(s => {
        let newX = s.x; // Simplified example, adjust as needed for responsive layout
        let newY = s.y;
        return {
            ...s,
            x: newX,
            y: newY
        };
    });
    shapes = newShapes;
}

// Fisher-Yates shuffle algorithm for array randomization
function shuffle(array) {
    let currentIndex = array.length,
        randomIndex;
    // While there remain elements to shuffle.
    while (currentIndex != 0) {
        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]
        ];
    }
    return array;
}