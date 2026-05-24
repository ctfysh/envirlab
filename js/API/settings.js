"use strict";
/*

Group: Simulation Settings

*/

/*
Method: getTimeStep

Gets the time step used in the simulation.

Returns:

The time step for the simulation as a floating point number.

See also:

<setTimeStep>
*/


function getTimeStep() {
	return parseFloat(getSetting().getAttribute("TimeStep"));
}


/*
Method: setTimeStep

Sets the time step used in the simulation.

Parameters:

timeStep - The time step to be used in the simulation.

See also:

<getTimeStep>
*/


function setTimeStep(timeStep) {
	setAttributeUndoable(
		getSetting(), "TimeStep",
		timeStep);

}

/*
Method: getTimeStart

Gets the start time for the simulation.

Returns:

The start time for the simulation as a floating point number.

See also:

<setTimeStart>
*/


function getTimeStart() {
	return parseFloat(getSetting().getAttribute("TimeStart"));
}


/*
Method: setTimeStart

Sets the start time for the simulation.

Parameters:

timeStart - The start time for the simulation.

See also:

<getTimeStart>
*/


function setTimeStart(timeStart) {
	setAttributeUndoable(
		getSetting(), "TimeStart",
		timeStart);

}

/*
Method: getTimeLength

Gets the length of the simulation.

Returns:

The length of the simulation as a floating point number.

See also:

<setTimeLength>
*/

function getTimeLength() {
	return parseFloat(getSetting().getAttribute("TimeLength"));
}


/*
Method: setTimeLength

Sets the length of the simulation.

Parameters:

timeLength - The length of the simulation.

See also:

<getTimeLength>
*/


function setTimeLength(timeLength) {
	setAttributeUndoable(
		getSetting(), "TimeLength",
		timeLength);
}

/*
Method: getPauseInterval

Gets the intervals at which to pause the simulation.

Returns:

The pause interval as a floating point number. Returns undefined if a pause interval has not been specified.

See also:

<setPauseInterval>
*/

function getPauseInterval() {
	return parseFloat(getSetting().getAttribute("TimePause"));
}


/*
Method: setPauseInterval

Sets the intervals at which to pause the simulation.

Parameters:

pauseInterval - The pause interval for the simulation.

See also:

<setPauseInterval>
*/


function setPauseInterval(pauseInterval) {
	setAttributeUndoable(
		getSetting(), "TimePause",
		pauseInterval);
}

/*
Method: getTimeUnits

Gets the time units of the simulation.

Returns:

The time units of the simulation (e.g. "Seconds", "Minutes", "Days", "Years").

See also:

<setTimeUnits>
*/


function getTimeUnits() {
	return getSetting().getAttribute("TimeUnits");
}


/*
Method: setTimeUnits

Sets the time units of the simulation.

Parameters:

units - The time units of the simulation (e.g. "Seconds", "Minutes", "Days", "Years").

See also:

<getTimeUnits>
*/


function setTimeUnits(units) {
	setAttributeUndoable(
		getSetting(), "TimeUnits",
		units);
}


/*
Method: getAlgorithm

Gets the algorithm for the simulation.

Returns:

The algorithm for the simulation as a string. "RK1" indicates Euler's method. "RK4" indicates a 4th order Runge-Kutta method.

See also:

<setAlgorithm>
*/


function getAlgorithm() {
	return getSetting().getAttribute("SolutionAlgorithm");
}


/*
Method: setAlgorithm

Sets the algorithm of the simulation.

Parameters:

algorithm - The algorithm for the simulation. "RK1" indicates Euler's method. "RK4" indicates a 4th order Runge-Kutta method.

See also:

<getAlgorithm>
*/


function setAlgorithm(algorithm) {
	setAttributeUndoable(
		getSetting(), "SolutionAlgorithm",
		algorithm);

}

/*
Method: getMacros

Gets the macros for the insight.

Returns:

The macros for the insight as a string.

See also:

<setMacros>
*/


function getMacros() {
	return getSetting().getAttribute("Macros");
}


/*
Method: setMacros

Sets the macros of the insight.

Parameters:

macros - The macros for the insight.

See also:

<getMacros>
*/


function setMacros(macros) {
	setAttributeUndoable(
		getSetting(), "Macros",
		macros);
}

