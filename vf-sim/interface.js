export { setupDatabase, clearDatabase, setTrain, commandVF, setTrainSpeed, setSoundUpdateFunction, getVFData, getTrainData, getAvailableTrains,
	pulsingModes, oscillationModes, JSONSchema, dataTypes };
import { setBulkParameters, sineFreq, pulsingPower, PWMfreq, pulsePattern, pulsingMethod, setPower, setFrequency } from "./pulsing.js";

const oscillationModes = [
	"TRIANGLE",
	"SAW-RISING",
	"SAW-FALLING",
	"SINE",
	"SQUARE",
	"RANDOM"
];

const JSONSchema = {
	"wheel_diameter": {
		"text": "Wheel Diameter",
		"type": "LENGTH",
		"min": 0.1,
		"max": 2,
		"increment": 0.001,
		"default":  0.84,
		"group": "B"
	},
	"gear_ratio_motor_side": {
		"text": "Gear Ratio Motor side",
		"type": "FLOAT",
		"min": 0.1,
		"max": 100,
		"increment": 0.01,
		"default": 6,
		"group": "B"
	},
	"gear_ratio_wheel_side": {
		"text": "Gear Ratio Wheel side",
		"type": "FLOAT",
		"min": 0.1,
		"max": 250,
		"increment": 0.01,
		"default": 1,
		"group": "B"
	},
	"speed_per_motor_hz": {
		"text": "Speed per Motor Hz",
		"type": "CONSTANT-FREQUENCY",
		"min": 0.1,
		"max": 5,
		"group": "A"
	},
	"motor_poles": {
		"text": "Motor Poles",
		"type": "INTEGER",
		"min": 2,
		"max": 16,
		"increment": 2,
		"default": 4,
		"group": "B"
	},
	"controls": {
		"text": "Controls",
		"acceleration": {
			"text": "Acceleration",
			"type": "ACCELERATION",
			"min": 0.1,
			"max": 20,
			"increment": 0.1,
			"default": 5
		},
		"deceleration": {
			"text": "Deceleration",
			"type": "ACCELERATION",
			"min": 0.1,
			"max": 20,
			"increment": 0.1 ,
			"default": 6
		}
	},
	"pulsing": {
		"text": "Pulsing",
		"type": "OBJECT-ARRAY",
		"all": {
			"mode": {
				"text": "Mode",
				"type": "KEY"
			},
			"min_speed": {
				"text": "Start Speed",
				"type": "SPEED",
				"min": 0,
				"increment": 0.1,
				"group": "B"
			},
			"min_motor_frequency": {
				"text": "Start Motor Frequency",
				"type": "CONSTANT-FREQUENCY",
				"min": 0,
				"increment": 0.1,
				"group": "A"
			}
		},
		"objects": {
			"SYNC": {
				"pulses": {
					"text": "Pulses",
					"type": "INTEGER",
					"min": 1,
					"default": 5
				}
			},
			"AUTO-SYNC": {
				"min_pulses": {
					"text": "Minimum Pulses",
					"type": "INTEGER",
					"min": 1,
				},
				"max_pulses": {
					"text": "Maximum Pulses",
					"type": "INTEGER",
					"min": 1,
					"default": 25
				},
				"pulse_step": {
					"text": "Pulse Step",
					"type": "INTEGER",
					"min": 1
				},
				"max_switching_frequency": {
					"text": "Maximum Switching Frequency",
					"type": "ANY-FREQUENCY",
					"min": 50,
					"default": 500
				}
			},
			"SHE-PWM": {
				"pulses": {
					"text": "Pulses",
					"type": "INTEGER",
					"min": 1,
					"max": 17,
					"step": 2,
					"default": 5
				}
			},
			"ASYNC": {
				"carrier_frequency": {
					"text": "Carrier Frequency",
					"type": "ANY-FREQUENCY",
					"default": 500
				}
			},
			"ASYNC-STEP": {
				"carrier_frequencies": {
					"text": "Carrier Frequencies",
					"type": "FREQUENCY-ARRAY"
				}
			},
			"ASYNC-OSCILLATING": {
				"min_carrier_frequency": {
					"text": "Minimum Carrier Frequency",
					"type": "ANY-FREQUENCY",
					"default": 500
				},
				"max_carrier_frequency": {
					"text": "Maximum Carrier Frequency",
					"type": "ANY-FREQUENCY",
					"default": 600
				},
				"oscillation_frequency": {
					"text": "Oscillation Frequency",
					"type": "ANY-FREQUENCY",
					"default": 5
				},
				"oscillation_mode": {
					"text": "Oscillation Mode",
					"type": "CONSTANT",
					"values": oscillationModes
				}
			},
			"ASYNC-SWEEP": {
				"min_carrier_frequency": {
					"text": "Start Carrier Frequency",
					"type": "ANY-FREQUENCY",
					"default": 500
				},
				"max_carrier_frequency": {
					"text": "End Carrier Frequency",
					"type": "ANY-FREQUENCY",
					"default": 1000
				},
			},
			"ASYNC-MUSIC": {
				"tempo": {
					"text": "Music Tempo",
					"type": "FLOAT",
					"min": 1,
					"max": 60000,
					"default": 120
				},
				"frequencies": {
					"text": "Note Frequencies",
					"type": "FREQUENCY-ARRAY",
				},
				"beats": {
					"text": "Note Durations (beats)",
					"type": "FLOAT-ARRAY"
				}
			},
			"PWM": {
				"carrier_frequency": {
					"type": "ANY-FREQUENCY",
					"default": 500
				}
			}
		}
	}
};

