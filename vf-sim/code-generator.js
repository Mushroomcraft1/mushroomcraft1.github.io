export { generateCode };
import { getTrainData } from "./interface.js";

function generateCode() {
	let frequencies = ``;
	let ifStatements = ``;
	const parsedTrain = getTrainData();
	let idx = 0;
	let frequenciesVariableIdx = 0;
	const poleRatio = 1;

	for (const pulsing of parsedTrain.pulsing) {
		if (++idx >= parsedTrain.pulsing.length) {
			ifStatements += `{\n`; 
		} else {
			ifStatements += `if (absSineFreq < (float)(${pulsing.max_motor_frequency * poleRatio})) {\n`;
		}

		switch (pulsing.mode) {
			case "ASYNC":
				{
					ifStatements += `\tswitchingMode = ASYNC;\n\tPWMfreq = (float)(${pulsing.carrier_frequency});\n`;
					break;
				}
			case "ASYNC-STEP":
				{
					const len = pulsing.carrier_frequencies.length;
					frequencies += `float frequencies${++frequenciesVariableIdx}[] = {${pulsing.carrier_frequencies.join(", ")}};\n\n`;
					ifStatements += `\tswitchingMode = ASYNC;\n\tPWMfreq = frequencies${frequenciesVariableIdx}[min(${len}, (int)((absSineFreq - ${pulsing.min_motor_frequency})`
					+ ` / ${pulsing.max_motor_frequency - pulsing.min_motor_frequency} * (float)(${len})))];\n`
					break;
				}
			case "ASYNC-SWEEP":
				{
					const scalar = (pulsing.max_carrier_frequency - pulsing.min_carrier_frequency)
					/ (pulsing.max_motor_frequency - pulsing.min_motor_frequency);
					ifStatements += `\tswitchingMode = ASYNC;\n\t`
					+ `PWMfreq = min(max(absSineFreq * ${scalar} + ${pulsing.min_carrier_frequency - scalar * pulsing.min_motor_frequency}, `
					+ `${pulsing.min_carrier_frequency}), ${pulsing.max_carrier_frequency});\n`;
					break;
				}
			case "ASYNC-OSCILLATING":
				{
					let oscillation = ``;

					switch (pulsing.oscillation_mode) {
						case "TRIANGLE":
							oscillation = `float factor = timeFactor >= 0.5f ? 2.0f - 2.0f * timeFactor : 2.0f * timeFactor;\n\t`
							+ `PWMfreq = (float)(${pulsing.max_carrier_frequency - pulsing.min_carrier_frequency} `
							+ `* factor + ${pulsing.min_carrier_frequency});`;
							break;
						case "SAW-RISING":
							oscillation = `PWMfreq = (float)(${pulsing.max_carrier_frequency - pulsing.min_carrier_frequency} `
							+ `* timeFactor + ${pulsing.min_carrier_frequency});`;
							break;
						case "SAW-FALLING":
							oscillation = `PWMfreq = (float)(${pulsing.max_carrier_frequency - pulsing.min_carrier_frequency} `
							+ `* (1.0f - timeFactor) + ${pulsing.min_carrier_frequency});`;
							break;
						case "SINE":
							oscillation = `float factor = sin(timeFactor * tau) / 2.0f + 0.5f;\n\t`
							+ `PWMfreq = (float)(${pulsing.max_carrier_frequency - pulsing.min_carrier_frequency} `
							+ `* factor + ${pulsing.min_carrier_frequency});`;
							break;
						case "SQUARE":
							oscillation = `PWMfreq = timeFactor <= 0.5f ? ${pulsing.min_carrier_frequency} : ${pulsing.max_carrier_frequency};`;
							break;
					}

					ifStatements += `\tswitchingMode = ASYNC;\n\t`
					+ `float timeFactor = fmod((float)(rawMicroSec % 1000000) / 1000000.0f, `
					+ `${1 / pulsing.oscillation_frequency}) * ${pulsing.oscillation_frequency};\n\t${oscillation}\n`
					break;
				}
			case "SYNC":
				{
					ifStatements += `\tswitchingMode = SYNC;\n\tnoOfSwitches = ${Math.floor(pulsing.pulses * 4)};\n`;
					break;
				}
			case "AUTO-SYNC":
				{
					let equation = `(int)(${pulsing.max_switching_frequency} / (absSineFreq * ${2 * pulsing.pulse_step}))`
					if ((pulsing.min_pulses & 1) && (pulsing.pulse_step & 1) == 0) equation = `(${equation} | 1)`; 
					ifStatements += `\tswitchingMode = SYNC;\n\tnoOfSwitches = min(${Math.floor(pulsing.max_pulses * 4)},`
					+ ` max(${Math.floor(pulsing.min_pulses * 4)}, ${equation} * 4.0f));\n`;
					break;
				}
		}

		if (idx < parsedTrain.pulsing.length) {
			ifStatements += `} else `;
		} else {
			ifStatements += `}\n`;
		}
	}
	let code = `${frequencies}sineFreq += throttle;\nfloat absSineFreq = abs(sineFreq);\npower = max(0.3f, min(1.0f, absSineFreq / 50.0f));\n\n`
	+ `${ifStatements}\n\nsineFreqTime = 1000000.0f / min(50, absSineFreq);\nsineFreqTimeInt = (unsigned long)sineFreqTime;\n`
	+ `PWMfreqTime = 1000000.0f / PWMfreq;\nPWMfreqTimeInt = (unsigned long)PWMfreqTime;`;
	return code;
}