"use strict";
/*

Copyright 2010-2015 Scott Fortmann-Roe. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License.

*/

var primitiveCache = {};
//cache clearing is set in InsightEditor.js

var neighborhoodCache = {};
//cache clearing is set in InsightEditor.js

function clearPrimitiveCache() {
	primitiveCache = {};
	neighborhoodCache = {};
}

function primitives(type) {
	if (primitiveCache[" " + type]) {
		return primitiveCache[" " + type];
	}
	var myCells = childrenCells(((graph instanceof SimpleNode) ? graph.children[0] : graph.getModel().getRoot()).children[0]);
	if (type == null) {
		primitiveCache[" " + type] = myCells;
	} else {
		var targetCells = [];
		for (var i = 0; i < myCells.length; i++) {
			if (myCells[i].value.nodeName == type) {
				targetCells.push(myCells[i]);
			}
		}
		primitiveCache[" " + type] = targetCells;
	}
	return primitiveCache[" " + type];
}

function childrenCells(root) {
	var myCells = root ? root.children : null;
	if (myCells != null) {
		var additions = [];
		for (var i = 0; i < myCells.length; i++) {
			if (myCells[i].value.nodeName == "Folder") {
				additions = additions.concat(childrenCells(myCells[i]));
			}
		}
		myCells = myCells.concat(additions);
		for (var i = myCells.length - 1; i >= 0; i--) {
			if (myCells[i] == null || myCells[i].value == null) {
				myCells.splice(i, 1);
			}
		}
		return myCells;
	}
	return null;
}

function isPrimitive(cell) {
	return !(cell.value.nodeName == 'Button' || cell.value.nodeName == 'Picture' || cell.value.nodeName == 'Text');
}

function cellsContainNodename(myCells, name) {
	for (var i = 0; i < myCells.length; i++) {
		if (myCells[i].value.nodeName == name) {
			return true;
		}
	}
}

function connectionType() {
	var connectBtn = ribbonPanelItems().down('#connect');
	if (connectBtn && connectBtn.pressed) {
		return "Flow";
	} else {
		return "Link";
	}
}

function setAllConnectable() {
	graph.setConnectable(true);
	var items = primitives();
	for (var i = 0; i < items.length; i++) {
		items[i].setConnectable(true);
	}
}

function orig(cell) {
	if (isUndefined(cell) || cell === null) {
		return null;
	}
	if (cell.value.nodeName === "Ghost") {
		return findID(cell.value.getAttribute("Source"));
	} else {
		return cell;
	}
}

function isValued(cell) {
	if (isUndefined(cell) || cell == null || isUndefined(orig(cell))) {
		return false;
	}
	return (orig(cell).value.nodeName == "Converter" || orig(cell).value.nodeName == "Flow" || orig(cell).value.nodeName == "Stock" || orig(cell).value.nodeName == "Variable" || orig(cell).value.nodeName == "Transition" || orig(cell).value.nodeName == "State");
}

function inAgent(cell) {
	if ((!cell) || cell == null) {
		return false;
	}

	var p = getParent(cell);
	if (p) {
		if (p.getAttribute("Type") == "Agent") {
			return true;
		}
	}
	return inAgent(p);
}

function parentAgent(cell) {
	if ((!cell) || cell == null) {
		return undefined;
	}

	var p = getParent(cell);
	if (p) {
		if (p.getAttribute("Type") == "Agent") {
			return p;
		}
	}
	return parentAgent(p);
}

function hasDisplay() {
	var myCells = primitives();
	return cellsContainNodename(myCells, "Display");
}

function urlImage(cell) {
	return cell.getAttribute("Image") && cell.getAttribute("Image").substring(0, 4).toLowerCase() == "http";
}

