// [ TONE.JS ]
// the source
const limiter = new Tone.Limiter(-2).toDestination();

const AcousticPlayer = new Tone.Player({
    url: "./audio/COLOURS/ACOUSTIC.ogg",
    loop: true,
});
const AtmosPlayer = new Tone.Player({
    url: "./audio/COLOURS/ATMOS.ogg",
    loop: true,
});
const ElectronicPlayer = new Tone.Player({
    url: "./audio/COLOURS/ELECTRONIC.ogg",
    loop: true,
});

// Create separate Tone.Channels for each player to control their individual volumes
const AcousticVolumeChannel = new Tone.Channel(); // No direct connection to limiter here
const AtmosVolumeChannel = new Tone.Channel();   // No direct connection to limiter here
const ElectronicVolumeChannel = new Tone.Channel(); // No direct connection to limiter here

// Connect players to their respective volume channels
AcousticPlayer.connect(AcousticVolumeChannel);
AtmosPlayer.connect(AtmosVolumeChannel);
ElectronicPlayer.connect(ElectronicVolumeChannel);


// make some effects
const chorus = new Tone.Chorus({
    wet: 0,
    frequency: 1.5,
    depth: 0.7,
})
.connect(limiter); // Chorus remains a send effect to the limiter

// AutoFilter is now an INSERT EFFECT for the main audio path
const autoFilter = new Tone.AutoFilter(50); // Initialize without direct connection to limiter yet
autoFilter.start(); // THEN call .start() on it

const reverb = new Tone.Reverb(3).connect(limiter); // Reverb remains a send effect

// --- NEW ROUTING FOR AUTOFILTER ---
// Connect ALL volume channels TO the autoFilter
AcousticVolumeChannel.connect(autoFilter);
AtmosVolumeChannel.connect(autoFilter);
ElectronicVolumeChannel.connect(autoFilter);

// Then, connect the autoFilter's output TO the limiter
autoFilter.connect(limiter);

// --- RETAIN OTHER SEND/RECEIVE ---
const chorusWetControl = new Tone.Channel().connect(chorus);
chorusWetControl.receive("chorus");

// REMOVE autoFilterWetControl AND ITS receive CALL, as it's no longer needed for direct routing.
// const autoFilterWetControl = new Tone.Channel().connect(autoFilter);
// autoFilterWetControl.receive("autoFilter");

const reverbWetControl = new Tone.Channel().connect(reverb);
reverbWetControl.receive("reverb");

// Initial send amounts to effects (still applies to chorus and reverb)
AcousticVolumeChannel.send("chorus", 1);
AtmosVolumeChannel.send("chorus", 1);
ElectronicVolumeChannel.send("chorus", 1);

// REMOVE THESE, as audio now goes directly through autoFilter
// AcousticVolumeChannel.send("autoFilter", 1);
// AtmosVolumeChannel.send("autoFilter", 1);
// ElectronicVolumeChannel.send("autoFilter", 1);

AcousticVolumeChannel.send("reverb", 1);
AtmosVolumeChannel.send("reverb", 1);
ElectronicVolumeChannel.send("reverb", 1);

// --- New function to hide the loading screen ---
function hideLoadingScreen() {
    const loadingWatermark = document.getElementById('loadingWatermark');
    if (loadingWatermark) {
        loadingWatermark.style.transition = 'opacity 0.5s ease-out';
        loadingWatermark.style.opacity = '0';
        loadingWatermark.addEventListener('transitionend', () => {
            loadingWatermark.style.display = 'none';
        }, { once: true });
    }
}

// --- AUDIO PLAYBACK TRIGGERED BY CANVAS INTERACTION ---
document.addEventListener('DOMContentLoaded', () => {
    let p5CanvasElement;
    setTimeout(() => {
        p5CanvasElement = document.querySelector('canvas');
        Tone.loaded().then(() => {
            console.log("All audio files loaded! Hiding loading screen.");
            hideLoadingScreen();
        }).catch(error => {
            console.error("Error loading audio files:", error);
            hideLoadingScreen();
        });
    }, 500);
});

let shapes = [];

let draggedShape = null;
let prevMouseX, prevMouseY;


