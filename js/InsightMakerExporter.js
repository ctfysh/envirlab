"use strict";

function xmlAttr(s) {
	if (s == null) return "";
	return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function attrPair(key, value) {
	if (value == null) return "";
	return " " + key + '="' + xmlAttr(value) + '"';
}

function flattenAttr(val) {
	if (typeof val === "boolean") return val ? "true" : "false";
	if (typeof val === "object" && val !== null) return JSON.stringify(val);
	return String(val);
}

function getCellStyle(node, nodeName) {
	if (node.style) return node.style;
	switch (nodeName) {
		case "Stock": return "stock";
		case "Flow": return "flow";
		case "Variable": return "variable";
		case "Link": return "link";
		case "State": return "state";
		case "Transition": return "transition";
		case "Converter": return "converter";
		case "Folder": return "folder";
		case "Setting": return "";
		case "Text": return "text";
		case "Display": return "roundImage;image=/builder/images/DisplayFull.png";
		case "Picture": return "image";
		case "Ghost": return "ghost";
		default: return "";
	}
}

function isConnector(nodeName) {
	return nodeName === "Flow" || nodeName === "Link" || nodeName === "Transition";
}

function getParentOffsets(node) {
	var ox = 0, oy = 0;
	var p = node.parent;
	while (p && p.value && p.value.nodeName !== "root" && p.id !== "1") {
		if (p.geometry) {
			ox += p.geometry.x || 0;
			oy += p.geometry.y || 0;
		}
		p = p.parent;
	}
	return { x: ox, y: oy };
}

function serializeGeometry(geometry, offsetX, offsetY) {
	offsetX = offsetX || 0;
	offsetY = offsetY || 0;
	var g = geometry || {};
	var x = (g.x || 0) + offsetX;
	var y = (g.y || 0) + offsetY;
	var w = g.width || 40;
	var h = g.height || 100;
	return '<mxGeometry x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" as="geometry"/>';
}

function serializeConnectorGeometry(geometry, parentOffsets) {
	parentOffsets = parentOffsets || { x: 0, y: 0 };
	var g = geometry || {};
	var x = (g.x || 0) + (parentOffsets.x || 0);
	var y = (g.y || 0) + (parentOffsets.y || 0);
	var xml = '<mxGeometry';
	if (x || y) {
		xml += ' x="' + x + '" y="' + y + '"';
	}
	xml += ' width="' + (g.width || 100) + '" height="' + (g.height || 100) + '" as="geometry">';
	if (g.sourcePoint) {
		xml += '<mxPoint x="' + (g.sourcePoint.x || 0) + '" y="' + (g.sourcePoint.y || 0) + '" as="sourcePoint"/>';
	}
	if (g.targetPoint) {
		xml += '<mxPoint x="' + (g.targetPoint.x || 0) + '" y="' + (g.targetPoint.y || 0) + '" as="targetPoint"/>';
	}
	if (g.points && g.points.length > 0) {
		xml += '<Array as="points">';
		for (var pi = 0; pi < g.points.length; pi++) {
			xml += '<mxPoint x="' + (g.points[pi].x || 0) + '" y="' + (g.points[pi].y || 0) + '"/>';
		}
		xml += '</Array>';
	}
	xml += '</mxGeometry>';
	return xml;
}

function serializeNode(node, options) {
	options = options || {};
	var nodeName = node.value.nodeName;
	if (!nodeName) return "";

	var attrParts = [];
	var seenKeys = {};

	var attrs = node["@attributes"] || node.attributes;
	if (attrs) {
		if (typeof attrs.forEach === "function") {
			attrs.forEach(function(value, key) {
				seenKeys[key] = true;
				attrParts.push(attrPair(key, flattenAttr(value)));
			});
		} else {
			Object.keys(attrs).forEach(function(key) {
				seenKeys[key] = true;
				attrParts.push(attrPair(key, flattenAttr(attrs[key])));
			});
		}
	}

	if (!seenKeys["id"] && node.id) {
		attrParts.push(attrPair("id", node.id));
	}

	attrParts.sort();

	var xml = "<" + nodeName;
	for (var i = 0; i < attrParts.length; i++) {
		xml += attrParts[i];
	}
	xml += ">";

	var hasCell = options.includeCell !== false;
	if (hasCell) {
		var parentId = "1";
		if (node.parent && node.parent.value && node.parent.value.nodeName !== "root" && node.parent.id && node.parent.id !== "1") {
			parentId = node.parent.id;
		}

		var cellAttrs = [];
		var style = getCellStyle(node, nodeName);
		if (style) cellAttrs.push('style="' + xmlAttr(style) + '"');
		cellAttrs.push('parent="' + xmlAttr(parentId) + '"');

		var isEdge = isConnector(nodeName);
		if (isEdge) {
			cellAttrs.push('edge="1"');
			var src = node.source ? node.source.id || node.source.getAttribute("id") : null;
			var tgt = node.target ? node.target.id || node.target.getAttribute("id") : null;
			if (src) cellAttrs.push('source="' + xmlAttr(src) + '"');
			if (tgt) cellAttrs.push('target="' + xmlAttr(tgt) + '"');
		} else {
			cellAttrs.push('vertex="1"');
			if (nodeName === "Setting" || nodeName === "Display") {
				cellAttrs.push('visible="0"');
			}
		}

		xml += "\n      <mxCell " + cellAttrs.join(" ") + ">";

		var offs = getParentOffsets(node);
		if (isEdge) {
			xml += "\n        " + serializeConnectorGeometry(node.geometry, offs);
		} else {
			xml += "\n        " + serializeGeometry(node.geometry, offs.x, offs.y);
		}

		xml += "\n      </mxCell>";
	}

	if (node.children && node.children.length > 0) {
		for (var ci = 0; ci < node.children.length; ci++) {
			var child = node.children[ci];
			if (!child.value || !child.value.nodeName) continue;
			if (child.value.nodeName === "mxCell") continue;
			var childXml = serializeNode(child, { includeCell: true });
			if (childXml) {
				xml += "\n    " + childXml;
			}
		}
	}

	xml += "\n    </" + nodeName + ">";
	return xml;
}

function collectPrimitiveNodes(root) {
	var result = [];
	function walk(node) {
		if (!node || !node.value) return;
		var nn = node.value.nodeName;
		if (nn && nn !== "mxCell") {
			result.push(node);
		}
		if (node.children) {
			for (var i = 0; i < node.children.length; i++) {
				walk(node.children[i]);
			}
		}
	}
	if (root.children) {
		for (var i = 0; i < root.children.length; i++) {
			walk(root.children[i]);
		}
	}
	return result;
}

function toInsightMakerXML(model) {
	if (!model || !model._graph) {
		throw new Error("Invalid model: must have a _graph property");
	}

	var allNodes = collectPrimitiveNodes(model._graph);

	var settingsNode = null;
	var otherNodes = [];
	for (var i = 0; i < allNodes.length; i++) {
		var n = allNodes[i];
		if (!n.value || !n.value.nodeName) continue;
		var nn = n.value.nodeName;
		if (nn === "Setting") {
			settingsNode = n;
		} else if (nn !== "root" && nn !== "info") {
			otherNodes.push(n);
		}
	}

	var xml = '<InsightMakerModel>\n  <root>\n    ';
	xml += '<mxCell id="0"/>\n    ';
	xml += '<mxCell id="1" parent="0"/>\n    ';

	if (settingsNode) {
		var sXml = serializeNode(settingsNode, { includeCell: true });
		if (sXml) xml += sXml + "\n    ";
	}

	for (var i = 0; i < otherNodes.length; i++) {
		var childXml = serializeNode(otherNodes[i], { includeCell: true });
		if (childXml) {
			xml += childXml + "\n    ";
		}
	}

	xml += '</root>\n</InsightMakerModel>';
	return xml;
}

if (typeof exports !== "undefined") {
	exports.toInsightMakerXML = toInsightMakerXML;
}
if (typeof window !== "undefined") {
	window.toInsightMakerXML = toInsightMakerXML;
}
