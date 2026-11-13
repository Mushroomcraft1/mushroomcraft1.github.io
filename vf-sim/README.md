# VF Simulator
This project simulates the different pulsing patterns in VF (variable frequency) drives for 3 phase induction motors used in all sorts of industrian machinery (lifts, trains, roller coasters, pumps...). It can be used to display visualisation of the pulsing patterns as well as simulate the sounds of different pulsing patterns played on trains.

# Overview

* [pulsing.js](./pulsing.js) - Core of the project. Creates the pulsing patterns to control transistors
* [sound.js](./sound.js) - Manages the generation of a simulated sound of a pulsing pattern used on a motor
* [processor.js](./processor.js) - Audio processor that generates sound in real time
* [render.js](./render.js) - Draws a visualisation of the pulsing pattern on a HTML Canvas
* [interface.js](./interface.js) - Provides a level of abstraction. Manages the different pulsing modes and train configurations, allows for loading of user made pulsing patterns
* [compress.js](./compress.js) - Compresses train configs to a small format for easier storage and sharing
* [trains.json](./trains.json) - JavaScript Object Notation database of our pre-made train configurations 
* [throttle-sim.html](./throttle-sim.html) - User friendly example to make and test out pulsing patterns of trains
* [throttle-sim-og.html](./throttle-sim-og.html) - Old version of the interface to make and test out pulsing patterns that includes functionality to generate C code for a train configuration to run on an arduino controlling VF hardware


Credits:
[@Daninet](https://github.com/Daninet) For [audioBufferToWav()](https://gist.github.com/Daninet/22edc59cf2aee0b9a90c18e553e49297)