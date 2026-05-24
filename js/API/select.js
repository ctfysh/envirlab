"use strict";
/*

Group: Primitive Selections

*/


/*
Method: highlight

Highlights a single primitive. Selects the primitive, expands any collapsed folders the primitive is in, and scrolls to the position of the primitive.

Parameters:

primitive - The primitive to highlight.

*/

function highlight(primitive) {
	var folder = getParent(primitive);
	while (folder) {
		if (getCollapsed(folder)) {
			expandFolder(folder);
		}
		folder = getParent(folder);
	}

	setSelected(primitive);
	graph.scrollCellToVisible(primitive);
}


/*
Method: getSelected

Finds and returns the currently selected primitives.

Return:

An array of the selected primitives.

See also:

<setSelected>, <isSelected>
*/

function getSelected() {
	return graph.getSelectionCells();
}

/*
Method: setSelected

Sets the currently selected primitives.

Parameters:

primitives - An array of primitives to select. Can also be a single primitive.

See also:

<getSelected>, <isSelected>

*/

function setSelected(primitives) {
	graph.allowButtonSelect = true;
	if (primitives instanceof Array) {
		graph.setSelectionCells(primitives);
	} else {
		graph.setSelectionCells([primitives]);
	}
	graph.allowButtonSelect = false;
}

/*
Method: isSelected

Indicates whether a primitive is selected.

Parameters:

primitive - A primitive to return the selection status for. May also be an array of primitives.

Return:

Whether the primitive is selected or not as a boolean. If an array of primitives was passed to the function, an array of booleans is returned.

See also:

<getSelected>, <setSelected>

*/

function isSelected(primitive) {
	var selected = getSelected();
	return map(primitive, function(primitive) {
		return (primitiveIndex(selected, primitive) > -1);
	});
}



