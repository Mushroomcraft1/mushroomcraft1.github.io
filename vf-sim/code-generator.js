export { generateCode };
import { getTrainData } from "./interface.js";

let tabs;

function generateTabs() {
	if (tabs <= 0) return "";
	return "\t".repeat(tabs);
} 

const preCode = `
#include <Arduino.h>

enum modes {
    OFF,
    ASYNC,
    SYNC,
    SHEPWM
};

modes switchingMode = ASYNC;

float Sine1 = 0;
float Sine2 = 0;
float Sine3 = 0;

unsigned int deadTime = 4;

int PWMfreq = 400; 
float sineFreq = 0;
float power = 0.5;
float throttle = 0;
float sineFreqTime;
unsigned long sineFreqTimeInt;

float noOfSwitches = 12;

float tau;
float offset120deg;
float offset240deg;

float repeatInterval;
unsigned long repeatIntervalInt;
int potVal;

float PWMfreqTime;
unsigned long PWMfreqTimeInt;

float completion = 0;
unsigned long prevTime = 0;
unsigned long microsec = 0;

int high1;
int high2;
int high3;
int low1;
int low2;
int low3;

int analogueStick = 18;
int button = 17;
float ADCSteps = (1 << 10) - 1;
float analogueStickZero;

int highMask;
int lowMask;
int fullMask;
int otherBits;

int itteration = 0;

void setup() {
    tau = PI * 2;
    offset120deg = tau * 1/3;
    offset240deg = tau * 2/3;

    otherBits = 0xFF & ~fullMask;

    high1  = 1 << digitalPinToBspPin(2); // Digital 2
    high2  = 1 << digitalPinToBspPin(3); // Digital 3
    high3  = 1 << digitalPinToBspPin(4); // Digital 4
    low1   = 1 << digitalPinToBspPin(5); // Digital 5
    low2   = 1 << digitalPinToBspPin(6); // Digital 6
    low3   = 1 << digitalPinToBspPin(7); // Digital 7
    
    int enable = 1 << digitalPinToBspPin(19); // Analogue 5

    highMask = high1 | high2 | high3;
    lowMask = low1 | low2 | low3;

    fullMask = highMask | lowMask;

    R_PORT1->PDR  |= fullMask | enable; // set all pins as output pins
    R_PORT1->PORR |= fullMask | enable; // set all pins to off
    
    sineFreqTime = 1000000.0f / sineFreq;
    sineFreqTimeInt = (unsigned long)sineFreqTime;
    PWMfreqTime = 1000000.0f / PWMfreq;
    PWMfreqTimeInt = (unsigned long)PWMfreqTime;

    repeatInterval = 5000.0f;
    repeatIntervalInt = (unsigned long)(repeatInterval * tau);

    analogueStickZero = (float)analogRead(analogueStick) / ADCSteps ;

    delay(100);

    R_PORT1->POSR |= enable; // pin for relay connecting mains

    delay(100);
}`;

