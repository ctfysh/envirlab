"use strict";
/*

Copyright 2010-2015 Scott Fortmann-Roe. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License.

*/

// ====== Graph Editing Operations ======

var scratchPadStatus = "";

var scratchpadFn = function() {
	if (scratchPadStatus == "shown") {
		Ext.get("mainGraph").setDisplayed("none");
		scratchPadStatus = "hidden";
	} else if (scratchPadStatus == "hidden") {
		Ext.get("mainGraph").setDisplayed("block");
		scratchPadStatus = "shown";
	} else {
		Ext.get("mainGraph").setDisplayed("block");
		Scratchpad($('#mainGraph'));
		scratchPadStatus = "shown";
	}
	ribbonPanel.down("#scratchpad").setChecked(scratchPadStatus == "shown");
};

var editActions = [];

editActions.copy = {
	hidden: is_ebook,
	itemId: 'copy',
	text: getText('复制'),
	glyph: 0xf0c5,
	tooltip: getText('复制') + ' ' + cmd("C"),
	handler: function() {
		mxClipboard.copy(graph);
		clipboardListener();
	},
	scope: this
};

editActions.cut = {
	hidden: is_ebook,
	itemId: 'cut',
	text: getText('剪切'),
	glyph: 0xf0c4,
	tooltip: getText('剪切') + ' ' + cmd("X"),
	handler: function() {
		mxClipboard.cut(graph);

		clipboardListener();

	},
	scope: this
};

editActions.paste = {
	hidden: is_ebook,
	text: getText('粘贴'),
	glyph: 0xf0ea,
	tooltip: getText('粘贴') + ' ' + cmd("V"),
	itemId: 'paste',
	handler: function() {
		mxClipboard.paste(graph);

		clipboardListener();

	},
	scope: this
};

editActions["delete"] = {
	itemId: 'delete',
	text: getText('删除'),
	glyph: 0xf00d,
	tooltip: getText('删除图元'),
	handler: function() {
		graph.removeCells(graph.getSelectionCells(), false);
	},
	scope: this
};

// Reverses arrow direction for selected edges (Flow/Link)
var reverseDirection = function() {
	graph.getModel().beginUpdate();

	var myCells = graph.getSelectionCells();
	if (myCells != null) {
		for (var i = 0; i < myCells.length; i++) {
			if (myCells[i].isEdge()) {
				var geo = myCells[i].getGeometry();

				var tmp = myCells[i].source;
				var edit = new mxTerminalChange(graph.getModel(), myCells[i], myCells[i].target, true);
				graph.getModel().execute(edit);
				edit = new mxTerminalChange(graph.getModel(), myCells[i], tmp, false);
				graph.getModel().execute(edit);

				tmp = geo.sourcePoint;
				geo.sourcePoint = geo.targetPoint;
				geo.targetPoint = tmp;
				if (geo.points != null) {
					geo.points.reverse();
				}
				edit = new mxGeometryChange(graph.getModel(), myCells[i], geo);
				graph.getModel().execute(edit);


				if (myCells[i].value.nodeName == "Link") {
					linkBroken(myCells[i]);
				}
			}
		}
	}

	graph.getModel().endUpdate();


};
