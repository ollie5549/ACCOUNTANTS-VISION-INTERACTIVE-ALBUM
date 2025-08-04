const limiter = new Tone.Limiter(-2).toDestination();

// Declare the reverb instance BEFORE it's connected to by the compressor
// The reverb's output now goes to the limiter.
const reverb = new Tone.Reverb({
    decay: 3,
    wet: 0.1 // Controls the amount of reverb in the mix
}).connect(limiter);

// The compressor now connects to the reverb, creating a serial processing chain.
const comp = new Tone.Compressor({
    threshold: -24, // Start here, then adjust based on your mix's overall loudness
    ratio: 3, // Good for general glue; try 2 or 4 if needed
    attack: 0.02, // 20ms - allows transients through for punch
    release: 0.15 // 150ms - good for general musicality, adjust to 'breathe' with tempo
}).connect(reverb); // Connect compressor to reverb


// Array to store references to the panners
const panners = [];

// Function to generate a random number within a specified range
function getRandomNumber(min, max) {
  return Math.random() * (max - min) + min;
}

// Define typical ranges for X, Y, Z
const xRange = { min: -5, max: 5 };
const yRange = { min: -1, max: 1 };
const zRange = { min: 0, max: 10 }; // zRange could still be used for initial placement or overall depth

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
  }).connect(comp); // Connect the panner to the compressor

  const player = new Tone.Player({
    url,
    loop: true,
  }).connect(panner).sync().start(0);

  // Store the panner for later access
  panners.push(panner);
}

// Initialize your players once when the script loads
createPlayerPlusPanner("./audio/Fossa/FOSSADRUM1.mp3", -2, 0, 0);
createPlayerPlusPanner("./audio/Fossa/FOSSADRUM2.mp3", 2, 0, 0.41086);
createPlayerPlusPanner("./audio/Fossa/FOSSADRUM3.mp3", -1.5, 0, 0.82);
createPlayerPlusPanner("./audio/Fossa/FOSSADRUM4.mp3", 1.5, 0, 1.2);
createPlayerPlusPanner("./audio/Fossa/FOSSADRUM5.mp3", -1, 0, 1.6);
createPlayerPlusPanner("./audio/Fossa/FOSSADRUM6.mp3", 1, 0, 2.06);
createPlayerPlusPanner("./audio/Fossa/FOSSADRUM7.mp3", -0.5, 0, 2.47);
createPlayerPlusPanner("./audio/Fossa/FOSSADRUM8.mp3", 0.5, 0, 2.8);
createPlayerPlusPanner("./audio/Fossa/FOSSAguitar.mp3", 0, 0, 3.29);
createPlayerPlusPanner("./audio/Fossa/FOSSAkorg.mp3", -2, 0, 3.7);
createPlayerPlusPanner("./audio/Fossa/FOSSAnord.mp3", 2, 0, 4.1);
createPlayerPlusPanner("./audio/Fossa/FOSSApiano.mp3", -1.2, 0, 4.5);
createPlayerPlusPanner("./audio/Fossa/FOSSAsax.mp3", 1.2, 0, 4.93);
createPlayerPlusPanner("./audio/Fossa/FOSSAtrumpet.mp3", -0.8, 0, 5.34);
createPlayerPlusPanner("./audio/Fossa/FOSSAxylo.mp3", 0.8, 0, 6.28);

//    document.querySelector("tone-play-toggle").addEventListener("start", () => Tone.Transport.start());
//    document.querySelector("tone-play-toggle").addEventListener("stop", () => Tone.Transport.stop());






// --- Loading Screen & Start Button Management ---
let audioLoadedAndReady = false; // Flag for when Tone.js buffers are loaded
let audioContextStarted = false; // Flag for when Tone.context has resumed
let audioStarted = false; // or var audioStarted = false;

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










let frameCount = 0;


function setRotation(angle) {
  Tone.Listener.forwardX.value = Math.sin(angle);
  Tone.Listener.forwardY.value = 0; // Assuming listener is primarily rotating on the XZ plane
  Tone.Listener.forwardZ.value = Math.cos(angle); // Use cos for Z to maintain direction
}

let snake;

