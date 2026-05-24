"use strict";
/*

Group: States

*/


/*
Method: getResidency

Gets the residency property of a state primitive.

Parameters:

state - The state for which the residency property is requested. May also be an array of states.

Return:

The residency property as a string.

See also:

<setResidency>
*/

function getResidency(state) {
	return map(state, function(state) {
		return state.getAttribute("Residency");
	});
}

/*
Method: setResidency

Sets the residency property of a state primitive.

Parameters:

state - The state primitive for which the residency property will be set. May also be an array of states.
residency - The new value for the residency property.

See also:

<getResidency>
*/

function setResidency(state, residency) {
	map(state, function(primitive) {
		setAttributeUndoable(primitive, "Residency", residency);
	});
}

