"use strict";
/*

Copyright 2010-2015 Scott Fortmann-Roe. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License.

*/

var analysisCount = 0;

function replaceAll(txt, replace, with_this) {

	if (isUndefined(txt)) {
		return "";
	}
	return txt.replace(new RegExp(replace, 'g'), with_this);
}

function processLabel(label, title, objects, units, timeStep, algorithm) {
	var ph = "<PERCENTSIGNPLACEHOLDER>";
	label = replaceAll(label, "%%", ph);

	label = replaceAll(label, "%u", units);
	label = replaceAll(label, "%t", title);
	label = replaceAll(label, "%o", objects);
	label = replaceAll(label, "%ts", timeStep);
	label = replaceAll(label, "%a", algorithm);

	label = replaceAll(label, ph, "%");

	return clean(label);
}

function quickLabel(label, title, objects) {
	var setting = getSetting();

	return processLabel(label, title, objects, setting.getAttribute("TimeUnits"), setting.getAttribute("TimeStep"), setting.getAttribute("SolutionAlgorithm"));
}

function stringArray(items, comma, and) {
	if (items.length == 0) {
		return "";
	} else if (items.length == 1) {
		return items[0];
	} else {
		var i = items.slice();
		var last = i.pop();
		var first = i.join(comma);
		return first + and + last;
	}
}

function getURLTitle() {
	var t = graph_title.replace(/&#\d+;/g, "");
	t = t.replace(/'/g, '');
	t = t.replace(/[^A-Za-z0-9]/g, "-");
	t = t.replace(/\-+/g, "-");
	t = t.replace(/(^\-)|(\-$)/g, "");
	if (t.toLowerCase().indexOf("embed") == 0) {
		t = "_" + t;
	}
	return t;
}

function cmd(key) {
	if (mxClient.IS_MAC) {
		return "<span style='color:grey'>(&#8984;" + key + ")</span>";
	} else {
		return "<span style='color:grey'>(Ctrl-" + key + ")</span>";
	}
}

function cmdAlt(key) {
	if (mxClient.IS_MAC) {
		return "<span style='color:grey'>(&#8997;&#8984;" + key + ")</span>";
	} else {
		return "<span style='color:grey'>(Ctrl-Alt-" + key + ")</span>";
	}
}
