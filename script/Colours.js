
// --- TONE.JS AUDIO SETUP ---

const limiter = new Tone.Limiter(-2).toDestination();

// Use Tone.Player with URL directly.
const AcousticPlayer = new Tone.Player({
    url: "./audio/COLOURS/ACOUSTIC.mp3",
    loop: true,
}).sync();
const AtmosPlayer = new Tone.Player({
    url: "./audio/COLOURS/ATMOS.mp3",
    loop: true,
}).sync();
const ElectronicPlayer = new Tone.Player({
    url: "./audio/COLOURS/ELECTRONIC.mp3",
    loop: true,
}).sync();

// Create a list of players for easier iteration
const players = [AcousticPlayer, AtmosPlayer, ElectronicPlayer];

// Create separate Tone.Channels for each player to control their individual volumes
const AcousticVolumeChannel = new Tone.Channel();
const AtmosVolumeChannel = new Tone.Channel();
const ElectronicVolumeChannel = new Tone.Channel();

// --- NEW: Add a Tone.Panner3D for each stem ---
const AcousticPanner = new Tone.Panner3D(0, 0, 0);
const AtmosPanner = new Tone.Panner3D(0, 0, 0);
const ElectronicPanner = new Tone.Panner3D(0, 0, 0);

// This channel will sum the "dry" signals from all players BEFORE effects
const DryVolumeChannel = new Tone.Channel();

// Crossfade between the summed FX signal (crossFade.a) and the summed Dry signal (crossFade.b)
const crossFade = new Tone.CrossFade().connect(limiter);

// Effects Chain
const chorus = new Tone.Chorus().start();
const autoFilter = new Tone.AutoFilter().start();
const reverb = new Tone.Reverb();
reverb.wet.value = 0.4;

// To reduce the reverb's volume, set the 'wet' value to a lower number.
// The default is 1, a value like 0.2 will make it much more subtle.


// --- Corrected Signal Flow ---
// 1. Players send their signal to their individual volume channels
AcousticPlayer.connect(AcousticVolumeChannel);
AtmosPlayer.connect(AtmosVolumeChannel);
ElectronicPlayer.connect(ElectronicVolumeChannel);

// 2. Individual volume channels send their signal to the Panner
AcousticVolumeChannel.connect(AcousticPanner);
AtmosVolumeChannel.connect(AtmosPanner);
ElectronicVolumeChannel.connect(ElectronicPanner);

// 3. The Panners now have the stem's signal and send their output to the DryVolumeChannel for the dry mix
AcousticPanner.connect(DryVolumeChannel);
AtmosPanner.connect(DryVolumeChannel);
ElectronicPanner.connect(DryVolumeChannel);

// 4. Panners also send their signal into the effects chain
AcousticPanner.connect(chorus);
AtmosPanner.connect(chorus);
ElectronicPanner.connect(chorus);

// 5. Effects are chained together
chorus.connect(autoFilter);
autoFilter.connect(reverb, limiter);

// 6. Reverb (wet signal) goes to crossFade.a
reverb.connect(crossFade.a);

