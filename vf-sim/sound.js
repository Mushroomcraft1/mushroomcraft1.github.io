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


/**
 * Counts the number of 1 bits in an integer
 * @param {Integer} x 
 * @returns 
 */
function popCount(x) {
	let n = 0;
	while (x) {
		x &= x - 1;
		++n;
	}
	return n ;
}


let soundLoop;

async function startSound() {
	if (soundStarted) throw "SoundSim already started";
	soundStarted = true;
	console.log("Started sound")

	const sampleRate = soundOptions.sampleRate;
	const audioDuration = soundOptions.bufferDuration;
	const audioCtx = new AudioContext();
	audioCtx.sampleRate = sampleRate;
	const samples = audioDuration * sampleRate / 1000;
	const buffer1 = audioCtx.createBuffer(1, samples, sampleRate);
	const buffer2 = audioCtx.createBuffer(1, samples, sampleRate);
	const intermediate = audioCtx.createBuffer(2, samples, sampleRate);
	const pulseData = new Uint8Array(samples);

	let prevPulse = 0;
	let startTime = audioCtx.currentTime;

	let activeBuffer = 0;
	let currentBuffer;

	let startIdx = 0;
	let prevSource;

	await audioCtx.audioWorklet.addModule("./processor.js");
	const streamNode = new AudioWorkletNode(audioCtx, "vf-sim");
	streamNode.connect(audioCtx.destination);

	function generate() {
		let pulseHeight = soundOptions.waveAmplitude;
		let prev = 0;
		let currentPulse = 0;
		let sign = 1;

		currentBuffer = activeBuffer ? buffer1 : buffer2; 
		activeBuffer = ~activeBuffer & 1;

		const sampleIncrement = 1000 / (sampleRate / 1000);

		for (let i = 0; i < pulseData.length; ++i) {
			pulseData[i] = pulse(i * sampleIncrement + startIdx);
		}

		let noOfHighBits = 0;
		let noOfLowBits = 0;

		const nowBuffering = currentBuffer.getChannelData(0);
		const intermediateBuffer1 = intermediate.getChannelData(0);
		const intermediateBuffer2 = intermediate.getChannelData(1);
		nowBuffering.fill(0);

		const bitmasks = [high1 | low1, high2 | low2, high3 | low3];
		if (soundOptions.singlePhase) bitmasks.length = 1;

		for (const bitmask of bitmasks) {
			for (let i = 0; i < pulseData.length; ++i) {
				registerValues = pulseData[i];

				currentPulse = registerValues & bitmask ? pulseHeight : 0

				intermediateBuffer1[i] = currentPulse;
				
				prevPulse = currentPulse;
			}

			let sum = totalSum = 0;
			const smooth = Math.round(sampleRate / 48000 * soundOptions.smoothLength);
			for (let i = 0; i < pulseData.length + smooth; ++i) {
				if (i < pulseData.length) sum += intermediateBuffer1[i], totalSum += intermediateBuffer1[i];
				if (i > smooth) sum -= intermediateBuffer1[i - smooth];
				intermediateBuffer2[i] = sum / smooth;
			}

			const average = pulseHeight / 2;//totalSum / pulseData.length;
			for (let i = 0; i < pulseData.length; ++i) {
				nowBuffering[i] += intermediateBuffer2[i] - average;
			}
		}
		
		streamNode.port.postMessage(nowBuffering);
	}

	generate();

	soundLoop = setInterval(generate, audioDuration);
}

function stopSound() {
	clearInterval(soundLoop);
	soundStarted = false;
}