import { setBulkParameters, pulse, sineFreq, pulsingPower, PWMfreq, pulsePattern, pulsingMethod,
    high1, low1, high2, low2, high3, low3, highMask, lowMask, fullMask, 
	setFrequency,
	setPower} from "./pulsing.js";

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

let idx = 0;
let PWMIndex = 0;
let sineProgress = 0;
let interpolationProgress = 0;

const powerIncrementFactor = 0.1;
const distortionFactor = 0.5;

let microsecPerSamples;
let sampleRate;
let prevFrequency = 0;
let prevPower = 0;
let targetFrequency = 0;
let targetPower = 0;
let deltaTime = 0;

let pulsing;

let soundOptions;

class NoiseGenerator extends AudioWorkletProcessor {
	constructor(options) {
		super();
		soundOptions = options.processorOptions;
		sampleRate = options.processorOptions.sampleRate;
		microsecPerSamples = 1000 / (sampleRate / 1000)
		console.log(sampleRate + "Hz")
		console.log(soundOptions)

		this.port.onmessage = ((event) => {
			const d = event.data.deltaTime;
			if (!isNaN(d) && d > 0 && soundOptions.useInterpolation) {
				deltaTime = d * 1000;
				prevFrequency = sineFreq;
				prevPower = pulsingPower;
				interpolationProgress = 0;
			}
			setBulkParameters(event.data);
			
			targetFrequency = event.data.frequency;
			targetPower = event.data.power;
		});
	}

	process(inputs, outputs, parameters) {
		const output = outputs[0];
		const nowBuffering = output[0];
		const len = nowBuffering.length;

		if (soundOptions.useInterpolation && deltaTime > 0) {
			const interp = Math.min(1, interpolationProgress / deltaTime);
			setFrequency(prevFrequency + interp * (targetFrequency - prevFrequency));
			setPower(prevPower + interp * (targetPower - prevPower));
			interpolationProgress += len * microsecPerSamples;
		}

		const noOfSamples = 1000000 / sineFreq / microsecPerSamples;

		idx = Math.floor(noOfSamples * sineProgress);

		for (let i = 0; i < len; ++i) {
			const registers = pulse((i + idx) * microsecPerSamples, (i + PWMIndex) * microsecPerSamples);
			const high = popCount(registers & highMask);
			const low = popCount(registers & lowMask);
			let current = high + low;

			if (high == 0 || low == 0) current = 0;

			nowBuffering[i] = current * powerIncrementFactor;
		}
		PWMIndex += len;
		PWMIndex %= 1000000 / PWMfreq / microsecPerSamples;

		sineProgress += len / noOfSamples;
		sineProgress %= 1;

		return true;
	}
}

let sum = 0;
let prev;
let smooth;

class NoiseFilter extends AudioWorkletProcessor {
	constructor(options) {
		super();
		smooth = 7;
		prev = new Array(smooth).fill(0);
	}

	process(inputs, outputs, parameters) {
		const output = outputs[0];
		const nowBuffering = output[0];
		const input = inputs[0][0];
		const len = input.length;

		for (let i = 0; i < len; ++i) {
			sum += input[i];
			prev.push(input[i]);

			nowBuffering[i] = sum / smooth;

			sum -= prev.shift();
		}
	}
}

let sineStage = 0; 

class Distort extends AudioWorkletProcessor {
	constructor(options) {
		super();
	}

	process(inputs, outputs, parameters) {
		const output = outputs[0];
		const nowBuffering = output[0];
		const input = inputs[0][0];
		const len = input.length;

		for (let i = 0; i < len; ++i) {
			nowBuffering[i] = input[i] + Math.sin(sineStage * Math.PI * 2) * distortionFactor;
			sineStage += sineFreq / (8 * sampleRate);
			sineStage %= 1;
		}
	}
}

registerProcessor("vf-generator", NoiseGenerator);
registerProcessor("vf-filter", NoiseFilter);
registerProcessor("vf-distort", Distort);