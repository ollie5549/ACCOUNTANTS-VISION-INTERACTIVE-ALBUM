			function createPlayerPlusPanner(url, positionX, positionY, positionZ) {
			const panner = new Tone.Panner3D({
				panningModel: "HRTF",
				positionX,
				positionY,
				positionZ,
			}).toDestination();

			const player = new Tone.Player({
				url,
				loop: true,
			}).connect(panner).sync().start(0);
		}
	createPlayerPlusPanner("./audio/ThreeBoats/acoustic.ogg", -2, 0, 0);
	createPlayerPlusPanner("./audio/ThreeBoats/electronic.ogg", 2, 0, 1);

		

		document.querySelector("tone-play-toggle").addEventListener("start", () => Tone.Transport.start());
		document.querySelector("tone-play-toggle").addEventListener("stop", () => Tone.Transport.stop());
		
		function setRotation(angle) {
			Tone.Listener.forwardX.value = Math.sin(angle);
			Tone.Listener.forwardY.value = 0;
			Tone.Listener.forwardZ.value = -Math.cos(angle);
		}

		document.querySelector("#xSlider").addEventListener("input", (e) => Tone.Listener.positionX.value = parseFloat(e.target.value));
		document.querySelector("#zSlider").addEventListener("input", (e) => Tone.Listener.positionY.value = parseFloat(e.target.value));
		document.querySelector("#rotation").addEventListener("input", (e) => setRotation(parseFloat(e.target.value)));
