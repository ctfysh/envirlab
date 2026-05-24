"use strict";
/*

Group: Transitions and Actions

*/

/*
Method: getTriggerType

Gets the trigger type of a transition or action.

Parameters:

primitive - The transition or action for which the trigger is requested. May also be an array of transitions or actions.

Return:

The trigger mode as a string. May be "Timeout", "Probability" or "Condition".

See also:

<setTriggerType>
*/

function getTriggerType(primitive) {
	return map(primitive, function(primitive) {
		return primitive.getAttribute("Trigger");
	});
}

/*
Method: setTriggerType

Sets the trigger type for a transition or action.

Parameters:

primitive - The transition or action for which the trigger will be set. May also be an array of transitions or actions.
trigger - The new trigger for the transition or action. May be "Timeout" "Probability" or "Condition".

See also:

<getTriggerType>
*/

function setTriggerType(primitive, trigger) {
	map(primitive, function(primitive) {
		setAttributeUndoable(primitive, "Trigger", trigger);
	});
}

/*
Method: getTriggerValue

Gets the trigger value equation of a transition or action.

Parameters:

primitive - The transition or action for which the trigger value equation is requested. May also be an array of transitions or actions.

Return:

The trigger value equation as a string.

See also:

<setTriggerValue>
*/

function getTriggerValue(primitive) {
	return map(primitive, function(primitive) {
		return primitive.getAttribute("Value");
	});
}

/*
Method: setTriggerValue

Sets the trigger value for a transition or action.

Parameters:

primitive - The transition or action for which the trigger will be set. May also be an array of transitions or actions.
value - The new trigger value equation as a string.

See also:

<getTriggerValue>
*/

function setTriggerValue(primitive, value) {
	map(primitive, function(primitive) {
		setAttributeUndoable(primitive, "Value", value);
	});
}

/*
Method: getTriggerRepeat

Gets the trigger Repeat property of a transition or action.

Parameters:

primitive - The transition or action for which the property is requested. May also be an array of transitions or actions.

Return:

The trigger Repeat property as a boolean.

See also:

<setTriggerRepeat>
*/

function getTriggerRepeat(primitive) {
	return map(primitive, function(primitive) {
		return isTrue(primitive.getAttribute("Repeat"));
	});
}

/*
Method: setTriggerRepeat

Sets the trigger Repeat property for a transition or action.

Parameters:

primitive - The transition or action for which the Repeat property will be set. May also be an array of transitions or actions.
repeat - A boolean determining whether to repeat the trigger

See also:

<getTriggerRepeat>
*/

function setTriggerRepeat(primitive, repeat) {
	map(primitive, function(primitive) {
		setAttributeUndoable(primitive, "Repeat", repeat);
	});
}

/*
Method: getTriggerRecalculate

Gets the trigger Recalculate property of a transition or action.

Parameters:

primitive - The transition or action for which the property is requested. May also be an array of transitions or actions.

Return:

The trigger Recalculate property as a boolean.

See also:

<setTriggerRecalculate>
*/

function getTriggerRecalculate(primitive) {
	return map(primitive, function(primitive) {
		return isTrue(primitive.getAttribute("Recalculate"));
	});
}

/*
Method: setTriggerRecalculate

Sets the trigger Recalculate property for a transition or action.

Parameters:

primitive - The transition or action for which the Recalculate property will be set. May also be an array of transitions or actions.
recalculate - A boolean determining whether to recalculate each time step

See also:

<getTriggerRecalculate>
*/

function setTriggerRecalculate(primitive, recalculate) {
	map(primitive, function(primitive) {
		setAttributeUndoable(primitive, "Recalculate", recalculate);
	});
}

