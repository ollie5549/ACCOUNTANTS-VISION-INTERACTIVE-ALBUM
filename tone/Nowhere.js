// Create player and sync to transport
			const player = new Tone.Player("./audio/Nowhere/NOWHERE.mp3")
				.toDestination();
			player.sync().start(0).stop()
			player.autostart = true;

			const keys = new Tone.Players({
				urls: {
					3: "agogoHigh.mp3",
					2: "agogoLow.mp3",
					1: "snare.mp3",
					0: "kick.mp3",
				},
				fadeOut: "64n",
				baseUrl: `./audio/Nowhere/`,
			}).toDestination();


			
			document
				.querySelector("tone-play-toggle")
				.addEventListener("start", () => Tone.Transport.start());
			document
				.querySelector("tone-play-toggle")
				.addEventListener("stop", () => Tone.Transport.stop());
			document
				.querySelector("tone-step-sequencer")
				.addEventListener("trigger", ({ detail }) => {
					keys.player(detail.row).start(detail.time, 0, "16t");
				});
			document
				.querySelector("tone-play-toggle")

				.addEventListener("start", async () => {
					await Tone.start(); // 🔓 Unlock the audio context
					Tone.Transport.bpm.value = 61;

					Tone.Transport.schedule((time) => {
					Tone.Transport.bpm.setValueAtTime(102, time); 
					}, "4:2:0");

					Tone.Transport.schedule((time) => {
					Tone.Transport.bpm.setValueAtTime(144, time); 
					}, "19:2:0");
  });