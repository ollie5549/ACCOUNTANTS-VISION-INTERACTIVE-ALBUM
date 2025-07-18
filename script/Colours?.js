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
const AcousticVolumeChannel = new Tone.Channel().connect(limiter);
const AtmosVolumeChannel = new Tone.Channel().connect(limiter);
const ElectronicVolumeChannel = new Tone.Channel().connect(limiter);

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
.connect(limiter);

const autoFilter = new Tone.AutoFilter(50).connect(limiter); // Declare autoFilter FIRST
autoFilter.start(); // THEN call .start() on it

const reverb = new Tone.Reverb(3).connect(limiter);

// These channels receive the *sent* signal from the players and route it *into* the effects.
// Their volume *should not* be 0 if you want to hear the effect.
// Instead, we connect them directly to the effect. The effect's 'wet' parameter controls the mix.
// The .send() method creates an implicit connection to the Tone.Channel associated with the 'name'.
// We don't need explicit `chorusChannel.receive("chorus")` if we're sending to the effect directly.
// The `wet` parameter on the effect itself controls the mix.

// Corrected: The .send() method sends to a named channel. Let's make sure the EFFECT'S wet output is audible.
// The `send` method itself also has a gain parameter. We'll set that to 1 to send full signal to the effects,
// and then control the `wet` parameter of the effect directly.

AcousticVolumeChannel.send("chorus", 1); // Send full signal to chorus bus
AtmosVolumeChannel.send("chorus", 1);
ElectronicVolumeChannel.send("chorus", 1);

AcousticVolumeChannel.send("autoFilter", 1); // Send full signal to autoFilter bus
AtmosVolumeChannel.send("autoFilter", 1);
ElectronicVolumeChannel.send("autoFilter", 1);

AcousticVolumeChannel.send("reverb", 1); // Send full signal to reverb bus
AtmosVolumeChannel.send("reverb", 1);
ElectronicVolumeChannel.send("reverb", 1);

// Initialize effects with `wet` at 0 or a low value if you want to fade them in
// The `wet` parameter on the effect itself determines the blend of dry/wet.
// If you want to dynamically control the *amount* of effect, you change its `wet` property.

// We need a Tone.Channel to receive the 'send' from players *into* the effect.
// Tone.Chorus by default outputs a wet signal. The `wet` parameter on the chorus itself
// controls the balance between dry and wet. If you still want a separate 'mix' for the effect
// after it processes, you'd add a gain node after the chorus. For now, let's just control the
// chorus's own `wet` parameter.
const chorusWetControl = new Tone.Channel().connect(chorus); // This receives the sent signal *into* the chorus
chorusWetControl.receive("chorus"); // This is the channel that actually receives from .send("chorus", ...)

const autoFilterWetControl = new Tone.Channel().connect(autoFilter);
autoFilterWetControl.receive("autoFilter"); // This receives the sent signal *into* the autoFilter

const reverbWetControl = new Tone.Channel().connect(reverb);
reverbWetControl.receive("reverb"); // This receives the sent signal *into* the reverb



// --- New function to hide the loading screen ---
function hideLoadingScreen() {
    const loadingWatermark = document.getElementById('loadingWatermark');
    if (loadingWatermark) {
        // Use opacity for a smooth fade out, then set display to 'none'
        loadingWatermark.style.transition = 'opacity 0.5s ease-out';
        loadingWatermark.style.opacity = '0';
        // Once faded, remove from DOM
        loadingWatermark.addEventListener('transitionend', () => {
            loadingWatermark.style.display = 'none';
        }, { once: true });
    }
}

// --- AUDIO PLAYBACK TRIGGERED BY CANVAS INTERACTION ---
document.addEventListener('DOMContentLoaded', () => {
    const canvasContainer = document.getElementById('canvas-container');

    Tone.loaded().then(() => {
        console.log("All audio files loaded! Hiding loading screen.");
        hideLoadingScreen();

        if (canvasContainer) {
            canvasContainer.addEventListener('mousedown', async () => {
                if (Tone.context.state !== 'running') {
                    await Tone.start();
                    console.log("Audio context resumed! 🔊");
                }
                Tone.Transport.start();
                console.log("Audio playback started! ▶️");
                AcousticPlayer.start();
                AtmosPlayer.start();
                ElectronicPlayer.start();
            }, { once: true });
        } else {
            console.error("Error: 'canvas-container' element not found. Audio cannot be started by canvas interaction.");
        }
    }).catch(error => {
        console.error("Error loading audio files:", error);
        hideLoadingScreen();
    });
});


// [ P5.JS VISUALS AND AUDIO VOLUME MAPPING ]
let coneSize = 100;
let colorPoints = [];

