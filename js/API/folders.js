"use strict";
/*

Group: Folders

*/

/*
Method: collapseFolder

Collapses a folder or an array of folders.

Parameter:

folder - Either a single folder primitive or an array of folder primitives.

See also:

<expandFolder>, <getCollapsed>

*/

function collapseFolder(folder) {

	map(folder, function(folder) {
		graph.foldCells(true, false, [folder]);
	});

}

/*
Method: expandFolder

Expands a folder or an array of folders.

Parameter:

folder - Either a single folder primitive or an array of folder primitives.

See also:

<collapseFolder>, <getCollapsed>
*/

function expandFolder(folder) {
	map(folder, function(folder) {
		graph.foldCells(false, false, [folder]);
	});
}

/*
Method: getCollapsed

Returns whether or not a given folder is collapsed.

Parameter:

folder - The folder for which the collapsed state is requested.

Return:

True is the folder is collapsed, false if it is expanded.

See also:

<collapseFolder>, <expandFolder>
*/

function getCollapsed(folder) {
	return map(folder, function(f) {
		return f.isCollapsed();
	});
}


/*
Method: getParent

Gets the parent folder for a primitive.

Parameters:

primitive - The primitive for which the parent folder will be returned. May also be an array of primitives.

Return:

The parent folder. Returns null if the primitive is not in a folder.

See also:

<setParent>
*/

function getParent(primitive) {
	var defaultID = "1"; //graph.getDefaultParent().id;
	return map(primitive, function(primitive) {
		
		var p = primitive.parentNode || primitive.parent;
		
		if ((p.value && p.value.nodeName =="root") || p.nodeName=="root" || p.id == defaultID) {
			return null;
		} else {
			return p;
		}
	});
}

/*
Method: setParent

Sets the parent folder for a primitive.

Parameters:

primitive - The primitive for which the parent folder will be set. May also be an array of primitives in which case they will all be set to the same parent.
parent - The parent folder primitive. Use null to remove the primitive from all folders.

See also:

<getParent>
*/

function setParent(primitive, parent, perserveLoc) {
	if(graph instanceof SimpleNode){
		if(parent == null){
			parent = graph.children[0].children[0];
		}
	}else{
		var p = (parent == null ? graph.getDefaultParent() : parent);
	}
	//console.log(p)
	//console.log(primitive);
	map(primitive, function(primitive) {
		//console.log(primitive.getAttribute("name"));

		if(graph instanceof SimpleNode){
			primitive.parent.children.splice(primitive.parent.children.indexOf(primitive),1);
			primitive.parent = parent;
			primitive.parentNode = parent;
			if(!parent.children){
				parent.children = [];
			}
			parent.children.push(primitive);
		}else{
			var loc = getPosition(primitive);
			var edit = new mxChildChange(graph.getModel(), p, primitive);
			graph.getModel().execute(edit);
			if (!perserveLoc) {
					setPosition(primitive, loc);
			}
		}
	});
}

/*
Method: getFrozen

Gets the frozen state for a primitive.

Parameters:

primitive - The primitive for which the frozen will be returned. May also be an array of primitives.

Return:

The frozen state for the primitive.

See also:

<setFrozen>
*/

function getFrozen(primitive) {
	return map(primitive, function(primitive) {
		
		return isTrue(primitive.getAttribute("Frozen"));
	});
}

/*
Method: setFrozen

Sets the frozen state for a primitive.

Parameters:

primitive - The primitive for which the frozen state will be set. May also be an array of primitives in which case they will all be set to the same frozen state.
frozen - The new frozen state for the primitive.

See also:

<getFrozen>
*/

function setFrozen(primitive, frozen) {
	
	map(primitive, function(primitive) {
		setAttributeUndoable(primitive, "Frozen", frozen);
	});
}


/*
Method: getChildren

Returns the children of a folder.

Parameters:

folder - The folder for which the children will be returned.
recursive - Optional. Whether the children of inner folders will be returned. Defaults to true.

Return:

The children primitves of the folder.

*/

function getChildren(folder, recursive) {
	if (isUndefined(recursive)) {
		recursive = true;
	}
	
	if(!folder.children){
		return [];
	}

	if (recursive) {
		return flatten(map(folder.children, function(x) {
			if (x.value.nodeName == "Folder") {
				return x.children.concat([x]);
			} else {
				return x;
			}
		}));
	} else {
		return folder.children;
	}
}

/*
Method: getFolderType

Gets the type of a folder.

Parameters:

folder - The folder for which the type is requested. May also be an array of folders.

Return:

The type mode as a string. May be "None" or "Agent".

See also:

<setFolderType>
*/

function getFolderType(folder) {
	return map(folder, function(primitive) {
		return primitive.getAttribute("Type");
	});
}

/*
Method: setFolderType

Sets the type of a folder.

Parameters:

folder - The folder for which the type will be set. May also be an array of folders.
type - The type mode as a string. May be "None" or "Agent".

See also:

<getFolderType>
*/

function setFolderType(folder, type) {
	map(folder, function(primitive) {
		setAttributeUndoable(primitive, "Type", type);
	});
}

/*
Method: getFolderAgentParent

Gets the agent parent of a folder.

Parameters:

folder - The folder for which the agent parent is requested. May also be an array of folders.

Return:

The agent parent as a string.

See also:

<setFolderAgentParent>
*/

function getFolderAgentParent(folder) {
	return map(folder, function(primitive) {
		return primitive.getAttribute("AgentBase");
	});
}

/*
Method: setFolderAgentParent

Sets the agent parent of a folder.

Parameters:

folder - The folder for which the type will be set. May also be an array of folders.
agentParent - The agent parent as a string.

See also:

<getFolderAgentParent>
*/

function setFolderAgentParent(folder, agentParent) {
	map(folder, function(primitive) {
		setAttributeUndoable(primitive, "AgentBase", agentParent);
	});
}


/*
Method: getFolderSolver

Gets the solver configuation for a folder. The configuration is an object with the properties:

enabled - true is the folder should have its own solver
algorithm - the solution algorithm. Current allowed values are "RK1" for Euler's method and "RK4" for a fourth order Runge-Kutta method
timeStep - the time step for the folder's solver

Parameters:

folder - The folder for which the solver is requested. May also be an array of folders.

Return:

The solver object

See also:

<setFolderSolver>
*/

function getFolderSolver(folder) {
	return map(folder, function(primitive) {
		return JSON.parse(primitive.getAttribute("Solver"));
	});
}

/*
Method: setFolderSolver

Sets the solver object for a folder

Parameters:

folder - The folder for which the solver will be set. May also be an array of folders.
solver - The solver object

See also:

<getFolderSolver>
*/

function setFolderSolver(folder, solver) {
	map(folder, function(primitive) {
		setAttributeUndoable(primitive, "Solver", JSON.stringify(solver));
	});
}


