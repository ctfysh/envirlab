"use strict";
/*

Copyright 2010-2018 Scott Fortmann-Roe. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License.

*/

// Cell ID mapping for clone/import operations
// Must be called after graph is created, from within main()

function setupCellIDManager() {

	// Override importCells to map key ID's

	var setID = function(cell){
		if(getID(cell)){
			cell.setAttribute("oldId", getID(cell));
		}
		if(getType(cell) == "Folder"){
			getChildren(cell, false).forEach(setID);
		}
	};

	graph.cloneCells = function(cells){

		cells.forEach(setID);

		return mxGraph.prototype.cloneCells.apply(graph, arguments);
	}

	graph.importCells = function(cells){
		function cellWithOldID(oldID) {
			var cs = newCells.slice();
			for(var i=0; i<newCells.length; i++){
				if(getType(newCells[i]) == "Folder"){
					cs = cs.concat(getChildren(newCells[i]));
				}
			}
			for (var i = 0; i < cs.length; i++) {
				if (cs[i].getAttribute("oldId") == oldID) {
					return cs[i];
				}
			}
			return findID(oldID);
		}


		cells.forEach(setID);

		var newCells = mxGraph.prototype.importCells.apply(graph, arguments);

		var updateID = function(cell) {
			if (cell.getAttribute("oldId") != undefined && cell.getAttribute("oldId") != "undefined") {
				if (cell.value.nodeName == "Converter") {
					var source = cell.getAttribute("Source");
					if (source[0] != "*" && source != "Time") {
						cell.setAttribute("Source", cellWithOldID(source).id);
					}
				} else if (cell.value.nodeName == "Agents") {
					cell.setAttribute("Agent", cellWithOldID(cell.getAttribute("Agent")).id);
				} else if (cell.value.nodeName == "Ghost") {
					cell.setAttribute("Source", cellWithOldID(cell.getAttribute("Source")).id);
				}
			}

			if(getType(cell) == "Folder"){
				getChildren(cell, false).forEach(updateID);
			}
		};

		newCells.forEach(updateID);

		newCells.forEach(setID);

		return newCells;
	}
}
