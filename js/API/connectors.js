"use strict";
/*

Group: Connectors

See <getNonNegative> and <setNonNegative> for setting the only-positive property of flows.

*/

/*
Method: getEnds

Gets the alpha and omega for the connector

Parameters:

connector - The connector for which the ends are requested. Can also be an array of connectors.

Return:

The alpha and omega as an array: [alpha, omega]. Array elements are returned as null if no connection exists.

See also:

<setEnds>
*/

function getEnds(connector) {
	return map(connector, function(primitive) {
		return [primitive.source, primitive.target];
	});
}

/*
Method: setEnds

Sets the alpha and omega for a connector.

Parameters:

connector - The connector for which the alpha and omega will be set. May also be an array of connectors.
ends - The new alpha and omega for the connector as an array: [alpha, omega]. Use null for either alpha or omega to disconnect an end.

See also:

<getEnds>
*/

function setEnds(connector, ends) {
	map(connector, function(primitive) {
		if(! (connector instanceof SimpleNode)){
			var edit = new mxTerminalChange(graph.model, primitive, ends[0], true);
			graph.getModel().execute(edit);
			edit = new mxTerminalChange(graph.model, primitive, ends[1], false);
			graph.getModel().execute(edit);
		}else{
			primitive.source = ends[0];
			primitive.target = ends[1];
			clearPrimitiveCache();
		}
		
	});
}

/*
Method: connected

Determines two primitives are connected by a link, flow, or transition. Alternatively if one of the primitives is a connector, checks if it connects directly to the other primitive.

Parameters:

primitive1 - A primitive.
primitive2 - A primitive to test whether it is connected to primitive1.

Return:

A boolean. True if the primitives are connected, false otherwise.
*/

function connected(primitive1, primitive2) {
	if (primitive1.isEdge) {
		if (primitive1.source !== null && primitive1.source.id === primitive2.id) {
			return true;
		} else if (primitive1.target !== null && primitive1.target.id === primitive2.id) {
			return true;
		}
	}
	if (primitive2.isEdge) {
		if (primitive2.source !== null && primitive2.source.id === primitive1.id) {
			return true;
		} else if (primitive2.target !== null && primitive2.target.id === primitive1.id) {
			return true;
		}
	}
	var items = findType(["Flow", "Link", "Transition"]);
	for (var i = 0; i < items.length; i++) {
		if (items[i].source !== null && items[i].target !== null) {
			if (items[i].source.id === primitive1.id && items[i].target.id === primitive2.id) {
				return true;
			}
			if (items[i].target.id === primitive1.id && items[i].source.id === primitive2.id) {
				return true;
			}
		}
	}
	return false;
}

