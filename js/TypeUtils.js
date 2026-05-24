"use strict";
/*

Copyright 2010-2015 Scott Fortmann-Roe. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License.

*/

function isTrue(item) {
	return (item != "false" && item != "No" && item != 0) && (item == 1 || item == -1 || item == "True" || item == "true" || item == true || item == "Yes");
}

function isUndefined(item) {
	return typeof(item) == "undefined";
}

function isDefined(item) {
	return (!isUndefined(item));
}

function isTouch() {
	return mxClient.IS_TOUCH;
}

function doubleArray(arr) {
	var narr = [];
	for (var i = 0; i < arr.length; i++) {
		narr.push([arr[i], arr[i]])
	}
	return narr;
}

function flatten(arr) {
	var r = [];

	function recFlatten(a) {
		var i, ln, v;

		for (i = 0, ln = a.length; i < ln; i++) {
			v = a[i];

			if (Array.isArray(v)) {
				recFlatten(v);
			} else {
				r.push(v);
			}
		}

		return r;
	}

	return recFlatten(arr);
}

function deepClone(target, obj, depth, fn) {
	var options, name, src, copy, copyIsArray, clone;

	// Only deal with non-null/undefined values
	if ((options = arguments[1]) != null) {
		// Extend the base object
		for (name in options) {
			src = target[name];
			copy = options[name];

			// Prevent never-ending loop
			if (target === copy) {
				continue;
			}
			if (fn) {
				var x = fn(copy);
				if (x) {
					target[name] = x;
					continue;
				}
			}
			// Recurse if we're merging plain objects or arrays
			if (depth > 0 && copy && ((copyIsArray = Array.isArray(copy)) || typeof(copy) == "object")) {
				if (copyIsArray) {
					copyIsArray = false;
					clone = src && Array.isArray(src) ? src : [];

				} else {
					clone = src && typeof(srv) == "object" ? src : {};
				}

				// Never move original objects, clone them
				target[name] = deepClone(clone, copy, depth - 1, fn);

				// Don't bring in undefined values
			} else if (copy !== undefined) {
				target[name] = copy;
			}
		}
	}

	// Return the modified object
	return target;

}

function map(val, fn) {
	if (val instanceof Array) {
		return val.map(fn);
	} else {
		return fn(val);
	}
}

function changeNodeName(node, newName) {
	var doc = mxUtils.createXmlDocument();
	var newNode = doc.createElement(newName);
	var attrs = node.attributes;
	for (var i = 0; i < attrs.length; i++) {
		newNode.setAttribute(attrs[i].name, attrs[i].value)
	}
	return newNode;
}