function setup() {
  createCanvas(700, 400, WEBGL);
  angleMode(DEGREES);
  buildSnake();
  describe('A tiled plane of snake models');




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

function buildSnake() {
  if (snake) {
    freeGeometry(snake);
  }

  snake = buildGeometry(() => {
    colorMode(HSB, 100);
    fill(random(100), 50, 100);

    // Draw the head
    push();
    scale(1, 0.5, 1.4);
    sphere(50);
    pop();

    // Draw eyes
    for (let mirrorX of [-1, 1]) {
      push();
      scale(mirrorX, 1, 1);
      fill('black');
      translate(20, -20, 10);
      sphere(10);
      pop();
    }
    translate(0, 0, 50);

    // Draw body
    let numSegments = ceil(random(10, 30));
    for (let segment = 0; segment < numSegments; segment++) {
      rotateY(random(-60, 60));
      translate(0, 0, 50);
      push();
      rotateX(90);
      scale(1, 1, 0.5);
      let radius = map(segment, numSegments - 5, numSegments, 50, 0, true);
      cylinder(radius, 100);
      pop();
      translate(0, 0, 50);
    }

    
  });

  snake.normalize();
}


function draw() {
  background(255);
  noStroke();
  scale(1.5);

  // Slowly orbit around the plane of snakes
  rotateX(-45);
  rotateY(frameCount * 0.25);

  frameCount++; // Increment frameCount on each frame

  // Calculate the angle for listener rotation
  const listenerAngle = frameCount * 0.0025;
  setRotation(listenerAngle);

  // Set up the material and shininess
  lights();
  specularMaterial('white');
  shininess(100);

  // Tile the snake model a number of times along the ground
  for (let x = -4; x <= 4; x += 1) {
    for (let z = -4; z <= 4; z += 1) {
      push();
      translate(x * 200, 0, z * 200);
      model(snake);
      pop();
    }
  }
}


// function touchStarted() {
//     if (touches.length > 0) {
//         mousePressed();
//     }
//     return true; // Allow default if no shape was touched or if touches.length is 0
// }


function touchStarted () {
  buildSnake();

  // Define a radius for the circular path
  const orbitRadius = 5; // Adjust this value to change the size of the orbit

  // Iterate through each stored panner and update its position
  panners.forEach((panner, index) => {
    // Distribute panners around the circle based on their index
    const angleOffset = (index / panners.length) * Math.PI * 2;
    const currentAngle = frameCount * 0.01 + angleOffset; // Add frameCount for continuous movement

    // Use sine and cosine to create a circular path for X and Z
    panner.positionX.value = orbitRadius * Math.sin(currentAngle);
    panner.positionY.value = getRandomNumber(yRange.min, yRange.max); // Y remains random or fixed
    panner.positionZ.value = orbitRadius * Math.cos(currentAngle);
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



// When mouse is pressed, generate a new snake
function mousePressed () {
  buildSnake();

  // Define a radius for the circular path
  const orbitRadius = 5; // Adjust this value to change the size of the orbit

  // Iterate through each stored panner and update its position
  panners.forEach((panner, index) => {
    // Distribute panners around the circle based on their index
    const angleOffset = (index / panners.length) * Math.PI * 2;
    const currentAngle = frameCount * 0.01 + angleOffset; // Add frameCount for continuous movement

    // Use sine and cosine to create a circular path for X and Z
    panner.positionX.value = orbitRadius * Math.sin(currentAngle);
    panner.positionY.value = getRandomNumber(yRange.min, yRange.max); // Y remains random or fixed
    panner.positionZ.value = orbitRadius * Math.cos(currentAngle);
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

// // When mouse is pressed, generate a new snake
// function touchStarted() {
//   buildSnake();

//   // Define a radius for the circular path
//   const orbitRadius = 5; // Adjust this value to change the size of the orbit

//   // Iterate through each stored panner and update its position
//   panners.forEach((panner, index) => {
//     // Distribute panners around the circle based on their index
//     const angleOffset = (index / panners.length) * Math.PI * 2;
//     const currentAngle = frameCount * 0.01 + angleOffset; // Add frameCount for continuous movement

//     // Use sine and cosine to create a circular path for X and Z
//     panner.positionX.value = orbitRadius * Math.sin(currentAngle);
//     panner.positionY.value = getRandomNumber(yRange.min, yRange.max); // Y remains random or fixed
//     panner.positionZ.value = orbitRadius * Math.cos(currentAngle);
//   });

//     // Check if the audio context has not started yet
//     if (!audioStarted) {
//         // Start the Tone.js audio context
//         Tone.start().then(() => {
//             console.log("Audio context started by canvas click!");
//             audioStarted = true; // Set flag to true

//             // Start all your players
//             Tone.Transport.start();
//         }).catch(e => {
//             console.error("Error starting Tone.js context:", e);
//         });
//     }


  
// }