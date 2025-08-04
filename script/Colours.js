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





// --- Loading Screen & Start Button Management ---
let audioLoadedAndReady = false; // Flag for when Tone.js buffers are loaded
let audioContextStarted = false; // Flag for when Tone.context has resumed

function showStartButton() {
    const loadingWatermark = document.getElementById('loadingWatermark');
    const loadingText = document.getElementById('loadingText');
    const startButton = document.getElementById('startButton');

    if (loadingWatermark && loadingText && startButton) {
        loadingText.textContent = "Ready to Play!";
        loadingWatermark.classList.add('loaded'); // Add 'loaded' class to hide spinner
        startButton.style.display = 'block'; // Show the button
        console.log("Start button shown, spinner hidden.");
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
        }, { once: true });
    } else {
        console.warn("Loading watermark element not found.");
    }
}

function handleInteractionDrag(currentX, currentY) {
    if (!audioContextStarted) {
        console.warn("Drag: Audio context not started.");
        return false;
    }
    if (draggedShape === null) { // This should ideally not happen if handleInteractionStart worked
        console.warn("Drag: draggedShape is null.");
        return false;
    }
    console.log(`Dragging shape: ${shapes[draggedShape].name}`);
    // ... rest of your drag logic ...
}

// Function to start Tone.Transport and players
function startPlayersAndTransport() {
    if (Tone.Transport.state !== 'started') {
        Tone.Transport.start();
        AcousticPlayer.start();
        AtmosPlayer.start();
        ElectronicPlayer.start();
        console.log("Audio playback (Tone.Transport and Players) started! ▶️");
    } else {
        console.log("Tone.Transport and Players were already started.");
    }
}

// This function is now specifically called by the "Start Audio" button
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
            // If context fails to start, you might want to show a retry button or error message
        });
    } else if (audioContextStarted) {
        console.log("Audio context already started. Hiding loading screen.");
        hideLoadingScreen(); // Just hide the loading screen if context is already running (e.g., on desktop)
    } else {
        console.warn("Start button clicked but audio not yet loaded. Please wait.");
        // Could update loadingText here to "Still loading, please wait..."
    }
}


