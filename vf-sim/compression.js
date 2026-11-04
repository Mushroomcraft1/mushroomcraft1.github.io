export { compressString, decompressString };
import { pulsingModes, oscillationModes } from "./interface.js";

const keys = {
	"a": "wheel_diameter",
	"b": "gear_ratio_motor_side",
	"c": "gear_ratio_wheel_side",
	"d": "motor_poles",
	"e": "max_speed",
	"f": "peak_point",
	"g": "rolling_resistance",
	"h": "speed_per_motor_hz",
	"i": "controls",
	"p": "pulsing",
	"A": "mode",
	"B": "min_speed",
	"C": "max_speed",
	"D": "min_motor_frequency",
	"E": "max_motor_frequency",
	"F": "oscillation_mode",
	"G": "oscillation_frequency",
	"H": "carrier_frequency",
	"I": "carrier_frequencies",
	"J": "min_carrier_frequency",
	"K": "max_carrier_frequency",
	"L": "pulses",
	"M": "min_pulses",
	"N": "max_pulses",
	"O": "pulse_step",
	"P": "max_switching_frequency",
};

const controlsKeys = {
	"a": "accelleration",
	"b": "decelleration",
	"c": "min_power",
	"d": "max_power",
	"e": "accelleration_notches",
	"f": "decelleration_notches"
}

const delimiter = "_";

const invertedKeys = {};

for (const key in keys) {
	invertedKeys[keys[key]] = key;
}
for (const key in controlsKeys) {
	invertedKeys[controlsKeys[key]] = key;
}

/**
 * 
 * @param {Object} trainObject - Valid train configuration to compress 
 * @returns {String} - Compressed string representation of a train object
 */
function compressString(trainObject) {
	let str = "";
	let pulsingStr = "";

	for (const key in trainObject) {
		let value = 0;
		if (key == "controls") {
			for (const keyR in trainObject[key]) {
				value = Number(trainObject[key][keyR]);
				if (!isNaN(value)) str += `${invertedKeys[keyR]}${value}`;
			}
		} else {
			value = Number(trainObject[key]);

			if (key == "pulsing") {
				for (const pulsing of trainObject[key]) {
					if (pulsing.mode != null) {
						let pulsingMode = `${invertedKeys.mode}${pulsingModes.indexOf(pulsing.mode)}`;
						
						for (const keyR in pulsing) {
							let pulsingValue = Number(pulsing[keyR]);

							if (keyR == "oscillation_mode") {
								pulsingValue = oscillationModes.indexOf(pulsing[keyR]);
							}

							if (keyR == "carrier_frequencies") {
								pulsingMode += `${invertedKeys[keyR]}${pulsing[keyR].join(delimiter)}`;
							} else if (!isNaN(pulsingValue)) {
								pulsingMode += `${invertedKeys[keyR]}${pulsingValue}`;
							}
						}

						pulsingStr += pulsingMode;
					}
				}
			}

			if (!isNaN(value)) {
				str += `${invertedKeys[key]}${value}`
			}
		}
	}

	str += pulsingStr;
	return str;
}

function buildObject(object, string) {
	let key = null;
	let controlsSubobject = false;
	let numberStr = "";
	let constructingNumber = false;

	for (let i = 0; i <= string.length; ++i) {
		const char = string[i];
		let isLetter = false;
		let isNumber = false;

		if (char != null) {
			isLetter = char.match(/[A-Za-z]/);
			isNumber = char.match(/[0-9\._]/);
		}

		if (char == null || (constructingNumber && isLetter)) {
			const number = parseFloat(numberStr);

			if (key != null) {
				if (controlsSubobject) {
					object.controls[key] = number;
				} else if (key == "oscillation_mode") {
					object[key] = oscillationModes[Math.floor(number)];
				} else if (key == "carrier_frequencies") {
					object[key] = numberStr.split(delimiter).map(parseFloat);
				} else {
					object[key] = number;
				}
			}

			key = null;
			constructingNumber = false;
			numberStr = "";
			if (char == null) break;
		}
		
		if (char == invertedKeys.controls) {
			object.controls = {};
			controlsSubobject = true;
			continue;
		}

		if (isLetter) {
			key = controlsSubobject ? controlsKeys[char] : keys[char];
			if (key == null) throw `Invalid key found (${char})`;
		} else if (isNumber) {
			constructingNumber = true;
			numberStr += char;
		}
	}


}

/**
 * 
 * @param {String} compressedString - String of a compressed train configuration 
 * @returns {Object} - Decompressed train configuration
 */
function decompressString(compressedString) {
	const splitStr = compressedString.split(invertedKeys.mode);
	const constants = splitStr[0];
	
	let parsed = {pulsing: []};

	buildObject(parsed, constants);

	for (let i = 1; i < splitStr.length; ++i) {
		const pulsingMode = splitStr[i];
		if (pulsingMode.length < 1) break;

		if (!pulsingMode[0].match(/\d/)) throw "Malformed pulsing mode in compressed string";

		const mode = {
			mode: pulsingModes[parseInt(pulsingMode[0])]
		};

		buildObject(mode, pulsingMode.slice(1));

		parsed.pulsing.push(mode);
	}
	console.log(parsed)

	return parsed;
}