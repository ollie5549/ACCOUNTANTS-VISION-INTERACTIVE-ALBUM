
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
	createPlayerPlusPanner("./audio/Fossa/FOSSADRUM1.ogg", -2, 0, 0);
	createPlayerPlusPanner("./audio/Fossa/FOSSADRUM2.ogg", 2, 0, 0.41086);
	createPlayerPlusPanner("./audio/Fossa/FOSSADRUM3.ogg", -1.5, 0, 0.82);
	createPlayerPlusPanner("./audio/Fossa/FOSSADRUM4.ogg", 1.5, 0, 1.2);
	createPlayerPlusPanner("./audio/Fossa/FOSSADRUM5.ogg", -1, 0, 1.6);
	createPlayerPlusPanner("./audio/Fossa/FOSSADRUM6.ogg", 1, 0, 2.06);
	createPlayerPlusPanner("./audio/Fossa/FOSSADRUM7.ogg", -0.5, 0, 2.47);
	createPlayerPlusPanner("./audio/Fossa/FOSSADRUM8.ogg", 0.5, 0, 2.8);
	createPlayerPlusPanner("./audio/Fossa/FOSSAguitar.ogg", 0, 0, 3.29);
	createPlayerPlusPanner("./audio/Fossa/FOSSAkorg.ogg", -2, 0, 3.7);
	createPlayerPlusPanner("./audio/Fossa/FOSSAnord.ogg", 2, 0, 4.1);
	createPlayerPlusPanner("./audio/Fossa/FOSSApiano.ogg", -1.2, 0, 4.5);
	createPlayerPlusPanner("./audio/Fossa/FOSSAsax.ogg", 1.2, 0, 4.93);
	createPlayerPlusPanner("./audio/Fossa/FOSSAtrumpet.ogg", -0.8, 0, 5.34);
	createPlayerPlusPanner("./audio/Fossa/FOSSAxylo.ogg", 0.8, 0, 6.28);
		
	

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
		
		
		
