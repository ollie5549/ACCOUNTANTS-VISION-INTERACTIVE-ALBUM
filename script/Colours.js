// --- TONE.JS AUDIO SETUP ---
const limiter = new Tone.Limiter(-2).toDestination();
const gain = new Tone.Gain(0.6).connect(limiter);

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

const players = [AcousticPlayer, AtmosPlayer, ElectronicPlayer];

const AcousticVolumeChannel = new Tone.Channel();
const AtmosVolumeChannel = new Tone.Channel();
const ElectronicVolumeChannel = new Tone.Channel();

const AcousticPanner = new Tone.Panner3D(0, 0, 0);
const AtmosPanner = new Tone.Panner3D(0, 0, 0);
const ElectronicPanner = new Tone.Panner3D(0, 0, 0);

const DryVolumeChannel = new Tone.Channel();

const crossFade = new Tone.CrossFade().connect(limiter);

const chorus = new Tone.Chorus().start();
const autoFilter = new Tone.AutoFilter().start();
const reverb = new Tone.Reverb();
reverb.wet.value = 0.4;

AcousticPlayer.connect(AcousticVolumeChannel);
AtmosPlayer.connect(AtmosVolumeChannel);
ElectronicPlayer.connect(ElectronicVolumeChannel);

AcousticVolumeChannel.connect(AcousticPanner);
AtmosVolumeChannel.connect(AtmosPanner);
ElectronicVolumeChannel.connect(ElectronicPanner);

AcousticPanner.connect(DryVolumeChannel);
AtmosPanner.connect(DryVolumeChannel);
ElectronicPanner.connect(DryVolumeChannel);

AcousticPanner.connect(chorus);
AtmosPanner.connect(chorus);
ElectronicPanner.connect(chorus);

chorus.connect(autoFilter);
autoFilter.connect(reverb, gain);

reverb.connect(crossFade.a);
DryVolumeChannel.connect(crossFade.b);

crossFade.fade.value = 0.5;

function getRandomNumber(min, max) {
    return Math.random() * (max - min) + min;
}

function randomizeAndStart(maxOffset = 1, minRate = 0.6, maxRate = 1.1) {
    if (Tone.Transport.state === 'started') {
        Tone.Transport.stop();
        players.forEach(player => player.stop());
    }

    const randomTempo = getRandomNumber(40, 120);
    Tone.Transport.bpm.value = randomTempo;

    players.forEach(player => {
        const randomDelay = getRandomNumber(0, maxOffset);
        const randomRate = getRandomNumber(minRate, maxRate);
        player.playbackRate = randomRate;
        player.start(`+${randomDelay}`);
    });

    Tone.Transport.start();
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
    }
}

function hideLoadingScreen() {
    const loadingWatermark = document.getElementById('loadingWatermark');
    if (loadingWatermark) {
        loadingWatermark.style.transition = 'opacity 0.5s ease-out';
        loadingWatermark.style.opacity = '0';
        loadingWatermark.addEventListener('transitionend', () => {
            loadingWatermark.style.display = 'none';
        }, {
            once: true
        });
    }
}

function startAudioContext() {
    if (audioLoadedAndReady && !audioContextStarted) {
        Tone.start().then(() => {
            audioContextStarted = true;
            console.log("Tone.context resumed successfully! 🔊");
            // Optionally, you can also start the players here
            // startPlayersAndTransport();
        }).catch(e => {
            console.error("Error resuming Tone.context:", e);
        });
    }
}

function handleStartButtonClick() {
    if (audioContextStarted) {
        startPlayersAndTransport();
        hideLoadingScreen();
    } else {
        // This case should ideally not be hit if the first interaction is handled properly
        startAudioContext();
        startPlayersAndTransport();
        hideLoadingScreen();
    }
}

let hasBroken = false;

function invertColors() {
    const body = document.body;
    if (body) {
        body.style.filter = 'invert(1)';
        body.style.transition = 'filter 0.5s ease-in-out';
    }
}

function handleRandomizeButtonClick() {
    if (!audioLoadedAndReady) {
        return;
    }

    if (!hasBroken) {
        invertColors();
        hasBroken = true;
    }

    // Since we're now starting the context on ANY interaction,
    // we can assume it's already started here.
    randomizeAndStart();
    randomizeShapePositions();
    hideLoadingScreen();
}

function startPlayersAndTransport() {
    if (Tone.Transport.state !== 'started') {
        Tone.Transport.start();
        players.forEach(player => player.start());
    }
}

// --- p5.js SKETCH LOGIC ---

let shapes = [];
let draggedShape = null;
let prevMouseX, prevMouseY;
let prevTouchX, prevTouchY;
let p5CanvasElement;

function setup() {
    const canvas = createCanvas(700, 400, WEBGL);
    canvas.parent('canvas-container');
    p5CanvasElement = canvas.elt;

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
    return false;
}

function mousePressed() {
    startAudioContext();
    return handleInteractionStart(mouseX, mouseY);
}

function mouseDragged() {
    return handleInteractionDrag(mouseX, mouseY);
}

function mouseReleased() {
    return handleInteractionEnd();
}

function touchStarted() {
    if (event.target === p5CanvasElement && touches.length > 0) {
        startAudioContext();
        return handleInteractionStart(touches[0].x, touches[0].y);
    }
    return true;
}

function touchMoved() {
    if (event.target === p5CanvasElement && touches.length > 0) {
        return handleInteractionDrag(touches[0].x, touches[0].y);
    }
    return true;
}

function touchEnded() {
    if (event.target === p5CanvasElement && touches.length == 0) {
        return handleInteractionEnd();
    }
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

// --- NEW CODE: Event listeners to handle the initial audio context start ---
document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('startButton');
    const randomizeButton = document.getElementById('randomizeButton');

    // Attach startAudioContext to the initial button clicks
    if (startButton) {
        startButton.addEventListener('click', () => {
            startAudioContext();
            handleStartButtonClick();
        });
        startButton.addEventListener('touchend', () => {
            startAudioContext();
            handleStartButtonClick();
        });
    }

    if (randomizeButton) {
        randomizeButton.addEventListener('click', () => {
            startAudioContext();
            handleRandomizeButtonClick();
        });
        randomizeButton.addEventListener('touchend', () => {
            startAudioContext();
            handleRandomizeButtonClick();
        });
    }

    Tone.loaded().then(() => {
        audioLoadedAndReady = true;
        showButtons();
    }).catch(error => {
        console.error("Error loading audio files:", error);
        alert("Failed to load audio files.");
        showButtons();
        const loadingText = document.getElementById('loadingText');
        if (loadingText) loadingText.textContent = "Error loading audio. Try again?";
    });
});