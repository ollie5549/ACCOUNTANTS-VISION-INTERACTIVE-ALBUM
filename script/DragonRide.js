// --- Tone.js Setup: Defines all players and audio effects ---
// (All of the Tone.js setup is correct and unchanged)
const limiter = new Tone.Limiter(-2).toDestination();
const comp = new Tone.Compressor({
    threshold: -24,
    ratio: 3,
    attack: 0.02,
    release: 0.15,
}).connect(limiter);
const highpassFilter = new Tone.Filter({
    type: "highpass",
    frequency: 300,
    rolloff: -24,
}).connect(comp);
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
    volume: -100,
}).connect(highpassFilter);
const reverb = new Tone.Reverb({
    decay: 1,
    wet: 1,
}).connect(highpassFilter);
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
    }
}
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
function startPlayersAndTransport() {
    if (Tone.Transport.state !== 'started') {
        Tone.Transport.start();
        GroundPlayer.start();
        AirPlayer.start();
        KitPlayer.start();
        ambientPlayer.start();
    }
}
function handleStartButtonClick() {
    if (audioLoadedAndReady && !audioContextStarted) {
        Tone.start().then(() => {
            audioContextStarted = true;
            startPlayersAndTransport();
            hideLoadingScreen();
        }).catch(e => {
            console.error("Error resuming Tone.context:", e);
        });
    }
}
document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('startButton');
    if (startButton) {
        startButton.addEventListener('click', handleStartButtonClick);
        startButton.addEventListener('touchend', handleStartButtonClick);
    }
    Tone.loaded().then(() => {
        audioLoadedAndReady = true;
        showStartButton();
    }).catch(error => {
        console.error("Error loading audio files:", error);
    });
});

// --- p5.js Sketch: Handles visual drawing and mouse/touch interactions ---

let images = [];
let landscapeImage;
let currentImageIndex = 0;
let fadeAlpha = 0;
let nextImageIndex = 1;
const fadeSpeed = 3;
const stayDuration = 5 * 60;
let timer = 0;

// Dragon image size restored to 100%
let radius = 24;
let edge = 100;
let inner = edge + radius;

const floatSpeed = 0.05;
const floatMagnitude = 10;

// Background scrolling and scaling variables
let bgX = 0;
const bgScrollSpeed = 0.3;
// Background image size restored to 100%
const bgScale = 0.4;

function preload() {
    // Load the wide landscape image
    landscapeImage = loadImage('./assets/dragon_background_wide.png');

    // Load all dragon images into the array
    images.push(loadImage('./assets/dragon1.png'));
    images.push(loadImage('./assets/dragon2.png'));
    images.push(loadImage('./assets/dragon3.png'));
    images.push(loadImage('./assets/dragon4.png'));
}

function setup() {
    createCanvas(700, 400);
    noStroke();
    rectMode(CORNERS);
    imageMode(CENTER);
}

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
    // FIX: Clear the canvas with a solid color before drawing anything else
    background(40);

    // --- Draw the scrolling background ---
    let scaledWidth = landscapeImage.width * bgScale;
    let scaledHeight = landscapeImage.height * bgScale;
    
    bgX -= bgScrollSpeed;
    if (bgX <= -scaledWidth) {
        bgX = 0;
    }

    image(landscapeImage, bgX, height / 2, scaledWidth, scaledHeight);
    image(landscapeImage, bgX + scaledWidth, height / 2, scaledWidth, scaledHeight);

    // FIX: Remove the fill and rect call here, as it's no longer needed
    // The scrolling background now fills the entire canvas
    // fill(237, 34, 93);
    // rect(edge, edge, width - edge, height - edge);

    // --- Draw the dragon based on mouse position ---
    let imageX = constrain(mouseX, inner, width - inner);
    let imageY = constrain(mouseY, inner, height - inner);
    let floatOffset = sin(frameCount * floatSpeed) * floatMagnitude;
    let finalImageY = imageY + floatOffset;

    if (images.length > 0) {
        timer++;
        
        // --- STAY PHASE ---
        if (timer < stayDuration) {
            push();
            tint(255, 255);
            if (imageX > width / 2) {
                translate(imageX, finalImageY);
                scale(-1, 1);
                image(images[currentImageIndex], 0, 0, radius * 18, radius * 18);
            } else {
                image(images[currentImageIndex], imageX, finalImageY, radius * 18, radius * 18);
            }
            pop();
        } 
        // --- FADE PHASE ---
        else {
            push();
            tint(255, 255 - fadeAlpha);
            if (imageX > width / 2) {
                translate(imageX, finalImageY);
                scale(-1, 1);
                image(images[currentImageIndex], 0, 0, radius * 18, radius * 18);
            } else {
                image(images[currentImageIndex], imageX, finalImageY, radius * 18, radius * 18);
            }
            pop();
            
            push();
            tint(255, fadeAlpha);
            if (imageX > width / 2) {
                translate(imageX, finalImageY);
                scale(-1, 1);
                image(images[nextImageIndex], 0, 0, radius * 18, radius * 18);
            } else {
                image(images[nextImageIndex], imageX, finalImageY, radius * 18, radius * 18);
            }
            pop();
            
            fadeAlpha += fadeSpeed;

            if (fadeAlpha >= 255) {
                currentImageIndex = nextImageIndex;
                nextImageIndex = (currentImageIndex + 1) % images.length;
                fadeAlpha = 0;
                timer = 0;
            }
        }
    }
    
    noTint();

    // Only update audio parameters if the audio context has started
    if (audioContextStarted) {
        const minVol = -40;
        const maxVol = 0;

        let groundVolume = map(finalImageY, inner, height - inner, minVol, maxVol);
        GroundPlayer.volume.value = groundVolume;
        KitPlayer.volume.value = groundVolume;

        let airVolume = map(finalImageY, inner, height - inner, maxVol, minVol);
        AirPlayer.volume.value = airVolume;
        ambientPlayer.volume.value = airVolume;

        const minDecay = 0.5;
        const maxDecay = 10;
        let reverbDecay = map(imageX, inner, width - inner, minDecay, maxDecay);
        reverb.decay = reverbDecay;
    }
}