function validPrimitiveName(name, primitive) {
	if (primitive.value.nodeName == "Stock" || primitive.value.nodeName == "Variable" || primitive.value.nodeName == "Converter" || primitive.value.nodeName == "Flow" || primitive.value.nodeName == "Display" || primitive.value.nodeName == "Agents" || primitive.value.nodeName == "Transition" || primitive.value.nodeName == "State") {
		if (name.length > 0 && (!(/[\[\]\(\)\{\}\<\>\'\"]/.test(name)))) {
			return true;
		} else {
			mxUtils.alert(getText("图元名称不能包括方括号、圆括号和引号。"));
			return false;
		}
	} else {
		return true;
	}
}

function removeAgent(cell) {
	var items = primitives("Agents");
	for (var i = 0; i < items.length; i++) {
		if (items[i].getAttribute("Agent") == cell.id) {
			items[i].setAttribute("Agent", "");
		}
	}
}

function neighborhood(target) {
	var targetInAgent = inAgent(target);
	if (neighborhoodCache[target.id]) {
		return neighborhoodCache[target.id];
	}
	var hood = [];
	var myCells = primitives();
	if (myCells != null) {
		if (target != null) {
			var flows = [];
			var links = [];
			if (["Flow", "Link", "Transition"].indexOf(target.value.nodeName) > -1) {
				if (orig(target.source) !== null) {
					hood.push({
						item: orig(target.source),
						type: "direct"
					});
				}
				if (orig(target.target) !== null) {
					hood.push({
						item: orig(target.target),
						type: "direct"
					});
				}
			}
			if (target.value.nodeName == "Agents") {
				if (target.getAttribute("Agent")) {
					hood = hood.concat(getAgentItems(target));
				}
			}
			for (var i = 0; i < myCells.length; i++) {
				if (myCells[i].value.nodeName == "Flow") {
					flows.push(orig(myCells[i]));
				} else if (myCells[i].value.nodeName == "Link") {
					links.push(orig(myCells[i]));
				}
			}
			for (var i = 0; i < flows.length; i++) {
				if (flows[i].source == target) {
					hood.push({
						item: flows[i],
						type: "direct",
						linkHidden: true
					});
				}
				if (flows[i].target == target) {
					hood.push({
						item: flows[i],
						type: "direct",
						linkHidden: true
					});
				}
			}
			for (var i = 0; i < links.length; i++) {
				if (orig(links[i].source) == target && (isDefined(links[i].target) && links[i].target !== null)) {
					var linkHidden = !isTrue(links[i].getAttribute("BiDirectional"));

					hood.push({
						item: orig(links[i].target),
						type: "direct",
						linkHidden: linkHidden
					});
					hood = hood.concat(getAgentItems(links[i].target, linkHidden));
				}
				if (orig(links[i].target) == target && (isDefined(links[i].source) && links[i].source !== null) && !(inAgent(orig(links[i].source)) && !targetInAgent)) {
					hood.push({
						item: orig(links[i].source),
						type: "direct"
					});
					hood = hood.concat(getAgentItems(links[i].source));
				}
			}
		} else {
			for (var i = 0; i < myCells.length; i++) {
				if (isValued(myCells[i])) {
					hood.push({
						item: orig(myCells[i]),
						type: "direct"
					});
				}
			}
		}
	}
	hood = hood.filter(function(x) {
		return x;
	});
	var res = [];

	//Remove duplicated elements
	for (var i = 0; i < hood.length; i++) {
		if (hood[i].linkHidden && strictLinks) {
			continue;
		}
		var found = false;
		for (var j = 0; j < res.length; j++) {
			if (res[j].type == hood[i].type && res[j].item.id == hood[i].item.id) {
				found = true;
				if (res[j].linkHidden && !hood[i].linkHidden) {
					res[j].linkHidden = false;
				}
				break;
			}
		}
		if (!found) {
			if (isValued(hood[i].item) || (hood[i].item.value.nodeName == "Agents")) {
				res.push(hood[i]);
			}
		}
	}
	neighborhoodCache[target.id] = res;
	return res;

	function getAgentItems(agent, linkHidden) {
		var res = [];
		if (orig(agent).value.nodeName == "Agents" && orig(agent).getAttribute("Agent")) {
			var id = orig(agent).getAttribute("Agent");
			if (id) {
				var items = getChildren(findID(id));
				items.forEach(function(x) {
					if (isValued(x) && x.value.nodeName != "Ghost") {
						res.push({
							item: x,
							type: "agent",
							linkHidden: linkHidden,
							name: x.getAttribute("name")
						});
					}
				})
			}
		}

		return res.sort(function(a, b) {
			if (a.name == b.name) {
				return 0;
			} else if (a.name > b.name) {
				return 1
			} else {
				return -1;
			}
		});
	}
}
