// Global variable declarations
let paths = [];
let framesBetweenParticles = 5;
let nextParticleFrame = 0;
let previousParticlePosition;
let particleFadeFrames = 700;

const GRID_COLS = 16;
const GRID_ROWS = 4;
let cellWidth;
let cellHeight;

let sequencerGridVisual = [];
let sequencerGridAudio = [];
let audioOffTimers = []; // Added for auto-unpress audio

let keys; // Tone.Players instance
let currentStep = 0; // For sequencing playback
let lastDraggedCell = { row: -1, col: -1 };
// A flag to ensure audio starts only once
let audioStarted = false;




function setup() {
  createCanvas(700, 400);

  // Initialize cell dimensions immediately after canvas creation
  cellWidth = width / GRID_COLS;
  cellHeight = height / GRID_ROWS;

  // Initialize all sequencer grids
  for (let r = 0; r < GRID_ROWS; r++) {
    sequencerGridVisual[r] = [];
    sequencerGridAudio[r] = [];
    audioOffTimers[r] = []; // Initialize inner array for audio timers
    for (let c = 0; c < GRID_COLS; c++) {
      sequencerGridVisual[r][c] = 0;
      sequencerGridAudio[r][c] = false;
      audioOffTimers[r][c] = 0; // Initialize with 0
    }
  }

  // Initialize previousParticlePosition for p5.js particle system
  previousParticlePosition = createVector();
  describe(
    'When the cursor drags along the black background, it draws a pattern of multicolored circles outlined in white and connected by white lines. The circles and lines fade out over time.'
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

  // Tone.js Setup
  const limiter = new Tone.Limiter(-2).toDestination();

  // Declare the reverb instance BEFORE the compressor connects to it.
  // The reverb's output now goes to the limiter.
  const reverb = new Tone.Reverb({
    decay: 3,
    wet: 0.5 // Controls the amount of reverb in the mix
  }).connect(limiter); // Reverb's output goes to the limiter

  // The compressor now connects to the reverb, creating a serial processing chain.
  const comp = new Tone.Compressor({
    threshold: -24, // Start here, then adjust based on your mix's overall loudness
    ratio: 3, // Good for general glue; try 2 or 4 if needed
    attack: 0.02, // 20ms - allows transients through for punch
    release: 0.15 // 150ms - good for general musicality, adjust to 'breathe' with tempo
  }).connect(reverb); // Connect compressor to reverb

  // Background track player (if you want it to play with transport, remove .stop())
  const player = new Tone.Player("./audio/Nowhere/NOWHERE.mp3")
    .connect(comp); // Connect player to compressor
  player.sync().start(0);
  player.autostart = true;

  keys = new Tone.Players({
    urls: {
      0: "agogoHigh.mp3",
      1: "agogoLow.mp3",
      2: "snare.mp3",
      3: "kick.mp3",
    },
    fadeOut: "64n",
    baseUrl: `./audio/Nowhere/`,
  }).connect(comp); // Connect keys to compressor

  // Tone.js Sequencing Logic (P5.js Grid driving Tone)
  Tone.Transport.scheduleRepeat((time) => {
    currentStep = (currentStep + 1) % GRID_COLS;

    for (let r = 0; r < GRID_ROWS; r++) {
      if (sequencerGridAudio[r][currentStep]) {
        keys.player(r).start(time);
      }
    }
  }, "16n"); // Repeat every 16th note
}


// Wait for all audio files to load before enabling playback controls
Tone.loaded().then(() => {
  console.log("All audio files loaded!");
}).catch(error => {
  // Catch any errors during loading, e.g., file not found
  console.error("Error loading audio files:", error);
});







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

    // // Wait for all Tone.Player buffers to load
    // Tone.loaded().then(() => {
    //     console.log("All Tone.Player audio files loaded!");
    //     audioLoadedAndReady = true; // Set flag
    //     showStartButton(); // Display the start button and hide spinner
    // }).catch(error => {
    //     console.error("Error loading audio files (Tone.loaded()):", error);
    //     alert("Failed to load audio files. Please check paths and network console for errors.");
    //     // If loading fails, still show the button, but it might not play sound.
    //     // Or update loadingText to indicate failure.
    //     showStartButton();
    //     const loadingText = document.getElementById('loadingText');
    //     if (loadingText) loadingText.textContent = "Error loading audio. Try again?";
    // });
});








