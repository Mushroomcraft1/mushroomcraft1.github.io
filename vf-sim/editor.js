import * as renderer from "./render.js";
import * as trainManager from "./interface.js";
import * as sound from "./sound.js";
import * as codeGenerator from "./code-generator.js";

let train;
let highlightLanguage;

const canvas = document.getElementById("visualisation");
const ctx = canvas.getContext("2d");
const editor = document.getElementById("editor");
const trainSelector = document.getElementById("train-select");
const textInput = document.getElementById("text-input");
const selectTrainButton = document.getElementById("select-train");
const vfInfo = document.getElementById("vf-info");
const saveTrainButton = document.getElementById("save-train");
const generateCodeButton = document.getElementById("generate-code");
const notificationArea = document.getElementById("notifications");
const codebox = document.getElementById("code");
const textArea = document.getElementById("text");
const codeContainer = document.getElementById("code-container");
const loadLibraryButton = document.getElementById("load-library");
const loadJSONButton = document.getElementById("load-json");
const clearDatabaseButton = document.getElementById("clear-database");
const editorActiveGroup = createElement("select")
		
editorActiveGroup.addEventListener("change", () => {
	loadEditor(true);
});
editorActiveGroup.append(
	createElement("option", { value: "A", textContent: "Frequency" }),
	createElement("option", { value: "B", textContent: "Speed" }));

const name = createElement("input", {
	type: "text"
}, ["train-name"]);

const motorFrequency = createElement("span");
const switchingFrequency = createElement("span");
const trainSpeed = createElement("span");
const trainPower = createElement("span");

vfInfo.append(
	createInput("Motor Frequency: ", motorFrequency, " Hz "),
	createInput("Switching Frequency: ", switchingFrequency, " Hz"), 
	createInput("Speed: ", trainSpeed, " km/h "),
	createInput("Power: ", trainPower, "%")
);

document.querySelectorAll(".close-button").forEach(button => {
	button.innerHTML = `<svg viewBox="0 0 50 50"><line fill="none" stroke-width="5" stroke-linecap="round" stroke-miterlimit="10" x1="5" y1="5" x2="45" y2="45"/><line fill="none" stroke-width="5" stroke-linecap="round" stroke-miterlimit="10" x1="45" y1="5" x2="5" y2="45"/></svg>`
	button.addEventListener("click", () => {
		button.parentElement.classList.remove("active");
	})
});

renderer.setRenderOptions({
	sampleRate: 120000,
	samplesPerPixel: 4
});

window.addEventListener("click", () => {
	document.getElementById("click-to-start-sound").remove();
	setTimeout(startSound, 100);
});

class Notif {
    #elm = null
    #animationDuration = 700

