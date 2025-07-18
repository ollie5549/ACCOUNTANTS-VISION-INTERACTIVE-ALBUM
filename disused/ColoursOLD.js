


// [ TONE.JS ]
// the source
const limiter = new Tone.Limiter(-50).toDestination(); // threshold in dB

const AcousticPlayer = new Tone.Player({
url: "./audio/COLOURS/ACOUSTIC.ogg",
loop: true,
});
const AtmosPlayer = new Tone.Player({
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
})
.connect(limiter);

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


//drawer()
// .add({
// tone: chorus,
// })
// .add({
// tone: reverb,
// })
// .add({
// tone: autoFilter,
// });



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




// bind the interface
document
.querySelector('[label="Chorus Send"]')
.addEventListener("input", (e) => {
chorusChannel.volume.value = parseFloat(e.target.value);
});
document
.querySelector('[label="autoFilter Send"]')
.addEventListener("input", (e) => {
autoFilterChannel.volume.value = parseFloat(e.target.value);
});
// document
// .getElementById("reverbSend")
// .addEventListener("input", (e) => {
// reverbChannel.volume.value = parseFloat(e.target.value);
// });

// [ P5.JS ]
// Click and drag the mouse to view the scene from different angles.





function setup() {
createCanvas(400, 400, WEBGL);

// Use degrees.
angleMode(DEGREES);

describe('A white cube on a gray background.');
}

function draw() {
background(200);

// Enable orbiting with the mouse.
orbitControl();

// Rotate the coordinate system 1/8 turn.
rotateZ(45);

// Draw a box.
box();


let reverbSendVolume = map(mouseX, 0, width, -60, -55); // Map X position to -60dB (off) to 0dB (full send)
// Directly set the value of the reverbChannel's volume AudioParam
reverbChannel.volume.value = reverbSendVolume;

// Optional: Add some visual feedback for the reverb volume
fill(0, 100, 255); // Blue color
rect(0, height - map(reverbSendVolume, -60, 0, 0, height), width, map(reverbSendVolume, -60, 0, 0, height));
textAlign(CENTER, BOTTOM);
fill(255);
text(`Reverb Send: ${reverbSendVolume.toFixed(2)} dB`, width / 2, height - 10);
text(`x: ${mouseX} y: ${mouseY}`, 50, 50);
}

function mousePressed() {
Tone.start();
}
function mouseReleased() {
}