const dataTypes = {
	"FLOAT": {
		"unit": "",
		"description": "Any non-negative number",
		"min": 0,
		"max": 9999,
		"step": 0.01
	},
	"INTEGER": {
		"unit": "",
		"description": "Any positive integer",
		"min": 0,
		"max": 9999,
		"step": 1
	},
	"LENGTH": {
		"unit": "m",
		"description": "Any size/length in metres",
		"min": 0,
		"max": 9999,
		"step": 0.001
	},
	"SPEED": {
		"unit": "km/h",
		"description": "Any speed in kilometres per hour",
		"min": 0,
		"max": 999,
		"step": 0.1
	},
	"ACCELERATION": {
		"unit": "km/h/s",
		"description": "Any acceleration in kilometres per hour per second",
		"min": 0,
		"max": 99,
		"step": 0.1
	},
	"CONSTANT-FREQUENCY": {
		"unit": "hz",
		"description": "A constant frequency in hertz",
		"min": 0,
		"max": 12000,
		"step": 0.1
	},
	"ANY-FREQUENCY": {
		"unit": "hz",
		"description": "A constant frequency or 2 frequencies to interpolate between",
		"min": 0,
		"max": 12000,
		"step": 0.1
	},
	"FREQUENCY-ARRAY": {
		"unit": "hz",
		"description": "A list of frequencies separated by commas"
	},
	"FLOAT-ARRAY": {
		"description": "A list of numbers separated by commas"
	}
};

const pulsingModes = Object.keys(JSONSchema.pulsing.objects);

let trainDB = new Map();

let currentTrainConfig;
let soundUpdateFunction;
let prevTime = 0;

let trainLoadID = 0;
let prevTrainLoadID = -1;
let prevPulsingIdx = -2;

let musicStartTime = 0;
let musicNote = -1;
let musicNoteEnds = -1;

/**
 * @param {Object} JSON 
 */
function loadDatabaseFromJSON(JSON) {
	for (const key in JSON) {
		trainDB.set(key, JSON[key]);
	}
}

/**
 * 
 * @param {Object|URL} trainConfigSource - JSON or URL to JSON
 * @returns {Promise}
 */
async function setupDatabase(trainConfigSource) {
	return new Promise((resolve, reject) => {
		if (typeof trainConfigSource == "string") {
			return fetch(trainConfigSource)
				.then((res) => {
					res.json()
						.then((json) => {
							loadDatabaseFromJSON(json);
							resolve();
						})
						.catch((e) => {
							reject("Failed to parse JSON: " + e);
						})

				})
				.catch((e) => {
					reject("Failed to fetch train configs: " + e);
				})
		} else {
			loadDatabaseFromJSON(trainConfigSource);
			resolve();
		}
	});
}

function clearDatabase() {
	trainDB.clear();
}

/**
 * @param {Function} funct - Sound update function recieved from startSound call
 */
function setSoundUpdateFunction(funct) {
	soundUpdateFunction = funct;
	prevPulsingIdx = -1;
}

/**
 * 
 * @param {String|Object} trainID - Unique name of the string used in the JSON DB 
 * @returns {Object} - Unaltered train
 */