function setup() {
    const canvas = createCanvas(710, 400, WEBGL);
    canvas.parent('canvas-container');

    angleMode(DEGREES);
    normalMaterial();

    // Define each shape's properties with new positions and sizes, removing cone and cylinder
    shapes = [
        { name: 'plane', x: -200, y: -100, size: 100, rotX: 0, rotY: 0, rotZ: 0 },
        { name: 'box', x: 0, y: -100, size: 80, rotX: 0, rotY: 0, rotZ: 0 },
        { name: 'torus', x: 200, y: -100, size: 100, rotX: 0, rotY: 0, rotZ: 0 },
        { name: 'sphere', x: -100, y: 100, size: 120, rotX: 0, rotY: 0, rotZ: 0 },
        { name: 'ellipsoid', x: 100, y: 100, size: 100, rotX: 0, rotY: 0, rotZ: 0 },
    ];

    // Rearrange the description to match the new shapes
    describe(
        'Six 3D shapes: a plane, box, torus, sphere and ellipsoid. Each shape is static. Clicking and dragging a shape will rotate it in 3D based on the drag direction.'
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

    // Plane
    push();
    translate(shapes[0].x, shapes[0].y, 0);
    applyShapeRotation(0);
    plane(shapes[0].size);
    pop();

    // Box
    push();
    translate(shapes[1].x, shapes[1].y, 0);
    applyShapeRotation(1);
    box(shapes[1].size);
    pop();

    // Torus
    push();
    translate(shapes[2].x, shapes[2].y, 0);
    applyShapeRotation(2);
    torus(shapes[2].size / 2 - 10, shapes[2].size / 5); // Adjusted torus size
    pop();

    // Sphere
    push();
    translate(shapes[3].x, shapes[3].y, 0);
    applyShapeRotation(3);
    stroke(0);
    sphere(shapes[3].size / 2); // Adjusted sphere size
    pop();

    // Ellipsoid
    push();
    translate(shapes[4].x, shapes[4].y, 0);
    applyShapeRotation(4);
    ellipsoid(shapes[4].size / 4, shapes[4].size / 2, shapes[4].size / 2); // Adjusted ellipsoid size
    pop();


}

function startAudio() {
    if (Tone.context.state !== 'running') {
        Tone.start();
        console.log("Audio context resumed! 🔊");
    }
    if (Tone.Transport.state !== 'started') {
        Tone.Transport.start();
        AcousticPlayer.start();
        AtmosPlayer.start();
        ElectronicPlayer.start();
        console.log("Audio playback started! ▶️");
    }
}

function mousePressed() {
    startAudio();

    let mouseXAdjusted = mouseX - width / 2;
    let mouseYAdjusted = mouseY - height / 2;

    for (let i = 0; i < shapes.length; i++) {
        let shape = shapes[i];
        if (
            mouseXAdjusted > shape.x - shape.size / 2 &&
            mouseXAdjusted < shape.x + shape.size / 2 &&
            mouseYAdjusted > shape.y - shape.size / 2 &&
            mouseYAdjusted < shape.y + shape.size / 2
        ) {
            draggedShape = i;
            prevMouseX = mouseX;
            prevMouseY = mouseY;
            console.log(`Started dragging ${shape.name} for rotation.`);
            return false;
        }
    }
    return false;
}


function mouseDragged() {
    if (draggedShape !== null) {
        let currentShape = shapes[draggedShape];
        let deltaX = mouseX - prevMouseX;
        let deltaY = mouseY - prevMouseY;

        // Apply rotation sensitivity (kept at 0.5 for shape rotation)
        currentShape.rotY += deltaX * 0.5;
        currentShape.rotX -= deltaY * 0.5;

        // Define a sensitivity multiplier for audio parameters
        const audioSensitivity = 10.0; // <<< --- CHANGED TO 10.0 for 10x more sensitivity

        // If the dragged shape is the 'box' (shapes[1]), map its rotation to reverb parameters
        if (currentShape.name === 'box') {
            const decayMin = 0.5;
            const decayMax = 20;
            const wetMin = 0.;
            const wetMax = 1.;

            // Apply audio sensitivity to deltas for mapping
            let audioDeltaX = deltaX * audioSensitivity;
            let audioDeltaY = deltaY * audioSensitivity;

            // Re-calculate normalized rotation based on the scaled deltas for audio parameters
            let audioNormalizedRotY = (currentShape.rotY + audioDeltaX) % 360;
            if (audioNormalizedRotY > 180) audioNormalizedRotY -= 360;
            if (audioNormalizedRotY < -180) audioNormalizedRotY += 360;

            let audioNormalizedRotX = (currentShape.rotX - audioDeltaY) % 360;
            if (audioNormalizedRotX > 180) audioNormalizedRotX -= 360;
            if (audioNormalizedRotX < -180) audioNormalizedRotX += 360;

            // Map normalizedRotY to decay
            let mappedDecay = map(audioNormalizedRotY, -180, 180, decayMin, decayMax);
            mappedDecay = constrain(mappedDecay, decayMin, decayMax);
            reverb.decay = mappedDecay;

            // Map normalizedRotY to wet
            let mappedWet = map(audioNormalizedRotY, -180, 180, wetMin, wetMax);
            mappedWet = constrain(mappedWet, wetMin, wetMax);
            reverb.wet.value = mappedWet;

            const partialMin = 0.;
            const partialMax = 1.;

            // Map normalizedRotX to reverb partial
            let mappedPartial = map(audioNormalizedRotX, -90, 90, partialMin, partialMax);
            mappedPartial = constrain(mappedPartial, partialMin, partialMax);
            reverb.partial = mappedPartial;

            console.log(`Reverb - Decay: ${reverb.decay.toFixed(2)}, Partial: ${reverb.partial.toFixed(2)}, Wet: ${reverb.wet.value.toFixed(2)}`);
        }

        // If the dragged shape is the 'torus' (shapes[2]), map its rotation to autofilter parameters
        if (currentShape.name === 'torus') {
            // Apply audio sensitivity to deltas for mapping
            let audioDeltaX = deltaX * audioSensitivity;
            let audioDeltaY = deltaY * audioSensitivity;

            // Re-calculate normalized rotation based on the scaled deltas for audio parameters
            let audioNormalizedRotY = (currentShape.rotY + audioDeltaX) % 360;
            if (audioNormalizedRotY > 180) audioNormalizedRotY -= 360;
            if (audioNormalizedRotY < -180) audioNormalizedRotY += 360;

            let audioNormalizedRotX = (currentShape.rotX - audioDeltaY) % 360;
            if (audioNormalizedRotX > 180) audioNormalizedRotX -= 360;
            if (audioNormalizedRotX < -180) audioNormalizedRotX += 360;

            // Map rotY (horizontal drag) to autoFilter.depth and autoFilter.frequency (LFO rate)
            const depthMin = 0;
            const depthMax = 1;
            const freqMin = 0.1;
            const freqMax = 20;

            let mappedDepth = map(audioNormalizedRotY, -180, 180, depthMin, depthMax);
            mappedDepth = constrain(mappedDepth, depthMin, depthMax);
            autoFilter.depth.value = mappedDepth;

            let mappedFrequency = map(audioNormalizedRotY, -180, 180, freqMin, freqMax);
            mappedFrequency = constrain(mappedFrequency, freqMin, freqMax);
            autoFilter.frequency.value = mappedFrequency;

            // Map rotX (vertical drag) to autoFilter.baseFrequency and autoFilter.octaves
            const baseFreqMin = 0.2;
            const baseFreqMax = 300;
            const octavesMin = 0.2;
            const octavesMax = 6;

            let mappedBaseFrequency = map(audioNormalizedRotX, -180, 180, baseFreqMin, baseFreqMax);
            mappedBaseFrequency = constrain(mappedBaseFrequency, baseFreqMin, baseFreqMax);
            autoFilter.baseFrequency = mappedBaseFrequency;

            let mappedOctaves = map(audioNormalizedRotX, -180, 180, octavesMin, octavesMax);
            mappedOctaves = constrain(mappedOctaves, octavesMin, octavesMax);
            autoFilter.octaves = mappedOctaves;

            // Map autoFilter.wet using the absolute value of horizontal rotation for broader control
            const wetMin = 0.6;
            const wetMax = 1;
            let mappedWet = map(Math.abs(audioNormalizedRotY), 0, 180, wetMin, wetMax);
            mappedWet = constrain(mappedWet, wetMin, wetMax);
            autoFilter.wet.value = mappedWet;

            console.log(`Autofilter - Depth: ${autoFilter.depth.value.toFixed(2)}, Frequency (LFO): ${autoFilter.frequency.value.toFixed(2)}, BaseFreq: ${autoFilter.baseFrequency.toFixed(2)}, Octaves: ${autoFilter.octaves.toFixed(2)}, Wet: ${autoFilter.wet.value.toFixed(2)}`);
        }

        prevMouseX = mouseX;
        prevMouseY = mouseY;
    }
    return false;
}