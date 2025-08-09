
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

// Declare a variable to hold the dragon image
let images = []; // Use an array to store multiple images
let currentImageIndex = 0;
let fadeAlpha = 255;
let nextImageIndex = 1;
const fadeSpeed = 3; // Adjust this value to control fade speed

let radius = 24;
let edge = 100;
let inner = edge + radius;

function preload() {
// Load all images into the array
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
background(230);
fill(237, 34, 93);
rect(edge, edge, width - edge, height - edge);

// Calculate image coordinates constrained to rectangle
let imageX = constrain(mouseX, inner, width - inner);
let imageY = constrain(mouseY, inner, height - inner);

if (images.length > 0) {
push(); // Save the current drawing state

// Check if the image is on the right half of the canvas
if (imageX > width / 2) {
// Flip the image horizontally by scaling the x-axis by -1
translate(imageX, imageY); // Move the origin to the image's position
scale(-1, 1);
image(images[currentImageIndex], 0, 0, radius * 18, radius * 18);
} else {
// Draw the image normally on the left half
image(images[currentImageIndex], imageX, imageY, radius * 18, radius * 18);
}
pop(); // Restore the original drawing state
}

// Only update audio parameters if the audio context has started
if (audioContextStarted) {
const minVol = -40;
const maxVol = 0;
let groundVolume = map(imageY, inner, height - inner, minVol, maxVol);
GroundPlayer.volume.value = groundVolume;
KitPlayer.volume.value = groundVolume;
let airVolume = map(imageY, inner, height - inner, maxVol, minVol);
AirPlayer.volume.value = airVolume;
ambientPlayer.volume.value = airVolume;
const minDecay = 0.5;
const maxDecay = 10;
let reverbDecay = map(imageX, inner, width - inner, minDecay, maxDecay);
reverb.decay = reverbDecay;
}
}