
			function makeChannel(name, url, pan) {
				const channel = new Tone.Channel({
					pan,
				}).toDestination();
				const player = new Tone.Player({
					url: `./audio/TalkingBoats/${url}.ogg`,
					loop: true,
				})
					.sync()
					.start(0);
				player.connect(channel);

				// add a UI element
				ui({
					name,
					tone: channel,
					parent: document.querySelector("#content"),
				});
			}

			// create a meter on the destination node
			const toneMeter = new Tone.Meter({ channelCount: 9 });
			Tone.Destination.chain(toneMeter);
			meter({
				tone: toneMeter,
				parent: document.querySelector("#content"),
			});

			makeChannel("A Guitar", "Aguitar", 1);
			makeChannel("Bass", "bass", -1);
			makeChannel("E Guitar", "Eguitar", 0.25);
			makeChannel("Flute", "Flute", -0.25);
            makeChannel("Glockenspeil", "glock", 1);
			makeChannel("Harmonium", "harmonium", -1);
			makeChannel("Piano", "piano", 0.25);
			makeChannel("Synth", "synth", -0.25);
            makeChannel("Xylophone", "xylophone", -0.25);

			document
				.querySelector("tone-play-toggle")
				.addEventListener("start", () => Tone.Transport.start());
			document
				.querySelector("tone-play-toggle")
				.addEventListener("stop", () => Tone.Transport.stop());
   
                document
                .querySelector("tone-play-toggle")
                .addEventListener("start", async () => {
                await Tone.start(); // 🔓 Unlock the audio context
                Tone.Transport.bpm.value = 44;

                Tone.Transport.schedule((time) => {
const jumpTo = Math.random() < 0.5 ? "4:0:0" : "8:0:0";
                   console.log(`Jumping to beat ${jumpTo}`);
                   
Tone.Transport.position = jumpTo;
}, "2:0:0");

  });