function setTrain(trainID) {
	if (typeof trainID == "string") {
		currentTrainConfig = trainDB.get(trainID);
	} else {
		currentTrainConfig = trainID;
	}

	const unaltered = structuredClone(currentTrainConfig);

	let {
		speed_per_motor_hz,
		wheel_diameter,
		gear_ratio_motor_side,
		gear_ratio_wheel_side,
		motor_poles,
		pulsing
	} = currentTrainConfig;

	let idx = -1;

	function checkNull(...variables) {
		if (idx < 0) {
			for (const variable of variables) {
				if (currentTrainConfig[variable] == null) throw `"${variable}" not given for train config`; 
			}
		} else {
			for (const variable of variables) {
				if (currentTrainConfig.pulsing[idx][variable] == null) throw `"${variable}" not given for pulsing mode at index ${idx}`; 
			}
		}
	}

	if (speed_per_motor_hz == null || speed_per_motor_hz < 0) {
		checkNull("wheel_diameter", "gear_ratio_motor_side", "gear_ratio_wheel_side");
	}

	if (gear_ratio_motor_side == null || gear_ratio_wheel_side == null || wheel_diameter == null) {
		checkNull("speed_per_motor_hz");
	} else {
		speed_per_motor_hz =
				((motor_poles ?? 4) *
				(gear_ratio_motor_side / gear_ratio_wheel_side)) /
				(7.2 * Math.PI * wheel_diameter);
	}

	currentTrainConfig.speed_per_motor_hz = speed_per_motor_hz;

	if (pulsing == null) throw "No pulsing configured for " + trainID

	for (const pulseConfig of pulsing) {
		++idx;
		if (pulseConfig == null) throw `Pulsing config at idx ${idx} is null`
		const { min_speed, max_speed, min_motor_frequency, max_motor_frequency, mode } = pulseConfig;
		if (min_speed == null) checkNull("min_motor_frequency"); else checkNull("min_speed");
		if (min_motor_frequency == null) pulseConfig.min_motor_frequency = min_speed * speed_per_motor_hz;
		if (max_speed != null && max_motor_frequency == null) pulseConfig.max_motor_frequency = max_speed * speed_per_motor_hz;
		checkNull("mode");
		switch (mode) {
			case "SYNC":
			case "SHE-PWM":
			{
				checkNull("pulses");
				break;
			}
			case "PWM":
			case "ASYNC":
			{
				checkNull("carrier_frequency");
				break;
			}
			case "ASYNC-STEP":
			{
				checkNull("carrier_frequencies");
				break;
			}
			case "ASYNC-OSCILLATING":
			{
				checkNull("oscillation_mode");
				if (pulseConfig.oscillation_mode != "RANDOM") checkNull("oscillation_frequency");
			}
			case "ASYNC-SWEEP":
			{
				checkNull("min_carrier_frequency", "max_carrier_frequency");
				break;
			}
			case "ASYNC-MUSIC":
			{
				checkNull("frequencies", "beats", "tempo");
				if (pulseConfig.frequencies.length != pulseConfig.beats.length) throw `Mismatched number of "beats" and "frequencies"`;
				break;
			}
			case "AUTO-SYNC":
			{		
				checkNull("min_pulses", "max_pulses", "pulse_step", "max_switching_frequency")		
				break;
			}
			default:
			{
				throw "Invalid pulsing mode at index " + idx;
			}
		}

		pulsing[idx] = pulseConfig;
	}

	pulsing.sort((a, b) => a.min_motor_frequency - b.min_motor_frequency);

	let maxFrequency = 1000;
	for (let i = pulsing.length - 1; i >= 0; --i) {
		if (pulsing[i].max_motor_frequency == null) pulsing[i].max_motor_frequency = maxFrequency;
		maxFrequency = pulsing[i].min_motor_frequency;
	}

	console.log("Loaded train " + (typeof trainID == "string" ? trainID : "from object"));
	
	++trainLoadID;

	unaltered.speed_per_motor_hz = speed_per_motor_hz;
	return unaltered;
}



/**
 * @param {Float} speed - Speed (km/h) at which to simulate the sound of the VF
 */