// 7. DryVolumeChannel (dry signal) goes to crossFade.b
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
function randomizeAndStart(maxOffset = 1, minRate = 0.6, maxRate = 1.1) {
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
let audioLoadedAndReady = false;
let audioContextStarted = false;

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

function handleStartButtonClick() {
    if (audioLoadedAndReady && !audioContextStarted) {
        console.log("Start button clicked. Attempting to start audio context.");
        Tone.start().then(() => {
            console.log("Tone.context resumed successfully! 🔊");
            audioContextStarted = true;
            startPlayersAndTransport();
            hideLoadingScreen();
        }).catch(e => {
            console.error("Error resuming Tone.context:", e);
            alert("Failed to start audio. Please ensure your device's media volume is up and try again.");
        });
    } else if (audioContextStarted) {
        console.log("Audio context already started. Hiding loading screen.");
        hideLoadingScreen();
    } else {
        console.warn("Start button clicked but audio not yet loaded. Please wait.");
    }
}

let hasBroken = false;

function invertColors() {
    const body = document.body;
    if (body) {
        body.style.filter = 'invert(1)';
        body.style.transition = 'filter 0.5s ease-in-out';
        console.log("Colors inverted!");
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
    }

    if (!audioContextStarted) {
        Tone.start().then(() => {
            console.log("Tone.context resumed successfully! 🔊");
            audioContextStarted = true;
            randomizeAndStart();
            randomizeShapePositions();
            hideLoadingScreen();
        }).catch(e => {
            console.error("Error resuming Tone.context:", e);
        });
    } else {
        randomizeAndStart();
        randomizeShapePositions();
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

    Tone.loaded().then(() => {
        console.log("All Tone.Player audio files loaded!");
        audioLoadedAndReady = true;
        showButtons();
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
let prevMouseX, prevMouseY;
let prevTouchX, prevTouchY;
let p5CanvasElement;

function setup() {
    const canvas = createCanvas(700, 400, WEBGL);
    canvas.parent('canvas-container');
    p5CanvasElement = canvas.elt; // Store the raw canvas DOM element

    angleMode(DEGREES);
    normalMaterial();

    initializeShapes();

    describe(
        'Four 3D shapes: a plane, box, torus, and sphere. Each shape is static. ' +
        'Clicking/Touching and dragging a shape rotates it in 3D. ' +
        'Rotating specific shapes controls audio effects: box for reverb, torus for auto-filter, plane for chorus, and sphere for dry/wet mix.'
    );
}

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

function randomizeShapePositions() {
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
    background(40);

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

function handleInteractionStart(inputX, inputY) {
    if (!audioContextStarted) {
        return false;
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
            return false;
        }
    }
    return true;
}

function handleInteractionDrag(currentX, currentY) {
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

        if (currentShape.name === 'sphere') {
            const rotX = currentShape.rotX % 360;
            const rotY = currentShape.rotY % 360;

            const mappedPannerX = map(rotY, -180, 180, -1, 1);

            const mappedPannerY = map(rotX, -180, 180, -1, 1);

            const mappedPannerZ = map((rotX + rotY) % 360, -360, 360, -1, 1);

            AcousticPanner.positionX.value = mappedPannerX;
            AcousticPanner.positionY.value = mappedPannerY;
            AcousticPanner.positionZ.value = mappedPannerZ;

            AtmosPanner.positionX.value = mappedPannerX;
            AtmosPanner.positionY.value = mappedPannerY;
            AtmosPanner.positionZ.value = mappedPannerZ;

            ElectronicPanner.positionX.value = mappedPannerX;
            ElectronicPanner.positionY.value = mappedPannerY;
            ElectronicPanner.positionZ.value = mappedPannerZ;

            console.log(`Panner3D Position - X: ${mappedPannerX.toFixed(2)}, Y: ${mappedPannerY.toFixed(2)}, Z: ${mappedPannerZ.toFixed(2)}`);
        }

        if (currentShape.name === 'box') {
            const decayMin = 0.01,
                decayMax = 60;
            const wetMin = 0.,
                wetMax = 1.;
            const partialMin = 0.,
                partialMax = 1.;

            let mappedDecay = map(currentShape.rotY % 360, -180, 180, decayMin, decayMax);
            reverb.decay = constrain(mappedDecay, decayMin, decayMax);

            let mappedWet = map(currentShape.rotY % 360, -180, 180, wetMin, wetMax);
            reverb.wet.value = constrain(mappedWet, wetMin, wetMax);

            let mappedPartial = map(currentShape.rotX % 360, -180, 180, partialMin, partialMax);
            reverb.partial = constrain(mappedPartial, partialMin, partialMax);
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
        }

        if (currentShape.name === 'plane') {
            const freqMin = 0.01,
                freqMax = 1000.0;
            const feedbackMin = 0.0,
                feedbackMax = 0.999;
            const delayMin = 0.0001,
                delayMax = 0.1;
            const depthMin = 0.0,
                depthMax = 1.0;

            let mappedFrequency = map(currentShape.rotY % 360, -180, 180, log(freqMin), log(freqMax));
            chorus.frequency.value = exp(mappedFrequency);
            chorus.frequency.value = constrain(chorus.frequency.value, freqMin, freqMax);

            let mappedFeedback = map(currentShape.rotX % 360, -180, 180, feedbackMin, feedbackMax);
            chorus.feedback.value = constrain(mappedFeedback, feedbackMin, feedbackMax);

            let mappedDelay = map(currentShape.rotX % 360, -180, 180, delayMin, delayMax);
            chorus.delayTime = constrain(mappedDelay, delayMin, delayMax);

            let mappedDepth = map(currentShape.rotY % 360, -180, 180, depthMin, depthMax);
            chorus.depth = constrain(mappedDepth, depthMin, depthMax);
        }

        if (currentShape.name === 'sphere' && currentShape.name !== 'sphere') {
            const fadeMin = 0.,
                fadeMax = 1.;
            let mappedFade = map(currentShape.rotY % 360, -180, 180, fadeMin, fadeMax);
            crossFade.fade.value = constrain(mappedFade, fadeMin, fadeMax);
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
    return handleInteractionStart(mouseX, mouseY);
}

function mouseDragged() {
    return handleInteractionDrag(mouseX, mouseY);
}

function mouseReleased() {
    return handleInteractionEnd();
}

function touchStarted() {
    // NEW: Check if the touch event originated on the canvas itself
    if (event.target === p5CanvasElement && touches.length > 0) {
        return handleInteractionStart(touches[0].x, touches[0].y);
    }
    // If not on the canvas, return true to allow other elements to handle the event
    return true;
}

function touchMoved() {
    // NEW: Check if the touch event originated on the canvas itself
    if (event.target === p5CanvasElement && touches.length > 0) {
        return handleInteractionDrag(touches[0].x, touches[0].y);
    }
    // If not on the canvas, return true
    return true;
}

function touchEnded() {
    // NEW: Check if the touch event originated on the canvas itself
    if (event.target === p5CanvasElement && touches.length == 0) {
        return handleInteractionEnd();
    }
    // If not on the canvas, return true
    return true;
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    const newShapes = shapes.map(s => {
        let newX = s.x;
        let newY = s.y;
        return {
            ...s,
            x: newX,
            y: newY
        };
    });
    shapes = newShapes;
}

function shuffle(array) {
    let currentIndex = array.length,
        randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]
        ];
    }
    return array;
}