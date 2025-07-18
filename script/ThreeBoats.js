
const limiter = new Tone.Limiter(-2).toDestination();


// Declare the reverb instance. It's connected to the limiter, creating a parallel effects bus.
const reverb = new Tone.Reverb({
    decay: 3,
    wet: 0.2 // Controls the amount of reverb in the mix
}).connect(limiter); // Reverb's output goes to the limiter





const comp = new Tone.Compressor({
threshold: -24, // Start here, then adjust based on your mix's overall loudness
ratio: 3, // Good for general glue; try 2 or 4 if needed
attack: 0.02, // 20ms - allows transients through for punch
release: 0.15 // 150ms - good for general musicality, adjust to 'breathe' with tempo
}).connect(reverb); // Connect this as the final stage before speakers




// Array to store references to the panners
const panners = [];

// Function to generate a random number within a specified range
function getRandomNumber(min, max) {
return Math.random() * (max - min) + min;
}

// Define typical ranges for X, Y, Z
const xRange = { min: -5, max: 5 };
const yRange = { min: -1, max: 1 };
const zRange = { min: 0, max: 10 };

/**
* Creates a Tone.Player with a 3D panner and stores the panner reference.
* @param {string} url - The URL of the audio file.
* @param {number} initialPositionX - The initial X-coordinate.
* @param {number} initialPositionY - The initial Y-coordinate.
* @param {number} initialPositionZ - The initial Z-coordinate.
*/
function createPlayerPlusPanner(url, initialPositionX, initialPositionY, initialPositionZ) {
const panner = new Tone.Panner3D({
panningModel: "HRTF",
positionX: initialPositionX,
positionY: initialPositionY,
positionZ: initialPositionZ,
}).connect(comp);


const player = new Tone.Player({
url,
loop: true,
}).connect(panner).sync().start(0);
// Store the panner for later access
panners.push(panner);


}
createPlayerPlusPanner("./audio/ThreeBoats/acoustic.ogg", -2, 0, 0);
createPlayerPlusPanner("./audio/ThreeBoats/electronic.ogg", 2, 0, 1);


// document.querySelector("tone-play-toggle").addEventListener("start", () => Tone.Transport.start());
// document.querySelector("tone-play-toggle").addEventListener("stop", () => Tone.Transport.stop());


// A flag to ensure audio starts only once
let audioStarted = false;

// Wait for all audio files to load before enabling playback controls
Tone.loaded().then(() => {
console.log("All audio files loaded!");


}).catch(error => {
// Catch any errors during loading, e.g., file not found
console.error("Error loading audio files:", error);
});






function setRotation(angle) {
Tone.Listener.forwardX.value = Math.sin(angle);
Tone.Listener.forwardY.value = 0;
Tone.Listener.forwardZ.value = -Math.cos(angle);
}

// document.querySelector("#xSlider").addEventListener("input", (e) => Tone.Listener.positionX.value = parseFloat(e.target.value));
// document.querySelector("#zSlider").addEventListener("input", (e) => Tone.Listener.positionY.value = parseFloat(e.target.value));
// document.querySelector("#rotation").addEventListener("input", (e) => setRotation(parseFloat(e.target.value)));


// send to xSlider, zSlider and rotation





//p5 CONDITIONS


// Declare variables for the position and color of the circle

let circleX;
let circleY;
let circleColor;

let xSlider;
let zSlider;
let rotationSlider;

function setup() {
createCanvas(710, 400);

// Set the initial position and color of the circle
setPositionAndColor();

// Get references to your tone-slider elements
xSlider = document.getElementById('xSlider');
zSlider = document.getElementById('zSlider');
rotationSlider = document.getElementById('rotation');

describe(
'A circle whose position and color change randomly when the user clicks the canvas.'
);





// --- IMPORTANT: Hide the loading watermark once audio assets are loaded ---
Tone.loaded().then(() => {
console.log("All audio files loaded!");
const loadingWatermark = document.getElementById('loadingWatermark');
if (loadingWatermark) {
loadingWatermark.style.display = 'none'; // Hide the watermark
}
}).catch(error => {
console.error("Error loading audio files:", error);
// Optionally, display an error message on the watermark if loading fails
const loadingWatermark = document.getElementById('loadingWatermark');
if (loadingWatermark) {
loadingWatermark.innerHTML = '<p style="color: red;">Error Loading Audio. Please refresh.</p>';
}
});






}

function setPositionAndColor() {
// Set the position to a random value (within the canvas)
circleX = random(0, width);
circleY = random(0, height);

// Set R, G, and B to random values in the range (100, 256)
circleColor = color(random(100, 256), random(100, 256), random(100, 256));
}

function draw() {
background(10);

// Draw a circle at (x,y) with color c
fill(circleColor);
circle(circleX, circleY, 100);
}

function mousePressed() {
// On mouse press (re)set the position and color
setPositionAndColor();

// Iterate through each stored panner and update its position
panners.forEach(panner => {
panner.positionX.value = getRandomNumber(xRange.min, xRange.max);
panner.positionY.value = getRandomNumber(yRange.min, yRange.max);
panner.positionZ.value = getRandomNumber(zRange.min, zRange.max);
});





// Check if the audio context has not started yet
if (!audioStarted) {
// Start the Tone.js audio context
Tone.start().then(() => {
console.log("Audio context started by canvas click!");
audioStarted = true; // Set flag to true

// Start all your players
Tone.Transport.start();
}).catch(e => {
console.error("Error starting Tone.js context:", e);
});
}

}