"use strict";
/*

Group: Create and Delete Primitives

*/

/*
Method: createPrimitive

Creates a new primitive and adds it to the model. This function is only for node-type primitives not connectors (e.g. flows or links).

Parameters:

name - The name of the primitive to add.
type - The type of the primitive to add. For example, "Variable" or "Stock".
position - The location of the upper-left corner of the primitive in the form: [x, y].
size - The dimensions of the primitive in the form: [width, height].

Return:

The newly created primitive.

See also:

<createConnector>, <removePrimitive>

*/

function createPrimitive(name, type, position, size) {


	var t = type.toLowerCase();
	
	if(graph instanceof SimpleNode){
		var parent = graph.children[0].children[0];
		var vertex = simpleCloneNode(primitiveBank[t], parent);
		parent.children.push(vertex);
		clearPrimitiveCache();
	}else{
		var parent = graph.getDefaultParent();
		
		var vertex = graph.insertVertex(parent, null, primitiveBank[t].cloneNode(true), position[0], position[1], size[0], size[1], t);
	}
	


	setName(vertex, name);

	if (vertex.value.nodeName == "Converter") {
		setConverterInit(vertex);
	}

	if (isValued(vertex) || vertex.value.nodeName == "Agents") {
		var displays = primitives("Display");
		for (var i = 0; i < displays.length; i++) {
			var d = displays[i];
			if (isTrue(d.getAttribute("AutoAddPrimitives")) && d.getAttribute("Type") != "Scatterplot" && (d.getAttribute("Type") != "Map" || vertex.value.nodeName == "Agents")) {
				var s = d.getAttribute("Primitives");
				if (typeof(s) == "undefined") {
					d.setAttribute("Primitives", vertex.id);
				} else {
					var items = s.split(",");
					items.push(vertex.id);
					d.setAttribute("Primitives", items.join(","));
				}
			}
		}
	}
	
	

	return vertex;
}

/*
Method: createConnector

Creates a new connector primitive and adds it to the model.

Parameters:

name - The name of the primitive to add.
type - The type of the primitive to add: "Link" or "Flow".
alpha - The primitive that will be at the start of the connector.
omega - The primitive that will be at the end of the connector.

Return:

The newly created connector primitive.

See also:

<createPrimitive>, <removePrimitive>

*/

function createConnector(name, type, alpha, omega) {


	var x;
	var usedTemp = false;


	var t = (type).toLowerCase();
	
	if(graph instanceof SimpleNode){
		var parent = graph.children[0].children[0];

		if(alpha){
			parent = alpha.parent;
		}
		if(omega){
			parent = omega.parent;
		}
		var edge = simpleCloneNode(primitiveBank[t], parent);
		parent.children.push(edge);
		setEnds(edge, [alpha, omega]);
		clearPrimitiveCache();
	}else{
		var parent = graph.getDefaultParent();
		
		if (omega == null && alpha == null) {
			usedTemp = true;
			x = createPrimitive("temp stock xyz", "Stock", [300, 300], [10, 10]);
			alpha = x;
			omega = x;
		} else if (alpha == null) {
			usedTemp = true;

			var pos = getPosition(omega);
			var size = getSize(omega);
			x = createPrimitive("temp stock xyz", "Stock", [pos[0] + size[0] / 2 - 5, pos[1] - 120], [10, 10]);

			alpha = x;

		} else if (omega == null) {
			usedTemp = true;

			var pos = getPosition(alpha);
			var size = getSize(alpha);
			x = createPrimitive("temp stock xyz", "Stock", [pos[0] + size[0] / 2 - 5, pos[1] + 120 + size[1]], [10, 10]);

			omega = x;
		}
	
		var edge = graph.insertEdge(parent, null, primitiveBank[t].cloneNode(true), alpha, omega, t);
	}
	
	


	setName(edge, name);

	if (usedTemp) {
		removePrimitive(x);
	}


	return edge;
}


/*
Method: removePrimitive

Removes a primitive from the model. You should not attempt to access or modify a primitive once it has been removed.

Parameters:

primitive - The primitive to delete, can also be an array of primitives.

See also:

<createPrimitive>, <createConnector>

*/

function removePrimitive(primitive) {
	if (!(primitive instanceof Array)) {
		primitive = [primitive];
	}
	
	
	if(graph instanceof SimpleNode){

		var connectors = findType(["Flow", "Transition", "Link"]);
		primitive.forEach(function(x){
			x.parent.children.splice(x.parent.children.indexOf(x), 1);
			connectors.forEach(function(c){
				if(c.source == x){
					c.source = null;
					if(c.target && c.target.parent !== c.parent){
						setParent(c, c.target.parent);
					}
				}
				if(c.target == x){
					c.target = null;
					if(c.source && c.source.parent !== c.parent){
						setParent(c, c.source.parent);
					}
				}
			})
		});
		clearPrimitiveCache();
	}else{
		graph.removeCells(primitive, false);
	}

}

