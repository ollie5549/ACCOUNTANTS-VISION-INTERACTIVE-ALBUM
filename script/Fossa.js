// =================================================================
// Global Variables for Randomization
// =================================================================
let canvasWidth = 700; 
let canvasHeight = 400; 
let rotationSpeed = 0.25; 
let rotationDirection = 1;
let rotationXAngle = -25; 
let cameraDistance = 1.5; 
let gridSizeX = 4; // ✨ New variable for repetitions on the X-axis
let gridSizeZ = 4; // ✨ New variable for repetitions on the Z-axis
let hasBroken = false; 

const pngImages = [{
    url: './assets/fossa1.png',
    width: 300,
    height: 300
}, {
    url: './assets/fossa2.png',
    width: 300,
    height: 300
}, {
    url: './assets/fossa3.png',
    width: 300,
    height: 300
}, {
    url: './assets/fossa4.png',
    width: 300,
    height: 300
}, ];

let selectedImage; 
let selectedImageWidth = 150;
let selectedImageHeight = 150;
let imageIsReady = false; 

// =================================================================
// Tone.js Setup and other functions (unchanged)
// =================================================================
const limiter = new Tone.Limiter(-2).toDestination();
const reverb = new Tone.Reverb({
    decay: 3,
    wet: 0.1
}).connect(limiter);
const comp = new Tone.Compressor({
    threshold: -24,
    ratio: 3,
    attack: 0.02,
    release: 0.15
}).connect(reverb);
const panners = [];
const players = [];

function getRandomNumber(min, max) {
    return Math.random() * (max - min) + min;
}

function createPlayerPlusPanner(url, initialPositionX, initialPositionY, initialPositionZ) {
    const panner = new Tone.Panner3D({
        panningModel: "HRTF",
        positionX: initialPositionX,
        positionY: initialPositionY,
        positionZ: initialPositionZ,
    }).connect(comp);
    const player = new Tone.Player({
        url,
        loop: true,
    }).connect(panner);
    panners.push(panner);
    players.push(player);
}

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


let audioLoadedAndReady = false;
let audioContextStarted = false;

function showButtons() {
    const loadingWatermark = document.getElementById('loadingWatermark');
    const loadingText = document.getElementById('loadingText');
    const startButton = document.getElementById('startButton');
    const randomizeButton = document.getElementById('randomizeButton');
    if (loadingWatermark && loadingText && startButton && randomizeButton) {
        loadingText.textContent = "Ready to Play!";
        loadingWatermark.classList.add('loaded');
        startButton.style.display = 'block';
        randomizeButton.style.display = 'block';
    }
}

function hideLoadingScreen() {
    const loadingWatermark = document.getElementById('loadingWatermark');
    if (loadingWatermark) {
        loadingWatermark.style.transition = 'opacity 0.5s ease-out';
        loadingWatermark.style.opacity = '0';
        loadingWatermark.addEventListener('transitionend', () => {
            loadingWatermark.style.display = 'none';
        }, {
            once: true
        });
    }
}

function startAudioContextAndPlayback() {
    if (audioLoadedAndReady && !audioContextStarted) {
        Tone.start().then(() => {
            audioContextStarted = true;
            Tone.Transport.start();
            players.forEach(player => player.start());
            hideLoadingScreen();
        }).catch(e => {
            console.error("Error resuming Tone.context:", e);
        });
    } else if (audioContextStarted) {
        hideLoadingScreen();
    }
}

function invertColors() {
    const body = document.body;
    if (body) {
        body.style.filter = 'invert(1)';
        body.style.transition = 'filter 0.5s ease-in-out';
    }
}

function randomizeAll() {
    if (!hasBroken) {
        invertColors();
        hasBroken = true;
    }
    canvasWidth = getRandomNumber(400, 1000);
    canvasHeight = getRandomNumber(300, 600);
    resizeCanvas(canvasWidth, canvasHeight);
    rotationSpeed = getRandomNumber(0.1, 200);
    if (audioContextStarted) {
        randomizeAndStart(0, 0.2, 20.2);
    }
    selectRandomImage();
}

function randomizeAndStart(maxOffset, minRate, maxRate) {
    if (Tone.Transport.state === 'started') {
        Tone.Transport.stop();
        players.forEach(player => player.stop());
    }
    players.forEach(player => {
        const randomDelay = getRandomNumber(0, maxOffset);
        const randomRate = getRandomNumber(0.3, 2.5);
        player.playbackRate = randomRate;
        player.start(`+${randomDelay}`);
    });
    Tone.Transport.start();
}

