          // ==================================================================================================================
            //
            //                              CONSOLIDATED & FINAL JS SCRIPT
            //
            // ==================================================================================================================

            // =================================================================
            // Global Flags and State
            // =================================================================
            let audioContextStarted = false;
            let isErasing = false;
            let hasBroken = false; // Flag to track if the 'break it' button has been clicked before
            let p5CanvasElement; // Added global variable to hold a reference to the canvas element

            // Tone.js variables
            const audioPlayers = [];
            const audioNodes = [];
            let lastAppliedTempo = 44;

            // p5.js variables
            let flock;
            let boatFlock;
            let audioUpdateNeeded = false;
            let previousBoidCount = 0;

            // Image-specific variables
            const boatImages = [];
            const boatFiles = ['boat1.png', 'boat2.png', 'boat3.png', 'boat4.png', 'boat5.png', 'boat6.png', 'boat7.png', 'boat8.png'];

            // =================================================================
            // P5.js Preload Function
            // =================================================================
            function preload() {
                for (let i = 0; i < boatFiles.length; i++) {
                    const imagePath = `./assets/boats/${boatFiles[i]}`;
                    const img = loadImage(imagePath,
                        () => console.log(`Image loaded successfully: ${imagePath}`),
                        (e) => console.error(`Failed to load image: ${imagePath}`, e)
                    );
                    boatImages.push(img);
                }
            }

            // =================================================================
            // Tone.js Audio Setup
            // =================================================================
            const limiter = new Tone.Limiter(-2).toDestination();
            const reverb = new Tone.Reverb({
                decay: 2.8,
                wet: 0.4
            }).connect(limiter);
            const comp = new Tone.Compressor({
                threshold: -24,
                ratio: 3,
                attack: 0.02,
                release: 0.15
            }).connect(reverb);

            function makeAudioNode(name, url) {
                const panner = new Tone.Panner3D({
                    positionX: 0,
                    positionY: 0,
                    positionZ: 0
                });
                // Remove .sync().start(0) so we can control start time and playback rate later
                const player = new Tone.Player({
                    url: `./audio/TalkingBoats/${url}.mp3`,
                    loop: true
                });
                player.connect(panner);
                panner.connect(comp);
                audioPlayers.push(player);
                audioNodes.push(panner);
            }

            makeAudioNode("A Guitar", "Aguitar");
            makeAudioNode("Bass", "bass");
            makeAudioNode("E Guitar", "Eguitar");
            makeAudioNode("Flute", "Flute");
            makeAudioNode("Glockenspiel", "glock");
            makeAudioNode("Harmonium", "harmonium");
            makeAudioNode("Piano", "piano");
            makeAudioNode("Synth", "synth");
            makeAudioNode("Xylophone", "xylophone");

            const toneMeter = new Tone.Meter({
                channelCount: 9
            });
            Tone.Destination.chain(toneMeter);

            // =================================================================
            // Randomization Logic
            // =================================================================

            /**
             * Generates a random number within a specified range.
             * @param {number} min - The minimum value.
             * @param {number} max - The maximum value.
             * @returns {number} A random number.
             */
            function getRandomNumber(min, max) {
                return Math.random() * (max - min) + min;
            }

            /**
             * Randomizes the starting time and playback speed of each audio stem.
             * @param {number} maxOffset - The maximum delay in seconds for a stem.
             * @param {number} minRate - The minimum playback rate (e.g., 0.8 for 80% speed).
             * @param {number} maxRate - The maximum playback rate (e.g., 1.2 for 120% speed).
             */
            function randomizeAndStart(maxOffset = 0, minRate = 0.02, maxRate = 0.8) {
                if (Tone.Transport.state === 'started') {
                    Tone.Transport.stop();
                    audioPlayers.forEach(player => player.stop());
                }

                // Set a random tempo for the entire transport
                const randomTempo = getRandomNumber(lastAppliedTempo * 0.8, lastAppliedTempo * 1.2);
                Tone.Transport.bpm.value = randomTempo;

                // Apply a random start time and playback rate to each player
                audioPlayers.forEach(player => {
                    const randomDelay = getRandomNumber(0, maxOffset);
                    const randomRate = getRandomNumber(minRate, maxRate);

                    player.playbackRate = randomRate;
                    player.start(`+${randomDelay}`);
                    console.log(`Player starting at: +${randomDelay.toFixed(2)}s with speed: ${randomRate.toFixed(2)}x`);
                });

                Tone.Transport.start();
                console.log(`Randomized playback started with Tempo: ${randomTempo.toFixed(2)} BPM.`);
            }


            // =================================================================
            // P5.js & Flocking Logic
            // =================================================================
            function setup() {
                // Resize the canvas to fit the window initially
                const canvas = createCanvas(windowWidth, windowHeight);
                canvas.parent('canvas-container');
                p5CanvasElement = canvas.elt; // Store a reference to the canvas element

                flock = new Flock();
                boatFlock = new Flock();

                imageMode(CENTER);

                let availableImages = shuffle([...boatImages]);

                for (let i = 0; i < 9; i++) {
                    if (audioNodes[i]) {
                        const boatImage = availableImages[i % availableImages.length];
                        let boat = new Boat(random(width), random(height), audioNodes[i], audioPlayers[i], boatImage);
                        boatFlock.addBoid(boat);
                    }
                }

                describe(
                    'A group of bird-like objects (triangles) and boat-like PNG images moving across the canvas. The boats control the 3D position of different musical instruments.'
                );

                previousBoidCount = flock.boids.length;

                const initialFPS = frameRate();
                const minFPS = 15;
                const maxFPS = 60;
                const minTempo = 40;
                const maxTempo = 120;
                lastAppliedTempo = constrain(map(initialFPS, minFPS, maxFPS, minTempo, maxTempo), minFPS, maxFPS);

                Tone.loaded().then(() => {
                    console.log("All audio files loaded! Updating UI.");
                    const loadingText = document.getElementById('loadingText');
                    const spinner = document.querySelector('#loadingWatermark .spinner');
                    const startButton = document.getElementById('startButton');
                    const randomizeButton = document.getElementById('randomizeButton');


                    if (loadingText) {
                        loadingText.textContent = "Ready to start!";
                    }
                    if (spinner) {
                        spinner.style.display = 'none';
                    }
                    if (startButton) {
                        startButton.style.display = 'block';
                        startButton.disabled = false;
                    }
                    if (randomizeButton) {
                        randomizeButton.style.display = 'block';
                        randomizeButton.disabled = false;
                    }
                }).catch(error => {
                    console.error("Error loading audio files:", error);
                    const loadingWatermark = document.getElementById('loadingWatermark');
                    if (loadingWatermark) {
                        loadingWatermark.innerHTML = '<p style="color: red;">Error Loading Audio. Please refresh.</p>';
                    }
                });
            }

            function draw() {
                background(0);

                let allBoids = [...flock.boids, ...boatFlock.boids];
                flock.run(allBoids);
                boatFlock.run(allBoids);

                if (flock.boids.length !== previousBoidCount) {
                    audioUpdateNeeded = true;
                    previousBoidCount = flock.boids.length;
                }

                let minFPS = 15;
                let maxFPS = 60;
                let minTempo = 40;
                let maxTempo = 120;
                let currentFPS = frameRate();
                let calculatedTempo = constrain(map(currentFPS, minFPS, maxFPS, minTempo, maxTempo), minTempo, maxTempo);

                if (audioUpdateNeeded && audioContextStarted) {
                    lastAppliedTempo = calculatedTempo;
                    Tone.Transport.bpm.value = lastAppliedTempo;
                    const baseTempo = 44;
                    const newPlaybackRate = lastAppliedTempo / baseTempo;
                    for (const player of audioPlayers) {
                        player.playbackRate = newPlaybackRate;
                    }
                    audioUpdateNeeded = false;
                }
            }

            // =================================================================
            // User Input (Mouse, Touch & UI)
            // =================================================================

            /**
             * Inverts all colors on the page by adding a CSS filter to the body.
             */
            function invertColors() {
                const body = document.body;
                if (body) {
                    body.style.filter = 'invert(1)';
                    body.style.transition = 'filter 0.5s ease-in-out';
                    console.log("Colors inverted!");
                }
            }

            async function handleStartButtonClick() {
                if (audioContextStarted) return;

                const startButton = document.getElementById('startButton');
                const randomizeButton = document.getElementById('randomizeButton');
                if (randomizeButton) {
                    randomizeButton.style.display = 'block'; // This line makes the button visible
                }


                if (startButton) {
                    startButton.disabled = true;
                    startButton.textContent = "Starting...";
                }


                try {
                    console.log("Attempting to start Tone.js audio...");
                    await Tone.start();
                    Tone.Transport.bpm.value = lastAppliedTempo;
                    Tone.Transport.start();
                    audioPlayers.forEach(player => player.start());
                    audioContextStarted = true;
                    hideLoadingScreen();
                    console.log("Tone.js audio started successfully! 🔊");
                } catch (e) {
                    console.error("Failed to start Tone.js audio:", e);
                    if (startButton) {
                        startButton.disabled = false;
                        startButton.textContent = "Error. Try again?";
                    }
                    if (randomizeButton) {
                        randomizeButton.disabled = false;
                    }
                    alert("Failed to start audio. Please try again.");
                }
            }

            function handleRandomizeButtonClick() {
                // Invert colors on the first click
                if (!hasBroken) {
                    invertColors();
                    hasBroken = true;
                }

                if (!audioContextStarted) {
                    Tone.start().then(() => {
                        audioContextStarted = true;
                        hideLoadingScreen();
                        randomizeAndStart();
                    });
                } else {
                    randomizeAndStart();
                }
            }

            function hideLoadingScreen() {
                const loadingWatermark = document.getElementById('loadingWatermark');
                if (loadingWatermark) {
                    loadingWatermark.style.opacity = '0';
                    setTimeout(() => {
                        loadingWatermark.style.display = 'none';
                    }, 500);
                }
            }

            function mouseDragged() {
                if (mouseButton === LEFT) {
                    flock.addBoid(new Boid(mouseX, mouseY));
                    audioUpdateNeeded = true;
                } else if (mouseButton === RIGHT) {
                    let eraseRadius = 30;
                    flock.boids = flock.boids.filter(boid => {
                        let d = dist(mouseX, mouseY, boid.position.x, boid.position.y);
                        return d > eraseRadius;
                    });
                    audioUpdateNeeded = true;
                }
            }

            // NEW: Add touchStarted function to prevent scrolling
            function touchStarted() {
                // Only prevent default if the touch starts on the canvas itself
                if (event.target === p5CanvasElement) {
                    return false;
                }
                // Allow other elements to handle the touch event
                return true;
            }

            function touchMoved() {
                // NEW: Check if the touch event is on the canvas before processing
                if (event.target === p5CanvasElement) {
                    if (touches.length === 2) {
                        isErasing = true;
                        let eraseX = touches[0].x;
                        let eraseY = touches[0].y;
                        let eraseRadius = 30;
                        flock.boids = flock.boids.filter(boid => {
                            let d = dist(eraseX, eraseY, boid.position.x, boid.position.y);
                            return d > eraseRadius;
                        });
                        audioUpdateNeeded = true;
                    } else {
                        if (!isErasing && touches.length === 1) {
                            flock.addBoid(new Boid(touches[0].x, touches[0].y));
                            audioUpdateNeeded = true;
                        }
                    }
                    return false;
                }
                return true;
            }

            function touchEnded() {
                // NEW: Check if the touch event is on the canvas before processing
                if (event.target === p5CanvasElement) {
                    isErasing = false;
                    return false;
                }
                return true;
            }

            document.addEventListener('contextmenu', event => event.preventDefault());
            document.addEventListener('DOMContentLoaded', () => {
                const startButton = document.getElementById('startButton');
                if (startButton) {
                    startButton.addEventListener('click', handleStartButtonClick);
                    startButton.addEventListener('touchend', handleStartButtonClick);
                }
                const randomizeButton = document.getElementById('randomizeButton');
                if (randomizeButton) {
                    randomizeButton.addEventListener('click', handleRandomizeButtonClick);
                    randomizeButton.addEventListener('touchend', handleRandomizeButtonClick);
                }
            });


            // =================================================================
            // Flock and Boid Classes
            // =================================================================
            class Flock {
                constructor() {
                    this.boids = [];
                }
                run(allBoids = this.boids) {
                    for (let boid of this.boids) boid.run(allBoids);
                }
                addBoid(b) {
                    this.boids.push(b);
                }
            }

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
                run(allBoids) {
                    this.flock(allBoids);
                    this.update();
                    this.borders();
                    this.render();
                }
                applyForce(force) {
                    this.acceleration.add(force);
                }
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
                    desired.normalize().mult(this.maxSpeed);
                    let steer = p5.Vector.sub(desired, this.velocity).limit(this.maxForce);
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
                separate(boids) {
                    let desiredSeparation = 100.0;
                    let steer = createVector(0.1, -0.3);
                    let count = 0;
                    for (let boid of boids) {
                        let d = p5.Vector.dist(this.position, boid.position);
                        if ((d > 0) && (d < desiredSeparation)) {
                            let diff = p5.Vector.sub(this.position, boid.position);
                            diff.normalize().div(d);
                            steer.add(diff);
                            count++;
                        }
                    }
                    if (count > 0) steer.div(count);
                    if (steer.mag() > 0) {
                        steer.normalize().mult(this.maxSpeed).sub(this.velocity).limit(this.maxForce);
                    }
                    return steer;
                }
                align(boids) {
                    let neighborDist = 100;
                    let sum = createVector(1, 2);
                    let count = 0;
                    for (let other of boids) {
                        let d = p5.Vector.dist(this.position, other.position);
                        if ((d > 0) && (d < neighborDist)) {
                            sum.add(other.velocity);
                            count++;
                        }
                    }
                    if (count > 0) {
                        sum.div(count).normalize().mult(this.maxSpeed);
                        let steer = p5.Vector.sub(sum, this.velocity).limit(this.maxForce);
                        return steer;
                    }
                    return createVector(0, 0);
                }
                cohesion(boids) {
                    let neighborDist = 50;
                    let sum = createVector(0, 0);
                    let count = 0;
                    for (let other of boids) {
                        let d = p5.Vector.dist(this.position, other.position);
                        if ((d > 0) && (d < neighborDist)) {
                            sum.add(other.position);
                            count++;
                        }
                        if (other instanceof Boat) {
                            sum.add(other.position);
                            count++;
                        }
                    }
                    if (count > 0) {
                        sum.div(count);
                        return this.seek(sum);
                    }
                    return createVector(0, 0);
                }
            }

            class Boat extends Boid {
                constructor(x, y, pannerNode, playerNode, boatImage) {
                    super(x, y);
                    this.panner = pannerNode;
                    this.player = playerNode; // Store a reference to the player
                    this.image = boatImage;
                    this.size = random(80, 120);
                    this.isFlipped = random() > 0.5;

                    this.maxSpeed = 1;
                    this.angle = random(TWO_PI);
                    this.audioRadius = 5;
                    this.audioSpeed = 0.02;
                    this.targetRotation = 0;
                    this.currentRotation = 0;
                    this.rotationSpeed = 0.1;
                }
                run(allBoids) {
                    this.flock(allBoids);
                    this.update();
                    this.borders();
                    this.render();
                    this.updateAudioPosition();
                }
                render() {
                    if (this.image) {
                        push();
                        translate(this.position.x, this.position.y);

                        // This is the line that was commented out to disable rotation
                        // let theta = this.velocity.heading() + radians(90);
                        // rotate(theta);

                        if (this.isFlipped) {
                            scale(-1, 1);
                        }

                        image(this.image, 0, 0, this.size, this.size);

                        pop();
                    }
                }
                updateAudioPosition() {
                    if (this.panner) {
                        this.angle += this.audioSpeed;
                        if (this.angle > TWO_PI) this.angle -= TWO_PI;
                        const newPosX = this.audioRadius * Math.cos(this.angle);
                        const newPosZ = this.audioRadius * Math.sin(this.angle);
                        const audioSpaceYRange = 5;
                        const newPosY = map(this.position.y, 0, height, -audioSpaceYRange, audioSpaceYRange);
                        this.panner.positionX.rampTo(newPosX, 0.1);
                        this.panner.positionY.rampTo(newPosY, 0.1);
                        this.panner.positionZ.rampTo(newPosZ, 0.1);
                    }
                }
            }