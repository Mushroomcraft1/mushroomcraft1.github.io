export { setupDatabase, setTrain, commandVF, getVFData, getTrainData, getAvailableTrains };
import { setBulkParameters, sineFreq, pulsingPower, PWMfreq, pulsePattern, pulsingMethod } from "./pulsing.js";

let trainDB = new Map();

let currentTrainConfig;

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
 * 
 * @param {String|Object} trainID - Unique name of the string used in the JSON DB 
 */
function setTrain(trainID) {
	if (typeof trainID == "string") {
		currentTrainConfig = trainDB.get(trainID.toLowerCase());
	} else {
		currentTrainConfig = trainID;
	}

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
		speed_per_motor_hz = (3.6 * Math.PI * wheel_diameter) 
			/ ((motor_poles ?? 4) * (gear_ratio_motor_side / gear_ratio_wheel_side))
	}

	currentTrainConfig.speed_per_motor_hz = speed_per_motor_hz;

	if (pulsing == null) throw "No pulsing configured for " + trainID

	for (const pulseConfig of pulsing) {
		++idx;
		if (pulseConfig == null) throw `Pulsing config at idx ${idx} is null`
		const { min_speed, max_speed, min_motor_frequency, max_motor_frequency, mode } = pulseConfig;
		if (min_speed == null) checkNull("min_motor_frequency"); else checkNull("min_speed");
		if (min_motor_frequency == null) pulseConfig.min_motor_frequency = min_speed * speed_per_motor_hz;
		if (max_speed != null && max_motor_frequency == null ) pulseConfig.max_motor_frequency = max_speed * speed_per_motor_hz;
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
				checkNull("oscillation_mode", "oscillation_frequency");
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
}

/**
 * @param {Float} frequency 
 * @param {Float} power 
 */
function commandVF(frequency, power, soundUpdateFunction) {
	if (currentTrainConfig == null) throw "No train selected"

	let data = { mode: "OFF", frequency: 0, power: 0 };

	const absFrequency = Math.abs(frequency);

	for (const pulsing of currentTrainConfig.pulsing) {
		const { min_motor_frequency, max_motor_frequency, oscillation_mode, oscillation_frequency,
			pulses, mode, carrier_frequency, carrier_frequencies, min_carrier_frequency, 
			max_carrier_frequency, min_pulses, max_pulses, pulse_step, max_switching_frequency } = pulsing;

		if (absFrequency >= min_motor_frequency && absFrequency < max_motor_frequency) {
			data = { pulses, mode, carrier_frequency, power, frequency };
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
								funct = (microsec) => {
									const timeFactor = (microsec / 1_000_000 % (1 / oscillation_frequency)) * oscillation_frequency;
									const factor = timeFactor >= 0.5 ? 2 - 2 * timeFactor : 2 * timeFactor;
									return (max_carrier_frequency - min_carrier_frequency) * factor + min_carrier_frequency;
								}
								break
							case "SAW-RISING":
								funct = (microsec) => {
									const timeFactor = (microsec / 1_000_000 % (1 / oscillation_frequency)) * oscillation_frequency;
									return (max_carrier_frequency - min_carrier_frequency) * timeFactor + min_carrier_frequency;
								}
								break
							case "SAW-FALLING":
								funct = (microsec) => {
									const timeFactor = 1 - (microsec / 1_000_000 % (1 / oscillation_frequency)) * oscillation_frequency;
									return (max_carrier_frequency - min_carrier_frequency) * timeFactor + min_carrier_frequency;
								}
								break
							case "SINE":
								funct = (microsec) => {
									const timeFactor = (microsec / 1_000_000 % (1 / oscillation_frequency)) * oscillation_frequency;
									const factor = Math.sin(timeFactor * Math.PI * 2) / 2 + 0.5;
									return (max_carrier_frequency - min_carrier_frequency) * factor + min_carrier_frequency;
								}
								break
							case "SQUARE":
								funct = (microsec) => {
									const timeFactor = (microsec / 1_000_000 % (1 / oscillation_frequency)) * oscillation_frequency;
									return timeFactor <= 0.5 ? min_carrier_frequency : max_carrier_frequency;
								}
								break
						}
						data.oscillation_function = funct;
						data.mode = "ASYNC";
						break;
					}
				case "ASYNC-SWEEP":
					{
						let calculatedCarrierFrequency = (absFrequency - min_motor_frequency)
						  / (max_motor_frequency - min_motor_frequency)
						  * (max_carrier_frequency - min_carrier_frequency)
						  + min_carrier_frequency; 
						data.carrier_frequency = Math.min(Math.max(min_carrier_frequency, calculatedCarrierFrequency), max_carrier_frequency);
						data.mode = "ASYNC";
						break;
					}
			}
			break;
		}
	}

	setBulkParameters(data);
	if (soundUpdateFunction != null) soundUpdateFunction(data);
}

function getVFData() {
	return {
		currentSpeed: sineFreq / currentTrainConfig.speed_per_motor_hz,
		currentFrequency: sineFreq,
		currentPower: pulsingPower,
		carrierFrequency: PWMfreq,
		pulses: pulsePattern,
		pulsingMode: pulsingMethod,
	};
}

function getTrainData() {
	return currentTrainConfig;
}

function getAvailableTrains() {
	return Array.from(trainDB.keys());
}