function draw() {
  background(0); // Sets the canvas background to black

  // Draw the 16x4 grid
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      let x = c * cellWidth;
      let y = r * cellHeight;

      // Decrement visual fade counter
      if (sequencerGridVisual[r][c] > 0) {
        sequencerGridVisual[r][c]--;
      }

      // Decrement audio off timer
      if (audioOffTimers[r][c] > 0) {
        audioOffTimers[r][c]--;
        if (audioOffTimers[r][c] === 0) {
          sequencerGridAudio[r][c] = false; // Turn off audio for this cell
        }
      }

      let opacity = map(sequencerGridVisual[r][c], 0, particleFadeFrames, 0, 255);

      // Highlight the current playing step
      if (c === currentStep && Tone.Transport.state === 'started') {
        fill(255, 100, 0); // Orange for the active column
      } else if (sequencerGridAudio[r][c]) {
        fill(0, 200, 200); // Solid aqua for cells that are "on" for audio
      } else {
        // If cell is "off" for audio, it might still be fading visually
        if (opacity > 0) {
          fill(0, 200, 200, opacity); // Aqua with fading opacity (for residual glow)
        } else {
          fill(50); // Dark grey for truly "off" cells with no glow
        }
      }
      stroke(100); // Grid line color
      rect(x, y, cellWidth, cellHeight);
    }
  }

  // Update and draw all p5.js particle paths
  for (let path of paths) {
    path.update();
    path.display();
  }
}

// Extracted function for toggling cell state (audio and visual)
function toggleSequencerCell(col, row) {
  // Basic check to ensure grids are initialized before interaction
  if (!sequencerGridAudio || !sequencerGridAudio[row] || !sequencerGridVisual || !sequencerGridVisual[row] || !audioOffTimers || !audioOffTimers[row]) {
    console.warn("Grids not fully initialized yet. Ignoring interaction.");
    return;
  }

  if (col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS) {
    // Toggle the audio state
    sequencerGridAudio[row][col] = !sequencerGridAudio[row][col];

    if (sequencerGridAudio[row][col]) {
      sequencerGridVisual[row][col] = particleFadeFrames; // Start visual fade
      audioOffTimers[row][col] = particleFadeFrames; // Start audio auto-off timer
    } else {
      sequencerGridVisual[row][col] = 0; // Turn off visual immediately
      audioOffTimers[row][col] = 0; // Turn off audio timer immediately
    }
  }
}

function mousePressed() {
  nextParticleFrame = frameCount;
  paths.push(new Path());

  // Reset previous particle position to mouse for p5.js particles
  previousParticlePosition.set(mouseX, mouseY);
  createParticle();

  // Handle sequencer grid click
  let col = floor(mouseX / cellWidth);
  let row = floor(mouseY / cellHeight);
  toggleSequencerCell(col, row);

  // Reset lastDraggedCell when a new click starts
  lastDraggedCell = { row: row, col: col };

  // Check if the audio context has not started yet
  if (!audioStarted) {
    // Start the Tone.js audio context
    Tone.start().then(() => {
      console.log("Audio context started by canvas click!");
      audioStarted = true;
      // Set flag to true
      // Start all your players
      Tone.Transport.bpm.value = 61;
      Tone.Transport.start();

      // Schedule BPM changes
      Tone.Transport.schedule((time) => {
        Tone.Transport.bpm.setValueAtTime(102, time);
      }, "4:2:0");

      Tone.Transport.schedule((time) => {
        Tone.Transport.bpm.setValueAtTime(144, time);
      }, "19:2:0");
    }).catch(e => {
      console.error("Error starting Tone.js context:", e);
    });
  }

  return false; // Prevent default browser behavior (e.g., right-click context menu)
}