    constructor(text, type) {
        let style = ""
        text = `${text}`
        const duration = text.length * 100 + 1000
        const types = { error: ["error", "err", "e", "failure", "fail", "f", "danger", "d", "red", "r"], warning: ["warning", "warn", "w", "yellow", "orange", "amber"], success: ["success", "suc", "s", "green"], blue: ["blue", "b"] }
        if (types.error.includes(`${type}`.toLowerCase())) {
            style = "background-image: linear-gradient(135deg, var(--red1), var(--red2));", type = "error"
        } else if (types.warning.includes(`${type}`.toLowerCase())) {
            style = "background-image: linear-gradient(135deg, var(--yellow1), var(--yellow2));", type = "warning"
        } else if (types.success.includes(`${type}`.toLowerCase())) {
            style = "background-image: linear-gradient(135deg, var(--theme2), var(--theme1));", type = "success"
        } else if (types.blue.includes(`${type}`.toLowerCase())) {
            style = "background-image: linear-gradient(135deg, var(--blue1), var(--blue2));", type = "blue"
        } else {
            let colour = `${type}`.replace("0x", "#").toUpperCase().match(/^#[A-F0-9]{3,4}([A-F0-9]{2})?([A-F0-9]{2})?/i)
            if (!colour) colour = "var(--light-grey)"; else colour = colour[0]
            style = `background-color: ${colour}`, type = "custom"
        }

		const css = "font-size: 30px;"
		switch (type) {
			case "error":
				console.error("%c" + text, css + "color: #f00")
				break
			case "warning":
				console.warn("%c" + text, css + "color: #ff0")
				break
			case "success":
				console.log("%c" + text, css + "color: #0f0")
				break
			case "custom":
				console.log("%c" + text, css)
				break
		}

        const elm = document.createElement("div")
        elm.classList = "notification"
        elm.style = style
        elm.textContent = text
        notificationArea.appendChild(elm)
        this.text = text, this.type = type, this.expires = duration + this.#animationDuration + new Date().getTime(), this.style = style, this.#elm = elm
        setTimeout(() => this.delete(elm), parseInt(duration) + this.#animationDuration)
    }

    get expired() {
        return this.expires < new Date()
    }

    get animationDuration() {
        return this.#animationDuration
    }

    delete(elm) {
        if (elm == null) elm = this.#elm
        elm.classList += " hiding test"
        setTimeout(() => {
            elm.remove()
        }, this.animationDuration)
    }
}

function startSound() {
	sound.startSound()
		.then((soundUpdateFunction) => {
			trainManager.setSoundUpdateFunction(soundUpdateFunction);
			window.removeEventListener("click", startSound);
		});
}

trainManager.setupDatabase("./trains.json")
	.then(() => {
		const availableTrain = trainManager.getAvailableTrains()[0];
		new Notif("Loaded built in trains", "success")
		loadTrain(availableTrain);
		renderLoop();
	})
	.catch((err) => {
		new Notif("Failed to load built in trains " + err, "error")
		renderLoop();
	});

renderer.setCanvas(canvas, ctx);

function loadTrain(newTrain) {
	let success = true;
	try {
		train = trainManager.setTrain(newTrain);
	} catch (err) {
		success = false;
		new Notif("Failed to load train " + err, "err")
	}
	if (typeof newTrain == "string") train.name = newTrain;
	if (success) new Notif("Succesfully loaded " + train.name, "success");
	loadEditor();
}

/**
 * @param {String} elementType 
 * @param {Object} properties 
 * @param {String[]} classes 
 * @returns {HTMLElement} 
 */
function createElement(elementType, properties, classes) {
	const element = Object.assign(document.createElement(elementType), properties ?? {});
	if (classes != null) element.classList.add(...classes);
	return element;
}

/**
 * @param {String} preText 
 * @param {HTMLElement} element 
 * @param {String} postText 
 * @param {String} tooltip
 * @param {String} parentType 
 * @returns {HTMLElement} 
 */
function createInput(preText, element, postText, tooltip, parentType) {
	const input = createElement(parentType ?? "div", tooltip != null ? { title: tooltip } : {}, ["editor-input"]);
	if (preText != null) input.appendChild(createElement("span", { innerText: preText + " " }));
	input.appendChild(element);
	if (postText != null) input.appendChild(createElement("span", { innerText: " " + postText }));
	return input;
}

/**
 * @param {String|String[]} key 
 * @param {Object} schema 
 * @param {*} trainValue 
 * @returns {HTMLElement}
 */
function createEditorElement(key, schema, parent, trainValue) {
	let element;
	if (key == "keys") return;
	if (schema.group != null && schema.group != editorActiveGroup.value) return;

	const name = schema?.text != null ? schema.text + ": " : "";
	const dataType = trainManager.dataTypes[schema.type] ?? {};

	switch (schema.type) {
		case "LENGTH":
		case "FLOAT":
		case "INTEGER":
		case "CONSTANT-FREQUENCY":
		case "SPEED":
		case "ACCELERATION":
		{
			let value = trainValue ?? schema.default ?? schema.min ?? dataType.min ?? 0;
			const input = createElement("input", { 
				type: "number", value, "data-key": key, "data-type": "NUMBER",
				min: schema.min ?? dataType.min,
				max: schema.max ?? dataType.max,
				step: schema.step ?? dataType.step
			});
			input.addEventListener("input", updateTrainFromEditor);
			element = createInput(name, input, dataType.unit, dataType.description); 
			break;
		}
		case "ANY-FREQUENCY":
		{
			let value = trainValue ?? schema.default ?? dataType.min ?? 0;
			let start, end;
			if (typeof value == "object") {
				start = value.start;
				end = value.end;
			} else {
				start = value;
				end = value;
			}
			const rangeHidden = start == end;
			const container = createElement("span", {
				"data-key": key, "data-type": "NUMBER-RANGE"
			});
			const constant = createElement("input", { 
				type: "number", value: start,
				"data-key": "start", "data-type": "NUMBER",
				min: schema.min ?? dataType.min,
				max: schema.max ?? dataType.max,
				step: schema.step ?? dataType.step
			});
			const range = createElement("input", { 
				type: "number", value: end,
				"data-key": "end", "data-type": "NUMBER",
				min: schema.min ?? dataType.min,
				max: schema.max ?? dataType.max,
				step: schema.step ?? dataType.step
			});
			const select = createElement("select", null, ["editor-context"]);

			select.append(
				createElement("option", { innerText: "Constant"}),
				createElement("option", { innerText: "Range"})
			);
			select.value = rangeHidden ? "Constant" : "Range";
			select.addEventListener("change", () => {
				range.parentElement.hidden = select.value == "Constant";
				updateTrainFromEditor();
			});

			constant.addEventListener("input", updateTrainFromEditor);
			range.addEventListener("input", updateTrainFromEditor);
			container.append(
				select,
				createInput(null, constant, dataType.unit, null, "span"),
				createInput(" to ", range, dataType.unit, null, "span")
			);

			range.parentElement.hidden = rangeHidden;
			element = createInput(name, container, null, dataType.description);
			break;
		}
		case "FLOAT-ARRAY": 
		case "FREQUENCY-ARRAY": {
			let value = trainValue ?? [];

			const input = createElement("input", {
				value, type: "text", "data-key": key, "data-type": "NUMBER-ARRAY",
			}, ["editor-array"]);
			input.addEventListener("input", () => {
				input.value = input.value.replaceAll(/[^0-9., ]/g, "");
				updateTrainFromEditor();
			})

			element = createInput(name, input, dataType.unit, dataType.description);
			break;
		}
		case "CONSTANT":
		{
			const values = schema.values;
			const select = createElement("select", { "data-key": key, "data-type": "STRING" });
	
			for (const value of values) {
				select.appendChild(createElement("option", { innerText: value }));
			}

			select.value = trainValue ?? values[0]
			select.addEventListener("change", updateTrainFromEditor);

			element = createInput(name, select);
			break;
		}
		case "KEY":
		{
			const keys = parent.keys;
			
			const select = createElement("select", { "data-key": key, "data-type": "STRING" });
			for (const value of keys) {
				select.appendChild(createElement("option", { innerText: value }));
			}
			select.value = trainValue ?? parent.keys[0]

			select.addEventListener("change", () => {
				const affectors = select.parentElement.parentElement.parentElement.children;
				for (const element of affectors) {
					if (element["data-property"] != null) element.hidden = element["data-property"] != select.value;
				}
				updateTrainFromEditor();
			});

			element = createInput(name, select);
			break;
		}
		case "OBJECT-ARRAY":
		{
			element = createElement("div", { 
				innerText: name, "data-key": key, "data-type": "OBJECT-ARRAY"
			}, ["editor-category"]);
			const values = Object.keys(schema.objects ?? {});
			const list = createElement("ol")
			let idx = 0;

			let keyProperty;
			for (const object in schema.all) if (schema.all[object].type == "KEY") keyProperty = object;

			function addObject(object, idx) {
				const listItem = createElement("li", { "data-key": idx, "data-type": "OBJECT" }, ["editor-object"]);
				schema.all.keys = values;
				const all = createEditorElement(null, schema.all, schema, object);
				listItem.appendChild(all);

				for (const value of values) {
					const option = createEditorElement(null, schema.objects[value], null, object);
					option["data-property"] = value;
					if (value != object[keyProperty]) option.hidden = true;
					listItem.appendChild(option);
				}

				const deleteButton = createElement("button", { innerText: "×" }, ["editor-object-delete"]);
				deleteButton.addEventListener("click", () => {
					listItem.remove();
					updateTrainFromEditor();
				})
				
				listItem.appendChild(deleteButton);
				list.appendChild(listItem);
			}

			const createButton = createElement("button", { innerText: "Add New" }, ["editor-object-create"]);
			createButton.addEventListener("click", () => {
				const newObject = {}
				newObject[keyProperty] = values[0];
				addObject(newObject, ++idx);
				updateTrainFromEditor();
			})

			element.appendChild(createButton);

			for (const object of trainValue ?? []) {
				addObject(object, idx++);
			}

			element.appendChild(list);
			break;
		}
		default: 
		{
			const properties = { innerText: name };
			if (key != null) {
				properties["data-key"] = key;
				properties["data-type"] = "OBJECT";
			}
			element = createElement("div", properties, ["editor-category"]);
			for (let schemaProperty in schema) {
				if (typeof schema[schemaProperty] == "object") {
					const recursiveElement = createEditorElement(
						schemaProperty, schema[schemaProperty], schema, (trainValue ?? {})[schemaProperty]
					);
					if (recursiveElement != null) element.appendChild(recursiveElement);
				}
			}
			break;
		}
	}
	return element;
}

function loadEditor(modeOverride) {
	try {
		if (!modeOverride) {
			 editorActiveGroup.value = "B";
			for (const pulsing of train.pulsing) {
				if (pulsing.min_motor_frequency != null) editorActiveGroup.value = "A";
			}
		}

		const elements = createEditorElement(null, trainManager.JSONSchema, null, train);
		elements.id = "editor-dynamic";
		editor.replaceChildren();
	
		name.value = train.name ?? "Unnamed";
		editor.appendChild(createInput("Name: ", name));
		editor.appendChild(createInput("Editor Mode: ", editorActiveGroup));
		editor.appendChild(elements);
		updateTrainFromEditor();
	} catch (err) {
		new Notif(err, "err");
	}
}

/**
 * @param {HTMLElement} element 
 * @returns {*}
 */
function findValue(element) {
	let queue = [element];
	while (queue.length > 0) {
		const firstInQueue = queue.shift();
		if (firstInQueue.value != null) return firstInQueue.value;
		for (const child of firstInQueue.children) {
			queue.push(child);
		}
	}
	return null;
}

/**
 * @param {HTMLElement} element 
 * @returns {Object}
 */
function createObjectFromElements(element) {
	let object = {};
	for (const child of element.children) {
		if (child.hidden) continue;
		const key = child["data-key"];
		const basicType = child["data-type"]
		switch (basicType) {
			case "OBJECT":
			{
				object[key] = createObjectFromElements(child);
				break;
			}
			case "OBJECT-ARRAY":
			{
				object[key] = [];
				const recursiveObject = createObjectFromElements(child);
				const keys = Object.keys(recursiveObject).sort((a, b) => a - b);
				let idx = 0;
				for (const order of keys) {
					object[key][idx++] = recursiveObject[order];
				}
				break;
			}
			case "NUMBER":
			{
				const value = findValue(element);
				if (value != null) {
					const number = parseFloat(value);
					if (!isNaN(number)) object[key] = number; 
				}
				break;
			}
			case "NUMBER-RANGE":
			{
				let value = createObjectFromElements(element.lastChild);
				if (value.end == null) value = value.start;
				object[key] = value;
				break;
			}
			case "NUMBER-ARRAY":
			{
				const value = findValue(element);
				if (value != null) object[key] = value.split(",").map(parseFloat);
				break;
			}
			case "STRING":
			{
				const value = findValue(element);
				if (value != null) {
					object[key] = value; 
				}
				break;
			}
			default:
			{
				const recursiveObject = createObjectFromElements(child);
				for (const property in recursiveObject) {
					object[property] = recursiveObject[property];
				}
				break;
			}
		}
	}
	return object
}

function updateTrainFromEditor() {
	const dynamic = document.getElementById("editor-dynamic");
	let pulsingElement, pulsingModesList;
	for (const child of dynamic.children) if (child["data-key"] == "pulsing") {
		pulsingElement = child;
		break;
	}
	if (pulsingElement != null) pulsingModesList = pulsingElement.querySelector("ol");

	train = {};
	train = createObjectFromElements(dynamic);
	try {
		trainManager.setTrain(train);
	} catch (err) {
		new Notif("Failed to load train " + err, "err");
		return false;
	}
}

function scroll(elm, x, y) {
	elm.scrollLeft = x ?? 0
	elm.scrollTop = y ?? 0
}

textArea.addEventListener("input", () => {
	codebox.innerHTML = hljs.highlight(textArea.value, { language: highlightLanguage }).value;
});
textArea.addEventListener("scroll", () => {
	scroll(codeContainer, textArea.scrollLeft, textArea.scrollTop);
})

function openTextArea(text, format, buttons, description) {
	const buttonRow = textInput.querySelector(".button-row");
	highlightLanguage = format;

	buttonRow.replaceChildren();

	const copyButton = createElement("button", { textContent: "Copy" });
	copyButton.addEventListener("click", () => {
		navigator.clipboard.writeText(textArea.value);
		new Notif("Coppied to clipboard", "success")
	});
	const saveButton = createElement("button", { textContent: "Save to File" });
	saveButton.addEventListener("click", () => {
		const blob = new Blob([textArea.value], { 
			type: "text/" + (format ?? "txt")
		});
		const filename = `${(name.value ?? "unnamed").replaceAll(/[^\w\d\-_ ]/g, "")}.${format ?? "txt"}`;
		const url = URL.createObjectURL(blob);
		createElement("a", { href: url, download: filename }).click();
		URL.revokeObjectURL(url);
		new Notif("Succesfully downloaded " + name.value, "success");
	})

	buttonRow.append(copyButton, saveButton, ...buttons);

	document.getElementById("text-description").innerText = description ?? "";

	textArea.value = text;
	textArea.dispatchEvent(new Event("input"));
	textInput.classList.add("active");
}

function openTrainSelector() {
	const trainsList = trainSelector.children[0];
	const outerLibraryGroup = createElement("div");
	const libraryGroup = createElement("div");
	outerLibraryGroup.appendChild(createElement("h1", {
		textContent: "Loaded Trains"
	}));

	const trains = trainManager.getAvailableTrains().map((name) => { 
		return {
			name,
			type: "library"
		}});

	try {
		const object = JSON.parse(localStorage.getItem("trains") ?? "{}");
		const keys = Object.keys(object);
		for (const key of keys) {
			object[key].name = key;
			trains.push({ 
				name: key,
				type: "save",
				object: object[key]
			});
		}
	} catch (err) {
		new Notif("Failed to load saved trains: " + err, "err");
	}

	trains
		.sort((a, b) => a.name.localeCompare(b.name, "en", { ignoreCase: true }));

	let prevChar = null;
	trains.forEach((train) => {
		const newChar = train.name[0].toUpperCase();
		if (newChar != prevChar) {
			libraryGroup.appendChild(createElement("h2", {
				textContent: newChar
			}));
			prevChar = newChar;
		}
		const trainElement = createElement("a", {
			textContent: train.name
		}, ["train-link", "train-link-" + train.type]);
		trainElement.addEventListener("click", () => {
			if (train.type == "library") {
				loadTrain(train.name);
			} else {
				loadTrain(train.object);
			}
		});
		libraryGroup.appendChild(trainElement);
	})

	outerLibraryGroup.appendChild(libraryGroup);

	trainsList.replaceChildren();
	trainsList.append(outerLibraryGroup);
	trainSelector.classList.add("active");
}

selectTrainButton.addEventListener("click", openTrainSelector);

loadLibraryButton.addEventListener("click", () => {
	const loadDatabases = createElement("button", {
		textContent: "Load Databases"
	});
	loadDatabases.addEventListener("click", async () => {
		loadDatabases.disabled = true;
		const urls = textArea.value
			.split("\n")
			.map(v => v.trim())
			.filter(v => v != "");
			
		for (const url of urls) {
			try {
				await trainManager.setupDatabase(url);
				new Notif("Succesfully loaded " + url, "success");
			} catch (err) {
				new Notif(`Failed to load ${url}:\n${err}`, "err");
			} 
		}
		loadDatabases.disabled = false;
		openTrainSelector();
	});
	const buttons = [
		loadDatabases
	];
	openTextArea("", "txt", buttons, "List of URLs to JSON files, 1 URL per line");
});

function parseTextAreaJSON() {
	try {
		const parsed = JSON.parse(`${textArea.value}`);
		const keys = Object.keys(parsed);
		if (keys.includes("pulsing")) {
			if (parsed.name == null) parsed.name = "JSON";
			loadTrain(parsed);
		} else {
			trainManager.setupDatabase(parsed);
			new Notif("Sucessfully loaded JSON database", "success");
		}
	} catch (err) {
		new Notif(err, "err");
	}
	openTrainSelector();
}

loadJSONButton.addEventListener("click", () => {
	const loadJSON = createElement("button", {
		innerText: "Load JSON"
	});
	const loadFile = createElement("input", {
		type: "file",
		accept: "text/*",
		id: "upload-json"
	});

	loadFile.addEventListener("change", (event) => {
		const reader = new FileReader();
		reader.readAsText(loadFile.files[0]);
		reader.addEventListener("load", () => {
			textArea.value = reader.result;
			textArea.dispatchEvent(new Event("input"));
			parseTextAreaJSON();
		});
	});
	loadJSON.addEventListener("click", parseTextAreaJSON);

	const buttons = [
		loadJSON, loadFile
	];
	openTextArea("", "JSON", buttons, "JSON Object of a single train or train database");
})

clearDatabaseButton.addEventListener("click", () => {
	console.log("clear")
	trainManager.clearDatabase();
	openTrainSelector();
});

saveTrainButton.addEventListener("click", () => {
	const saveToBrowser = createElement("button", { textContent: "Save to Browser" });
	saveToBrowser.addEventListener("click", () => {
		try {
			const current = JSON.parse(localStorage.getItem("trains") ?? "{}");
			current[name.value ?? "Unnamed"] = train;
			localStorage.setItem("trains", JSON.stringify(current));
			new Notif(`Saved ${name.value ?? "Unnamed"} to Browser Storage`, "success");
		} catch (err) {
			new Notif(err, "err");
		}
	});
	const buttons = [saveToBrowser];
	openTextArea(JSON.stringify(train, null, "\t"), "JSON", buttons);
});

generateCodeButton.addEventListener("click", () => {
	const buttons = [];
	openTextArea(codeGenerator.generateCode(), "C", buttons);
});

let mouse = { x: 0, y: 0, pressed: false, clickPosition: { x: 0, y: 0 } };

canvas.addEventListener("pointerdown", (e) => {
	mouse.pressed = true;
	mouse.clickPosition.x = e.clientX;
	mouse.clickPosition.y = e.clientY;
	e.preventDefault();
});

window.addEventListener("pointermove", (e) => {
	mouse.x = e.clientX;
	mouse.y = e.clientY;
});

window.addEventListener("pointerup", () => {
	mouse.pressed = false;
})

let prevFrame = 0;
let speed = 0;

const style = window.getComputedStyle(document.body);

function displayValue(number) {
	if (isNaN(number)) return "--";
	return number.toFixed(2);
}

function renderLoop() {
	const time = performance.now();
	const delta = time - prevFrame;

	renderer.renderVisualisations();

	if (mouse.pressed) {
		const trackLength = 200;
		const x = mouse.clickPosition.x;
		const y = mouse.clickPosition.y;
		const factor = Math.min(Math.max(-1, (y - mouse.y) / trackLength), 1);
		if (factor > 0) {
			speed += (train?.controls?.acceleration ?? 2.5) * factor / 1000 * delta;
		} else {
			speed += (train?.controls?.deceleration ?? 3) * factor / 1000 * delta;
		}

		ctx.fillStyle = ctx.strokeStyle = style.getPropertyValue("--white");
		ctx.lineWidth = 3;

		ctx.beginPath();
		ctx.moveTo(x, y - trackLength);
		ctx.lineTo(x, y + trackLength);
		ctx.stroke();
		ctx.beginPath();
		ctx.arc(x, y - factor * trackLength, 
			50, 0, Math.PI * 2);
      	ctx.fill();
	}
	speed = Math.max(0, speed);

	trainManager.setTrainSpeed(speed);

	const {
		currentSpeed,
		currentFrequency,
		currentPower,
		currentPulsingIdx
	} = trainManager.getVFData();

	const {
		pulsingFrequency
	} = sound.getSoundData();

	motorFrequency.innerText = displayValue(currentFrequency);
	switchingFrequency.innerText = displayValue(pulsingFrequency);
	trainPower.innerText = displayValue((currentPower ?? 0) * 100);
	trainSpeed.innerText = displayValue(currentSpeed);

	const pulsingModes = editor.querySelector("ol");
	let idx = 0;
	for (const mode of pulsingModes.children) {
		if (idx == currentPulsingIdx) {
			mode.classList.add("active-mode");
		} else {
			mode.classList.remove("active-mode");
		}
		++idx;
	}

	window.requestAnimationFrame(renderLoop);
	prevFrame = time;
}