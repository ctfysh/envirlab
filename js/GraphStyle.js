"use strict";
/*

Copyright 2010-2015 Scott Fortmann-Roe. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License.

*/

function getGraphXml(graph) {
	var enc = new mxCodec(mxUtils.createXmlDocument());
	var node = enc.encode(graph.getModel());
	return mxUtils.getPrettyXml(node);
}

function sendGraphtoServer(graph) {
	if (!unfoldingManager.unfolding) {
		var xml = getGraphXml(graph);
		var blob = new Blob([xml], { type: 'application/xml' });
		var url = URL.createObjectURL(blob);
		var a = document.createElement('a');
		var filename = (graph_title || "未命名模型") + ".xml";
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		setSaveEnabled(false);
		updateWindowTitle();
		setTopLinks();
	}
}

function setPicture(cell) {

	var styleString = cell.getStyle();
	if (cell.getAttribute("Image") == "None" || cell.getAttribute("Image") == "" || cell.getAttribute("Image") == " " || cell.getAttribute("Image") == "null" || (cell.value.nodeName == "Folder" && !cell.isCollapsed())) {
		styleString = mxUtils.setStyle(styleString, "image", "None");
		if (cell.value.nodeName == "Display" || cell.value.nodeName == "Stock" || cell.value.nodeName == "Folder") {
			styleString = mxUtils.setStyle(styleString, "shape", "rectangle");
		} else if (cell.value.nodeName == "Button") {
			styleString = mxUtils.setStyle(styleString, "shape", "rectangle");
		} else {
			styleString = mxUtils.setStyle(styleString, "shape", "ellipse");
		}
	} else {
		if (urlImage(cell)) {
			styleString = mxUtils.setStyle(styleString, "image", cell.getAttribute("Image"));
		} else {
			styleString = mxUtils.setStyle(styleString, "image", builder_path + "/images/SD/" + cell.getAttribute("Image") + ".png");
		}
		if (isTrue(cell.getAttribute("FlipVertical"))) {
			styleString = mxUtils.setStyle(styleString, "imageFlipV", 1);
		} else {
			styleString = mxUtils.setStyle(styleString, "imageFlipV", 0);
		}
		if (isTrue(cell.getAttribute("FlipHorizontal"))) {
			styleString = mxUtils.setStyle(styleString, "imageFlipH", 1);
		} else {
			styleString = mxUtils.setStyle(styleString, "imageFlipH", 0);
		}
		styleString = mxUtils.setStyle(styleString, "shape", "image");
	}
	var edit = new mxStyleChange(graph.getModel(), cell, styleString);

	graph.getModel().execute(edit);

	propogateGhosts(cell);
}

function setLabelPosition(cell) {

	var labelPos = cell.getAttribute("LabelPosition");

	var styleString = cell.getStyle();

	if (cell.value.nodeName == "Folder" && (!cell.isCollapsed())) {
		styleString = mxUtils.setStyle(styleString, "labelPosition", null);
		styleString = mxUtils.setStyle(styleString, "align", null);

		styleString = mxUtils.setStyle(styleString, "verticalLabelPosition", null);
		styleString = mxUtils.setStyle(styleString, "verticalAlign", null);

	} else {

		if (labelPos == "Top") {
			styleString = mxUtils.setStyle(styleString, "labelPosition", "middle");
			styleString = mxUtils.setStyle(styleString, "align", "center");

			styleString = mxUtils.setStyle(styleString, "verticalLabelPosition", "top");
			styleString = mxUtils.setStyle(styleString, "verticalAlign", "bottom");
		} else if (labelPos == "Bottom") {
			styleString = mxUtils.setStyle(styleString, "labelPosition", "middle");
			styleString = mxUtils.setStyle(styleString, "align", "center");

			styleString = mxUtils.setStyle(styleString, "verticalLabelPosition", "bottom");
			styleString = mxUtils.setStyle(styleString, "verticalAlign", "top");
		} else if (labelPos == "Middle") {
			styleString = mxUtils.setStyle(styleString, "labelPosition", "middle");
			styleString = mxUtils.setStyle(styleString, "align", "center");

			styleString = mxUtils.setStyle(styleString, "verticalLabelPosition", "middle");
			styleString = mxUtils.setStyle(styleString, "verticalAlign", "middle");
		} else if (labelPos == "Left") {
			styleString = mxUtils.setStyle(styleString, "verticalLabelPosition", "middle");
			styleString = mxUtils.setStyle(styleString, "verticalAlign", "middle");

			styleString = mxUtils.setStyle(styleString, "labelPosition", "left");
			styleString = mxUtils.setStyle(styleString, "align", "right");
		} else if (labelPos == "Right") {
			styleString = mxUtils.setStyle(styleString, "verticalLabelPosition", "middle");
			styleString = mxUtils.setStyle(styleString, "verticalAlign", "middle");

			styleString = mxUtils.setStyle(styleString, "labelPosition", "right");
			styleString = mxUtils.setStyle(styleString, "align", "left");
		}
	}

	var edit = new mxStyleChange(graph.getModel(), cell, styleString);

	graph.getModel().execute(edit);

	propogateGhosts(cell);
}

