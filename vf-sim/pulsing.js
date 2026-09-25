let method

let registersOn = 0;

let PWMPercentage1 = 0;
let PWMPercentage2 = 0;
let PWMPercentage3 = 0;
let percentageTime1 = 0;
let percentageTime2 = 0;
let percentageTime3 = 0;

let deadTime = 100;

let PWMfreq = 400; 
let sineFreq = 10;
let power = 0.2;
let sineFreqTime;
let sineFreqTimeInt;

let pulsePattern = 3;

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
const PI = Math.PI;
let tau;
let offset120deg;
let offset240deg;

let repeatInterval;
let repeatIntervalInt;
let potVal;

let PWMfreqTime;
let PWMfreqTimeInt;

let high1  = 0b00000001;
let low1   = 0b00000010;
let high2  = 0b00000100;
let low2   = 0b00001000;
let high3  = 0b00010000;
let low3   = 0b00100000;

let highMask;
let lowMask;
let fullMask;

let registers;

for (const pulses of SHEPulsing) {
    for (let i = 0; i < pulses.length; ++i) {
        pulses[i] = sin(pulses[i] / 360 * PI * 2);
    }
}

function setup() {
    tau = PI * 2;
    offset120deg = tau * 1/3;
    offset240deg = tau * 2/3;

    highMask = high1 | high2 | high3;
    lowMask = low1 | low2 | low3;

    fullMask = highMask | lowMask;
    
    sineFreqTime = 1000 / sineFreq;
    sineFreqTimeInt = Math.floor(sineFreqTime);
    PWMfreqTime = 1000000 / PWMfreq;
    PWMfreqTimeInt = Math.floor(PWMfreqTime);

    repeatInterval = 5000;
    repeatIntervalInt = Math.floor(repeatInterval * tau);

    pulseTimes = SHEPulsing[(pulsePattern - 1) / 2] ?? SHEPulsing[1];
}

function pulse(microsec) {
    if (sineFreq < 0.2 && sineFreq > -0.2) {
        registers |= fullMask; // set all pins to off
        delay(1);
    } else {
        let mask1 = mask2 = mask3 = mask = 0;

        curTime = microsec % PWMfreqTimeInt;
        milsec = Math.floor(microsec / 1000) % sineFreqTimeInt;

        // Swap one of the phases to change direction
        if (sineFreq > 0) {
            PWMPercentage1 = sin((milsec / sineFreqTime) * tau);
            PWMPercentage2 = sin((milsec / sineFreqTime) * tau - offset120deg);
            PWMPercentage3 = sin((milsec / sineFreqTime) * tau - offset240deg);
        } else {
            PWMPercentage1 = sin((milsec / sineFreqTime) * tau - offset120deg) ;
            PWMPercentage2 = sin((milsec / sineFreqTime) * tau);
            PWMPercentage3 = sin((milsec / sineFreqTime) * tau - offset240deg);
        }

        switch (method) { 
            case "ASYNC": {
                percentageTime1 = abs(PWMPercentage1 * power) * PWMfreqTime;
                percentageTime2 = abs(PWMPercentage2 * power) * PWMfreqTime;
                percentageTime3 = abs(PWMPercentage3 * power) * PWMfreqTime;

                mask1 = (PWMPercentage1 > 0 ? high1 : low1);
                mask2 = (PWMPercentage2 > 0 ? high2 : low2);
                mask3 = (PWMPercentage3 > 0 ? high3 : low3);
                
                mask = ((curTime < percentageTime1) ? mask1 : 0)
                        | ((curTime < percentageTime2) ? mask2 : 0)
                        | ((curTime < percentageTime3) ? mask3 : 0);
                break;
            }
            case "SHE-PWM": {
                const progress = milsec / sineFreqTime;

                currentSin1 = abs(PWMPercentage1);
                currentSin2 = abs(PWMPercentage2);
                currentSin3 = abs(PWMPercentage3);
                
                pattern1 = PWMPercentage1 > 0 ? high1 : low1;
                pattern2 = PWMPercentage2 > 0 ? high2 : low2;
                pattern3 = PWMPercentage3 > 0 ? high3 : low3;

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
    }

	return registers;
}