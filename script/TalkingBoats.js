// Tone.js Script

// Array to store all Tone.Player instances for playback rate control
const audioPlayers = [];
// Array to store all Tone.Panner3D instances for 3D audio control
const audioNodes = [];

// Flag to ensure Tone.start() is called only once
let toneStarted = false;

// Initialize Tone.js components and effects
const limiter = new Tone.Limiter(-2).toDestination();

// --- FIX START ---
// Declare the reverb instance FIRST.
// Its output will go to the limiter, as intended for a serial chain.
const reverb = new Tone.Reverb({
    decay: 3,
    wet: 0.2 // Controls the amount of reverb in the mix
}).connect(limiter); // Reverb's output goes to the limiter

// Now, declare the compressor and connect it to the reverb.
// This establishes the correct processing order: Compressor -> Reverb -> Limiter -> Destination.
const comp = new Tone.Compressor({
    threshold: -24, // Start here, then adjust based on your mix's overall loudness
    ratio: 3, // Good for general glue; try 2 or 4 if needed
    attack: 0.02, // 20ms - allows transients through for punch
    release: 0.15 // 150ms - good for general musicality, adjust to 'breathe' with tempo
}).connect(reverb); // Connect compressor to reverb
// --- FIX END ---


/**
 * Creates and sets up an audio node with a player and a 3D panner.
 * @param {string} name - The name for the UI element.
 * @param {string} url - The base name of the audio file (e.g., "Aguitar" for "Aguitar.ogg").
 */
function makeAudioNode(name, url) {
    // Panner3D positions the audio source in 3D space around the listener
    const panner = new Tone.Panner3D({
        positionX: 0,
        positionY: 0,
        positionZ: 0,
    });

    const player = new Tone.Player({
        url: `./audio/TalkingBoats/${url}.ogg`,
        loop: true,
    })
        .sync()
        .start(0);

    // --- UPDATED AUDIO ROUTING ---
    // 1. Player's output goes to the panner
    player.connect(panner);
    // 2. Panner's output now ONLY goes to the compressor (which then goes to reverb, then limiter)
    panner.connect(comp); // Connect panner to the compressor

    audioPlayers.push(player);
    audioNodes.push(panner); // Store the panner for boat control

    if (typeof ui !== 'undefined') {
        ui({
            name,
            tone: panner, // Pass the panner to the UI
            parent: document.querySelector("#content"),
        });
    }
}

// Create a meter on the destination node
const toneMeter = new Tone.Meter({ channelCount: 9 });
Tone.Destination.chain(toneMeter);
if (typeof meter !== 'undefined') {
    meter({
        tone: toneMeter,
        parent: document.querySelector("#content"),
    });
}

// Initialize all the specific audio nodes with 3D panners
makeAudioNode("A Guitar", "Aguitar");
makeAudioNode("Bass", "bass");
makeAudioNode("E Guitar", "Eguitar");
makeAudioNode("Flute", "Flute");
makeAudioNode("Glockenspiel", "glock");
makeAudioNode("Harmonium", "harmonium");
makeAudioNode("Piano", "piano");
makeAudioNode("Synth", "synth");
makeAudioNode("Xylophone", "xylophone");


// Removed the direct Tone.js play/stop toggle event listeners from HTML elements
// Instead, we will manage Tone.start() with the first mouse click.

// P5 FLOCKING SCRIPT

let flock;
let boatFlock; // A separate flock for the boats

// --- Variables for Controlling Audio Update Logic ---
let audioUpdateNeeded = false;
let previousBoidCount = 0;
let lastAppliedTempo = 44;

/**
 * p5.js setup function: runs once at the beginning of the sketch.
 */