function setup() {
    let canvasWidth = Math.min(710, window.innerWidth * 0.9);
    let canvasHeight = Math.min(400, window.innerHeight * 0.7);
    let canvas = createCanvas(canvasWidth, canvasHeight, WEBGL);
    canvas.parent('canvas-container');

    angleMode(DEGREES);
    normalMaterial();

    colorPoints.push({ x: 0, y: -height / 3, color: [0, 255, 0], playerChannel: AtmosVolumeChannel });
    colorPoints.push({ x: -width / 3, y: height / 3, color: [255, 0, 0], playerChannel: AcousticVolumeChannel });
    colorPoints.push({ x: width / 3, y: height / 3, color: [0, 0, 255], playerChannel: ElectronicVolumeChannel });

    describe(
        'A 3D cone in the center of the screen that points towards the mouse cursor. ' +
        'The background color dynamically changes from red, green, and blue, blending smoothly ' +
        'based on the mouse cursor\'s proximity to three invisible points on the canvas. ' +
        'The volume of corresponding audio tracks changes based on mouse proximity to these points.'
    );
}

function draw() {
    let webglMouseX = mouseX - width / 2;
    let webglMouseY = mouseY - height / 2;

    let totalWeight = 0;
    let weights = [];
    const epsilon = 0.001;

    for (let i = 0; i < colorPoints.length; i++) {
        let p = colorPoints[i];
        let d = dist(webglMouseX, webglMouseY, p.x, p.y);
        let weight = 1 / (d + epsilon);
        weights.push(weight);
        totalWeight += weight;
    }

    let r = 0, g = 0, b = 0;
    const minDb = -60;
    const maxDb = 0;

    for (let i = 0; i < colorPoints.length; i++) {
        let p = colorPoints[i];
        let normalizedWeight = weights[i] / totalWeight;

        r += p.color[0] * normalizedWeight;
        g += p.color[1] * normalizedWeight;
        b += p.color[2] * normalizedWeight;

        let d = dist(webglMouseX, webglMouseY, p.x, p.y);
        const maxPossibleDist = dist(0, 0, width / 2, height / 2);
        let normalizedDist = constrain(d / maxPossibleDist, 0, 1);
        let inverseNormalizedDist = 1 - normalizedDist;
        const falloffPower = 2;
        let proximityFactor = Math.pow(inverseNormalizedDist, falloffPower);
        let targetVolumeDb = map(proximityFactor, 0, 1, minDb, maxDb);
        p.playerChannel.volume.set(targetVolumeDb);
    }

    background(r, g, b);

    // --- Dynamic Effect Parameter Control ---

    // Map mouseX to Chorus Wetness (0 to 1)
    // When mouse is left, wetness is low; when right, wetness is high
    let chorusWetness = map(mouseX, 0, width, 0, 1);
    chorus.wet.set(chorusWetness); // Use .set() for AudioParams

    // Map mouseY to Reverb Wetness (0 to 1)
    // When mouse is top, wetness is low; when bottom, wetness is high
    let reverbWetness = map(mouseY, 0, height, 0, 1);
    reverb.wet.set(reverbWetness); // Use .set() for AudioParams

    // Map mouseX to AutoFilter LFO Frequency (rate of modulation)
    // A reasonable range for filter LFO frequency could be 0.1 Hz to 10 Hz
    let filterLFOFreq = map(mouseX, 0, width, 0.1, 10);
    autoFilter.frequency.set(filterLFOFreq); // This is an AudioParam, use .set()

    // Map mouseY to AutoFilter Octaves (range of modulation)
    // Octaves typically go from 0 (no modulation) to around 6-8 (wide range)
    let filterOctaves = map(mouseY, 0, height, 0, 6);
    autoFilter.octaves = filterOctaves; // This appears to be a direct property assignment based on Tone.js docs


    // --- Cone pointing logic ---
    let mouseAngle = atan2(webglMouseY, webglMouseX);
    let coneRotationZ = mouseAngle + 90;

    push();
    translate(0, 0, 0);
    rotateZ(coneRotationZ);
    cone(coneSize / 2, coneSize);
    pop();
}

function windowResized() {
    let canvasWidth = Math.min(710, window.innerWidth * 0.9);
    let canvasHeight = Math.min(400, window.innerHeight * 0.7);
    resizeCanvas(canvasWidth, canvasHeight);

    colorPoints = [];
    colorPoints.push({ x: 0, y: -height / 3, color: [0, 255, 0], playerChannel: AtmosVolumeChannel });
    colorPoints.push({ x: -width / 3, y: height / 3, color: [255, 0, 0], playerChannel: AcousticVolumeChannel });
    colorPoints.push({ x: width / 3, y: height / 3, color: [0, 0, 255], playerChannel: ElectronicVolumeChannel });
}