const pulsingCode = `

void loop() {
    unsigned long rawMicroSec = micros();
    microsec += rawMicroSec - prevTime;
    if (microsec > sineFreqTimeInt) microsec = 0;
    float curTime = (float)(microsec % PWMfreqTimeInt);
    completion = (float)(microsec) / sineFreqTime;
    prevTime = rawMicroSec;
    

    // Swap one of the phases to change direction
    if (sineFreq > 0.01f) {
        Sine1 = sin(completion * tau);
        Sine2 = sin(completion * tau + offset120deg);
        Sine3 = sin(completion * tau + offset240deg);
    } else if (sineFreq < -0.01f) {
        Sine1 = sin(completion * tau + offset120deg) ;
        Sine2 = sin(completion * tau);
        Sine3 = sin(completion * tau + offset240deg);
    } else {
        Sine1 = 0.0f;
        Sine2 = 0.0f;
        Sine3 = 0.0f;
    }

    int mask;

    switch (switchingMode)
    {
        case SYNC:
        {
            float triangleSync = abs(fmod(noOfSwitches * completion, 2.0f) - 1);

            int pattern1 = Sine1 > 0 ? high1 : low1;
            int pattern2 = Sine2 > 0 ? high2 : low2;
            int pattern3 = Sine3 > 0 ? high3 : low3;

            int mask1 = abs(Sine1 * power) > triangleSync ? pattern1 : 0;
            int mask2 = abs(Sine2 * power) > triangleSync ? pattern2 : 0;
            int mask3 = abs(Sine3 * power) > triangleSync ? pattern3 : 0;

            mask = mask1 | mask2 | mask3;
            break;
        }
        case ASYNC:
        {
            float triangleSync = abs(fmod(curTime / PWMfreqTime * 2, 2.0f) - 1);

            int mask1 = (Sine1 > 0 ? high1 : low1);
            int mask2 = (Sine2 > 0 ? high2 : low2);
            int mask3 = (Sine3 > 0 ? high3 : low3);
            
            mask = ((abs(Sine1 * power) > triangleSync) ? mask1 : 0)
                 | ((abs(Sine2 * power) > triangleSync) ? mask2 : 0)
                 | ((abs(Sine3 * power) > triangleSync) ? mask3 : 0);
            break;
        }
        default:
        {
            delayMicroseconds(deadTime);
            mask = 0;
            break;
        }
    }
    
    R_PORT1->PORR |= ~mask & fullMask; // turn off reverse
    delayMicroseconds(deadTime);
    R_PORT1->POSR |= mask;

    if ((itteration % 101) == 0) {
`;

const endCode = `
    }
    // if ((itteration % 771) == 0) {
    //     if ((float)analogRead(button) / ADCSteps > 0.5f) {
    //         sineFreq = 0;
    //         power = 0;
    //         sineFreqTime = 1;
    //         sineFreqTimeInt = (unsigned long)sineFreqTime;
    //     }
    // }

    if (++itteration > 1000) {
        itteration = 0;
        float analogueVal = (float)analogRead(analogueStick) / ADCSteps - analogueStickZero;
        if (abs(analogueVal) > 0.05f) {
            throttle = analogueVal / 30.0f; 
        } else {
            throttle = 0;
        }
    }
}`;

