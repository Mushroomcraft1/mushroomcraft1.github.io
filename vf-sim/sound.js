export { setSoundOptions, startSound, stopSound };

let soundStarted = false;

let soundOptions = {
	singlePhase: false,
	sampleRate: 48000,
	bufferDuration: 50,
	waveAmplitude: 0.1,
	smoothLength: 5,
};

/**
 * @param {Object}
 */
function setSoundOptions(newOptions) {
	for (const key in newOptions) {
		soundOptions[key] = newOptions[key]
	}
}

let noiseNode;
let smoothNode;
let audioCtx;

async function startSound() {
	return new Promise((res, rej) => {
		if (soundStarted) rej("SoundSim already started");
		soundStarted = true;
		console.log("Started sound")

		audioCtx = new AudioContext({
			sampleRate: soundOptions.sampleRate
		});

		audioCtx.audioWorklet.addModule("processor.js")
			.then(() => {
				smoothNode = new AudioWorkletNode(audioCtx, "vf-filter");
				noiseNode = new AudioWorkletNode(audioCtx, "vf-generator", { processorOptions: {
					sampleRate: soundOptions.sampleRate
				} });
				smoothNode.connect(audioCtx.destination);
				noiseNode.connect(smoothNode);
				
				res((data) => {
					noiseNode.port.postMessage(data);
				});
			});
	});
}

function stopSound() {
	soundStarted = false;
}