function propogateGhosts(cell) {
	var ghosts = primitives("Ghost");
	for (var i = 0; i < ghosts.length; i++) {
		if (ghosts[i].getAttribute("Source") == cell.id) {
			var style = cell.getStyle();
			style = mxUtils.setStyle(style, "opacity", 30);
			ghosts[i].setStyle(style);
			var edit = setAttributeUndoable(ghosts[i], "name", cell.getAttribute("name"));

		}
	}
}

function currentStyleIs(val) {
	var tmp = graph.getCellStyle(graph.getSelectionCell())[mxConstants.STYLE_FONTSTYLE];
	for (var i = 3; i >= 1; i--) {

		tmp = tmp - val * (Math.pow(2, i));
		if (tmp < 0) {
			tmp = tmp + val * Math.pow(2, i);
		}
	}
	return (tmp >= val);
}

function setStyles() {
	if ((!is_embed) && is_editor) {
		var selected = !graph.isSelectionEmpty();

		var r = ribbonPanelItems();

		if (selected) {
			r.down('#bold').setChecked(currentStyleIs(mxConstants.FONT_BOLD));
			r.down('#italic').setChecked(currentStyleIs(mxConstants.FONT_ITALIC));
			r.down('#underline').setChecked(currentStyleIs(mxConstants.FONT_UNDERLINE));
			var style = graph.getCellStyle(graph.getSelectionCell());
			r.down("#sizeCombo").setValue(style[mxConstants.STYLE_FONTSIZE]);
			r.down("#fontCombo").setValue(style[mxConstants.STYLE_FONTFAMILY]);
		} else {
			r.down('#bold').setChecked(false);
			r.down('#italic').setChecked(false);
			r.down('#underline').setChecked(false);
			r.down("#fontCombo").setValue("");
			r.down("#sizeCombo").setValue("");
		}
	}
}

function exportSvg() {
	var scale = graph.view.scale;
	var bounds = graph.getGraphBounds();

	// Prepares SVG document that holds the output
	var svgDoc = mxUtils.createXmlDocument();
	var root = (svgDoc.createElementNS != null) ?
		svgDoc.createElementNS(mxConstants.NS_SVG, 'svg') : svgDoc.createElement('svg');

	if (root.style != null) {
		root.style.backgroundColor = '#FFFFFF';
	} else {
		root.setAttribute('style', 'background-color:#FFFFFF');
	}

	if (svgDoc.createElementNS == null) {
		root.setAttribute('xmlns', mxConstants.NS_SVG);
	}

	root.setAttribute('width', Math.ceil(bounds.width * scale + 2) + 'px');
	root.setAttribute('height', Math.ceil(bounds.height * scale + 2) + 'px');
	root.setAttribute('xmlns:xlink', mxConstants.NS_XLINK);
	root.setAttribute('version', '1.1');

	// Adds group for anti-aliasing via transform
	var group = (svgDoc.createElementNS != null) ?
		svgDoc.createElementNS(mxConstants.NS_SVG, 'g') : svgDoc.createElement('g');
	group.setAttribute('transform', 'translate(0.5,0.5)');
	root.appendChild(group);
	svgDoc.appendChild(root);

	// Renders graph. Offset will be multiplied with state's scale when painting state.
	var svgCanvas = new mxSvgCanvas2D(group);
	svgCanvas.translate(Math.floor(1 / scale - bounds.x), Math.floor(1 / scale - bounds.y));
	svgCanvas.scale(scale);

	var imgExport = new mxImageExport();
	imgExport.drawState(graph.getView().getState(graph.model.root), svgCanvas);

	var xml = (mxUtils.getXml(root));

	downloadFile(
		"Insight Maker Diagram.svg",
		xml,
		"text/svg");
}