document.addEventListener('DOMContentLoaded', () => {
    const homeButton = document.querySelector('.home-button');
    if (homeButton) {
        homeButton.addEventListener('touchend', (event) => {
            event.preventDefault();
            window.location.href = homeButton.href;
        });
        homeButton.addEventListener('click', (event) => {});
    }
    const startButton = document.getElementById('startButton');
    const randomizeButton = document.getElementById('randomizeButton');
    if (startButton) {
        startButton.addEventListener('click', startAudioContextAndPlayback);
        startButton.addEventListener('touchend', startAudioContextAndPlayback);
    }
    if (randomizeButton) {
        randomizeButton.addEventListener('click', randomizeAll);
        randomizeButton.addEventListener('touchend', randomizeAll);
    }
    Tone.loaded().then(() => {
        audioLoadedAndReady = true;
        showButtons();
    }).catch(error => {
        console.error("Error loading audio files:", error);
        showButtons();
        const loadingText = document.getElementById('loadingText');
        if (loadingText) loadingText.textContent = "Error loading audio. Try again?";
    });
});

// =================================================================
// p5.js Sketch
// =================================================================
let frameCount = 0;
let p5CanvasElement;

function setRotation(angle) {
    Tone.Listener.forwardX.value = Math.sin(angle);
    Tone.Listener.forwardY.value = 0;
    Tone.Listener.forwardZ.value = Math.cos(angle);
}

function preload() {
    selectRandomImage();
}

function setup() {
    const canvasContainer = document.getElementById('canvas-container');
    const p5Canvas = createCanvas(canvasWidth, canvasHeight, WEBGL);
    if (canvasContainer) {
        p5Canvas.parent(canvasContainer);
        p5CanvasElement = p5Canvas.elt;
    } else {
        console.error("Canvas container not found!");
    }
    angleMode(DEGREES);
    describe('A tiled plane of randomly selected PNG images');
    if (p5CanvasElement) {
        p5CanvasElement.addEventListener('touchstart', (event) => {
            event.preventDefault();
            handleCanvasPress();
        }, {
            passive: false
        });
    }
}

function selectRandomImage() {
    imageIsReady = false;
    const randomIndex = floor(random(pngImages.length));
    const imageInfo = pngImages[randomIndex];
    selectedImage = loadImage(imageInfo.url, () => {
        selectedImageWidth = imageInfo.width;
        selectedImageHeight = imageInfo.height;
        imageIsReady = true;
    }, (error) => {
        console.error(`Failed to load image from ${imageInfo.url}: ${error}`);
    });
}

function draw() {
    clear(); 

    noStroke();
    scale(cameraDistance);
    rotateX(rotationXAngle); 
    rotateY(frameCount * rotationSpeed * rotationDirection);
    frameCount++;

    const listenerAngle = frameCount * 0.0025;
    setRotation(listenerAngle);

    lights();
    
    if (imageIsReady) {
        texture(selectedImage); 
        // ✨ Use the new grid size variables in the for loops
        for (let x = -gridSizeX; x <= gridSizeX; x += 1) {
            for (let z = -gridSizeZ; z <= gridSizeZ; z += 1) {
                push();
                translate(x * (selectedImageWidth + 20), 0, z * (selectedImageHeight + 20));
                plane(selectedImageWidth, selectedImageHeight);
                pop();
            }
        }
    } else {
        fill(200);
        // ✨ Use the new grid size variables for the fallback
        for (let x = -gridSizeX; x <= gridSizeX; x += 1) {
            for (let z = -gridSizeZ; z <= gridSizeZ; z += 1) {
                push();
                translate(x * (150 + 20), 0, z * (150 + 20));
                plane(150, 150);
                pop();
            }
        }
    }
}
function handleCanvasPress() {
    selectRandomImage();
    const orbitRadius = 5;
    const yRange = {
        min: -1,
        max: 1
    };
    
    cameraDistance = getRandomNumber(0.5, 2.5);
    rotationXAngle = getRandomNumber(-45, 45);

    if (random() > 0.5) {
        rotationDirection *= -1;
    }

    // ✨ Randomly change the grid size on click from 5 to 50
    gridSizeX = floor(getRandomNumber(1, 5));
    gridSizeZ = floor(getRandomNumber(1, 5));

    panners.forEach((panner, index) => {
        const angleOffset = (index / panners.length) * Math.PI * 2;
        const currentAngle = frameCount * 0.01 + angleOffset;
        panner.positionX.value = orbitRadius * Math.sin(currentAngle);
        panner.positionY.value = getRandomNumber(yRange.min, yRange.max);
        panner.positionZ.value = orbitRadius * Math.cos(currentAngle);
    });
}

function mousePressed() {
    handleCanvasPress();
}

function touchStarted() {
    return false;
}