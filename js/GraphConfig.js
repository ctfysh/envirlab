"use strict";
/*

Copyright 2010-2018 Scott Fortmann-Roe. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License.

*/

// mxGraph label, display, and interaction configuration
// Must be called after graph is created, from within main()

function setupGraphConfig() {

	// --- Label rendering ---

	graph.isHtmlLabel = function(cell) {
		var isHTML = cell != null && cell.value != null && (cell.value.nodeName != "Display");

		return isHTML;
	};

	graph.isWrapping = graph.isHtmlLabel;

	graph.convertValueToString = function(cell) {
		if (mxUtils.isNode(cell.value)) {
			if (cell.value.nodeName == "Link" && orig(cell).getAttribute("name") == "Link") {
				return "";
			} else if (cell.value.nodeName == "Text") {
				var name = orig(cell).getAttribute("name");
				if (isTrue(cell.getAttribute("UseMathJax"))) {
					return '<div style="word-wrap: break-word; white-space: normal; width: 100%; overflow: visible;"><span class="mathjax-content">' + clean(name) + '</span></div>';
				}
				return '<div style="word-wrap: break-word; white-space: normal; width: 100%; overflow: visible;">' + clean(name) + '</div>';
			} else {
				return clean(orig(cell).getAttribute("name"));
			}
		}
		return '';
	};

	graph.isHtmlLabel = function(cell) {
		if (cell && cell.value && cell.value.nodeName == "Text") {
			return true;
		}
		return false;
	};

	// --- Cell interaction ---

	graph.isCellLocked = function(cell) {
		return (!viewConfig.allowEdits) || getOpacity(cell) === 0;
	}
	graph.allowButtonSelect = false;
	graph.isCellSelectable = function(cell) {
		return (cell.value.nodeName != "Setting" && cell.value.nodeName != "Display" && (graph.allowButtonSelect || cell.value.nodeName != "Button" && getOpacity(cell) !== 0));
	}
	graph.isCellEditable = function(cell) {
		if (!viewConfig.allowEdits) {
			return false;
		}
		return (cell.value.nodeName != "Display" && cell.value.nodeName != "Setting" && getOpacity(cell) !== 0 && cell.value.nodeName != "Ghost" && (cell.value.nodeName != "Button" || graph.isCellSelected(cell)));
	}

	graph.getCursorForCell = function(cell) {
		if (cell.value.nodeName == "Button") {
			return "pointer";
		}
	}

	graph.labelChanged = function(cell, newValue, evt) {
		if (validPrimitiveName(newValue, cell)) {

			var oldName = cell.getAttribute("name");

			setModelAttribute(graph.getSelectionCell(), "name", Ext.getCmp('nameEditor').getValue());
			return cell;
		}
	};

	graph.getEditingValue = function(cell) {
		if (mxUtils.isNode(cell.value)) {
			return cell.getAttribute('name');
		}
	};

	// --- MathJax ---

	var mathJaxTimer;
	function triggerMathJax() {
		clearTimeout(mathJaxTimer);
		mathJaxTimer = setTimeout(function() {
			if (typeof MathJax === 'undefined' || !MathJax.typesetPromise || !graph || !graph.container) return;
			var elements = graph.container.querySelectorAll('.mathjax-content');
			if (elements.length > 0) {
				MathJax.typesetPromise([].slice.call(elements)).catch(function(err) {
					console.log('MathJax typeset error:', err);
				});
			}
		}, 150);
	}
	graph.getModel().addListener(mxEvent.CHANGE, function() {
		triggerMathJax();
	});

	// Initial render: trigger MathJax once graph is loaded and any async CDN script has arrived
	triggerMathJax();
}
