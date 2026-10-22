import { setBulkParameters, pulse, sineFreq, pulsingPower, PWMfreq, pulsePattern, pulsingMethod,
    high1, low1, high2, low2, high3, low3, highMask, lowMask, fullMask } from "./pulsing.js";

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
const powerIncrementFactor = 0.1;
let microsecPerSamples;

class NoiseGenerator extends AudioWorkletProcessor {
	constructor(options) {
		super();
		microsecPerSamples = 1000 / (options.processorOptions.sampleRate / 1000)

		this.port.onmessage = ((event) => {
			setBulkParameters(event.data);
		});
	}

	process(inputs, outputs, parameters) {
		const output = outputs[0];
		const nowBuffering = output[0];
		const len = nowBuffering.length;

		for (let i = 0; i < len; ++i) {
			const registers = pulse((i + idx) * microsecPerSamples);
			const high = popCount(registers & highMask);
			const low = popCount(registers & lowMask);
			let current = high + low;

			if (high == 0 || low == 0) current = 0;

			nowBuffering[i] = current * powerIncrementFactor;
		}
		idx += len;
		if (pulsingMethod != "ASYNC") {
			idx %= Math.floor(1000000 / sineFreq / microsecPerSamples);
		}

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

registerProcessor("vf-generator", NoiseGenerator);
registerProcessor("vf-filter", NoiseFilter);