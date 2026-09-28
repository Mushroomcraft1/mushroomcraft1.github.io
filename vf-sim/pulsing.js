// "ASYNC", "SYNC", "SHE-PWM"
let pulsingMethod;

let Sine1 = 0;
let Sine2 = 0;
let Sine3 = 0;
let percentageTime1 = 0;
let percentageTime2 = 0;
let percentageTime3 = 0;

let PWMfreq; 
let sineFreq;
let pulsingPower;
let sineFreqTime;
let sineFreqTimeInt;
let microsecMod;

let pulsePattern;
let noOfPulses;

const SHEPulsing = [
    [36.8699],
    [23.6306, 38.0607, 47.8399],
    [18.3488, 24.9836, 33.8216, 46.4864, 52.0461],
    [15.4907, 19.3651, 27.2061, 34.6339, 39.9608, 50.3018, 54.1653],
    [13.7881, 16.4146, 23.3703, 28.3392, 33.4046, 40.3724, 44.0530, 52.5265, 55.4561],
    [12.2211, 13.8484, 18.8421, 27.1104, 31.0249, 45.3726, 47.9174, 54.5138, 56.6458, 80.7106, 83.9842],
    [9.6520, 13.1310, 16.8229, 22.8346, 27.1692, 31.3007, 34.7734, 55.7969, 57.4444, 69.7161, 71.7958, 77.4431, 80.1275],
    [4.4908, 6.3870, 14.0187, 15.9450, 18.3002, 23.5976, 27.6411, 31.5053, 34.6927, 47.2634, 49.3635, 62.9753, 64.8474, 78.0797, 80.6235],
    [10.3227, 11.2851, 16.3175, 18.5834, 20.1060, 24.5566, 28.0600, 31.4767, 34.2952, 45.1767, 47.0893, 51.9312, 53.5522, 57.9338, 58.8924, 79.3640, 81.6659],
];

let pulseTimes;

const sin = Math.sin;
const abs = Math.abs;
const floor = Math.floor;
const PI = Math.PI;
let tau = PI * 2;
let offset120deg = tau * 1/3;
let offset240deg = tau * 2/3;

let high1  = 0b00000001;
let low1   = 0b00000010;
let high2  = 0b00000100;
let low2   = 0b00001000;
let high3  = 0b00010000;
let low3   = 0b00100000;

let highMask = high1 | high2 | high3;
let lowMask = low1 | low2 | low3;
let fullMask = highMask | lowMask;

let registers;

for (const setPulses of SHEPulsing) {
    for (let i = 0; i < setPulses.length; ++i) {
        setPulses[i] = sin(setPulses[i] / 360 * PI * 2);
    }
}

/**
 * Frequency of the sine waves to generate
 * @param {Float} newFrequency 
 */
function setFrequency(newFrequency) {
    sineFreq = newFrequency;
    sineFreqTime = 1000000 / newFrequency;
    sineFreqTimeInt = floor(sineFreqTime);
}

/**
 * Sets the power factor to be currently used
 * @param {Float} newPower - Between 0 and 1 
 */
function setPower(newPower) {
    pulsingPower = newPower;
}

/**
 *  Sets the number of pulses in Synchronous and SHE-PWM pulsing modes
 *  @param {Integer} newMethod - Odd integer, must not exceed 17 in SHE-PWM mode
*/
function setPulseCount(newPulseCount) {
    pulsePattern = newPulseCount;
    noOfPulses = newPulseCount * 4;

    pulseTimes = SHEPulsing[(pulsePattern - 1) / 2] ?? SHEPulsing[0];
    noOfPulses = pulsePattern * 4;
}

/**
 * Sets the pulsing frequency in Async mode
 * @param {Float} newFrequency 
 */
function setCarrierFrequency(newFrequency) {
    PWMfreq = newFrequency;
    PWMfreqTime = 1000000 / newFrequency;
    PWMfreqTimeInt = Math.floor(PWMfreqTime);
}

/**
  * @param {String} newMethod - "ASYNC", "SYNC", "SHE-PWM"
*/
function setPulsingMethod(newMethod) {
    pulsingMethod = newMethod;
}

function pulse(microsec) {
    let mask1 = mask2 = mask3 = mask = 0;

    curTime = microsec % PWMfreqTimeInt;
    microsecMod = microsec % sineFreqTimeInt;

    const progress = (microsecMod / sineFreqTime);

    // Swap one of the phases to change direction
    if (sineFreq > 0) {
        Sine1 = sin(progress * tau);
        Sine2 = sin(progress * tau - offset120deg);
        Sine3 = sin(progress * tau - offset240deg);
    } else {
        Sine1 = sin(progress * tau - offset120deg) ;
        Sine2 = sin(progress * tau);
        Sine3 = sin(progress * tau - offset240deg);
    }

    switch (pulsingMethod) { 
        case "ASYNC": {
            percentageTime1 = abs(Sine1 * pulsingPower) * PWMfreqTime;
            percentageTime2 = abs(Sine2 * pulsingPower) * PWMfreqTime;
            percentageTime3 = abs(Sine3 * pulsingPower) * PWMfreqTime;

            mask1 = (Sine1 > 0 ? high1 : low1);
            mask2 = (Sine2 > 0 ? high2 : low2);
            mask3 = (Sine3 > 0 ? high3 : low3);
            
            mask = ((curTime < percentageTime1) ? mask1 : 0)
                    | ((curTime < percentageTime2) ? mask2 : 0)
                    | ((curTime < percentageTime3) ? mask3 : 0);
            break;
        }
        case "SYNC": {
            const triangleSync = abs((noOfPulses * progress % 2) - 1);

            pattern1 = Sine1 > 0 ? high1 : low1;
            pattern2 = Sine2 > 0 ? high2 : low2;
            pattern3 = Sine3 > 0 ? high3 : low3;

            mask1 = abs(Sine1 * pulsingPower) > triangleSync ? pattern1 : 0;
            mask2 = abs(Sine2 * pulsingPower) > triangleSync ? pattern2 : 0;
            mask3 = abs(Sine3 * pulsingPower) > triangleSync ? pattern3 : 0;

            mask = mask1 | mask2 | mask3;
            break;
        }
        case "SHE-PWM": {
            currentSin1 = abs(Sine1);
            currentSin2 = abs(Sine2);
            currentSin3 = abs(Sine3);
            
            pattern1 = Sine1 > 0 ? high1 : low1;
            pattern2 = Sine2 > 0 ? high2 : low2;
            pattern3 = Sine3 > 0 ? high3 : low3;

            for (let i = 0; i < pulsePattern; ++i) {
                if (pulseTimes[i] <= currentSin1) {
                    mask1 = (i & 1) ? 0 : pattern1;
                }
            }

            for (let i = 0; i < pulsePattern; ++i) {
                if (pulseTimes[i] <= currentSin2) {
                    mask2 = (i & 1) ? 0 : pattern2;
                }
            }

            for (let i = 0; i < pulsePattern; ++i) {
                if (pulseTimes[i] <= currentSin3) {
                    mask3 = (i & 1) ? 0 : pattern3;
                }
            }

            mask = mask1 | mask2 | mask3;
            break;
        }
    }
    
    registers = (~mask) & fullMask; // turn off reverse
    registers = mask;

	return registers;
}