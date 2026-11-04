export { setSoundOptions, startSound, stopSound };

let soundStarted = false;

let soundOptions = {
	singlePhase: false,
	sampleRate: 48000,
	bufferDuration: 50,
	volume: 1,
	smoothLength: 5,
	useInterpolation: true
};


let audioCtx, gainNode;

/**
 * @param {Object}
 */
function setSoundOptions(newOptions) {
	for (const key in newOptions) {
		soundOptions[key] = newOptions[key]
	}

	if (gainNode != null) {
		gainNode.gain.setValueAtTime(soundOptions.volume, audioCtx.currentTime);
	}
}

async function startSound() {
	return new Promise((res, rej) => {
		if (soundStarted) stopSound();
		soundStarted = true;
		console.log("Started sound")

		audioCtx = new AudioContext({
			sampleRate: soundOptions.sampleRate
		});

		audioCtx.audioWorklet.addModule("processor.js")
			.then(() => {
				const smoothNode = new AudioWorkletNode(audioCtx, "vf-filter");
				const speedDistortNode = new AudioWorkletNode(audioCtx, "vf-distort");
				const noiseNode = new AudioWorkletNode(audioCtx, "vf-generator" + 
					(soundOptions.singlePhase ? "-single-phase" : ""), { processorOptions: soundOptions });
				gainNode = new GainNode(audioCtx);
				
				noiseNode
					.connect(smoothNode)
					.connect(speedDistortNode)
					.connect(gainNode)
					.connect(audioCtx.destination);
				
				res((data, deltaTime) => {
					data.deltaTime = deltaTime;
					noiseNode.port.postMessage(data);
				});
			});
	});
}

function stopSound() {
	if (audioCtx.state != "closed") audioCtx.close();
	soundStarted = false;
}