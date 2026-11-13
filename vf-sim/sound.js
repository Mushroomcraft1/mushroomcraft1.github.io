export { setSoundOptions, startSound, stopSound, getSoundData, startRecording, stopRecording, setRecordingSavedCallback };

let soundStarted = false;

let soundOptions = {
	singlePhase: false,
	sampleRate: 48000,
	bufferDuration: 50,
	volume: 1,
	smoothLength: 5,
	useInterpolation: true,
	debug: false
};


let audioCtx = new AudioContext(), gainNode, recordNode, recordingSavedCallback;

/**
 * @param {Object} soundOptions
 */
function setSoundOptions(newOptions) {
	for (const key in newOptions) {
		soundOptions[key] = newOptions[key]
	}

	if (gainNode != null) {
		gainNode.gain.linearRampToValueAtTime(soundOptions.volume, audioCtx.currentTime + 0.5);
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
		soundOptions
	}
}

function startRecording() {
	if (recordNode == null) {
		throw "recordNode is null. Was the sound sucessfully started?";
	}

	soundOptions.recording = true;

	recordNode.port.postMessage({ record: true });
}

function stopRecording() {
	soundOptions.recording = false;

	recordNode.port.postMessage({ record: false, saveRecording: true });
}

/**
 * 
 * @param {Function} callback 
 */
function setRecordingSavedCallback(callback) {
	recordingSavedCallback = callback;
}

/** Credit: https://gist.github.com/Daninet/22edc59cf2aee0b9a90c18e553e49297
 * @param {Number} sampleRate 
 * @param {Float32Array[]} channelBuffers
*/
function audioBufferToWav(sampleRate, channelBuffers) {
	const totalSamples = channelBuffers[0].length * channelBuffers.length;

	const buffer = new ArrayBuffer(44 + totalSamples * 2);
	const view = new DataView(buffer);

	const writeString = (view, offset, string) => {
		for (let i = 0; i < string.length; i++) {
		view.setUint8(offset + i, string.charCodeAt(i));
		}
	};

	/* RIFF identifier */
	writeString(view, 0, "RIFF");
	/* RIFF chunk length */
	view.setUint32(4, 36 + totalSamples * 2, true);
	/* RIFF type */
	writeString(view, 8, "WAVE");
	/* format chunk identifier */
	writeString(view, 12, "fmt ");
	/* format chunk length */
	view.setUint32(16, 16, true);
	/* sample format (raw) */
	view.setUint16(20, 1, true);
	/* channel count */
	view.setUint16(22, channelBuffers.length, true);
	/* sample rate */
	view.setUint32(24, sampleRate, true);
	/* byte rate (sample rate * block align) */
	view.setUint32(28, sampleRate * 4, true);
	/* block align (channel count * bytes per sample) */
	view.setUint16(32, channelBuffers.length * 2, true);
	/* bits per sample */
	view.setUint16(34, 16, true);
	/* data chunk identifier */
	writeString(view, 36, "data");
	/* data chunk length */
	view.setUint32(40, totalSamples * 2, true);

	// floatTo16BitPCM
	let offset = 44;
	for (let i = 0; i < channelBuffers[0].length; i++) {
		for (let channel = 0; channel < channelBuffers.length; channel++) {
		const s = Math.max(-1, Math.min(1, channelBuffers[channel][i]));
		view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
		offset += 2;
		}
	}

	return buffer;
}

async function startSound() {
	return new Promise((res, rej) => {
		if (soundStarted) stopSound();
		soundStarted = true;
		const channels = 1;

		audioCtx = new AudioContext({
			sampleRate: soundOptions.sampleRate,
			numberOfOutputs: channels
		});

		audioCtx.audioWorklet.addModule("processor.js")
			.then(() => {
				console.log("Started sound")
				const smoothNode = new AudioWorkletNode(audioCtx, "vf-filter");
				const speedDistortNode = new AudioWorkletNode(audioCtx, "vf-distort");
				const noiseNode = new AudioWorkletNode(audioCtx, "vf-generator" + 
					(soundOptions.singlePhase ? "-single-phase" : ""), { 
						numberOfInputs: 0, numberOfOutputs: channels,
						processorOptions: soundOptions
					});
				recordNode = new AudioWorkletNode(audioCtx, "vf-record");
				gainNode = new GainNode(audioCtx);

				noiseNode
					.connect(smoothNode)
					.connect(speedDistortNode)
					.connect(gainNode)
					.connect(recordNode)
					.connect(audioCtx.destination);
				
				noiseNode.port.onmessage = ({ data }) => {
					soundData = data;
				};

				recordNode.port.onmessage = ({ data }) => {
					const sampleLength = data[0][0].length; 

					let maxLength = 0;

					for (let i = 0; i < data.length; ++i) {
						maxLength = Math.max(maxLength, data[i].length * sampleLength);
					}

					const channels = [];

					for (let i = 0; i < data.length; ++i) {
						channels[i] = new Float32Array(maxLength);
						let sampleIdx = 0;
						for (const sample of data[i]) {
							for (let j = 0; j < sampleLength; ++j) {
								channels[i][sampleIdx + j] = sample[j];
							}
							sampleIdx += sampleLength;
						}
					}
					
					const blob = new Blob([audioBufferToWav(soundOptions.sampleRate, channels)], { type: "audio/wav"});
					const url = URL.createObjectURL(blob);
					
					console.log("Saved a recording: " + url);

					if (typeof recordingSavedCallback == "function") recordingSavedCallback(url); 
					else console.error("No callback function set for once a recording is saved.");
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