"use strict";
/*

Copyright 2010-2015 Scott Fortmann-Roe. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License.

*/

function getSetting() {
	var myCells = primitives();

	for (var i = 0; i < myCells.length; i++) {
		if (myCells[i].value.nodeName == "Setting") {
			return myCells[i];
		}
	}
	alert(getText("设置图元未找到。"))
	return null;
}

function customUnits() {
	if (typeof(getSetting().getAttribute("Units")) != "undefined") {
		var rows = getSetting().getAttribute("Units").split("\n");
		for (var i = 0; i < rows.length; i++) {
			rows[i] = rows[i].split("<>");
		}
		return rows;
	} else {
		return [];
	}
}

function unitsUsedInModel() {
	var items = primitives();
	var us = [];
	for (var i = 0; i < items.length; i++) {
		var u = items[i].getAttribute("Units");
		if (items[i].value.nodeName != "Setting" && isDefined(u) && u !== null && u != "无单位") {
			us.push(u);
		}
	}
	return Ext.Array.unique(us);
}
