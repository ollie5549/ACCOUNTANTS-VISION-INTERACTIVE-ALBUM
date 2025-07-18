
			// the source
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



			
			// make some effects
			const Dry = new Tone.Gain(10).toDestination();
			const DryChannel = new Tone.Channel({ volume: -60 }).connect(
				Dry
			);
			DryChannel.receive("Dry");

			const Sky = new Tone.Gain(10).toDestination();
			const SkyChannel = new Tone.Channel({ volume: -60 }).connect(
				Sky
			);
			SkyChannel.receive("Sky");

			const reverb = new Tone.Reverb(3).toDestination();
			const reverbChannel = new Tone.Channel({ volume: -60 }).connect(
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



			    // Wait for all audio files to load before enabling playback controls
            Tone.loaded().then(() => {
                console.log("All audio files loaded!");



                document
                    .querySelector("tone-play-toggle")
                    .addEventListener("start", () => {
                        AcousticPlayer.start();
                        ElectronicPlayer.start();
						KitPlayer.start();
                    });

                document
                    .querySelector("tone-play-toggle")
                    .addEventListener("stop", () => {
                        AcousticPlayer.stop();
                        ElectronicPlayer.stop();
						KitPlayer.stop();
                    });
            }).catch(error => {
                // Catch any errors during loading, e.g., file not found
                console.error("Error loading audio files:", error);
            });




			// bind the interface
			document
				.querySelector('[label="Dry"]')
				.addEventListener("input", (e) => {
					DryChannel.volume.value = parseFloat(e.target.value);
				});
			document
				.querySelector('[label="Sky"]')
				.addEventListener("input", (e) => {
					SkyChannel.volume.value = parseFloat(e.target.value);
				});
			document
				.querySelector('[label="Reverb"]')
				.addEventListener("input", (e) => {
					reverbChannel.volume.value = parseFloat(e.target.value);
				});