function setup() {
    createCanvas(640, 360);

    // Initialize the flock of birds
    flock = new Flock();
    for (let i = 0; i < 0; i++) {
        let b = new Boid(width / 2, height / 2);
        flock.addBoid(b);
    }
    previousBoidCount = flock.boids.length;

    // Initialize the flock of boats
    boatFlock = new Flock();
    // Create exactly 9 boats, each linked to a 3D audio node
    for (let i = 0; i < 9; i++) {
        if (audioNodes[i]) {
            let boat = new Boat(random(width), random(height), audioNodes[i]);
            boatFlock.addBoid(boat);
        }
    }

    describe(
        'A group of bird-like objects (triangles) and boat-like objects moving across the canvas. The boats control the 3D position of different musical instruments.'
    );

    // Initialize lastAppliedTempo
    const initialFPS = frameRate();
    const minFPS = 15;
    const maxFPS = 60;
    const minTempo = 40;
    const maxTempo = 120;
    lastAppliedTempo = constrain(map(initialFPS, minFPS, maxFPS, minTempo, maxTempo), minFPS, maxFPS);

    // Apply initial tempo to Tone.js (this will be active once Tone.start() is called)
    if (Tone.Transport) {
        Tone.Transport.bpm.value = lastAppliedTempo;
        const baseTempo = 44;
        const newPlaybackRate = lastAppliedTempo / baseTempo;
        for (const player of audioPlayers) {
            player.playbackRate = newPlaybackRate;
        }
    }

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

/**
 * p5.js draw function: runs continuously.
 */
function draw() {
    background(0);

    // Combine both flocks for interaction
    let allBoids = [...flock.boids, ...boatFlock.boids];

    flock.run(allBoids); // Pass all boids to the bird flock
    boatFlock.run(allBoids); // Pass all boids to the boat flock

    if (flock.boids.length !== previousBoidCount) {
        audioUpdateNeeded = true;
        previousBoidCount = flock.boids.length;
    }

    // --- Dynamic Frame Rate to Audio Tempo Mapping ---
    let minFPS = 15;
    let maxFPS = 60;
    let minTempo = 40;
    let maxTempo = 120;
    let currentFPS = frameRate();

    let calculatedTempo = map(currentFPS, minFPS, maxFPS, minTempo, maxTempo);
    calculatedTempo = constrain(calculatedTempo, minTempo, maxTempo);

    if (audioUpdateNeeded) {
        lastAppliedTempo = calculatedTempo;
        if (Tone.Transport) {
            Tone.Transport.bpm.value = lastAppliedTempo;
            const baseTempo = 44;
            const newPlaybackRate = lastAppliedTempo / baseTempo;
            for (const player of audioPlayers) {
                player.playbackRate = newPlaybackRate;
            }
        }
        audioUpdateNeeded = false;
    }
}

/**
 * p5.js mousePressed function: starts Tone.js on the first click.
 */
function mousePressed() {
    if (!toneStarted) {
        startToneAudio();
        toneStarted = true; // Set flag to true so it doesn't start again
    }
}

/**
 * p5.js mouseDragged function: adds a new boid on drag.
 * Modified to also remove boids with right-click drag.
 */
function mouseDragged() {
    // If left mouse button is pressed (default behavior)
    if (mouseButton === LEFT) {
        flock.addBoid(new Boid(mouseX, mouseY));
        audioUpdateNeeded = true;
    }
    // If right mouse button is pressed
    else if (mouseButton === RIGHT) {
        // Define a radius for "erasing"
        let eraseRadius = 30;

        // Filter out boids within the erase radius for birds ONLY
        flock.boids = flock.boids.filter(boid => {
            let d = dist(mouseX, mouseY, boid.position.x, boid.position.y);
            return d > eraseRadius;
        });

        audioUpdateNeeded = true; // Tempo might need updating if boid count changes
    }
}

// Function to start Tone.js audio
async function startToneAudio() {
    await Tone.start();
    Tone.Transport.bpm.value = lastAppliedTempo; // Use the dynamically calculated tempo
    Tone.Transport.start();

    // Schedule the jump behavior for Tone.Transport
    //  Tone.Transport.schedule((time) => {
    //      const jumpTo = Math.random() < 0.5 ? "4:0:0" : "8:0:0";
    //      console.log(`Jumping to beat ${jumpTo}`);
    //      Tone.Transport.position = jumpTo;
    //  }, "2:0:0");
    console.log("Tone.js audio started!");
}


// Prevent default right-click context menu
document.addEventListener('contextmenu', event => event.preventDefault());


// Flock class
class Flock {
    constructor() {
        this.boids = [];
    }
    // Modify run to accept an optional 'allBoids' argument
    run(allBoids = this.boids) {
        for (let boid of this.boids) {
            boid.run(allBoids); // Pass allBoids to each boid's run method
        }
    }
    addBoid(b) {
        this.boids.push(b);
    }
}

// Boid class
class Boid {
    constructor(x, y) {
        this.acceleration = createVector(0, 0);
        this.velocity = createVector(random(-1, 1), random(-1, 1));
        this.position = createVector(x, y);
        this.size = 3.0;
        this.maxSpeed = 3;
        this.maxForce = 0.05;
        colorMode(HSB);
        this.color = color(random(256), 255, 255);
    }
    // Modified run to accept 'allBoids'
    run(allBoids) {
        this.flock(allBoids); // Pass allBoids to flocking behavior
        this.update();
        this.borders();
        this.render();
    }
    applyForce(force) {
        this.acceleration.add(force);
    }
    // Modified flock to use 'allBoids'
    flock(allBoids) {
        let separation = this.separate(allBoids);
        let alignment = this.align(allBoids);
        let cohesion = this.cohesion(allBoids);
        separation.mult(1.5);
        alignment.mult(1.0);
        cohesion.mult(1.0);
        this.applyForce(separation);
        this.applyForce(alignment);
        this.applyForce(cohesion);
    }
    update() {
        this.velocity.add(this.acceleration);
        this.velocity.limit(this.maxSpeed);
        this.position.add(this.velocity);
        this.acceleration.mult(0);
    }
    seek(target) {
        let desired = p5.Vector.sub(target, this.position);
        desired.normalize();
        desired.mult(this.maxSpeed);
        let steer = p5.Vector.sub(desired, this.velocity);
        steer.limit(this.maxForce);
        return steer;
    }
    render() {
        let theta = this.velocity.heading() + radians(90);
        fill(this.color);
        stroke(255);
        push();
        translate(this.position.x, this.position.y);
        rotate(theta);
        beginShape();
        vertex(0, -this.size * 2);
        vertex(-this.size, this.size * 2);
        vertex(this.size, this.size * 2);
        endShape(CLOSE);
        pop();
    }
    borders() {
        if (this.position.x < -this.size) this.position.x = width + this.size;
        if (this.position.y < -this.size) this.position.y = height + this.size;
        if (this.position.x > width + this.size) this.position.x = -this.size;
        if (this.position.y > height + this.size) this.position.y = -this.size;
    }
    // Modified separate to use 'allBoids'
    separate(boids) {
        let desiredSeparation = 25.0;
        let steer = createVector(0, 0);
        let count = 0;
        for (let boid of boids) {
            let d = p5.Vector.dist(this.position, boid.position);
            // Only separate from *other* boids (not itself)
            if ((d > 0) && (d < desiredSeparation)) {
                let diff = p5.Vector.sub(this.position, boid.position);
                diff.normalize();
                diff.div(d);
                steer.add(diff);
                count++;
            }
        }
        if (count > 0) steer.div(count);
        if (steer.mag() > 0) {
            steer.normalize();
            steer.mult(this.maxSpeed);
            steer.sub(this.velocity);
            steer.limit(this.maxForce);
        }
        return steer;
    }
    // Modified align to use 'allBoids'
    align(boids) {
        let neighborDist = 50;
        let sum = createVector(0, 0);
        let count = 0;
        for (let other of boids) {
            let d = p5.Vector.dist(this.position, other.position);
            // Only align with *other* boids (not itself)
            if ((d > 0) && (d < neighborDist)) {
                sum.add(other.velocity);
                count++;
            }
        }
        if (count > 0) {
            sum.div(count);
            sum.normalize();
            sum.mult(this.maxSpeed);
            let steer = p5.Vector.sub(sum, this.velocity);
            steer.limit(this.maxForce);
            return steer;
        } else {
            return createVector(0, 0);
        }
    }
    // Modified cohesion to use 'allBoids'
    cohesion(boids) {
        let neighborDist = 50;
        let sum = createVector(0, 0);
        let count = 0;
        for (let other of boids) {
            let d = p5.Vector.dist(this.position, other.position);
            // Only cohere with *other* boids (not itself)
            if ((d > 0) && (d < neighborDist)) {
                sum.add(other.position);
                count++;
            }
            // Ensure boids also cohere with boats, and vice-versa
             if (other instanceof Boat) { // Check if the other boid is a Boat
                sum.add(other.position);
                count++;
            }
        }
        if (count > 0) {
            sum.div(count);
            return this.seek(sum);
        } else {
            return createVector(0, 0);
        }
    }
}

// UPDATED Boat class
class Boat extends Boid {
    constructor(x, y, pannerNode) {
        super(x, y);
        this.panner = pannerNode;
        this.size = 10;
        this.maxSpeed = 1;
        this.color = color(210, 80, 255);
        this.angle = random(TWO_PI); // Initialize a random angle for circular motion
        this.audioRadius = 5; // Define the radius for the audio circle
        this.audioSpeed = 0.02; // Define the speed of audio circling

        // New properties for smooth upright rotation
        this.targetRotation = 0; // Target angle in radians
        this.currentRotation = 0; // Current angle in radians
        this.rotationSpeed = 0.1; // How quickly it snaps to upright (0 to 1)
    }

    // Override the run method to include audio positioning and accept 'allBoids'
    run(allBoids) {
        this.flock(allBoids); // Pass allBoids to flocking behavior
        this.update();
        this.borders();
        this.render();
        this.updateAudioPosition();
    }

    // Override the render method to draw a boat shape
    render() {
        fill(this.color);
        stroke(255);
        push();
        translate(this.position.x, this.position.y);

        // Smoothly interpolate towards upright (pointing exactly upwards, -PI/2 radians)
        // This makes the boat point up visually, regardless of its movement direction.
        this.targetRotation = -HALF_PI; // Point directly upwards
        this.currentRotation = lerp(this.currentRotation, this.targetRotation, this.rotationSpeed);
        rotate(this.currentRotation);

        // Draw the boat shape assuming its default "forward" is along the negative Y-axis (upwards)
        beginShape();
        // Base of the boat (wider part)
        vertex(-this.size * 0.7, this.size * 0.5);
        vertex(this.size * 0.7, this.size * 0.5);
        // Tip of the boat / front (where the mast starts)
        vertex(0, -this.size * 0.5);
        endShape(CLOSE);

        // Draw the mast. It should extend "upwards" from the tip of the boat.
        rect(-this.size * 0.1, -this.size * 1.5, this.size * 0.2, this.size);
        pop();
    }

    // New method to update the 3D audio position based on canvas position
    updateAudioPosition() {
        if (this.panner) {
            // Update the angle for circular motion
            this.angle += this.audioSpeed;
            if (this.angle > TWO_PI) {
                this.angle -= TWO_PI; // Keep angle within 0 to 2*PI
            }

            // Calculate new X and Z positions using sine and cosine
            // X for left/right, Z for front/back
            const newPosX = this.audioRadius * Math.cos(this.angle);
            const newPosZ = this.audioRadius * Math.sin(this.angle); // Using Z for depth, creating a circle in XZ plane

            // For the Y position (height), you can still map it from canvas Y
            // Or keep it static if you want a flat audio plane
            const audioSpaceYRange = 5; // Example range for Y
            const newPosY = map(this.position.y, 0, height, -audioSpaceYRange, audioSpaceYRange);

            // Smoothly move the audio source to the new position
            this.panner.positionX.rampTo(newPosX, 0.1);
            this.panner.positionY.rampTo(newPosY, 0.1);
            this.panner.positionZ.rampTo(newPosZ, 0.1); // Apply the calculated Z position
        }
    }
}