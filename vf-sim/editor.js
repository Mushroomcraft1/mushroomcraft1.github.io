import * as renderer from "./render.js";
import * as trainManager from "./interface.js";
import * as sound from "./sound.js";

let train;

const canvas = document.getElementById("visualisation");
const ctx = canvas.getContext("2d");
const editor = document.getElementById("editor");

window.addEventListener("pointerdown", startSound);

function startSound() {
	sound.startSound()
		.then((soundUpdateFunction) => {
			trainManager.setSoundUpdateFunction(soundUpdateFunction);
			window.removeEventListener("pointerdown", startSound);
		});
}

trainManager.setupDatabase("./trains.json")
	.then(() => {
		const availableTrains = trainManager.getAvailableTrains()[0];
		loadTrain("hitachi");//availableTrains);
		renderLoop();
	})
	.catch(renderLoop);

renderer.setCanvas(canvas, ctx);

function loadTrain(newTrain) {
	train = trainManager.setTrain(newTrain);
	if (typeof newTrain == "string") train.name = newTrain;
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
				type: "number", value, "data-key": key, 
				min: schema.min ?? dataType.min,
				max: schema.max ?? dataType.max,
				step: schema.step ?? dataType.step
			});
			input.addEventListener("change", updateTrainFromEditor);
			element = createInput(name, input, dataType.unit, dataType.description); 
			break;
		}
		case "ANY-FREQUENCY":
		{
			let value = trainValue ?? schema.default ?? schema.min ?? dataType.min ?? 0;
			const container = createElement("span", {
				"data-key": key
			});
			const constant = createElement("input", { 
				type: "number", value, "data-key": key, 
				min: schema.min ?? dataType.min,
				max: schema.max ?? dataType.max,
				step: schema.step ?? dataType.step
			});
			const range = createElement("input", { 
				type: "number", value, "data-key": key, 
				min: schema.min ?? dataType.min,
				max: schema.max ?? dataType.max,
				step: schema.step ?? dataType.step
			});
			const select = createElement("select", {
				style: ""
			}, ["editor-context"]);
			select.append(
				createElement("option", { innerText: "Constant"}),
				createElement("option", { innerText: "Range"})
			);
			select.value = "Constant";
			select.addEventListener("change", () => {
				range.parentElement.hidden = select.value == "Constant";
			});

			constant.addEventListener("change", updateTrainFromEditor);
			range.addEventListener("change", updateTrainFromEditor);
			container.append(
				select,
				createInput(null, constant, dataType.unit, null, "span"),
				createInput(" to ", range, dataType.unit, null, "span")
			);

			range.parentElement.hidden = true;
			element = createInput(name, container, null, dataType.description);
			break;
		}
		case "FLOAT-ARRAY": 
		case "FREQUENCY-ARRAY": {
			let value = trainValue ?? [];
			const input = createElement("input", {
				value, type: "text", "data-key": key
			}, ["editor-array"]);
			input.addEventListener("change", () => {
				input.value = input.value.replaceAll(/[^0-9., ]/g, "");
				updateTrainFromEditor();
			})
			element = createInput(name, input, dataType.unit, dataType.description);
			break;
		}
		case "CONSTANT":
		{
			const values = schema.values;
			const select = createElement("select", { "data-key": key });
	
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
			console.log(trainValue, key)
			const select = createElement("select", { "data-key": key });
			for (const value of keys) {
				select.appendChild(createElement("option", { innerText: value }));
			}
			select.value = trainValue ?? parent.keys[0]

			select.addEventListener("change", () => {
				const affectors = select.parentElement.parentElement.parentElement.children;
				for (const element of affectors) {
					if (element["data-key"] == null) continue;
					element.hidden = element["data-key"] != select.value;
				}
				updateTrainFromEditor();
			});

			element = createInput(name, select);
			break;
		}
		case "OBJECT-ARRAY":
		{
			element = createElement("div", { innerText: name, "data-key": key }, ["editor-category"]);
			const values = Object.keys(schema.objects ?? {});
			const list = createElement("ol")
			let idx = 0;

			let keyProperty;
			for (const object in schema.all) if (schema.all[object].type == "KEY") keyProperty = object;

			function addObject(object, idx) {
				const listItem = createElement("li", { "data-key": idx }, ["editor-object"]);
				schema.all.keys = values;
				const all = createEditorElement(null, schema.all, schema, object);
				listItem.appendChild(all);

				for (const value of values) {
					console.log(object, value, object[keyProperty])
					const option = createEditorElement(value, schema.objects[value], null, object);
					if (value != object[keyProperty]) option.hidden = true;
					listItem.appendChild(option);
				}

				const deleteButton = createElement("button", { innerText: "Delete" }, ["editor-object-delete"]);
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
			element = createElement("div", { innerText: name, "data-key": key }, ["editor-category"]);
			for (let schemaProperty in schema) {
				if (typeof schema[schemaProperty] == "object") {
					const recursiveElement = createEditorElement(
						schemaProperty, schema[schemaProperty], schema, trainValue[schemaProperty]
					);
					if (recursiveElement != null) element.appendChild(recursiveElement);
				}
			}
			break;
		}
	}
	return element;
}

function loadEditor() {
	const elements = createEditorElement(train.name ?? "Unnamed", trainManager.JSONSchema, null, train);
	editor.replaceChildren();
	editor.appendChild(elements);
}

function updateTrainFromEditor() {
	console.log("Update")
}

let mouse = { x: 0, y: 0, pressed: false };

canvas.addEventListener("pointerdown", (e) => {
	mouse.pressed = true;
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

function renderLoop() {
	const time = performance.now();
	const delta = time - prevFrame;

	renderer.renderVisualisations();

	if (mouse.pressed) speed += (train?.controls?.acceleration ?? 2.5) / 1000 * delta;

	trainManager.setTrainSpeed(speed);

	ctx.beginPath();
	ctx.arc(mouse.x, mouse.y, 50, 0, Math.PI * 2, false);
  	ctx.stroke();

	window.requestAnimationFrame(renderLoop);
	prevFrame = time;
}