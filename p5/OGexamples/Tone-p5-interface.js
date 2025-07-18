let synth;

function setup() {
  createCanvas(400, 400);
  synth = new Tone.Synth().toDestination();
}

function draw() {
  background(0);
  fill(200, 100, 100);
  circle(width/2, height/2, 100);
}

function mousePressed() {
  // Only play note if clicked inside the circle
  if (dist(mouseX, mouseY, width/2, height/2) < 50) {
    Tone.start(); // Required to resume audio context
    synth.triggerAttackRelease("C4", "8n");
  }
}
