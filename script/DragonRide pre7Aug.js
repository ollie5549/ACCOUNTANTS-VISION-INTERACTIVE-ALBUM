// --- Tone.js Setup: Defines all players and audio effects ---
// Create a limiter and compressor for the master output
const limiter = new Tone.Limiter(-2).toDestination();
const comp = new Tone.Compressor({
    threshold: -24,
    ratio: 3,
    attack: 0.02,
    release: 0.15,
}).connect(limiter);

// High-pass filter for the "sky" sound
const highpassFilter = new Tone.Filter({
    type: "highpass",
    frequency: 300,
    rolloff: -24,
}).connect(comp);

// Define players for each audio file
const GroundPlayer = new Tone.Player({
    url: "./audio/DragonRide/Acoustic.mp3",
    loop: true,
}).connect(comp);
const AirPlayer = new Tone.Player({
    url: "./audio/DragonRide/Electronic.mp3",
    loop: true,
}).connect(highpassFilter);
const KitPlayer = new Tone.Player({
    url: "./audio/DragonRide/Kit.mp3",
    loop: true,
}).connect(comp);
const ambientPlayer = new Tone.Player({
    url: "./audio/DragonRide/sky.mp3",
    loop: true,
    volume: -100, // Start very quiet
}).connect(highpassFilter);

// Initialize Reverb effect
const reverb = new Tone.Reverb({
    decay: 1, // Default decay
    wet: 1, // Fully wet signal
}).connect(highpassFilter);

// Send the ambient player to the reverb
ambientPlayer.connect(reverb);

// --- Loading Screen & Start Button Management ---
let audioLoadedAndReady = false;
let audioContextStarted = false;

function showStartButton() {
    const loadingText = document.getElementById('loadingText');
    const startButton = document.getElementById('startButton');

    if (loadingText && startButton) {
        loadingText.textContent = "Ready to Play!";
        startButton.style.display = 'block';
        console.log("Start button shown.");
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
    }
}

function startPlayersAndTransport() {
    if (Tone.Transport.state !== 'started') {
        Tone.Transport.start();
        GroundPlayer.start();
        AirPlayer.start();
        KitPlayer.start();
        ambientPlayer.start();
        console.log("Audio playback started! ▶️");
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
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content Loaded.");
    const startButton = document.getElementById('startButton');
    if (startButton) {
        startButton.addEventListener('click', handleStartButtonClick);
        startButton.addEventListener('touchend', handleStartButtonClick);
        console.log("Start button listeners attached.");
    }

    Tone.loaded().then(() => {
        console.log("All Tone.js audio files loaded!");
        audioLoadedAndReady = true;
        showStartButton();
    }).catch(error => {
        console.error("Error loading audio files:", error);
    });
});

// --- p5.js Sketch: Handles visual drawing and mouse/touch interactions ---

// Circle's radius and position constraints
let radius = 24;
let edge = 100;
let inner = edge + radius;

function setup() {
    createCanvas(700, 400);
    noStroke();
    ellipseMode(RADIUS);
    rectMode(CORNERS);
}

// These touch functions are now simplified and only return true to allow default behavior
function touchStarted() {
    return true;
}

function touchMoved() {
    return true;
}

function touchEnded() {
    return true;
}

function draw() {
    background(230);
    fill(237, 34, 93);
    rect(edge, edge, width - edge, height - edge);

    // Calculate circle coordinates constrained to rectangle
    let circleX = constrain(mouseX, inner, width - inner);
    let circleY = constrain(mouseY, inner, height - inner);

    fill(255);
    circle(circleX, circleY, radius);

    // Only update audio parameters if the audio context has started
    if (audioContextStarted) {
        const minVol = -40; // A quiet but audible volume in dB
        const maxVol = 0;   // Full volume in dB

        // Map Y position to the volume of the ground and air players
        let groundVolume = map(circleY, inner, height - inner, minVol, maxVol);
        GroundPlayer.volume.value = groundVolume;
        KitPlayer.volume.value = groundVolume;

        let airVolume = map(circleY, inner, height - inner, maxVol, minVol);
        AirPlayer.volume.value = airVolume;
        ambientPlayer.volume.value = airVolume;

        // Map X position to reverb decay
        const minDecay = 0.5;
        const maxDecay = 10;
        let reverbDecay = map(circleX, inner, width - inner, minDecay, maxDecay);
        reverb.decay = reverbDecay;
    }
}