function setTrainSpeed(speed) {
	const time = performance.now();
	const deltaTime = Math.min(100, time - prevTime);

	if (currentTrainConfig == null) throw "No train selected"

	const {
		peak_point,
		speed_per_motor_hz,
		controls
	} = currentTrainConfig;

	if (speed_per_motor_hz == null) throw "speed_per_motor_hz is null (does the train config have a gear ratio and wheel diameter?)"

	const frequency = Math.abs(speed * speed_per_motor_hz);

	const peakPoint = peak_point == null ? 50 : peak_point * speed_per_motor_hz;

	let power = Math.max(controls?.min_power ?? 0.1,
			   Math.min(1, frequency / peakPoint))
			 * (controls?.max_power ?? 1);
	
	if (frequency < 0.1) power = 0;

	commandVF(frequency, power, deltaTime);
	
	prevTime = time;
}

function getValue(value, min_motor_frequency, max_motor_frequency, frequency) {
	if (typeof value == "number") return value;
	if (value == null) return 0;
	return (frequency - min_motor_frequency)
	 / (max_motor_frequency - min_motor_frequency)
	 * (value.end - value.start) + value.start;
}

function createEquation(value, min_motor_frequency, max_motor_frequency) {
	if (typeof value == "number") return value;
	return `((sineFreq - ${min_motor_frequency})
	/ ${max_motor_frequency - min_motor_frequency}
	* ${value.end - value.start} + ${value.start})`
}

/**
 * @param {Float} frequency - Frequency for VF to synthasise
 * @param {Float} power - Power level for the current pulsing mode 
 * @param {Float|null} deltaTime - Time to be taken in the sound sim to transition to the new frequency and power, if not given, interpolation won't be used
 */
