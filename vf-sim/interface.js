export { setupDatabase, setTrain, commandVF, setTrainSpeed, setSoundUpdateFunction, getVFData, getTrainData, getAvailableTrains,
	pulsingModes, oscillationModes };
import { setBulkParameters, sineFreq, pulsingPower, PWMfreq, pulsePattern, pulsingMethod } from "./pulsing.js";

const pulsingModes = [
	"SYNC",
	"AUTO-SYNC",
	"SHE-PWM",
	"ASYNC",
	"ASYNC-STEP",
	"ASYNC-OSCILLATING",
	"ASYNC-SWEEP"
]

const oscillationModes = [
	"TRIANGLE",
	"SAW-RISING",
	"SAW-FALLING",
	"SINE",
	"SQUARE",
	"RANDOM"
]

let trainDB = new Map();

let currentTrainConfig;
let soundUpdateFunction;
let prevTime = 0;

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

/**
 * @param {Function} funct - Sound update function recieved from startSound call
 */
function setSoundUpdateFunction(funct) {
	soundUpdateFunction = funct;
}

/**
 * 
 * @param {String|Object} trainID - Unique name of the string used in the JSON DB 
 * @returns {Object} - Unaltered train
 */
function setTrain(trainID) {
	if (typeof trainID == "string") {
		currentTrainConfig = trainDB.get(trainID.toLowerCase());
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

/**
 * @param {Float} frequency - Frequency for VF to synthasise
 * @param {Float} power - Power level for the current pulsing mode 
 * @param {Float|null} deltaTime - Time to be taken in the sound sim to transition to the new frequency and power, if not given, interpolation won't be used
 */
function commandVF(frequency, power, deltaTime) {
	if (currentTrainConfig == null) throw "No train selected"

	let data = { mode: "OFF", frequency: 0, power: 0 };

	const absFrequency = Math.abs(frequency);

	for (const pulsing of currentTrainConfig.pulsing) {
		const { min_motor_frequency, max_motor_frequency, oscillation_mode, oscillation_frequency,
			pulses, mode, carrier_frequency, carrier_frequencies, min_carrier_frequency, 
			max_carrier_frequency, min_pulses, max_pulses, pulse_step, max_switching_frequency } = pulsing;

		if (absFrequency >= min_motor_frequency && absFrequency < max_motor_frequency) {
			data = { pulses, mode, carrier_frequency, oscillation_frequency, power, frequency };
			data.oscillation_function = null;
			switch (mode) {
				case "AUTO-SYNC":
					{
						let calculatedPulseCount = Math.floor(max_switching_frequency / (absFrequency * 2 * pulse_step)) * pulse_step;
						if ((min_pulses & 1) && (pulse_step & 1) == 0) calculatedPulseCount -= 1;
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
									const timeFactor = ((microsec / 1_000_000) % ${1 / oscillation_frequency}) * ${oscillation_frequency};
									const factor = timeFactor >= 0.5 ? 2 - 2 * timeFactor : 2 * timeFactor;
									return (${max_carrier_frequency - min_carrier_frequency}) * factor + ${min_carrier_frequency};
								}`
								break
							case "SAW-RISING":
								funct = `(microsec) => {
									const timeFactor = ((microsec / 1_000_000) % ${1 / oscillation_frequency}) * ${oscillation_frequency};
									return (${max_carrier_frequency - min_carrier_frequency}) * timeFactor + ${min_carrier_frequency};
								}`
								break
							case "SAW-FALLING":
								funct = `(microsec) => {
									const timeFactor = 1 - ((microsec / 1_000_000) % ${1 / oscillation_frequency}) * ${oscillation_frequency};
									return (${max_carrier_frequency - min_carrier_frequency}) * timeFactor + ${min_carrier_frequency};
								}`
								break
							case "SINE":
								funct = `(microsec) => {
									const timeFactor = ((microsec / 1_000_000) % ${1 / oscillation_frequency}) * ${oscillation_frequency};
									const factor = Math.sin(timeFactor * Math.PI * 2) / 2 + 0.5;
									return (${max_carrier_frequency - min_carrier_frequency}) * factor + ${min_carrier_frequency};
								}`
								break
							case "SQUARE":
								funct = `(microsec) => {
									const timeFactor = ((microsec / 1_000_000) % ${1 / oscillation_frequency}) * ${oscillation_frequency};
									return timeFactor <= 0.5 ? ${min_carrier_frequency} : ${max_carrier_frequency};
								}`
								break
							case "RANDOM":
								funct = `(microsec) => {
									if (microsec > PWMfreqTimeInt) {
										return ${min_carrier_frequency} + Math.random() * ${max_carrier_frequency - min_carrier_frequency};
									} else {
										return PWMfreq;	
									}
								}`
								break
						}
						data.oscillation_function = funct;
						data.mode = "ASYNC";
						break;
					}
				case "ASYNC-SWEEP":
					{
						data.oscillation_function = `(microsec) => {
							let calculatedCarrierFrequency = (sineFreq - ${min_motor_frequency})
							/ (${max_motor_frequency - min_motor_frequency})
							* (${max_carrier_frequency - min_carrier_frequency})
							+ ${min_carrier_frequency}; 
							return Math.min(Math.max(${min_carrier_frequency}, calculatedCarrierFrequency), ${max_carrier_frequency});
						}`
						data.oscillation_frequency = null;
						data.mode = "ASYNC";
						break;
					}
			}
			break;
		}
	}


	setBulkParameters(data);
	if (soundUpdateFunction != null) {
		soundUpdateFunction(data, deltaTime);
	}
}

function getVFData() {
	return {
		currentSpeed: sineFreq / currentTrainConfig.speed_per_motor_hz,
		currentFrequency: sineFreq,
		currentPower: pulsingPower,
		carrierFrequency: PWMfreq,
		pulses: pulsePattern,
		pulsingMode: pulsingMethod,
		speedPerMotorHz: currentTrainConfig.speed_per_motor_hz
	};
}

function getTrainData() {
	return currentTrainConfig;
}

function getAvailableTrains() {
	return Array.from(trainDB.keys());
}