function setModelAttribute(cell, name, value) {
	var model = graph.getModel();
	model.beginUpdate();
	try {
		model.execute(new mxCellAttributeChange(cell, name, String(value)));
	} finally {
		model.endUpdate();
	}
}

function modelTransaction(fn) {
	var model = graph.getModel();
	model.beginUpdate();
	try {
		var result = fn();
		clearPrimitiveCache();
		return result;
	} finally {
		model.endUpdate();
	}
}

function loadBackgroundColor() {
	mxPanel.el.dom.style["background-color"] = getSetting().getAttribute("BackgroundColor");

	mxPanel.el.dom.style.backgroundColor = getSetting().getAttribute("BackgroundColor");
}

function handelCursors() {
	graph.container.style.cursor = 'auto';
}

function printGraph() { // P
	var pageCount = mxUtils.prompt(getText('输入要打印的页数') + ":", '1');

	if (pageCount != null) {
		var scale = mxUtils.getScaleForPageCount(pageCount, graph);
		var preview = new mxPrintPreview(graph, scale);
		preview.open();
	}
}

function customColor(fn) {
	return function() {
		getCustomColor(function(col) {
			fn(col);
		});
	}
}

function widthItem(size, menu) {
	menu.push({
		text: getText('宽度: %s', size),
		handler: function() {
			graph.setCellStyles(mxConstants.STYLE_STROKEWIDTH, size, excludeType(graph.getSelectionCells(), "Ghost"));
			graph.setCellStyles(mxConstants.ARROW_SIZE, size * 10, excludeType(graph.getSelectionCells(), "Ghost"));
		}
	});
}

function setCellShape(shape, perimeter, cells) {
	graph.setCellStyles(mxConstants.STYLE_SHAPE, shape, cells);
	graph.setCellStyles(mxConstants.STYLE_PERIMETER, perimeter, cells);
}

function toggleFontBold(cells) {
	graph.toggleCellStyleFlags(mxConstants.STYLE_FONTSTYLE, mxConstants.FONT_BOLD, cells);
}

function toggleFontItalic(cells) {
	graph.toggleCellStyleFlags(mxConstants.STYLE_FONTSTYLE, mxConstants.FONT_ITALIC, cells);
}

function toggleFontUnderline(cells) {
	graph.toggleCellStyleFlags(mxConstants.STYLE_FONTSTYLE, mxConstants.FONT_UNDERLINE, cells);
}

function setCellAlignment(cells, align) {
	graph.setCellStyles(mxConstants.STYLE_ALIGN, align, cells);
}

function capMenu(start) {
	function createSetter(val) {
		return function() {
			if (start) {
				graph.setCellStyles(mxConstants.STYLE_STARTARROW, val, excludeType(graph.getSelectionCells(), "Ghost"));
			} else {
				graph.setCellStyles(mxConstants.STYLE_ENDARROW, val, excludeType(graph.getSelectionCells(), "Ghost"));
			}
		}
	}
	var items = [
		["无", mxConstants.NONE],
		'-', ["常规箭头", mxConstants.ARROW_CLASSIC],
		["块箭头", mxConstants.ARROW_BLOCK],
		["打开箭头", mxConstants.ARROW_OPEN],
		["菱形", mxConstants.ARROW_DIAMOND],
		["瘦菱形", mxConstants.ARROW_DIAMOND_THIN],
		["椭圆", mxConstants.ARROW_OVAL]
	];

	for (var i = 0; i < items.length; i++) {
		if (items[i] !== "-") {
			items[i] = {
				text: items[i][0],
				handler: createSetter(items[i][1])
			}
		}
	}
	return items;
}
