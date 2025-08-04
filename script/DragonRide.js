// the source
const limiter = new Tone.Limiter(-2).toDestination(); 

const comp = new Tone.Compressor({
threshold: -24, // Start here, then adjust based on your mix's overall loudness
ratio: 3, // Good for general glue; try 2 or 4 if needed
attack: 0.02, // 20ms - allows transients through for punch
release: 0.15 // 150ms - good for general musicality, adjust to 'breathe' with tempo
}).connect(limiter); // Connect this as the final stage before speakers



const AcousticPlayer = new Tone.Player({
    url: "./audio/DragonRide/Acoustic.mp3",
    loop: true,
});
const ElectronicPlayer = new Tone.Player({
    url: "./audio/DragonRide/Electronic.mp3",
    loop: true,
});
const KitPlayer = new Tone.Player({
    url: "./audio/DragonRide/Kit.mp3",
    loop: true,
});
const airPlayer = new Tone.Player({
    url: "./audio/DragonRide/sky.mp3",
    loop: true,
    volume: 0,
});

// Create a highpass filter
const highpassFilter = new Tone.Filter({
    type: "highpass", // This is crucial for removing bass
    frequency: 300,    // Adjust this frequency to control how much bass is removed
    rolloff: -24,      // How steep the cutoff is (optional, but good for clarity)
}).connect(comp)



// make some effects
const Dry = new Tone.Gain(2).connect(comp);

const DryChannel = new Tone.Channel({ volume: 10 }).connect(
    Dry
);
DryChannel.receive("Dry");

const Sky = new Tone.Gain().connect(highpassFilter);
const SkyChannel = new Tone.Channel({ volume: 0 }).connect(
    Sky
);
SkyChannel.receive("Sky");


const reverb = new Tone.Reverb().connect(highpassFilter);
const reverbChannel = new Tone.Channel({ volume: 0 }).connect(
    reverb
);
reverbChannel.receive("reverb");




// send the Acousticplayer to all of the channels
const AcousticPlayerChannel = new Tone.Channel();
AcousticPlayerChannel.send("Dry", 0);
AcousticPlayerChannel.send("Sky", 0);
AcousticPlayerChannel.send("reverb", 0);
AcousticPlayer.connect(AcousticPlayerChannel);

// send the Electronicplayer to all of the channels
const ElectronicPlayerChannel = new Tone.Channel();
ElectronicPlayerChannel.send("Dry", -20);
ElectronicPlayerChannel.send("Sky", -20);
ElectronicPlayerChannel.send("reverb", -20);
ElectronicPlayer.connect(ElectronicPlayerChannel);

// send the Kit player to all of the channels
const KitPlayerChannel = new Tone.Channel();
KitPlayerChannel.send("Dry", 0);
KitPlayerChannel.send("Sky", 0);
KitPlayerChannel.send("reverb", 0);
KitPlayer.connect(KitPlayerChannel);

// send the sky player to all of the channels
const airPlayerChannel = new Tone.Channel();
KitPlayerChannel.send("Dry", 0);
airPlayerChannel.send("Sky", 0);
airPlayerChannel.send("reverb", 0);
airPlayer.connect(airPlayerChannel);

//send the busses to a 3d Panner????



//add draws 
drawer()
    .add({
        tone: Dry,
    })
    .add({
        tone: Sky,
    })
    .add({
        tone: reverb,
    });



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
        ElectronicPlayer.start();
        KitPlayer.start();
        airPlayer.start(); // Changed AtmosPlayer to airPlayer based on your code
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
        // Or update loadingText here to indicate failure.
        showStartButton();
        const loadingText = document.getElementById('loadingText');
        if (loadingText) loadingText.textContent = "Error loading audio. Try again?";
    });
});




                //P5



                // Circle's radius
let radius = 24;

// Distance between edge of rectangle and edge of canvas
let edge = 100;

// Distance between center of circle and edge of canvas
// when circle is at edge of rectangle
let inner = edge + radius;

let audioStarted = false; // Flag to track if audio context has started

function setup() {
  createCanvas(700, 400);
  noStroke();

  // Use radius mode to pass in radius as 3rd parameter for circle()
  ellipseMode(RADIUS);

  // Use corners mode to pass in rectangle corner coordinates
  rectMode(CORNERS);

  describe(
    'Pink rectangle on a grey background. The cursor moves a white circle within the pink rectangle.'
  );
}

// --- p5.js mousePressed function ---
// This function is called automatically by p5.js when the mouse is pressed *on the canvas*.
function mousePressed() {
    // Check if the audio context has not started yet
    if (!audioStarted) {
        // Start the Tone.js audio context
        Tone.start().then(() => {
            console.log("Audio context started by canvas click!");
            audioStarted = true; // Set flag to true

            // Start all your players
            AcousticPlayer.start();
            ElectronicPlayer.start();
            KitPlayer.start();
            airPlayer.start();
        }).catch(e => {
            console.error("Error starting Tone.js context:", e);
        });
    }
    // IMPORTANT: If you want to stop audio on a second click, you'd add logic here.
    // For now, it only starts on the first click.
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


function draw() {
  background(230);

  // Draw rectangle
  fill(237, 34, 93);
  rect(edge, edge, width - edge, height - edge);

  // Calculate circle coordinates constrained to rectangle
  let circleX = constrain(mouseX, inner, width - inner);
  let circleY = constrain(mouseY, inner, height - inner);

  // Draw circle
  fill(255);
  circle(circleX, circleY, radius);

    const minVol = -40; // A quiet but audible volume in dB
    const maxVol = 0;   // Full volume in dB

     let GROUNDVolume = map(circleY, inner, height - inner, minVol, maxVol);
     DryChannel.volume.value = GROUNDVolume;

    let HIGHVolume = map(circleY, inner, height - inner, maxVol, minVol);
     SkyChannel.volume.value = HIGHVolume;
     reverbChannel.volume.value = HIGHVolume;

    // Map circleX to reverb decay
    // Decay values for Tone.Reverb are typically in seconds.
    // A reasonable range might be from 0.5 seconds (short) to 10 seconds (long).
    const minDecay = 0.5;
    const maxDecay = 10;
    
    // The `circleX` ranges from `inner` (left) to `width - inner` (right).
    // We want decay to increase as `circleX` goes right.
    let reverbDecay = map(circleX, inner, width - inner, minDecay, maxDecay);
    reverb.decay = reverbDecay;
}

