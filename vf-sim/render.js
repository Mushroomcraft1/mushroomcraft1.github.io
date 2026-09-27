let visulisationCanvas;
let visulisationCanvasCtx;

let options = {
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
	movement: 0,
	timeScale: 0.1,
	lineWidth: 1
};

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
		options[key] = newOptions[key]
	}
}

function renderVisualisations() {
	const canvasWidth = visulisationCanvas.clientWidth;
	const canvasHeight = visulisationCanvas.clientHeight;
	visulisationCanvas.width = canvasWidth;
	visulisationCanvas.height = canvasHeight;

	visulisationCanvasCtx.clearRect(0, 0, visulisationCanvas.width, visulisationCanvas.height);

	let phase1Height = Math.floor(canvasHeight * options.phase1Position);
	let phase2Height = Math.floor(canvasHeight * options.phase2Position);
	let phase3Height = Math.floor(canvasHeight * options.phase3Position);
	let waveHeight = options.absoluteWaveHeight ? options.waveHeight : options.waveHeight * canvasHeight;

	let phase1top = phase1Height - waveHeight;
	let phase1bottom = phase1Height + waveHeight;

	let phase2top = phase2Height - waveHeight;
	let phase2bottom = phase2Height + waveHeight;

	let phase3top = phase3Height - waveHeight;
	let phase3bottom = phase3Height + waveHeight;

	let y = prevHeight = phase1Height;

	let registerValues = prev = 0;

	visulisationCanvasCtx.beginPath();
	visulisationCanvasCtx.lineWidth = options.lineWidth;

	visulisationCanvasCtx.strokeStyle = options.phase1Colour;
	visulisationCanvasCtx.moveTo(0, phase1Height);

	for (let i = 0; i <= visulisationCanvas.width; ++i) {
		registerValues = pulse((i + performance.now() * options.movement) * options.timeScale) & (high1 | low1);
		y = registerValues & high1 ? phase1top : registerValues & low1 ? phase1bottom : phase1Height;
		
		visulisationCanvasCtx.lineTo(i, prevHeight)
		visulisationCanvasCtx.lineTo(i, y)
		prev = registerValues;
		prevHeight = y;
	}

	visulisationCanvasCtx.lineTo(canvasWidth, prevHeight)
	visulisationCanvasCtx.stroke();
	visulisationCanvasCtx.strokeStyle = options.phase2Colour;

	if (!options.renderSinglePhase) {
		prevHeight = phase2Height;
		visulisationCanvasCtx.beginPath();
		visulisationCanvasCtx.moveTo(0, phase2Height);

		for (let i = 0; i <= visulisationCanvas.width; ++i) {
			registerValues = pulse((i + performance.now() * options.movement) * options.timeScale) & (high2 | low2);
			y = registerValues & high2 ? phase2top : registerValues & low2 ? phase2bottom : phase2Height;

			visulisationCanvasCtx.lineTo(i, prevHeight)
			visulisationCanvasCtx.lineTo(i, y)
			prev = registerValues;
			prevHeight = y;
		}

		visulisationCanvasCtx.lineTo(canvasWidth, prevHeight)
		visulisationCanvasCtx.stroke();
		visulisationCanvasCtx.strokeStyle =  options.phase3Colour;

		prevHeight = phase3Height;
		visulisationCanvasCtx.beginPath();
		visulisationCanvasCtx.moveTo(0, phase3Height);

		for (let i = 0; i <= visulisationCanvas.width; ++i) {
			registerValues = pulse((i + performance.now() * options.movement) * options.timeScale) & (high3 | low3);
			y = registerValues & high3 ? phase3top : registerValues & low3 ? phase3bottom : phase3Height;

			visulisationCanvasCtx.lineTo(i, prevHeight)
			visulisationCanvasCtx.lineTo(i, y)
			prev = registerValues;
			prevHeight = y;
		}

		visulisationCanvasCtx.lineTo(canvasWidth, prevHeight)
		visulisationCanvasCtx.stroke();
	}

	if (options.renderSineWave) {
		let sinOffset = 0;

		for (const mid of [phase1Height, phase2Height, phase3Height]) {
			visulisationCanvasCtx.beginPath();
			visulisationCanvasCtx.strokeStyle = "#ffffff";
			visulisationCanvasCtx.moveTo(-100, mid);

			for (let i = 0; i <= visulisationCanvas.width; ++i) {
				visulisationCanvasCtx.lineTo(i, mid + waveHeight * -Math.sin((2 *  sineFreq *
					(i + performance.now() * options.movement) 
					* Math.PI)
					/ 1000 * options.timeScale / 1000 + sinOffset));
			}
			visulisationCanvasCtx.stroke();

			if (options.renderSinglePhase) break;
		
			sinOffset -= Math.PI * 2 / 3;
		}
	}
}