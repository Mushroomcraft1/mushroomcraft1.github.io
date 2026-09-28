let soundStarted = false;

let soundOptions = {
	singlePhase: false,
	sampleRate: 48000,
	bufferDuration: 50,
	waveAmplitude: 0.1 
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

function startSound() {
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
	const pulseData = new Uint8Array(samples);

	let prevPulse = 0;
	let startTime = audioCtx.currentTime;

	let activeBuffer = 0;
	let currentBuffer;

	let startIdx = 0;
	let prevSource;

	soundLoop = setInterval(() => {
		const source = audioCtx.createBufferSource();
		source.buffer = currentBuffer;
		source.connect(audioCtx.destination);
		source.start(startTime);
		startTime = audioCtx.currentTime + buffer1.duration;

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

		if (soundOptions.singlePhase) {
			for (let i = 0; i < pulseData.length; ++i) {
				registerValues = pulseData[i];

				currentPulse = registerValues & high1 ? pulseHeight : registerValues & low1 ? -pulseHeight : 0

				nowBuffering[i] = currentPulse * sign;

			}
		} else {
			for (let i = 0; i < pulseData.length; ++i) {
				registerValues = pulseData[i];

				let newNoOfHighBits = popCount(registerValues & highMask);
				let newNoOfLowBits = popCount(registerValues & lowMask);

				currentPulse = newNoOfHighBits > 0 && newNoOfLowBits > 0 ? (newNoOfHighBits + newNoOfLowBits) * pulseHeight : 0;

				if (currentPulse == 0 && currentPulse != prevPulse) sign *= -1;

				nowBuffering[i] = currentPulse * sign;

				noOfHighBits = newNoOfHighBits;
				noOfHighBits = newNoOfLowBits;
				
				prevPulse = currentPulse;
			}
		}
		nowBuffering[pulseData.length - 1] = 0;
		prevSource = source;
	}, audioDuration);
}

function stopSound() {
	clearInterval(soundLoop);
	soundStarted = false;
}