	// the source
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
				.toDestination()
				.start();
			const chorusChannel = new Tone.Channel({ volume: -60 }).connect(
				chorus
			);
			chorusChannel.receive("chorus");

			const autoFilter = new Tone.AutoFilter(50).toDestination();
			const autoFilterChannel = new Tone.Channel({ volume: -60 }).connect(
				autoFilter
			);
			autoFilterChannel.receive("autoFilter");

			const reverb = new Tone.Reverb(3).toDestination();
			const reverbChannel = new Tone.Channel({ volume: -60 }).connect(
				reverb
			);
			reverbChannel.receive("reverb");

			// send the Acousticplayer to all of the channels
			const AcousticPlayerChannel = new Tone.Channel().toDestination();
			AcousticPlayerChannel.send("chorus");
			AcousticPlayerChannel.send("autoFilter");
			AcousticPlayerChannel.send("reverb");
			AcousticPlayer.connect(AcousticPlayerChannel);

			// send the Electronicplayer to all of the channels
			const ElectronicPlayerChannel = new Tone.Channel().toDestination();
			ElectronicPlayerChannel.send("chorus");
			ElectronicPlayerChannel.send("autoFilter");
			ElectronicPlayerChannel.send("reverb");
			ElectronicPlayer.connect(ElectronicPlayerChannel);


			drawer()
				.add({
					tone: chorus,
				})
				.add({
					tone: reverb,
				})
				.add({
					tone: autoFilter,
				});



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
			document
				.getElementById("reverbSend")
				.addEventListener("input", (e) => {
					reverbChannel.volume.value = parseFloat(e.target.value);
				});

  
