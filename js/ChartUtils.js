"use strict";
/*

Copyright 2010-2020 Scott Fortmann-Roe. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License.

*/

var linkedResults = undefined;

var defaultColors = ["#94ae0a", "#115fa6", "#a61120", "#ff8809", "#ffd13e", "#a61187", "#24ad9a", "#7c7474", "#a66111"];

function dataRenderer(item) {
	if (item instanceof Vector) {
		return item.toString();
	} else if (item instanceof Agent) {
		return "Agent " + (item.index + 1);
	} else {
		return commaStr(item);
	}
}

function commaStr(nStr) {
	if (typeof nStr === 'string') {
		return nStr.replace(/[&<>'"]/g, 
			tag => ({
					'&': '&amp;',
					'<': '&lt;',
					'>': '&gt;',
					"'": '&#39;',
					'"': '&quot;'
				}[tag]));
	}
	
	if (typeof nStr === 'boolean') {
		return nStr.toString();
	}
	
	if (isUndefined(nStr) || nStr === null) {
		return "";
	}

	if (nStr >= 1e9 || nStr <= 1e-9 && nStr != 0) {
		return nStr.toPrecision(3);
	} else {
		var nStr = round(nStr, 9) + '';
		var x = nStr.split('.');
		var x1 = x[0];
		var x2 = x.length > 1 ? '.' + x[1] : '';
		var rgx = /(\d+)(\d{3})/;
		while (rgx.test(x1)) {
			x1 = x1.replace(rgx, '$1' + ',' + '$2');
		}
		return x1 + x2;
	}
}

function numericBound(v) {
	if (v === undefined || v === "") {
		return undefined;
	} else {
		return +v;
	}
}

function round(value, precision, mode) {
	// Returns the number rounded to specified precision  
	// 
	// version: 1109.2015
	// discuss at: http://phpjs.org/functions/round
	// +   original by: Philip Peterson
	// +    revised by: Onno Marsman
	// +      input by: Greenseed
	// +    revised by: T.Wild
	// +      input by: meo
	// +      input by: William
	// +   bugfixed by: Brett Zamir (http://brett-zamir.me)
	// +      input by: Josep Sanz (http://www.ws3.es/)
	// +    revised by: Rafał Kukawski (http://blog.kukawski.pl/)
	// %        note 1: Great work. Ideas for improvement:
	// %        note 1:  - code more compliant with developer guidelines
	// %        note 1:  - for implementing PHP constant arguments look at
	// %        note 1:  the pathinfo() function, it offers the greatest
	// %        note 1:  flexibility & compatibility possible
	// *     example 1: round(1241757, -3);
	// *     returns 1: 1242000
	// *     example 2: round(3.6);
	// *     returns 2: 4
	// *     example 3: round(2.835, 2);
	// *     returns 3: 2.84
	// *     example 4: round(1.1749999999999, 2);
	// *     returns 4: 1.17
	// *     example 5: round(58551.799999999996, 2);
	// *     returns 5: 58551.8
	var m, f, isHalf, sgn; // helper variables
	precision |= 0; // making sure precision is integer
	m = Math.pow(10, precision);
	value *= m;
	sgn = (value > 0) | -(value < 0); // sign of the number
	isHalf = value % 1 === 0.5 * sgn;
	f = Math.floor(value);

	if (isHalf) {
		switch (mode) {
			case 'PHP_ROUND_HALF_DOWN':
				value = f + (sgn < 0); // rounds .5 toward zero
				break;
			case 'PHP_ROUND_HALF_EVEN':
				value = f + (f % 2 * sgn); // rouds .5 towards the next even integer
				break;
			case 'PHP_ROUND_HALF_ODD':
				value = f + !(f % 2); // rounds .5 towards the next odd integer
				break;
			default:
				value = f + (sgn > 0); // rounds .5 away from zero
		}
	}

	return (isHalf ? value : Math.round(value)) / m;
}
