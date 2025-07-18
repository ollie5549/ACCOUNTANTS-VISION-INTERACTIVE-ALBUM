// Tone.js Script

// Array to store all Tone.Player instances for playback rate control
const audioPlayers = [];
// New array to store all Tone.Channel instances for panning control
const audioChannels = [];

// Initialize Tone.js components and effects
const limiter = new Tone.Limiter(-20).toDestination();

// Declare the reverb instance before it's used
const reverb = new Tone.Reverb({
    decay: 3,
    wet: 0.5
}).connect(limiter);

// Global reverb return channel that receives signals for reverb processing
const reverbReturnChannel = new Tone.Channel({ volume: 0 }).receive("reverb");
reverbReturnChannel.connect(reverb);

/**
 * Creates and sets up an audio channel with a player, connecting it to the main signal chain
 * and sending a portion of its signal to the reverb.
 * @param {string} name - The name for the UI element.
 * @param {string} url - The base name of the audio file (e.g., "Aguitar" for "Aguitar.ogg").
 * @param {number} pan - The stereo pan position (-1 for left, 1 for right, 0 for center).
 */
function makeChannel(name, url, pan) {
    const channel = new Tone.Channel({
        pan, // Set initial pan
    }); // Channel for dry signal processing (pan)

    const player = new Tone.Player({
        url: `./audio/TalkingBoats/${url}.ogg`, // Ensure this path is correct
        loop: true,
    })
        .sync() // Synchronize player with Tone.Transport
        .start(0); // Start playback at the beginning of the transport timeline

    player.connect(channel); // Connect player output to its dedicated channel

    // Connect the channel's dry signal to the limiter
    channel.connect(limiter);

    // Send a portion of the channel's signal to the global reverb bus
    // The second argument (0.3) is the send amount (0 to 1)
    channel.send("reverb", 0.3); // Send 30% of the channel's signal to the 'reverb' bus

    // Store the player and channel instances for later manipulation
    audioPlayers.push(player);
    audioChannels.push(channel); // Store the channel for panning control

    // Add a UI element (assuming 'ui' function is defined in ui.js)
    if (typeof ui !== 'undefined') { // Check if ui function exists
        ui({
            name,
            tone: channel,
            parent: document.querySelector("#content"),
        });
    }
}

// Create a meter on the destination node
const toneMeter = new Tone.Meter({ channelCount: 9 }); // Adjust channelCount if needed
Tone.Destination.chain(toneMeter); // Chain the meter to the destination for visualization
if (typeof meter !== 'undefined') { // Check if meter function exists
    meter({
        tone: toneMeter,
        parent: document.querySelector("#content"),
    });
}

// Initialize all the specific audio channels (9 channels)
makeChannel("A Guitar", "Aguitar", 1);
makeChannel("Bass", "bass", -1);
makeChannel("E Guitar", "Eguitar", 0.25);
makeChannel("Flute", "Flute", -0.25);
makeChannel("Glockenspiel", "glock", 1);
makeChannel("Harmonium", "harmonium", -1);
makeChannel("Piano", "piano", 0.25);
makeChannel("Synth", "synth", -0.25);
makeChannel("Xylophone", "xylophone", -0.25);

// Event listeners for the Tone.js play/stop toggle UI element
document
    .querySelector("tone-play-toggle")
    .addEventListener("start", async () => {
        await Tone.start(); // Unlock the audio context (crucial for web audio in browsers)
        Tone.Transport.bpm.value = 44; // Set initial tempo
        Tone.Transport.start(); // Start the Tone.js transport for playback

        // Optional: Schedule a jump in position (e.g., for song structure)
        Tone.Transport.schedule((time) => {
            const jumpTo = Math.random() < 0.5 ? "4:0:0" : "8:0:0"; // Jump to beat 4 or 8
            console.log(`Jumping to beat ${jumpTo}`);
            Tone.Transport.position = jumpTo;
        }, "2:0:0"); // Schedule the jump to happen at beat 2
    });

document
    .querySelector("tone-play-toggle")
    .addEventListener("stop", () => Tone.Transport.stop());

// P5 FLOCKING SCRIPT

let flock; // Declare flock variable globally for p5.js

// --- Variables for Controlling Audio Update Logic ---
// Flag to indicate if interaction occurred (boid count changed)
let audioUpdateNeeded = false;
let previousBoidCount = 0; // Keep track of the number of boids
let lastAppliedTempo = 44; // Stores the tempo that was last applied to Tone.js

// --- Constants for Boid Limit ---
const MAX_BOIDS = 9; // Maximum number of boids allowed in the simulation

/**
 * p5.js setup function: runs once at the beginning of the sketch.
 */
function setup() {
    createCanvas(640, 360);

    flock = new Flock();

    // Add exactly MAX_BOIDS (9) boids with random initial positions
    for (let i = 0; i < MAX_BOIDS; i++) {
        let b = new Boid(random(width), random(height)); // Random x, y position
        flock.addBoid(b);
    }
    previousBoidCount = flock.boids.length; // Initialize boid count

    describe(
        'A group of bird-like objects, represented by triangles, moving across the canvas, modeling flocking behavior.'
    );

    // Initialize lastAppliedTempo based on initial frame rate
    const initialFPS = frameRate(); // Get initial frame rate
    const minFPS = 15;
    const maxFPS = 60;
    const minTempo = 40;
    const maxTempo = 120;
    lastAppliedTempo = constrain(map(initialFPS, minFPS, maxFPS, minTempo, maxTempo), minTempo, maxTempo);

    // Apply initial tempo to Tone.js if it's ready
    if (Tone.Transport) {
        Tone.Transport.bpm.value = lastAppliedTempo;
        const baseTempo = 44;
        const newPlaybackRate = lastAppliedTempo / baseTempo;
        for (const player of audioPlayers) {
            player.playbackRate = newPlaybackRate;
        }
    }
}

