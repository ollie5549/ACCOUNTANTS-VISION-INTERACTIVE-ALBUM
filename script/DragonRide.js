
			// the source
            const limiter = new Tone.Limiter(-2).toDestination(); 

			const comp = new Tone.Compressor({
threshold: -24, // Start here, then adjust based on your mix's overall loudness
ratio: 3, // Good for general glue; try 2 or 4 if needed
attack: 0.02, // 20ms - allows transients through for punch
release: 0.15 // 150ms - good for general musicality, adjust to 'breathe' with tempo
}).connect(limiter); // Connect this as the final stage before speakers



			const AcousticPlayer = new Tone.Player({
				url: "./audio/DragonRide/Acoustic.ogg",
				loop: true,
			});
			const ElectronicPlayer = new Tone.Player({
				url: "./audio/DragonRide/Electronic.ogg",
				loop: true,
			});
			const KitPlayer = new Tone.Player({
				url: "./audio/DragonRide/Kit.ogg",
				loop: true,
			});
			const airPlayer = new Tone.Player({
				url: "./audio/DragonRide/sky.ogg",
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


				
// A flag to ensure audio starts only once
let audioStarted = false;

			    // Wait for all audio files to load before enabling playback controls
            Tone.loaded().then(() => {
                console.log("All audio files loaded!");


           }).catch(error => {
                // Catch any errors during loading, e.g., file not found
                console.error("Error loading audio files:", error);
            });


//                document
 //                   .querySelector("#playButton")
 //                   .addEventListener("start", () => {
//                        AcousticPlayer.start();
//                        ElectronicPlayer.start();
//						KitPlayer.start();
//						airPlayer.start();
 ///                   });

 //               document
  //                  .querySelector("#playButton")
//                    .addEventListener("stop", () => {
  //                      AcousticPlayer.stop();
 //                       ElectronicPlayer.stop();
//						KitPlayer.stop();
	//					airPlayer.stop();
  //                  });

 




			// bind the interface
//			document
//				.querySelector('[label="Dry"]')
//				.addEventListener("input", (e) => {
//					DryChannel.volume.value = parseFloat(e.target.value);
//				});
//			document
//				.querySelector('[label="Sky"]')
//				.addEventListener("input", (e) => {
//					SkyChannel.volume.value = parseFloat(e.target.value);
//				});
//			document
//				.querySelector('[label="Reverb"]')
//				.addEventListener("input", (e) => {
//					reverbChannel.volume.value = parseFloat(e.target.value);
//				});


                



                //P5



                // Circle's radius
let radius = 24;

// Distance between edge of rectangle and edge of canvas
let edge = 100;

// Distance between center of circle and edge of canvas
// when circle is at edge of rectangle
let inner = edge + radius;

function setup() {
  createCanvas(720, 720);
  noStroke();

  // Use radius mode to pass in radius as 3rd parameter for circle()
  ellipseMode(RADIUS);

  // Use corners mode to pass in rectangle corner coordinates
  rectMode(CORNERS);

  describe(
    'Pink rectangle on a grey background. The cursor moves a white circle within the pink rectangle.'
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

// 124 [inner = Highest] 596 [height - inner = lowest]

// console.log(constrain(mouseY, inner, height - inner))

	const minVol = -40; // A quiet but audible volume in dB
	const maxVol = 0;   // Full volume in dB

	 let GROUNDVolume = map(circleY, inner, height - inner, minVol, maxVol);
 	 DryChannel.volume.value = GROUNDVolume;

	let HIGHVolume = map(circleY, inner, height - inner, maxVol, minVol);
 	 SkyChannel.volume.value = HIGHVolume;
 	 reverbChannel.volume.value = HIGHVolume;



}