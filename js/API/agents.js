"use strict";
/*

Group: Agents

*/


/*
Method: getPopulationSize

Gets the size of the agent population.

Parameters:

agents - The agent population for which the size will be returned. May also be an array of agent populations.

Return:

The population size.

See also:

<setPopulationSize>
*/

function getPopulationSize(agents) {
	return map(agents, function(primitive) {
		return primitive.getAttribute("Size");
	});
}

/*
Method: setPopulationSize

Sets the size of the agent population.

Parameters:

agents - The agent population for which the size will be set. May also be an array of agent populations.
size - The new population size.

See also:

<getPopulationSize>
*/

function setPopulationSize(agents, size) {
	map(agents, function(primitive) {
		setAttributeUndoable(primitive, "Size", size);
	});
}

/*
Method: getAgentBase

Gets the base agent for the population.

Parameters:

agents - The agent population for which the base agent will be returned. May also be an array of agent populations.

Return:

The base agent folder.

See also:

<setAgentBase>
*/

function getAgentBase(agents) {
	return map(agents, function(primitive) {
		return findID(primitive.getAttribute("Agent"));
	});
}

/*
Method: setAgentBase

Sets the base agent for the population.

Parameters:

agents - The agent population for which the base agent will be set. May also be an array of agent populations.
folder - The base agent folder. The type for this folder should be set to "Agent".

See also:

<getAgentBase>
*/

function setAgentBase(agents, folder) {
	map(agents, function(primitive) {
		setAttributeUndoable(primitive, "Agent", folder.id);
	});
}


/*
Method: getGeometryWrap

Whether the geometry should wrap across edges.

Parameters:

agents - The agent population for which the geometry wrap property will be returned. May also be an array of agent populations.

Return:

The wrap property as a boolean

See also:

<setGeometryWrap>
*/

function getGeometryWrap(agents) {
	return map(agents, function(primitive) {
		return isTrue(primitive.getAttribute("GeoWrap"));
	});
}

/*
Method: setGeometryWrap

Sets the wrap property for the population area geometry.

Parameters:

agents - The agent population for which geometry wrap property will be set. May also be an array of agent populations.
wrap - The wrap property for the geometry.

See also:

<getGeometryWrap>
*/

function setGeometryWrap(agents, wrap) {
	map(agents, function(primitive) {
		setAttributeUndoable(primitive, "GeoWrap", wrap);
	});
}

/*
Method: getGeometryUnits

Gets the units for the population area geometry.

Parameters:

agents - The agent population for which the units will be returned. May also be an array of agent populations.

Return:

The units as a string

See also:

<setGeometryUnits>
*/

function getGeometryUnits(agents) {
	return map(agents, function(primitive) {
		return primitive.getAttribute("GeoDimUnits");
	});
}

/*
Method: setGeometryUnits

Sets the units for the population area geometry.

Parameters:

agents - The agent population for which geometry units will be set. May also be an array of agent populations.
units - The units as a string.

See also:

<getGeometryUnits>
*/

function setGeometryUnits(agents, units) {
	map(agents, function(primitive) {
		setAttributeUndoable(primitive, "GeoDimUnits", units);
	});
}

/*
Method: getGeometryWidth

Gets the width for the population area geometry.

Parameters:

agents - The agent population for which the width will be returned. May also be an array of agent populations.

Return:

The width of the geometry

See also:

<setGeometryWidth>
*/

function getGeometryWidth(agents) {
	return map(agents, function(primitive) {
		return primitive.getAttribute("GeoWidth");
	});
}

/*
Method: setGeometryWidth

Sets the width for the population area geometry.

Parameters:

agents - The agent population for which geometry width will be set. May also be an array of agent populations.
width - The desired width.

See also:

<getGeometryWidth>
*/

function setGeometryWidth(agents, width) {
	map(agents, function(primitive) {
		setAttributeUndoable(primitive, "GeoWidth", width);
	});
}

/*
Method: getGeometryHeight

Gets the height for the population area geometry.

Parameters:

agents - The agent population for which the height will be returned. May also be an array of agent populations.

Return:

The height of the geometry

See also:

<setGeometryHeight>
*/