function commandVF(frequency, power, deltaTime) {
	if (currentTrainConfig == null) throw "No train selected"

	let data = { mode: "ASYNC", power: 0, frequency: 500 };
	let idx = -1;

	const absFrequency = Math.abs(frequency);

	for (const pulsing of currentTrainConfig.pulsing) {
		++idx;
		const { min_motor_frequency, max_motor_frequency, oscillation_mode, oscillation_frequency,
			pulses, mode, carrier_frequency, carrier_frequencies, min_carrier_frequency, 
			max_carrier_frequency, min_pulses, max_pulses, pulse_step, max_switching_frequency,
			frequencies, beats, tempo } = pulsing;

		if (absFrequency >= min_motor_frequency && absFrequency < max_motor_frequency) {
			data = { mode, power, frequency };
			data.oscillation_function = null;
			switch (mode) {
				case "AUTO-SYNC":
					{					
						const value = getValue(max_switching_frequency, min_motor_frequency, max_motor_frequency, absFrequency);	
						let offset = ((min_pulses & 1) && (pulse_step & 1) == 0) ? 1 : 0;
						let calculatedPulseCount = Math.floor(value / (absFrequency * pulse_step * 2) + offset)
						 * pulse_step - offset;
						if (absFrequency * calculatedPulseCount * 2 > value) calculatedPulseCount -= pulse_step;
						data.pulses = Math.max(min_pulses, Math.min(max_pulses, calculatedPulseCount));
						data.mode = "SYNC";
						break;
					}
				case "ASYNC-STEP":
					{
						let idx = (absFrequency - min_motor_frequency)
						  / (max_motor_frequency - min_motor_frequency) 
						  * carrier_frequencies.length;
						data.carrier_frequency = carrier_frequencies[Math.floor(idx)];
						data.mode = "ASYNC";
						break;
					}
				case "ASYNC-OSCILLATING":
					{
						let funct;
						switch (oscillation_mode) {
							case "TRIANGLE":
								funct = `(microsec) => {
									const min = ${createEquation(min_carrier_frequency, min_motor_frequency, max_motor_frequency)};
									const max = ${createEquation(max_carrier_frequency, min_motor_frequency, max_motor_frequency)};
									const timeFactor = ((microsec / 1_000_000) % ${1 / oscillation_frequency}) * ${oscillation_frequency};
									const factor = timeFactor >= 0.5 ? 2 - 2 * timeFactor : 2 * timeFactor;
									return (max - min) * factor + min;
								}`
								break
							case "SAW-RISING":
								funct = `(microsec) => {
									const min = ${createEquation(min_carrier_frequency, min_motor_frequency, max_motor_frequency)};
									const max = ${createEquation(max_carrier_frequency, min_motor_frequency, max_motor_frequency)};
									const timeFactor = ((microsec / 1_000_000) % ${1 / oscillation_frequency}) * ${oscillation_frequency};
									return (max - min) * timeFactor + min;
								}`
								break
							case "SAW-FALLING":
								funct = `(microsec) => {
									const min = ${createEquation(min_carrier_frequency, min_motor_frequency, max_motor_frequency)};
									const max = ${createEquation(max_carrier_frequency, min_motor_frequency, max_motor_frequency)};
									const timeFactor = 1 - ((microsec / 1_000_000) % ${1 / oscillation_frequency}) * ${oscillation_frequency};
									return (max - min) * timeFactor + min;
								}`
								break
							case "SINE":
								funct = `(microsec) => {
									const min = ${createEquation(min_carrier_frequency, min_motor_frequency, max_motor_frequency)};
									const max = ${createEquation(max_carrier_frequency, min_motor_frequency, max_motor_frequency)};
									const timeFactor = ((microsec / 1_000_000) % ${1 / oscillation_frequency}) * ${oscillation_frequency};
									const factor = Math.sin(timeFactor * Math.PI * 2) / 2 + 0.5;
									return (max - min) * factor + min;
								}`
								break
							case "SQUARE":
								funct = `(microsec) => {
									const min = ${createEquation(min_carrier_frequency, min_motor_frequency, max_motor_frequency)};
									const max = ${createEquation(max_carrier_frequency, min_motor_frequency, max_motor_frequency)};
									const timeFactor = ((microsec / 1_000_000) % ${1 / oscillation_frequency}) * ${oscillation_frequency};
									return timeFactor <= 0.5 ? min : max;
								}`
								break
							case "RANDOM":
								funct = `(microsec) => {
									const min = ${createEquation(min_carrier_frequency, min_motor_frequency, max_motor_frequency)};
									const max = ${createEquation(max_carrier_frequency, min_motor_frequency, max_motor_frequency)};
									return min + Math.random() * (max - min);
								}`
								break
						}
						data.oscillation_function = funct;
						data.oscillation_frequency = oscillation_frequency;
						data.mode = "ASYNC";
						break;
					}
				case "ASYNC-SWEEP":
					{
						data.oscillation_function = `(microsec) => {
							return ${createEquation({ start: min_carrier_frequency, end: max_carrier_frequency }, min_motor_frequency, max_motor_frequency)};
						}`
						data.mode = "ASYNC";
						break;
					}
				case "ASYNC-MUSIC":
					{
						if (power == 0) {
							musicStartTime += deltaTime;
						} else {
							const beat = (performance.now() - musicStartTime) / 60000 * tempo;
							let frequency = 0;

							if (musicNote < 0 || musicNoteEnds < 0) {
								musicNote = 0;
								musicNoteEnds = beats[0];
								musicStartTime = performance.now();
							}

							while (beat >= musicNoteEnds && musicNote < beats.length) {
								musicNoteEnds += beats[++musicNote];
							}

							if (musicNote >= beats.length) {
								musicNote = 0;
								musicNoteEnds = beats[0];
								musicStartTime = performance.now();
							}

							frequency = frequencies[musicNote];

							data.carrier_frequency = frequency;
							data.mode = "ASYNC";
							break;
						}
					}
				case "PWM":
				case "ASYNC":
					{
						data.carrier_frequency = getValue(carrier_frequency, min_motor_frequency, max_motor_frequency, absFrequency);
						break;
					}
				case "SYNC":
				case "SHE-PWM":
					{
						data.pulses = pulses;
						break;
					}
			}
			break;
		}
	}


	if (prevTrainLoadID == trainLoadID && idx == prevPulsingIdx) {
		data.oscillation_function = -1;
	} else {
		musicNote = -1;
		musicNoteEnds = -1;
	}

	setBulkParameters(data);
	if (soundUpdateFunction != null) {
		soundUpdateFunction(data, deltaTime);
	}
		
	prevTrainLoadID = trainLoadID;
	prevPulsingIdx = idx;
}

function getVFData() {
	return {
		currentSpeed: sineFreq / currentTrainConfig.speed_per_motor_hz,
		currentFrequency: sineFreq,
		currentPower: pulsingPower,
		carrierFrequency: PWMfreq,
		pulses: pulsePattern,
		pulsingMode: pulsingMethod,
		currentPulsingIdx: prevPulsingIdx,
		speedPerMotorHz: currentTrainConfig.speed_per_motor_hz
	};
}

function getTrainData() {
	return currentTrainConfig;
}

function getAvailableTrains() {
	return Array.from(trainDB.keys());
}