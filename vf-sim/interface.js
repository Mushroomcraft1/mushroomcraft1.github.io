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
 * @param {String} trainID - Unique name of the string used in the JSON DB 
 */
function setTrain(trainID) {
	currentTrainConfig = trainDB.get(trainID.toLowerCase());

	let {
		speed_per_motor_hz,
		wheel_diameter,
		gear_ratio_motor_side,
		gear_ratio_wheel_side,
		motor_poles,
		pulsing
	} = currentTrainConfig;

	if (speed_per_motor_hz == null) {
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
			mode, pulses, carrier_frequency } = pulseConfig;
		if (pulseConfig.min_speed == null && pulseConfig.min_motor_frequency == null) throw "No min speed given for pulsing at index " + idx
		if (min_motor_frequency == null) pulseConfig.min_motor_frequency = min_speed * speed_per_motor_hz;
		if (max_speed != null && max_motor_frequency == null) pulseConfig.max_motor_frequency = max_speed * speed_per_motor_hz;
		if (mode == null) throw "No pulsing mode given at index " + idx

		switch (mode) {
			case "SYNC":
			case "SHE-PWM":
			{
				if (pulses == null) throw "Number of pulses not given for SYNC/SHE-PWM pulsing mode at index " + idx;
				break;
			}
			case "ASYNC":
			{
				if (carrier_frequency == null) throw "Carrier frequency not given for ASYNC pulsing mode at index " + idx;
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

	console.log("Loaded train " + trainID)
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
		if (absFrequency > pulsing.min_motor_frequency && frequency < pulsing.max_motor_frequency) {
			if (pulsing.pulses != null) setPulseCount(pulsing.pulses);
			if (pulsing.carrier_frequency != null) setCarrierFrequency(pulsing.carrier_frequency);
			setPulsingMethod(pulsing.mode);
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