/**
 * p5.js draw function: runs continuously, roughly 60 times per second.
 */
function draw() {
    background(0);
    flock.run();

    // Check if the number of boids has changed since the last frame
    // This will only trigger if boids are added/removed via mouse interaction
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

    // Only update tempo and playback rate if an interaction occurred (boid count changed)
    if (audioUpdateNeeded) {
        lastAppliedTempo = calculatedTempo; // Store the newly calculated tempo
        if (Tone.Transport) {
            Tone.Transport.bpm.value = lastAppliedTempo;

            const baseTempo = 44;
            const newPlaybackRate = lastAppliedTempo / baseTempo;

            for (const player of audioPlayers) {
                player.playbackRate = newPlaybackRate;
            }
        }
        // Reset the flag after updating audio
        audioUpdateNeeded = false;
    }

    // --- Map Boid X-coordinate to Audio Panning ---
    // Iterate through the boids and corresponding audio channels
    for (let i = 0; i < flock.boids.length && i < audioChannels.length; i++) {
        const boid = flock.boids[i];
        const channel = audioChannels[i];

        // Map boid's X position (0 to width) to Tone.js pan (-1 to 1)
        // IMPORTANT: Use constrain() to ensure the mapped value is strictly within -1 and 1
        const newPan = constrain(map(boid.position.x, 0, width, -1, 1), -1, 1);

        // Update the pan value of the audio channel
        // Use .value for direct parameter access
        channel.pan.value = newPan;
    }

    // Optional: Log values for debugging and monitoring
    // console.log(`Current FPS: ${currentFPS.toFixed(2)}, Calculated Tempo: ${calculatedTempo.toFixed(2)}, Applied Tempo: ${lastAppliedTempo.toFixed(2)}, Playback Rate: ${lastAppliedTempo / 44}`);
}

/**
 * p5.js mouseDragged function: triggered when the mouse is dragged.
 * Adds a new boid at the mouse's current position, up to MAX_BOIDS.
 */
function mouseDragged() {
    if (flock.boids.length < MAX_BOIDS) { // Only add boids if below the maximum limit
        flock.addBoid(new Boid(mouseX, mouseY));
        audioUpdateNeeded = true; // Set flag to true on user interaction
    } else {
        // Optional: Provide feedback if max boids reached
        // console.log("Maximum boids reached (9).");
    }
}

// Flock class (unchanged)
class Flock {
    constructor() {
        this.boids = [];
    }
    run() {
        for (let boid of this.boids) {
            boid.run(this.boids);
        }
    }
    addBoid(b) {
        this.boids.push(b);
    }
}

// Boid class (unchanged)
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
    run(boids) {
        this.flock(boids);
        this.update();
        this.borders();
        this.render();
    }
    applyForce(force) {
        this.acceleration.add(force);
    }
    flock(boids) {
        let separation = this.separate(boids);
        let alignment = this.align(boids);
        let cohesion = this.cohesion(boids);
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
        // The boid position can go slightly beyond the canvas edge due to this logic.
        // The constrain() in draw() handles this for panning.
        if (this.position.x < -this.size) {
            this.position.x = width + this.size;
        }
        if (this.position.y < -this.size) {
            this.position.y = height + this.size;
        }
        if (this.position.x > width + this.size) {
            this.position.x = -this.size;
        }
        if (this.position.y > height + this.size) {
            this.position.y = -this.size;
        }
    }
    separate(boids) {
        let desiredSeparation = 25.0;
        let steer = createVector(0, 0);
        let count = 0;
        for (let boid of boids) {
            let distanceToNeighbor = p5.Vector.dist(this.position, boid.position);
            if (distanceToNeighbor > 0 && distanceToNeighbor < desiredSeparation) {
                let diff = p5.Vector.sub(this.position, boid.position);
                diff.normalize();
                diff.div(distanceToNeighbor);
                steer.add(diff);
                count++;
            }
        }
        if (count > 0) {
            steer.div(count);
        }
        if (steer.mag() > 0) {
            steer.normalize();
            steer.mult(this.maxSpeed);
            steer.sub(this.velocity);
            steer.limit(this.maxForce);
        }
        return steer;
    }
    align(boids) {
        let neighborDistance = 50;
        let sum = createVector(0, 0);
        let count = 0;
        for (let i = 0; i < boids.length; i++) {
            let d = p5.Vector.dist(this.position, boids[i].position);
            if (d > 0 && d < neighborDistance) {
                sum.add(boids[i].velocity);
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
    cohesion(boids) {
        let neighborDistance = 50;
        let sum = createVector(0, 0);
        let count = 0;
        for (let i = 0; i < boids.length; i++) {
            let d = p5.Vector.dist(this.position, boids[i].position);
            if (d > 0 && d < neighborDistance) {
                sum.add(boids[i].position);
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