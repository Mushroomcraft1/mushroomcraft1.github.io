# VF Simulator
This project simulates the different pulsing patterns in VF (variable frequency) drives for 3 phase induction motors used in all sorts of industrian machinery (lifts, trains, roller coasters, pumps...). It can be used to display visualisation of the pulsing patterns as well as simulate the sounds of different pulsing patterns played on trains.

# Overview

* [pulsing.js](./pulsing.js) - Core of the project. Creates the pulsing patterns to control transistors
* [sound.js](./sound.js) - Manages the generation of a simulated sound of a pulsing pattern used on a motor
* [processor.js](./processor.js) - Audio processor that generates sound in real time
* [render.js](./render.js) - Draws a visualisation of the pulsing pattern on a HTML Canvas
* [interface.js](./interface.js) - Provides a level of abstraction. Manages the different pulsing modes and train configurations, allows for loading of user made pulsing patterns
* [compression.js](./compression.js) - (UNMAINTAINED) Compresses train configs to a small format for easier storage and sharing
* [trains.json](./trains.json) - JavaScript Object Notation database of pre-made train configurations 
* [tests.json](./tests.json) - JavaScript Object Notation database of fake train configurations to test out different pulsing modes
* [editor.html](./editor.html) - New and improved interface to make and test pulsing configurations, saving and loading to JSON and generating C code 
* [throttle-sim.html](./throttle-sim.html) - (UNMAINTAINED) Old version of the interface to make and test out pulsing configurations that includes functionality to generate C code for a train configuration to run on an arduino controlling VF hardware

# Usage

```js
import * as renderer from "./render.js";
import * as trainManager from "./interface.js";
import * as soundGenerator from "./sound.js";

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

let currentTrain = {
	"speed_per_motor_hz": 1.6189469954574645,
	"controls": {
		"acceleration": 4.6,
		"deceleration": 5.6
	},
	"pulsing": [
		{
			"mode": "ASYNC-SWEEP",
			"min_motor_frequency": 0,
			"min_carrier_frequency": 275,
			"max_carrier_frequency": 320,
			"max_motor_frequency": 2
		},
		{
			"mode": "ASYNC-SWEEP",
			"min_motor_frequency": 2,
			"min_carrier_frequency": 320,
			"max_carrier_frequency": 1000,
			"max_motor_frequency": 8
		},
		{
			"mode": "ASYNC",
			"min_motor_frequency": 8,
			"carrier_frequency": 1000,
			"max_motor_frequency": 22
		},
		{
			"mode": "AUTO-SYNC",
			"min_motor_frequency": 22,
			"min_pulses": 7,
			"max_pulses": 21,
			"pulse_step": 2,
			"max_switching_frequency": {
				"start": 1000,
				"end": 1200
			},
			"max_motor_frequency": 80
		},
		{
			"mode": "SYNC",
			"min_motor_frequency": 80,
			"pulses": 5,
			"max_motor_frequency": 1000
		}
	]
};
trainManager.setTrain(currentTrain); // Can set the train from an object

renderer.setCanvas(canvas, ctx); // You give the renderer a canvas and context, can use a canvas used by other code if clearCanvas is set to false and you clear the canvas in your code

renderer.setRenderOptions({
	absoluteWaveHeight: false, // Whether to use pixels or percentage for wave height
	waveHeight: 0.1, // Number of pixels or percentage relative to canvas height
	phase1Position: 0.25, // Percentage position on the screen relative to canvas height
	phase2Position: 0.50,
	phase3Position: 0.75,
	renderSinglePhase: false, // Whether to render 1 waveform or all 3
	renderSineWave: true, // Whether to render the target waveform
	phase1Colour: "#ff0000", // Colour of the waveforms for each phase
	phase2Colour: "#ffff00",
	phase3Colour: "#0000ff",
	clearCanvas: true, // Whether to clear the canvas before rendering
	sampleRate: 10000, // Sample rate for wave in Hzm higher = "more zoomed in"
	samplesPerPixel: 1, // Higher = "less zoomed in", but more accurate
	maxPixels: 1920, // Max length to render
	lineWidth: 1 // Size of line
});

soundGenerator.setSoundOptions({
	singlePhase: false, // Whether to use the raw output of one of the phases as the sound
	sampleRate: 48000, // Sample rate of sound (kHz), lower = better performance, higher = can simulate faster switching frequencies
	bufferDuration: 50, // Number of samples per generator itteration
	volume: 1, // Volume, percentage, 0-1
	smoothLength: 5, // Samples to smooth a square wave into triangle-like wave over 
	useInterpolation: true, // Ideal for low update rates, smoothly transitions between frequencies and power, eliminating stepping sounds
	debug: false // Creates multiple audio tracks when recording to show the sound wave in the various stages of generation
});

// Sound can only be started once the user has interacted with the page
function clickFunction() { 
	setTimeout(() => {
		soundGenerator.startSound()
			.then((funct) => {
				trainManager.setSoundUpdateFunction(funct);
			});
		window.removeEventListener("pointerdown", clickFunction); 
	}, 100);
	renderLoop();
}

// Start the sound once the mouse was pressed
window.addEventListener("pointerdown", clickFunction);

// URL to a JSON train database anywhere on the internet
trainManager.setupDatabase("https://mushroomcraft1.github.io/vf-sim/trains.json")
	.then(() => {
		const trains = trainManager.getAvailableTrains(); // Returns an array of the IDs of all trains in the database
		currentTrain = trainManager.setTrain(trains[0]); // Loads configuration of a train in the database from an ID or loads an object 
	});

let speed = 0;
let prevFrame = 0;

function renderLoop() {
	const time = performance.now();
	const deltaTime = time - prevFrame;
	prevFrame = time;

	const controls = currentTrain.controls ?? {};
	const throttle = 1;

	// Simple calculations to simulate acceleration falloff
	const peakPoint = currentTrain.peak_point ?? 100;
	const maxSpeed = currentTrain.max_speed ?? 160;
	const accelleration = (throttle > 0 ? 
		(1 - Math.max(0, speed - peakPoint) / Math.max(1, maxSpeed - peakPoint))
		* (controls.accelleration ?? 2.5) 
		: controls.decelleration ?? 3) * throttle;

	// Delta time is used so the acceleration doesn't vary with framerate
	speed += deltaTime / 1000 * accelleration;
	speed = Math.max(0, speed);

	trainManager.setTrainSpeed(speed);
			
	renderer.renderVisualisations(); // Call on every frame

	requestAnimationFrame(renderLoop);
}
```

Credits:
[@Daninet](https://github.com/Daninet) For [audioBufferToWav()](https://gist.github.com/Daninet/22edc59cf2aee0b9a90c18e553e49297)