function touchStarted() {
  nextParticleFrame = frameCount;
  paths.push(new Path());

  // Reset previous particle position to mouse for p5.js particles
  previousParticlePosition.set(mouseX, mouseY);
  createParticle();

  // Handle sequencer grid click
  let col = floor(mouseX / cellWidth);
  let row = floor(mouseY / cellHeight);
  toggleSequencerCell(col, row);

  // Reset lastDraggedCell when a new click starts
  lastDraggedCell = { row: row, col: col };

  // Check if the audio context has not started yet
  if (!audioStarted) {
    // Start the Tone.js audio context
    Tone.start().then(() => {
      console.log("Audio context started by canvas click!");
      audioStarted = true;
      // Set flag to true
      // Start all your players
      Tone.Transport.bpm.value = 61;
      Tone.Transport.start();

      // Schedule BPM changes
      Tone.Transport.schedule((time) => {
        Tone.Transport.bpm.setValueAtTime(102, time);
      }, "4:2:0");

      Tone.Transport.schedule((time) => {
        Tone.Transport.bpm.setValueAtTime(144, time);
      }, "19:2:0");
    }).catch(e => {
      console.error("Error starting Tone.js context:", e);
    });
  }

  return false; // Prevent default browser behavior (e.g., right-click context menu)
}



function mouseDragged() {
  // Handle sequencer grid drag
  let col = floor(mouseX / cellWidth);
  let row = floor(mouseY / cellHeight);

  // Only toggle if the mouse has moved into a *new* cell during the drag
  if (col !== lastDraggedCell.col || row !== lastDraggedCell.row) {
    toggleSequencerCell(col, row);
    lastDraggedCell = { row: row, col: col }; // Update last dragged cell
  }

  // Handle p5.js particle creation during drag
  if (frameCount >= nextParticleFrame) {
    createParticle();
  }
}

// --- p5.js Connected Particles System Functions and Classes ---

function createParticle() {
  let mousePosition = createVector(mouseX, mouseY);
  let velocity = p5.Vector.sub(mousePosition, previousParticlePosition);
  velocity.mult(0.05);

  let lastPath = paths[paths.length - 1];
  if (lastPath) { // Ensure there's a path to add to
    lastPath.addParticle(mousePosition, velocity);
  }

  nextParticleFrame = frameCount + framesBetweenParticles;
  previousParticlePosition.set(mouseX, mouseY);
}

class Path {
  constructor() {
    this.particles = [];
  }

  addParticle(position, velocity) {
    let particleHue = (this.particles.length * 30) % 360;
    this.particles.push(new Particle(position, velocity, particleHue));
  }

  update() {
    for (let particle of this.particles) {
      particle.update();
    }
  }

  connectParticles(particleA, particleB) {
    let opacity = particleA.framesRemaining / particleFadeFrames;
    stroke(255, opacity);
    line(
      particleA.position.x,
      particleA.position.y,
      particleB.position.x,
      particleB.position.y
    );
  }

  display() {
    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      if (this.particles[i].framesRemaining <= 0) {
        this.particles.splice(i, 1);
      } else {
        this.particles[i].display();
        if (i < this.particles.length - 1) {
          this.connectParticles(this.particles[i], this.particles[i + 1]);
        }
      }
    }
  }
}

class Particle {
  constructor(position, velocity, hue) {
    this.position = position.copy();
    this.velocity = velocity.copy();
    this.hue = hue;
    this.drag = 0.95;
    this.framesRemaining = particleFadeFrames;
  }

  update() {
    this.position.add(this.velocity);
    this.velocity.mult(this.drag);
    this.framesRemaining = this.framesRemaining - 1;
  }

  display() {
    let opacity = this.framesRemaining / particleFadeFrames;
    noStroke();
    colorMode(HSB, 360, 100, 100, 1); // Set color mode for HSB
    fill(this.hue, 80, 90, opacity);
    circle(this.position.x, this.position.y, 24);
    colorMode(RGB, 255, 255, 255, 255); // Reset to RGB for other elements
  }
}