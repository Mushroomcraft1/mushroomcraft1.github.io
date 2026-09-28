let soundStarted = false;

let soundOptions = {
	singlePhase: true
}

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

	const audioDuration = 50;
	const samplesPerMillisecond = 48;
	const audioCtx = new AudioContext();
	audioCtx.sampleRate = 1000 * samplesPerMillisecond;
	const samples = audioDuration * samplesPerMillisecond;
	const buffer1 = audioCtx.createBuffer(1, samples, audioCtx.sampleRate);
	const buffer2 = audioCtx.createBuffer(1, samples, audioCtx.sampleRate);
	const pulseData = new Int8Array(samples);
	const pulseHeight = 0.1;

	let prevPulse = 0;


	let activeBuffer = 0;
	let currentBuffer;

	let startIdx = 0;

	soundLoop = setInterval(() => {
		const source = audioCtx.createBufferSource();
		source.buffer = currentBuffer;
		source.connect(audioCtx.destination);
		source.start();

		startTime = performance.now();

		let prev = 0;
		let currentPulse = 0;
		let sign = 1;

		currentBuffer = activeBuffer ? buffer1 : buffer2; 
		activeBuffer = ~activeBuffer & 1;


		for (let i = 0; i < pulseData.length; ++i) {
			pulseData[i] = pulse(i / samplesPerMillisecond * 1000 + startIdx);
		}

		startIdx += pulseData.length;

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
	}, audioDuration);
}

function stopSound() {
	clearInterval(soundLoop);
	soundStarted = false;
}