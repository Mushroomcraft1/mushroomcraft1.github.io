import { setBulkParameters, pulse, sineFreq, pulsingPower, PWMfreq, pulsePattern, PWMfreqTime, pulsingMethod,
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

let powerIncrementFactor = 0.1;
let distortionFactor = 0;

let microsecPerSamples;
let sampleRate;
let prevFrequency = 0;
let prevPower = 0;
let targetFrequency = 0;
let targetPower = 0;
let deltaTime = 0;
let oscillationFrequency;

let soundOptions;

let buffer = [];

let recordOptions = {
	recording: false
};

class NoiseGenerator3Phase extends AudioWorkletProcessor {
	constructor(options) {
		super();
		soundOptions = options.processorOptions;
		sampleRate = options.processorOptions.sampleRate;

		microsecPerSamples = 1000 / (sampleRate / 1000)

		console.log(sampleRate + "Hz 3 Phase")

		this.port.onmessage = (({ data }) => {
			const d = data.deltaTime;
			if (!isNaN(d) && d > 0 && soundOptions.useInterpolation) {
				deltaTime = d * 1000;
				prevFrequency = sineFreq;
				prevPower = pulsingPower;
				interpolationProgress = 0;
			}

			setBulkParameters(data);

			if (data.distortion_factor != null) distortionFactor = data.distortion_factor;
			
			oscillationFrequency = data.oscillation_frequency;
			targetFrequency = data.frequency;
			targetPower = data.power;
		});
	}

	process(inputs, outputs, parameters) {
		const nowBuffering = outputs[0][0];
		const len = nowBuffering.length;

		if (soundOptions.useInterpolation && deltaTime > 0) {
			const interp = Math.min(1, interpolationProgress / deltaTime);
			setFrequency(prevFrequency + interp * (targetFrequency - prevFrequency));
			setPower(prevPower + interp * (targetPower - prevPower));
			interpolationProgress += len * microsecPerSamples;
		}

		const noOfSamples = 1000000 / sineFreq / microsecPerSamples;

		idx = Math.floor(noOfSamples * sineProgress);

		if (soundOptions.debug && recordOptions.recording) {
			const combined = new Float32Array(len);
			const phase1 = new Float32Array(len);
			const phase2 = new Float32Array(len);
			const phase3 = new Float32Array(len);

			for (let i = 1; i < 5; ++i) if (buffer[i] == null) buffer[i] = [];
			
			for (let i = 0; i < len; ++i) {
				const registers = pulse((i + idx) * microsecPerSamples, (PWMIndex + i) * microsecPerSamples);
				const high = popCount(registers & highMask);
				const low = popCount(registers & lowMask);
				let current = high + low;

				if (high == 0 || low == 0) current = 0;

				nowBuffering[i] = current * powerIncrementFactor;

				combined[i] = current * powerIncrementFactor;
				phase1[i] = registers & high1 ? 0.2 : registers & low1 ? -0.2 : 0;
				phase2[i] = registers & high2 ? 0.2 : registers & low2 ? -0.2 : 0;
				phase3[i] = registers & high3 ? 0.2 : registers & low3 ? -0.2 : 0;
			}
			
			buffer[1].push(combined);
			buffer[2].push(phase1);
			buffer[3].push(phase2);
			buffer[4].push(phase3);
		} else {
			for (let i = 0; i < len; ++i) {
				const registers = pulse((i + idx) * microsecPerSamples, (PWMIndex + i) * microsecPerSamples);
				const high = popCount(registers & highMask);
				const low = popCount(registers & lowMask);
				let current = high + low;

				if (high == 0 || low == 0) current = 0;

				nowBuffering[i] = current * powerIncrementFactor;
			}
		}

		PWMIndex += len;
		
		PWMIndex %= 2 ** 32; 

		sineProgress += len / noOfSamples;
		sineProgress %= 1;

		this.port.postMessage({ PWMfreq, microsecPerSamples, pulsingMethod, PWMfreqTime, sineFreq, pulsePattern })

		if (recordOptions.recording) {
			for (let i = 1; i < outputs.length; ++i) {
				if (buffer[i] == null) buffer[i] = [];
				buffer[i].push(outputs[i][0]);
			}
		}

		return true;
	}
}

class NoiseGeneratorSinglePhase extends AudioWorkletProcessor {
	constructor(options) {
		super();
		soundOptions = options.processorOptions;
		sampleRate = options.processorOptions.sampleRate;
		microsecPerSamples = 1000 / (sampleRate / 1000)
		console.log(sampleRate + "Hz Single Phase")

		this.port.onmessage = (({ data }) => {
			const d = data.deltaTime;
			if (!isNaN(d) && d > 0 && soundOptions.useInterpolation) {
				deltaTime = d * 1000;
				prevFrequency = sineFreq;
				prevPower = pulsingPower;
				interpolationProgress = 0;
			}

			setBulkParameters(data);
			
			oscillationFrequency = data.oscillation_frequency;
			targetFrequency = data.frequency;
			targetPower = data.power;
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
			let current = registers & high1 ? 1 : registers & low1 ? -1 : 0;

			nowBuffering[i] = current * 3 * powerIncrementFactor; // make it the same volume as 3 phase sim
		}
		PWMIndex += len;
		
		PWMIndex %= 2 ** 32; 

		sineProgress += len / noOfSamples;
		sineProgress %= 1;

		this.port.postMessage({ PWMfreq, microsecPerSamples, pulsingMethod, sineFreq, PWMfreqTime, pulsePattern })

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
		
		if (inputs.length > 1) {
			for (let i = 1; i < inputs.length; ++i) outputs[i] = inputs[i];
		}

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

		if (inputs.length > 1) {
			for (let i = 1; i < inputs.length; ++i) outputs[i] = inputs[i];
		}
	
		for (let i = 0; i < len; ++i) {
			nowBuffering[i] = input[i] + Math.sin(sineStage * Math.PI * 2) * distortionFactor;
			sineStage += sineFreq / (2 * sampleRate);
			sineStage %= 1;
		}
	}
}

class Record extends AudioWorkletProcessor {
	constructor() {
		super();
		

		this.port.onmessage = (({ data }) => {
			recordOptions.recording = data.record ?? false;
			if (buffer[0] == null) buffer[0] = [];

			if (data.saveRecording) {
				this.port.postMessage(buffer);

				buffer = [];
			}
		});
	}

	process(inputs, outputs, parameters) {
		const nowBuffering = outputs[0][0];
		const input = inputs[0][0];
		const len = input.length;
	
		for (let i = 0; i < len; ++i) {
			nowBuffering[i] = input[i];
		}
		
		if (recordOptions.recording) {
			const copy = new Float32Array(len);
			for (let i = 0; i < len; ++i) {
				copy[i] = input[i];
			}
			buffer[0].push(copy);
		}
	}
}

registerProcessor("vf-generator", NoiseGenerator3Phase);
registerProcessor("vf-generator-single-phase", NoiseGeneratorSinglePhase);
registerProcessor("vf-filter", NoiseFilter);
registerProcessor("vf-distort", Distort);
registerProcessor("vf-record", Record);