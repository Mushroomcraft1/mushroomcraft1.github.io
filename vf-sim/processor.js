class StreamProcessor extends AudioWorkletProcessor {
	constructor() {
		super();
		this.bufferQueue = [];
		
		this.port.onmessage = (event) => {
			this.bufferQueue.push(...event.data);
		};
	}

	process(inputs, outputs, parameters) {
		const output = outputs[0];
		const channel = output[0]; 
		
		for (let i = 0; i < channel.length; i++) {
			channel[i] = this.bufferQueue.shift() || 0.0;
		}
		
		return true;
	}
}

registerProcessor("vf-sim", StreamProcessor);