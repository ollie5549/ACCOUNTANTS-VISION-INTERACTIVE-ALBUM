// [ TONE.JS ]
// the source
const limiter = new Tone.Limiter(-50).toDestination(); // threshold in dB

const AcousticPlayer = new Tone.Player({
  url: "./audio/COLOURS/ACOUSTIC.ogg",
  loop: true,
});
const AtmosPlayer = new Tone.Player({ // Atmos player added back as it might be used later. If not, it can be removed.
  url: "./audio/COLOURS/ATMOS.ogg",
  loop: true,
});
const ElectronicPlayer = new Tone.Player({
  url: "./audio/COLOURS/ELECTRONIC.ogg",
  loop: true,
});


// make some effects
const chorus = new Tone.Chorus({
  wet: 1,
}).connect(limiter);

const chorusChannel = new Tone.Channel({ volume: -60 }).connect(
  chorus
);
chorusChannel.receive("chorus");

const autoFilter = new Tone.AutoFilter(50).connect(limiter);
const autoFilterChannel = new Tone.Channel({ volume: -60 }).connect(
  autoFilter
);
autoFilterChannel.receive("autoFilter");

const reverb = new Tone.Reverb(3).connect(limiter);
const reverbChannel = new Tone.Channel({ volume: -60 }).connect(
  reverb
);
reverbChannel.receive("reverb");

// send the Acousticplayer to all of the channels
const AcousticPlayerChannel = new Tone.Channel().connect(limiter);
AcousticPlayerChannel.send("chorus");
AcousticPlayerChannel.send("autoFilter");
AcousticPlayerChannel.send("reverb");
AcousticPlayer.connect(AcousticPlayerChannel);

// send the Electronicplayer to all of the channels
const ElectronicPlayerChannel = new Tone.Channel().connect(limiter);
ElectronicPlayerChannel.send("chorus");
ElectronicPlayerChannel.send("autoFilter");
ElectronicPlayerChannel.send("reverb");
ElectronicPlayer.connect(ElectronicPlayerChannel);


// Wait for all audio files to load before enabling playback controls
Tone.loaded().then(() => {
  console.log("All audio files loaded!");

  document
    .querySelector("tone-play-toggle")
    .addEventListener("start", () => {
      AcousticPlayer.start();
      ElectronicPlayer.start();
    });

  document
    .querySelector("tone-play-toggle")
    .addEventListener("stop", () => {
      AcousticPlayer.stop();
      ElectronicPlayer.stop();
    });
}).catch(error => {
  // Catch any errors during loading, e.g., file not found
  console.error("Error loading audio files:", error);
});





let coneSize = 100; // Size of the cone

        // Define three color points in WEBGL coordinates (center is 0,0)
        // These points will dictate the pure R, G, B zones.
        let colorPoints = [];

        function setup() {
            // Create a responsive canvas that fills the container
            let canvasWidth = Math.min(710, window.innerWidth * 0.9);
            let canvasHeight = Math.min(400, window.innerHeight * 0.7);
            let canvas = createCanvas(canvasWidth, canvasHeight, WEBGL);
            canvas.parent('canvas-container'); // Attach canvas to a specific div

            angleMode(DEGREES); // Set angle mode to degrees for easier rotation understanding

            // Use a normal material for the cone, which helps visualize its 3D form.
            normalMaterial();

            // Define the three color points in WEBGL coordinates
            // Top (Green)
            colorPoints.push({ x: 0, y: -height / 3, color: [0, 255, 0] });
            // Bottom Left (Red)
            colorPoints.push({ x: -width / 3, y: height / 3, color: [255, 0, 0] });
            // Bottom Right (Blue)
            colorPoints.push({ x: width / 3, y: height / 3, color: [0, 0, 255] });

            // Describe the sketch for accessibility
            describe(
                'A 3D cone in the center of the screen that points towards the mouse cursor. ' +
                'The background color dynamically changes from red, green, and blue, blending smoothly ' +
                'based on the mouse cursor\'s proximity to three invisible points on the canvas.'
            );
        }

        function draw() {
            // Convert mouseX and mouseY (which are relative to top-left) to WEBGL coordinates (center is 0,0)
            let webglMouseX = mouseX - width / 2;
            let webglMouseY = mouseY - height / 2;

            // Calculate the total weight for normalization for color blending
            let totalWeight = 0;
            let weights = [];
            const epsilon = 0.001; // Small value to prevent division by zero when mouse is exactly on a point

            // Calculate weights based on inverse distance to each color point
            for (let i = 0; i < colorPoints.length; i++) {
                let p = colorPoints[i];
                let d = dist(webglMouseX, webglMouseY, p.x, p.y);
                let weight = 1 / (d + epsilon); // Inverse distance weight
                weights.push(weight);
                totalWeight += weight;
            }

            // Normalize weights and calculate the blended color
            let r = 0, g = 0, b = 0;
            for (let i = 0; i < colorPoints.length; i++) {
                let p = colorPoints[i];
                let normalizedWeight = weights[i] / totalWeight;
                r += p.color[0] * normalizedWeight;
                g += p.color[1] * normalizedWeight;
                b += p.color[2] * normalizedWeight;
            }

            // Set the calculated background color
            background(r, g, b);

            // --- Cone pointing logic ---
            // The cone's default orientation in p5.js WEBGL mode has its height along the Y-axis (pointing "up").
            // We want its Y-axis to point towards the mouse cursor.
            // Calculate the angle from the positive X-axis to the mouse position.
            let mouseAngle = atan2(webglMouseY, webglMouseX);

            // To make the cone's default "up" (positive Y-axis) align with the mouse direction:
            // If mouse is right (angle 0 from +X), we need to rotate 90 degrees around Z.
            // If mouse is down (angle 90 from +X), we need to rotate 180 degrees around Z.
            // If mouse is left (angle 180 from +X), we need to rotate -90 degrees (or 270) around Z.
            // If mouse is up (angle -90 from +X), we need to rotate 0 degrees around Z.
            // The pattern is: rotateZ(mouseAngle + 90 degrees).
            let coneRotationZ = mouseAngle + 90;

            // Push a new drawing state onto the stack
            push();
            // Translate the cone to the center of the screen (0,0,0 in WEBGL mode)
            translate(0, 0, 0);
            // Apply the calculated rotation to make the cone point towards the mouse
            rotateZ(coneRotationZ);
            // Draw the cone
            cone(coneSize / 2, coneSize); // radius, height
            // Pop the drawing state, restoring previous transformations
            pop();
        }

        // Handle window resizing to make the canvas responsive
        function windowResized() {
            let canvasWidth = Math.min(710, window.innerWidth * 0.9);
            let canvasHeight = Math.min(400, window.innerHeight * 0.7);
            resizeCanvas(canvasWidth, canvasHeight);

            // Recalculate color points based on new canvas size
            colorPoints = [];
            colorPoints.push({ x: 0, y: -height / 3, color: [0, 255, 0] });
            colorPoints.push({ x: -width / 3, y: height / 3, color: [255, 0, 0] });
            colorPoints.push({ x: width / 3, y: height / 3, color: [0, 0, 255] });
        }