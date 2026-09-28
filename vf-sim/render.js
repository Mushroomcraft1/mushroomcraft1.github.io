let visulisationCanvas;
let visulisationCanvasCtx;

let renderOptions = {
	absoluteWaveHeight: false,
	waveHeight: 0.1,
	phase1Position: 0.25,
	phase2Position: 0.50,
	phase3Position: 0.75,
	renderSinglePhase: false,
	renderSineWave: true,
	phase1Colour: "#ff0000",
	phase2Colour: "#ffff00",
	phase3Colour: "#0000ff",
	sampleRate: 10000,
	samplesPerPixel: 10,
	maxPixels: 1920,
	lineWidth: 1
};

const pulses = new Uint8Array(renderOptions.sampleRate / renderOptions.samplesPerPixel * renderOptions.maxPixels);

/**
 * @param {HTMLCanvasElement} canvasElement 
 * @param {CanvasRenderingContext2D} context 
 */
function setCanvas(canvasElement, context) {
	visulisationCanvas = canvasElement;
	visulisationCanvasCtx = context;
}

/**
 * @param {Object}
 */
function setRenderOptions(newOptions) {
	for (const key in newOptions) {
		renderOptions[key] = newOptions[key]
	}
}

function renderVisualisations() {
	const canvasWidth = visulisationCanvas.clientWidth;
	const canvasHeight = visulisationCanvas.clientHeight;
	visulisationCanvas.width = canvasWidth;
	visulisationCanvas.height = canvasHeight;

	visulisationCanvasCtx.clearRect(0, 0, visulisationCanvas.width, visulisationCanvas.height);

	const noOfSamples = Math.min(canvasWidth, renderOptions.maxPixels) * renderOptions.samplesPerPixel;
	const increment = 1 / renderOptions.samplesPerPixel;
	const sampleTimeMicroSec = 1000 * 1000 / renderOptions.sampleRate;

	for (let i = 0; i < noOfSamples; ++i) {
		pulses[i] = pulse(i * sampleTimeMicroSec);
	}

	let phase1Height = Math.floor(canvasHeight * renderOptions.phase1Position);
	let phase2Height = Math.floor(canvasHeight * renderOptions.phase2Position);
	let phase3Height = Math.floor(canvasHeight * renderOptions.phase3Position);
	let waveHeight = renderOptions.absoluteWaveHeight ? renderOptions.waveHeight : renderOptions.waveHeight * canvasHeight;

	let phase1top = phase1Height - waveHeight;
	let phase1bottom = phase1Height + waveHeight;

	let phase2top = phase2Height - waveHeight;
	let phase2bottom = phase2Height + waveHeight;

	let phase3top = phase3Height - waveHeight;
	let phase3bottom = phase3Height + waveHeight;

	let y = prevHeight = phase1Height;

	let p = registerValues = prev = 0;

	visulisationCanvasCtx.beginPath();
	visulisationCanvasCtx.lineWidth = renderOptions.lineWidth;

	visulisationCanvasCtx.strokeStyle = renderOptions.phase1Colour;
	visulisationCanvasCtx.moveTo(0, phase1Height);

	for (let x = 0; x <= visulisationCanvas.width; x += increment) {
		registerValues = pulses[p++] & (high1 | low1);
		y = registerValues & high1 ? phase1top : registerValues & low1 ? phase1bottom : phase1Height;
		
		if (registerValues != prev) {
			visulisationCanvasCtx.lineTo(x, prevHeight)
			visulisationCanvasCtx.lineTo(x, y)
		}
		
		prev = registerValues;
		prevHeight = y;
	}

	visulisationCanvasCtx.lineTo(canvasWidth, prevHeight)
	visulisationCanvasCtx.stroke();
	visulisationCanvasCtx.strokeStyle = renderOptions.phase2Colour;


	if (!renderOptions.renderSinglePhase) {
		p = 0;
		prevHeight = phase2Height;
		visulisationCanvasCtx.beginPath();
		visulisationCanvasCtx.moveTo(0, phase2Height);

		for (let x = 0; x <= visulisationCanvas.width; x += increment) {
			registerValues = pulses[p++] & (high2 | low2);
			y = registerValues & high2 ? phase2top : registerValues & low2 ? phase2bottom : phase2Height;

			if (registerValues != prev) {
				visulisationCanvasCtx.lineTo(x, prevHeight)
				visulisationCanvasCtx.lineTo(x, y)
			}

			prev = registerValues;
			prevHeight = y;
		}

		visulisationCanvasCtx.lineTo(canvasWidth, prevHeight)
		visulisationCanvasCtx.stroke();
		visulisationCanvasCtx.strokeStyle =  renderOptions.phase3Colour;

		p = 0;
		prevHeight = phase3Height;
		visulisationCanvasCtx.beginPath();
		visulisationCanvasCtx.moveTo(0, phase3Height);

		for (let x = 0; x <= visulisationCanvas.width; x += increment) {
			registerValues = pulses[p++] & (high3 | low3);
			y = registerValues & high3 ? phase3top : registerValues & low3 ? phase3bottom : phase3Height;

			if (registerValues != prev) {
				visulisationCanvasCtx.lineTo(x, prevHeight)
				visulisationCanvasCtx.lineTo(x, y)
			}

			prev = registerValues;
			prevHeight = y;
		}

		visulisationCanvasCtx.lineTo(canvasWidth, prevHeight)
		visulisationCanvasCtx.stroke();
	}

	if (renderOptions.renderSineWave) {
		let sinOffset = 0;

		for (const mid of [phase1Height, phase2Height, phase3Height]) {
			visulisationCanvasCtx.beginPath();
			visulisationCanvasCtx.strokeStyle = "#ffffff";
			visulisationCanvasCtx.moveTo(-100, mid);

			for (let i = 0; i <= visulisationCanvas.width; ++i) {
				visulisationCanvasCtx.lineTo(i, mid + waveHeight * -Math.sin((2 *  sineFreq *
					(i + performance.now() * renderOptions.movement) 
					* Math.PI)
					/ 1000 * renderOptions.timeScale / 1000 + sinOffset));
			}
			visulisationCanvasCtx.stroke();

			if (renderOptions.renderSinglePhase) break;
		
			sinOffset -= Math.PI * 2 / 3;
		}
	}
}