function getGeometryHeight(agents) {
	return map(agents, function(primitive) {
		return primitive.getAttribute("GeoHeight");
	});
}

/*
Method: setGeometryHeight

Sets the height for the population area geometry.

Parameters:

agents - The agent population for which geometry height will be set. May also be an array of agent populations.
height - The desired height.

See also:

<getGeometryHeight>
*/

function setGeometryHeight(agents, height) {
	map(agents, function(primitive) {
		setAttributeUndoable(primitive, "GeoHeight", height);
	});
}

/*
Method: getAgentPlacement

The placement method for the agent population.

Parameters:

agents - The agent population for which the placement method will be returned. May also be an array of agent populations.

Return:

The placement method for the agent population. One of "Random", "Network", "Grid" or "Custom Function".

See also:

<setAgentPlacement>
*/

function getAgentPlacement(agents) {
	return map(agents, function(primitive) {
		return primitive.getAttribute("Placement");
	});
}

/*
Method: setAgentPlacement

Sets the placement method for the agent population.

Parameters:

agents - The agent population for which placement method will be set. May also be an array of agent populations.
method - The desired placemennt method. One of "Random", "Network", "Grid" or "Custom Function".

See also:

<getAgentPlacement>
*/

function setAgentPlacement(agents, method) {
	map(agents, function(primitive) {
		setAttributeUndoable(primitive, "Placement", method);
	});
}

/*
Method: getAgentPlacementFunction

A custom placement function for the agent population.

Parameters:

agents - The agent population for which the custom placement function will be returned. May also be an array of agent populations.

Return:

The custom placement function for the agent population.

See also:

<setAgentPlacementFunction>
*/

function getAgentPlacementFunction(agents) {
	return map(agents, function(primitive) {
		return primitive.getAttribute("PlacementFunction");
	});
}

/*
Method: setAgentPlacementFunction

Sets the custom placement function for the agent population. The placement method should be set to "Custom Function" in order for this function to be used.

Parameters:

agents - The agent population for which the custom placement function will be set. May also be an array of agent populations.
func - The desired custom placement function.

See also:

<getAgentPlacementFunction>
*/

function setAgentPlacementFunction(agents, func) {
	map(agents, function(primitive) {
		setAttributeUndoable(primitive, "PlacementFunction", func);
	});
}

/*
Method: getAgentNetwork

The network method for the agent population.

Parameters:

agents - The agent population for which the network method will be returned. May also be an array of agent populations.

Return:

The network method for the agent population. One of "None" or "Custom Function".

See also:

<setAgentNetwork>
*/

function getAgentNetwork(agents) {
	return map(agents, function(primitive) {
		return primitive.getAttribute("Network");
	});
}

/*
Method: setAgentNetwork

Sets the network method for the agent population.

Parameters:

agents - The agent population for which network method will be set. May also be an array of agent populations.
method - The desired placemennt method. One of "None" or "Custom Function".

See also:

<getAgentNetwork>
*/

function setAgentNetwork(agents, method) {
	map(agents, function(primitive) {
		setAttributeUndoable(primitive, "Network", method);
	});
}

/*
Method: getAgentNetworkFunction

A custom network function for the agent population.

Parameters:

agents - The agent population for which the custom network function will be returned. May also be an array of agent populations.

Return:

The custom network function for the agent population.

See also:

<setAgentNetworkFunction>
*/

function getAgentNetworkFunction(agents) {
	return map(agents, function(primitive) {
		return primitive.getAttribute("NetworkFunction");
	});
}

/*
Method: setAgentNetworkFunction

Sets the custom network function for the agent population. The network method should be set to "Custom Function" in order for this function to be used.

Parameters:

agents - The agent population for which the custom network function will be set. May also be an array of agent populations.
func - The desired custom network function.

See also:

<getAgentNetworkFunction>
*/

function setAgentNetworkFunction(agents, func) {
	map(agents, function(primitive) {
		setAttributeUndoable(primitive, "NetworkFunction", func);
	});
}

