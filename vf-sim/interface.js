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

	if (speed_per_motor_hz == null || speed_per_motor_hz < 0) {
		if (wheel_diameter == null) throw "wheel_diameter required without speed_per_motor_hz"
		if (gear_ratio_motor_side == null) throw "gear_ratio_motor_side required without speed_per_motor_hz"
		if (gear_ratio_wheel_side == null) throw "gear_ratio_wheel_side required without speed_per_motor_hz"
		speed_per_motor_hz = (3.6 * Math.PI * wheel_diameter) 
			/ ((motor_poles ?? 4) * (gear_ratio_motor_side / gear_ratio_wheel_side))
	}

	currentTrainConfig.speed_per_motor_hz = speed_per_motor_hz;

	if (pulsing == null) throw "No pulsing configured for " + trainID

	let idx = 0;
	for (const pulseConfig of pulsing) {
		const { min_speed, max_speed, min_motor_frequency, max_motor_frequency, 
			mode, pulses, carrier_frequency, min_carrier_frequency, max_carrier_frequency,
			min_pulses, max_pulses, pulse_step, max_switching_frequency } = pulseConfig;
		if (min_speed == null && min_motor_frequency == null || min_motor_frequency < 0) throw "No min speed given for pulsing at index " + idx
		if (min_motor_frequency == null) pulseConfig.min_motor_frequency = min_speed * speed_per_motor_hz;
		if (max_speed != null && max_motor_frequency == null ) pulseConfig.max_motor_frequency = max_speed * speed_per_motor_hz;
		if (mode == null) throw "No pulsing mode given at index " + idx

		switch (mode) {
			case "SYNC":
			case "SHE-PWM":
			{
				if (pulses == null) throw `"pulses" not given for SYNC/SHE-PWM pulsing mode at index ` + idx;
				break;
			}
			case "ASYNC":
			{
				if (carrier_frequency == null) throw `"carrier_frequency" not given for ASYNC pulsing mode at index ` + idx;
				break;
			}
			case "ASYNC-OSCILLATING":
			case "ASYNC-SWEEP":
			{
				if (min_carrier_frequency == null || max_carrier_frequency == null) throw `"min_carrier_frequency" and "max_carrier_frequency" needed for Variable ASYNC pulsing mode at index ` + idx;
				break;
			}
			case "AUTO-SYNC":
			{				
				if (min_pulses == null || max_pulses == null || pulse_step == null || max_switching_frequency == null) throw `"min_pulses", "max_pulses", "pulse_step" and "max_switching_frequency" needed for AUTO-SYNC pulsing mode at index ` + idx;
				break;
			}
			default:
			{
				throw "Invalid pulsing mode at index " + idx;
			}
		}

		pulsing[idx] = pulseConfig;
		++idx;
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
function commandVF(frequency, power) {
	if (currentTrainConfig == null) throw "No train selected"

	setFrequency(frequency);
	setPower(power);

	const absFrequency = Math.abs(frequency);

	for (const pulsing of currentTrainConfig.pulsing) {
		const { min_speed, max_speed, min_motor_frequency, max_motor_frequency, 
			mode, pulses, carrier_frequency, min_carrier_frequency, max_carrier_frequency,
			min_pulses, max_pulses, pulse_step, max_switching_frequency } = pulsing;
		if (absFrequency > min_motor_frequency && frequency < max_motor_frequency) {
			switch (mode) {
				case "SYNC":
				case "SHE-PWM":
					{
						setPulseCount(pulses);
						setPulsingMethod(mode);
						break;
					}
				case "AUTO-SYNC":
					{
						let calculatedPulseCount = Math.floor(max_switching_frequency / (absFrequency * 2 * pulse_step)) * pulse_step;
						if ((min_pulses & 1) && (pulse_step & 1) == 0) calculatedPulseCount -= 1;
						setPulseCount(Math.max(min_pulses, Math.min(max_pulses, calculatedPulseCount)));
						setPulsingMethod("SYNC");
						break;
					}
				case "ASYNC":
					{
						setCarrierFrequency(carrier_frequency);
						setPulsingMethod("ASYNC");
						break;
					}
				case "ASYNC-SWEEP":
					{
						let calculatedCarrierFrequency = (absFrequency - min_motor_frequency)
						  / (max_motor_frequency - min_motor_frequency)
						  * (max_carrier_frequency - min_carrier_frequency)
						  + min_carrier_frequency; 
						setCarrierFrequency(Math.min(Math.max(min_carrier_frequency, calculatedCarrierFrequency), max_carrier_frequency));
						setPulsingMethod("ASYNC");
						break;
					}
			}
			break;

		}
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
	};
}

function getTrainData() {
	return currentTrainConfig;
}

function getAvailableTrains() {
	return Array.from(trainDB.keys());
}