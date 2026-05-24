"use strict";
/*

Copyright 2010-2015 Scott Fortmann-Roe. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License.

*/

function deletePrimitive(cell) {
	var myCells = primitives();

	var setting = getSetting();
	if (setting.getAttribute("SensitivityPrimitives")) {
		var items = setting.getAttribute("SensitivityPrimitives").split(",");
		var j = items.indexOf(cell.id);
		if (j > -1) {
			items.splice(j, 1);
			setting.setAttribute("SensitivityPrimitives", items.join(","));
		}
	}

	if (cell.value.nodeName == "Folder" && cell.getAttribute("Type") == "Agent") {
		removeAgent(cell);
	}

	for (var i = 0; i < myCells.length; i++) {
		if (myCells[i].value.nodeName == "Display") {
			if (myCells[i].getAttribute("Primitives")) {
				var items = myCells[i].getAttribute("Primitives").split(",");
				var j = items.indexOf(cell.id);
				if (j > -1) {
					items.splice(j, 1);
					myCells[i].setAttribute("Primitives", items.join(","));
				}
			}
		} else if (myCells[i].value.nodeName == "Converter") {
			if (myCells[i].getAttribute("Source") == cell.id) {
				myCells[i].setAttribute("Source", "Time");
			} else if (cell.value.nodeName == "Link") {
				testConverterSource(myCells[i]);
			}
		} else if (myCells[i].value.nodeName == "Ghost") {
			if (myCells[i].value.getAttribute("Source") == cell.id) {
				var k = myCells[i];

				deletePrimitive(k);
				graph.removeCells([k], false);

			}
		}
	}
}

function linkBroken(edge) {
	var myCells = primitives();
	for (var i = 0; i < myCells.length; i++) {
		if (myCells[i].value.nodeName == "Converter") {
			testConverterSource(myCells[i]);
		}
	}
	if ((edge.getTerminal(false) !== null) && edge.getTerminal(false).value.nodeName == "Converter") {
		if (typeof(edge.getTerminal(true)) != "undefined") {
			if (isValued(edge.getTerminal(true))) {
				edge.getTerminal(false).setAttribute("Source", orig(edge.getTerminal(true)).id);
			}
		}
	}

}

function testConverterSource(target) {
	var neigh = neighborhood(target);
	var found = false;
	for (var j = 0; j < neigh.length; j++) {
		if (!neigh[j].linkHidden) {
			if (target.getAttribute("Source") == neigh[j].item.id) {
				found = true;
			}
		}
	}
	if (!found) {
		target.setAttribute("Source", "Time");
	}
}

function propogateName(cell, oldName) {
	if (isValued(cell)) {
		var newValue = getName(cell);
		var patt = new RegExp("\\[" + oldName + "\\]", "gi");

		var allItems = primitives();
		for (var i = 0; i < allItems.length; i++) {
			var item = allItems[i];
			if (item.id == cell.id) {
				continue;
			}
			if (isValued(item) || item.value.nodeName == "Action") {
				var val = getValue(item);
				if (patt.test(val)) {
					setValue(item, val.replace(patt, "[" + newValue + "]"));
				}
			}
		}
	}
}
