// Tone.js Script

// Array to store all Tone.Player instances for playback rate control
const audioPlayers = [];

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
        pan,
    });

    const player = new Tone.Player({
        url: `./audio/TalkingBoats/${url}.ogg`,
        loop: true,
    })
        .sync()
        .start(0);

    player.connect(channel);
    channel.connect(limiter);
    channel.send("reverb", 0.3);
    audioPlayers.push(player);

    if (typeof ui !== 'undefined') {
        ui({
            name,
            tone: channel,
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

// Initialize all the specific audio channels
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
        await Tone.start();
        Tone.Transport.bpm.value = 44; // Initial tempo
        Tone.Transport.start();

        Tone.Transport.schedule((time) => {
            const jumpTo = Math.random() < 0.5 ? "4:0:0" : "8:0:0";
            console.log(`Jumping to beat ${jumpTo}`);
            Tone.Transport.position = jumpTo;
        }, "2:0:0");
    });

document
    .querySelector("tone-play-toggle")
    .addEventListener("stop", () => Tone.Transport.stop());

// P5 FLOCKING SCRIPT

let flock;

// --- Variables for Controlling Audio Update Logic ---
// Flag to indicate if interaction occurred (boid count changed)
let audioUpdateNeeded = false;
let previousBoidCount = 0; // Keep track of the number of boids
let lastAppliedTempo = 44; // Stores the tempo that was last applied to Tone.js

/**
 * p5.js setup function: runs once at the beginning of the sketch.
 */
function setup() {
    createCanvas(640, 360);

    flock = new Flock();

    for (let i = 0; i < 100; i++) {
        let b = new Boid(width / 2, height / 2);
        flock.addBoid(b);
    }
    previousBoidCount = flock.boids.length; // Initialize boid count

    describe(
        'A group of bird-like objects, represented by triangles, moving across the canvas, modeling flocking behavior.'
    );

    // Initialize lastAppliedTempo based on initial frame rate
    // This ensures the audio starts at a tempo reflecting the initial simulation performance
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
    if (flock.boids.length !== previousBoidCount) {
        audioUpdateNeeded = true;
        previousBoidCount = flock.boids.length;
    }

    // --- Dynamic Frame Rate to Audio Tempo Mapping ---
    // Define your desired FPS range
    let minFPS = 15; // If FPS drops below this, tempo will be at minTempo
    let maxFPS = 60; // If FPS reaches this, tempo will be at maxTempo

    // Define the desired range for your audio tempo in BPM
    let minTempo = 40; // Slower tempo when FPS is low
    let maxTempo = 120; // Faster tempo when FPS is high

    let currentFPS = frameRate(); // Get the current frame rate from p5.js

    // Calculate the potential new tempo based on current FPS
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
    // If no update is needed, the audio parameters remain at `lastAppliedTempo`

    // Optional: Log values for debugging and monitoring
    // console.log(`Current FPS: ${currentFPS.toFixed(2)}, Calculated Tempo: ${calculatedTempo.toFixed(2)}, Applied Tempo: ${lastAppliedTempo.toFixed(2)}, Playback Rate: ${lastAppliedTempo / 44}`);
}

/**
 * p5.js mouseDragged function: triggered when the mouse is dragged.
 * Adds a new boid at the mouse's current position and flags for audio update.
 */
function mouseDragged() {
    flock.addBoid(new Boid(mouseX, mouseY));
    audioUpdateNeeded = true; // Set flag to true on user interaction
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