function generateCode() {
	let frequencies = ``;
	let ifStatements = ``;
	const parsedTrain = getTrainData();
	let idx = 0;
	let frequenciesVariableIdx = 0;
	const poleRatio = 1;

	tabs = 1;

	for (const pulsing of parsedTrain.pulsing) {
		if (++idx >= parsedTrain.pulsing.length) {
			ifStatements += generateTabs() + `{\n`; 
		} else {
			ifStatements += generateTabs() + `if (absSineFreq < (float)(${pulsing.max_motor_frequency * poleRatio})) {\n`;
		}

		tabs += 1;

		switch (pulsing.mode) {
			case "ASYNC":
				{
					ifStatements += generateTabs() + `switchingMode = ASYNC;\n`
								 +  generateTabs() + `\tPWMfreq = (float)(${pulsing.carrier_frequency});\n`;
					break;
				}
			case "ASYNC-STEP":
				{
					const len = pulsing.carrier_frequencies.length;
					frequencies += `float frequencies${++frequenciesVariableIdx}[] = {${pulsing.carrier_frequencies.join(", ")}};\n\n`;
					ifStatements += generateTabs() + `switchingMode = ASYNC;\n`
								 +  generateTabs() + `PWMfreq = frequencies${frequenciesVariableIdx}[min(${len}, (int)((absSineFreq - ${pulsing.min_motor_frequency})`
												   + ` / ${pulsing.max_motor_frequency - pulsing.min_motor_frequency} * (float)(${len})))];\n`
					break;
				}
			case "ASYNC-SWEEP":
				{
					const scalar = (pulsing.max_carrier_frequency - pulsing.min_carrier_frequency)
					/ (pulsing.max_motor_frequency - pulsing.min_motor_frequency);
					ifStatements += generateTabs() + `switchingMode = ASYNC;\n`
					             +  generateTabs() + `PWMfreq = min(max(absSineFreq * ${scalar} + ${pulsing.min_carrier_frequency - scalar * pulsing.min_motor_frequency}, `
					             +  generateTabs() + `${pulsing.min_carrier_frequency}), ${pulsing.max_carrier_frequency});\n`;
					break;
				}
			case "ASYNC-OSCILLATING":
				{
					let oscillation = ``;

					switch (pulsing.oscillation_mode) {
						case "TRIANGLE":
							oscillation = generateTabs() + `float factor = timeFactor >= 0.5f ? 2.0f - 2.0f * timeFactor : 2.0f * timeFactor;\n`
										+ generateTabs() + `PWMfreq = (float)(${pulsing.max_carrier_frequency - pulsing.min_carrier_frequency} `
										+  `* factor + ${pulsing.min_carrier_frequency});`;
							break;
						case "SAW-RISING":
							oscillation = generateTabs() + `PWMfreq = (float)(${pulsing.max_carrier_frequency - pulsing.min_carrier_frequency} `
										+ `* timeFactor + ${pulsing.min_carrier_frequency});`;
							break;
						case "SAW-FALLING":
							oscillation = generateTabs() + `PWMfreq = (float)(${pulsing.max_carrier_frequency - pulsing.min_carrier_frequency} `
										+ `* (1.0f - timeFactor) + ${pulsing.min_carrier_frequency});`;
							break;
						case "SINE":
							oscillation = generateTabs() + `float factor = sin(timeFactor * tau) / 2.0f + 0.5f;\n\t`
										+ `PWMfreq = (float)(${pulsing.max_carrier_frequency - pulsing.min_carrier_frequency} `
										+ `* factor + ${pulsing.min_carrier_frequency});`;
							break;
						case "SQUARE":
							oscillation = generateTabs() +  `PWMfreq = timeFactor <= 0.5f ? ${pulsing.min_carrier_frequency} : ${pulsing.max_carrier_frequency};`;
							break;
					}

					ifStatements += generateTabs() + `switchingMode = ASYNC;\n`
								 +  generateTabs() + `float timeFactor = fmod((float)(rawMicroSec % 1000000) / 1000000.0f, `
								 				   + `${1 / pulsing.oscillation_frequency}) * ${pulsing.oscillation_frequency};\n`
								 +  generateTabs() + `${oscillation}\n`
					break;
				}
			case "SYNC":
				{
					ifStatements += generateTabs() + `switchingMode = SYNC;\n`
								 +  generateTabs() + `noOfSwitches = ${Math.floor(pulsing.pulses * 4)};\n`;
					break;
				}
			case "AUTO-SYNC":
				{
					let equation = generateTabs() + `(int)(${pulsing.max_switching_frequency} / (absSineFreq * ${2 * pulsing.pulse_step}))`
					if ((pulsing.min_pulses & 1) && (pulsing.pulse_step & 1) == 0) equation = `(${equation} | 1)`; 
					ifStatements += generateTabs() + `switchingMode = SYNC;\n`
								 +  generateTabs() + `noOfSwitches = min(${Math.floor(pulsing.max_pulses * 4)},`
								 				   + ` max(${Math.floor(pulsing.min_pulses * 4)}, ${equation} * 4.0f));\n`;
					break;
				}
		}

		tabs -= 1;

		if (idx < parsedTrain.pulsing.length) {
			ifStatements += generateTabs() + `} else `;
		} else {
			ifStatements += generateTabs() + `}\n`;
		}
	}

	const selectionCode = generateTabs() + `sineFreq += throttle;\n`
						+ generateTabs() + `float absSineFreq = abs(sineFreq);\n`
						+ generateTabs() + `power = max(0.3f, min(1.0f, absSineFreq / 50.0f));\n\n`
						+ `${ifStatements}\n\n`
						+ generateTabs() + `sineFreqTime = 1000000.0f / min(50, absSineFreq);\n`
						+ generateTabs() + `sineFreqTimeInt = (unsigned long)sineFreqTime;\n`
						+ generateTabs() + `PWMfreqTime = 1000000.0f / PWMfreq;\n`
						+ generateTabs() + `PWMfreqTimeInt = (unsigned long)PWMfreqTime;`;

	code = `${preCode}${frequencies}${pulsingCode}${selectionCode}${endCode}`;
	return code;
}