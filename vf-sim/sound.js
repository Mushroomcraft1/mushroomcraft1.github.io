export { setSoundOptions, startSound, stopSound, getSoundData };

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

let soundData = {};

/**
 * @returns {Object}
 */
function getSoundData() {
	let pulsingFrequency = soundData.PWMfreq ?? 0;
	if (soundData.pulsingMethod != "ASYNC") pulsingFrequency = soundData.pulsePattern * 2 * soundData.sineFreq;
	return {
		pulsingFrequency,
		mode: soundData.pulsePattern ?? "OFF",
		sineFrequency: soundData.sineFreq,
		PWMfreqTime: soundData.PWMfreqTime,
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
				
				noiseNode.port.onmessage = ({ data }) => {
					soundData = data;
				};

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