// --- DOMContentLoaded for Loading & Initial Setup ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content Loaded.");

    const startButton = document.getElementById('startButton');
    if (startButton) {
        startButton.addEventListener('click', handleStartButtonClick);
        startButton.addEventListener('touchend', handleStartButtonClick); // Also listen for touchend for robustness
        console.log("Start button listeners attached.");
    } else {
        console.error("Start button not found!");
    }

    // Wait for all Tone.Player buffers to load
    Tone.loaded().then(() => {
        console.log("All Tone.Player audio files loaded!");
        audioLoadedAndReady = true; // Set flag
        showStartButton(); // Display the start button and hide spinner
    }).catch(error => {
        console.error("Error loading audio files (Tone.loaded()):", error);
        alert("Failed to load audio files. Please check paths and network console for errors.");
        // If loading fails, still show the button, but it might not play sound.
        // Or update loadingText to indicate failure.
        showStartButton();
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

    shapes = [
        { name: 'plane', x: -width / 4, y: -height / 8, size: 100, rotX: 0, rotY: 0, rotZ: 0 },
        { name: 'box', x: width / 4, y: -height / 8, size: 80, rotX: 0, rotY: 0, rotZ: 0 },
        { name: 'torus', x: -width / 4, y: height / 8, size: 100, rotX: 0, rotY: 0, rotZ: 0 },
        { name: 'sphere', x: width / 4, y: height / 8, size: 120, rotX: 0, rotY: 0, rotZ: 0 },
    ];

    describe(
        'Four 3D shapes: a plane, box, torus, and sphere. Each shape is static. ' +
        'Clicking/Touching and dragging a shape rotates it in 3D. ' +
        'Rotating specific shapes controls audio effects: box for reverb, torus for auto-filter, plane for chorus, and sphere for dry/wet mix.'
    );
}

function draw() {
    background(250);

    function applyShapeRotation(shapeIndex) {
        let s = shapes[shapeIndex];
        rotateX(s.rotX);
        rotateY(s.rotY);
        rotateZ(s.rotZ);
    }

    push(); translate(shapes[0].x, shapes[0].y, 0); applyShapeRotation(0); plane(shapes[0].size); pop();
    push(); translate(shapes[1].x, shapes[1].y, 0); applyShapeRotation(1); box(shapes[1].size); pop();
    push(); translate(shapes[2].x, shapes[2].y, 0); applyShapeRotation(2); torus(shapes[2].size / 2 - 10, shapes[2].size / 5); pop();
    push(); translate(shapes[3].x, shapes[3].y, 0); applyShapeRotation(3); stroke(0); sphere(shapes[3].size / 2); pop();
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
            return true;
        }
    }
    return false;
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
            const decayMin = 0.5, decayMax = 20;
            const wetMin = 0., wetMax = 1.;
            const partialMin = 0., partialMax = 1.;

            let mappedDecay = map(currentShape.rotY % 360, -180, 180, decayMin, decayMax);
            reverb.decay = constrain(mappedDecay, decayMin, decayMax);

            let mappedWet = map(currentShape.rotY % 360, -180, 180, wetMin, wetMax);
            reverb.wet.value = constrain(mappedWet, wetMin, wetMax);

            let mappedPartial = map(currentShape.rotX % 360, -180, 180, partialMin, partialMax);
            reverb.partial = constrain(mappedPartial, partialMin, partialMax); // Corrected: should be partialMax here

            // console.log(`Reverb - Decay: ${reverb.decay.toFixed(2)}, Partial: ${reverb.partial.toFixed(2)}, Wet: ${reverb.wet.value.toFixed(2)}`);
        }

        if (currentShape.name === 'torus') {
            const depthMin = 0.0, depthMax = 1.0;
            const freqMin = 0.1, freqMax = 20.0;
            const baseFreqMin = 100, baseFreqMax = 2000;
            const octavesMin = 0, octavesMax = 6;

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
            const freqMin = 0.1, freqMax = 10.0;
            const feedbackMin = 0.0, feedbackMax = 0.9;
            const delayMin = 0.001, delayMax = 0.05;

            let mappedFrequency = map(currentShape.rotY % 360, -180, 180, freqMin, freqMax);
            chorus.frequency.value = constrain(mappedFrequency, freqMin, freqMax);

            let mappedFeedback = map(currentShape.rotX % 360, -180, 180, feedbackMin, feedbackMax);
            chorus.feedback.value = constrain(mappedFeedback, feedbackMin, feedbackMax);

            let mappedDelay = map(currentShape.rotX % 360, -180, 180, delayMin, delayMax);
            chorus.delayTime = constrain(mappedDelay, delayMin, delayMax);

            // console.log(`Chorus - Freq: ${chorus.frequency.value.toFixed(2)}, Feedback: ${chorus.feedback.value.toFixed(2)}, Delay: ${chorus.delayTime.toFixed(4)}`);
        }

        if (currentShape.name === 'sphere') {
            const fadeMin = 0., fadeMax = 1.;

            let mappedFade = map(currentShape.rotY % 360, -180, 180, fadeMin, fadeMax);
            crossFade.fade.value = constrain(mappedFade, fadeMin, fadeMax);

            // console.log(`CrossFade (Dry/Wet) - Fade: ${crossFade.fade.value.toFixed(2)}`);
        }
        return true;
    }
    return false;
}

function handleInteractionEnd() {
    if (!audioContextStarted) {
        return false;
    }
    draggedShape = null;
    console.log("Interaction ended. Dragged shape reset.");
    return true;
}

function mousePressed() {
    // Only return false (prevent default) if handleInteractionStart actually found a shape.
    if (handleInteractionStart(mouseX, mouseY)) {
        return false;
    }
    // If no shape was hit, allow the default behavior (e.g., HTML clicks).
    return true;
}

function mouseDragged() {
    if (handleInteractionDrag(mouseX, mouseY)) {
        return false;
    }
    return true;
}

function mouseReleased() {
    if (handleInteractionEnd()) {
        return false;
    }
    return true;
}

function touchStarted() {
    if (touches.length > 0) {
        // Same logic: if a shape is hit, prevent default. Otherwise, allow.
        if (handleInteractionStart(touches[0].x, touches[0].y)) {
            return false;
        }
    }
    return true; // Allow default if no shape was touched or if touches.length is 0
}

function touchMoved() {
    if (touches.length > 0) {
        if (handleInteractionDrag(touches[0].x, touches[0].y)) {
            return false;
        }
    }
    return true;
}

function touchEnded() {
    if (handleInteractionEnd()) {
        return false;
    }
    return true;
}


// --- Responsive Canvas Handling ---
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    shapes = [
        { name: 'plane', x: -width / 4, y: -height / 8, size: 100, rotX: shapes[0].rotX, rotY: shapes[0].rotY, rotZ: shapes[0].rotZ },
        { name: 'box', x: width / 4, y: -height / 8, size: 80, rotX: shapes[1].rotX, rotY: shapes[1].rotY, rotZ: shapes[1].rotZ },
        { name: 'torus', x: -width / 4, y: height / 8, size: 100, rotX: shapes[2].rotX, rotY: shapes[2].rotY, rotZ: shapes[2].rotZ },
        { name: 'sphere', x: width / 4, y: height / 8, size: 120, rotX: shapes[3].rotX, rotY: shapes[3].rotY, rotZ: shapes[3].rotZ },
    ];
}