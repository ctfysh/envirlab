"use strict";

/*
Copyright 2010-2020 Scott Fortmann-Roe. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License.

Headless Node.js runner for the Insight Maker SimulationEngine.
Creates a browser-like global environment for the SE, then loads
all SE files in order and exposes runSimulationHeadless().
*/

var fs = require('fs');
var path = require('path');
var vm = require('vm');

// ── Browser global stubs ─────────────────────────────────────────

// window — set useful simulation globals
if (typeof window === 'undefined') {
	global.window = global;
}
window.timeStep = 1;
window.simulate = null;
window.storyConverter = null;
window.ObjectBase = null;
window.AgentBase = null;
window.isCalc = null;

// document — only document.location.hostname used in formula.js isLocal()
if (typeof document === 'undefined') {
	global.document = { location: { hostname: 'node' } };
}

// ExtJS stub — Ext.data.Store used in Modeler.js for results grid
if (typeof Ext === 'undefined') {
	global.Ext = {
		data: {
			Store: function(config) {
				this.data = [];
				this.records = {};
				this.maxLoaded = -1;
				return this;
			}
		}
	};
}
Ext.data.Store.prototype.loadData = function(data) {
	this.data = data;
};
Ext.data.Store.prototype.getById = function(id) {
	if (this.records && this.records[id]) return this.records[id];
	if (this.data && this.data[id]) return this.data[id];
	return undefined;
};
Ext.data.Store.prototype.suspendEvents = function() {};
Ext.data.Store.prototype.resumeEvents = function() {};
Ext.data.Store.prototype.filter = function() {};
Ext.data.Store.prototype.add = function(records) {
	if (!Array.isArray(records)) records = [records];
	for (var i = 0; i < records.length; i++) {
		var r = records[i];
		var id = r && (r.id || r.getId && r.getId());
		if (id !== undefined) {
			this.records[id] = r;
		}
	}
};

// mxUtils stub — only mxUtils.alert() used in Modeler.js error reporting
if (typeof mxUtils === 'undefined') {
	global.mxUtils = { alert: function(msg) { console.error('mxUtils.alert:', msg); } };
}

// mxGraph stubs — Graph/Layout used in Modeler.js network layout (~line 1382)
if (typeof Graph === 'undefined') {
	global.Graph = function() {};
	global.Layout = { ForceDirected: function() {} };
}
Graph.prototype.newNode = function() {};
Graph.prototype.newEdge = function() {};
Layout.ForceDirected.prototype.execute = function() {};

// alert stub — used in FormulaParser.js (29x) and functions.js Print()
if (typeof alert === 'undefined') {
	global.alert = function(msg) { console.error('alert:', msg); };
}


// ── SE-external function stubs ───────────────────────────────────
// These are defined OUTSIDE the SimulationEngine in the browser app.
// For headless mode we provide minimal implementations.

// i18n — identity when UI not needed
if (typeof getText === 'undefined') {
	global.getText = function(key) {
		if (arguments.length > 1) {
			var s = key;
			for (var i = 1; i < arguments.length; i++) {
				s = s.replace(/%s/, arguments[i]);
			}
			return s;
		}
		return key;
	};
}

// Utility stubs
if (typeof isTrue === 'undefined') {
	global.isTrue = function(value) {
		return value === true || value === 'true';
	};
}

if (typeof isUndefined === 'undefined') {
	global.isUndefined = function(value) { return typeof value === 'undefined'; };
}

if (typeof isDefined === 'undefined') {
	global.isDefined = function(value) { return typeof value !== 'undefined'; };
}

if (typeof isLocal === 'undefined') {
	global.isLocal = function() { return document.location.hostname === 'node'; };
}

if (typeof clean === 'undefined') {
	global.clean = function(txt) { return String(txt); };
}

// Primitive/Model data stubs — populated by runSimulationHeadless()
var _modelPrimitives = [];
var _modelLookup = {};

if (typeof findID === 'undefined') {
	global.findID = function(id) {
		return _modelLookup[id] || null;
	};
}

if (typeof neighborhood === 'undefined') {
	global.neighborhood = function(target) {
		if (!target) {
			return [];
		}
		var targetId = target.id || target.getAttribute && target.getAttribute('id');
		var targetType = target.getAttribute && target.getAttribute('type') || target.type;
		var hood = [];

		// For Flow/Link/Transition: include source and target
		if (['Flow', 'Link', 'Transition'].indexOf(targetType) >= 0) {
			if (target.source) {
				hood.push({ item: target.source, type: 'direct' });
			}
			if (target.target) {
				hood.push({ item: target.target, type: 'direct' });
			}
		}

		// Walk all primitives to find connected edges
		var allPrims = primitives();
		for (var i = 0; i < allPrims.length; i++) {
			var p = allPrims[i];
			var pType = p.getAttribute && p.getAttribute('type') || p.type;

			if (pType === 'Flow' || pType === 'Transition') {
				var pSourceId = p.source && (p.source.id || p.source.getAttribute && p.source.getAttribute('id'));
				var pTargetId = p.target && (p.target.id || p.target.getAttribute && p.target.getAttribute('id'));

				if (pSourceId === targetId) {
					hood.push({ item: p, type: 'direct', linkHidden: true });
				}
				if (pTargetId === targetId) {
					hood.push({ item: p, type: 'direct', linkHidden: true });
				}
			}

			// For Links, only include the connected item at the other end, not the Link itself
			if (pType === 'Link') {
				var pSourceId = p.source && (p.source.id || p.source.getAttribute && p.source.getAttribute('id'));
				var pTargetId = p.target && (p.target.id || p.target.getAttribute && p.target.getAttribute('id'));

				if (pSourceId === targetId && p.target) {
					var resolvedItem = _modelLookup ? (_modelLookup[p.target.id] || p.target) : p.target;
					hood.push({ item: resolvedItem, type: 'direct' });
				}
				if (pTargetId === targetId && p.source) {
					var resolvedItem = _modelLookup ? (_modelLookup[p.source.id] || p.source) : p.source;
					hood.push({ item: resolvedItem, type: 'direct' });
				}
			}
		}

		// Resolve Ghost cells via orig() then deduplicate + filter non-valued items
		var seen = {};
		var res = [];
		var valuedTypes = { 'Stock': true, 'Flow': true, 'Variable': true, 'Converter': true, 'Transition': true, 'State': true };
		for (var i = 0; i < hood.length; i++) {
			var item = orig(hood[i].item); // resolve Ghost -> actual primitive
			if (!item) continue;
			var itemType = item.getAttribute ? item.getAttribute('type') : item.type;
			if (!valuedTypes[itemType]) continue;
			var key = item.id || 'null';
			if (!seen[key]) {
				seen[key] = true;
				res.push({ item: item, type: hood[i].type, linkHidden: hood[i].linkHidden });
			}
		}

		return res;
	};
}

if (typeof getChildren === 'undefined') {
	global.getChildren = function(folder) { return []; };
}

if (typeof getValue === 'undefined') {
	global.getValue = function(primitive) {
		if (!primitive) return null;
		// Match the browser's API/primitives.js getValue which reads
		// type-specific attributes rather than the generic 'value' attr.
		var n = primitive.value && primitive.value.nodeName;
		if (n == "Stock") {
			return primitive.getAttribute("InitialValue");
		} else if (n == "Flow") {
			return primitive.getAttribute("FlowRate");
		} else if (n == "Transition") {
			return primitive.getAttribute("Value");
		} else if (n == "State") {
			return primitive.getAttribute("Active");
		} else if (n == "Variable") {
			return primitive.getAttribute("Equation");
		} else if (n == "Converter") {
			return primitive.getAttribute("Data");
		} else if (n == "Action") {
			return primitive.getAttribute("Action");
		}
		// Fallback: try generic 'value' attribute
		if (primitive.getAttribute) return primitive.getAttribute('value');
		return primitive.value;
	};
}

if (typeof getName === 'undefined') {
	global.getName = function(primitive) {
		if (!primitive) return null;
		if (primitive.getAttribute) return primitive.getAttribute('name');
		return primitive.name;
	};
}

if (typeof orig === 'undefined') {
	global.orig = function(cell) {
		if (!cell) return null;
		// Resolve Ghost cells to their referenced primitive (browser's Utilities.js behaviour)
		var nodeName = cell.value && cell.value.nodeName;
		if (nodeName === 'Ghost') {
			// Source attribute may be on cell.value (mxGraph style) or on cell directly
			var srcId = cell.value.getAttribute ? cell.value.getAttribute('Source') : null;
			if (srcId === null || srcId === undefined) {
				srcId = cell.getAttribute ? cell.getAttribute('Source') : null;
			}
			if (srcId) {
				var target = _modelLookup ? _modelLookup[String(srcId)] : null;
				if (target) return target;
			}
		}
		return cell;
	};
}

if (typeof getSetting === 'undefined') {
	global.getSetting = function() { return null; };
}

if (typeof getFrozen === 'undefined') {
	global.getFrozen = function(primitive) { return false; };
}

if (typeof primitives === 'undefined') {
	global.primitives = function(type) {
		if (type) {
			return _modelPrimitives.filter(function(p) {
				var t = p.getAttribute ? p.getAttribute('type') : p.type;
				return t === type;
			});
		}
		return _modelPrimitives;
	};
}

if (typeof findType === 'undefined') {
	global.findType = function(types) {
		if (!Array.isArray(types)) types = [types];
		return _modelPrimitives.filter(function(p) {
			var t = p.getAttribute ? p.getAttribute('type') : p.type;
			return types.indexOf(t) >= 0;
		});
	};
}

if (typeof getParent === 'undefined') {
	global.getParent = function(cell) { return null; };
}

if (typeof inAgent === 'undefined') {
	global.inAgent = function(cell) { return false; };
}

if (typeof getLineColor === 'undefined') {
	global.getLineColor = function(primitive) { return '#000000'; };
}

if (typeof commaStr === 'undefined') {
	global.commaStr = function(nStr) {
		if (nStr === undefined || nStr === null) return '0';
		var x = parseFloat(nStr);
		if (isNaN(x)) return String(nStr);
		return x.toLocaleString('en-US');
	};
}

if (typeof deepClone === 'undefined') {
	global.deepClone = function(target, obj, depth, fn) {
		if (!obj) return target;
		try { return JSON.parse(JSON.stringify(obj)); }
		catch(e) { return obj; }
	};
}

if (typeof showMacros === 'undefined') {
	global.showMacros = function(annotations) {};
}

// Results window mock — intercepted by runSimulationHeadless to capture data
var _simulationResults = null;

if (typeof createResultsWindow === 'undefined') {
	global.createResultsWindow = function(config) {
		var mock = {
			scripter: {
				paused: false,
				running: true,
				simData: [],
				dataSeries: [],
				dataNames: [],
				maxTime: 0,
				time: 0,
				iteration: 0,
				animInter: null,
				updateDisplayed: function() {},
				pause: function() {},
				finished: function() {},
				loadTime: function() {},
				advanceTimer: function() {},
				combo: {
					getValue: function() { return -1; }
				}
			},
			resultsGrid: {
				view: {
					getHeaderCt: function() { return { hideHeaders: function() {} }; },
					getEl: function() { return { on: function() {} }; }
				}
			},
			displayInformation: null,
			config: null,
			show: function() {},
			close: function() {},
			setTitle: function() {}
		};
		return mock;
	};
}


// ── SimulationEngine file loader ──────────────────────────────────

var _seBaseDir = __dirname;
var _projectDir = path.resolve(_seBaseDir, '..', '..');

// RedBlackTree is a vendored library (resources/RedBlackTree.js) loaded lazily
// Must be available before TaskScheduler.js creates TaskQueue instances.
var _sePreFiles = [
	path.join(_projectDir, 'resources/RedBlackNode.js'),
	path.join(_projectDir, 'resources/RedBlackTree.js')
];

// Exact loading order from index.html (lines 139-155, Worker.js for cross-reference)
var _seFiles = [
	'OO.js',
	'calc/unitsStructure.js',
	'calc/units.js',
	'SimpleCalc.js',
	'calc/antlr3-all-min.js',
	'calc/output/FormulaLexer.js',
	'calc/output/FormulaParser.js',
	'calc/rand.js',
	'calc/random.js',
	'calc/formula.js',
	'calc/functions.js',
	'Functions.js',
	'Classes.js',
	'Primitives.js',
	'TaskScheduler.js',
	'Simulator.js',
	'Modeler.js'
];

// Bignum files: schemeNumber.js auto-detects Node.js and tries
// require("biginteger"). We register the vendored file before loading.
function _registerBignum() {
	var bignumDir = path.join(_seBaseDir, 'calc/bignum');
	var bigintegerPath = path.join(bignumDir, 'biginteger.js');
	var schemeNumberPath = path.join(bignumDir, 'schemeNumber.js');

	if (!fs.existsSync(bigintegerPath) || !fs.existsSync(schemeNumberPath)) {
		return;
	}

	// Intercept require("biginteger") so schemeNumber.js's internal require works.
	// Use Node's require() not vm.runInThisContext() so the intercept takes effect.
	var Module = require('module');
	var origResolve = Module._resolveFilename;
	Module._resolveFilename = function(request, parent) {
		if (request === 'biginteger') {
			return bigintegerPath;
		}
		return origResolve.call(this, request, parent);
	};

	try {
		require(schemeNumberPath);
	} catch (e) {
		console.warn('Warning: failed to load schemeNumber.js, using SimpleCalc:', e.message);
	} finally {
		Module._resolveFilename = origResolve;
	}
}

function _loadSE() {
	// Try to load bignum first (for SchemeNumber precision). Falls back to SimpleCalc.
	_registerBignum();

	// Load vendored pre-dependencies (RedBlackTree.js, etc.)
	for (var i = 0; i < _sePreFiles.length; i++) {
		var preCode = fs.readFileSync(_sePreFiles[i], 'utf8');
		try {
			vm.runInThisContext(preCode, _sePreFiles[i]);
		} catch (e) {
			console.error('Error loading pre-file:', _sePreFiles[i], '-', e.message);
			throw e;
		}
	}

	for (var i = 0; i < _seFiles.length; i++) {
		var filePath = path.join(_seBaseDir, _seFiles[i]);
		var code = fs.readFileSync(filePath, 'utf8');
		try {
			vm.runInThisContext(code, _seFiles[i]);
		} catch (e) {
			console.error('Error loading SE file:', _seFiles[i], '-', e.message);
			throw e;
		}
	}
}

_loadSE();


// ── Helper: convert ModelJSON elements to pseudo-mxCells ────────

function _createPseudoCell(jsonElement) {
	var attrMap = {
		'name': jsonElement.name || '',
		'value': jsonElement.value || '',
		'type': jsonElement.type || '',
		'InitialValue': jsonElement.InitialValue || '',
		'width': jsonElement.geometry ? String(jsonElement.geometry.width) : '100',
		'height': jsonElement.geometry ? String(jsonElement.geometry.height) : '40',
		'x': jsonElement.geometry ? String(jsonElement.geometry.x) : '0',
		'y': jsonElement.geometry ? String(jsonElement.geometry.y) : '0',
		'units': jsonElement.units || '',
		'constraints': jsonElement.constraints || '',
		'note': jsonElement.note || '',
		'Min': jsonElement.Min || '',
		'Max': jsonElement.Max || '',
		'Step': jsonElement.Step || '',
		'NonNegative': jsonElement.NonNegative || '',
		'StockType': jsonElement.StockType || '',
		'Delay': jsonElement.Delay || '',
		'sourceId': jsonElement.sourceId || '',
		'targetId': jsonElement.targetId || '',
		'LabelPosition': jsonElement.LabelPosition || 'Middle',
		'TriggerType': jsonElement.TriggerType || '',
		'TriggerValue': jsonElement.TriggerValue || '',
		'TriggerRepeat': jsonElement.TriggerRepeat || '',
		'TriggerRecalculate': jsonElement.TriggerRecalculate || '',
		'PopulationSize': jsonElement.PopulationSize || '',
		'AgentBase': jsonElement.AgentBase || '',
		'GeometryWrap': jsonElement.GeometryWrap || '',
		'GeometryUnits': jsonElement.GeometryUnits || '',
		'GeometryWidth': jsonElement.GeometryWidth || '',
		'GeometryHeight': jsonElement.GeometryHeight || '',
		'AgentPlacement': jsonElement.AgentPlacement || '',
		'AgentPlacementFunction': jsonElement.AgentPlacementFunction || '',
		'AgentNetwork': jsonElement.AgentNetwork || '',
		'AgentNetworkFunction': jsonElement.AgentNetworkFunction || '',
		'Primitives': jsonElement.Primitives || '',
		'Color': jsonElement.Color || '',
		'Opacity': jsonElement.Opacity || '',
		'Source': jsonElement.Source || '',
		'ConverterInput': jsonElement.ConverterInput || '',
		'Interpolation': jsonElement.Interpolation || '',
		'DataType': jsonElement.DataType || '',
		'Data': jsonElement.Data || '',
		'OnlyPositive': jsonElement.OnlyPositive || '',
		'ShowSlider': jsonElement.ShowSlider || '',
		'Solver': jsonElement.Solver || '',
		'StrictLinks': jsonElement.StrictLinks || '',
		'Equation': jsonElement.Equation || '',
		'FlowRate': jsonElement.FlowRate || ''
	};

	return {
		id: jsonElement.id || '0',
		value: { nodeName: jsonElement.type || '' },
		getAttribute: function(name) {
			return attrMap[name] !== undefined ? attrMap[name] : null;
		},
		setAttribute: function(name, val) {
			attrMap[name] = String(val);
		},
		isVertex: function() { return true; },
		isEdge: function() { return !!jsonElement.sourceId; },
		source: jsonElement.sourceId ? (_modelLookup && _modelLookup[jsonElement.sourceId] || { id: jsonElement.sourceId, getAttribute: function() { return null; }, value: { nodeName: '' } }) : null,
		target: jsonElement.targetId ? (_modelLookup && _modelLookup[jsonElement.targetId] || { id: jsonElement.targetId, getAttribute: function() { return null; }, value: { nodeName: '' } }) : null
	};
}


// ── Main entry point: run a simulation headless ──────────────────

function runSimulationHeadless(modelJSON, overrides) {
	// modelJSON: output from exportModelJSON() — object with setting + elements
	// overrides: optional object to override settings (e.g., {TimeLength: "200"})

	// Validate inputs early
	if (!modelJSON || typeof modelJSON !== 'object') {
		throw new Error('runSimulationHeadless: modelJSON must be an object with .setting and .elements');
	}
	if (!modelJSON.elements || !Array.isArray(modelJSON.elements)) {
		modelJSON.elements = [];
	}
	if (!modelJSON.setting || typeof modelJSON.setting !== 'object') {
		modelJSON.setting = {};
	}

	// Build ID lookup FIRST so _createPseudoCell can resolve source/target refs
	_modelLookup = {};
	modelJSON.elements.forEach(function(el) {
		var id = el.id || el._id || '';
		_modelLookup[id] = null; // placeholder filled below
	});

	// Populate primitive stubs from model data
	_modelPrimitives = (modelJSON.elements || []).map(function(el) {
		var cell = _createPseudoCell(el);
		var id = el.id || el._id || '';
		_modelLookup[id] = cell;
		return cell;
	});
	for (var i = 0; i < _modelPrimitives.length; i++) {
		_modelLookup[_modelPrimitives[i].id] = _modelPrimitives[i];
	}

	// Resolve source/target references to actual cells
	for (var i = 0; i < _modelPrimitives.length; i++) {
		var cell = _modelPrimitives[i];
		if (cell.source && cell.source.id) {
			cell.source = _modelLookup[cell.source.id] || cell.source;
		}
		if (cell.target && cell.target.id) {
			cell.target = _modelLookup[cell.target.id] || cell.target;
		}
	}

	// Build settings from model config, mapping JSON keys to SE-expected keys
	var rawSettings = {};
	if (modelJSON.setting) {
		for (var key in modelJSON.setting) {
			if (modelJSON.setting.hasOwnProperty(key)) {
				rawSettings[key] = modelJSON.setting[key];
			}
		}
	}
	if (overrides) {
		for (var oKey in overrides) {
			if (overrides.hasOwnProperty(oKey)) {
				rawSettings[oKey] = overrides[oKey];
			}
		}
	}

	// Map JSON format keys to the names Modeler.js reads with getAttribute()
	var settingMap = {
		'TimeUnits': rawSettings.TimeUnits || 'Day',
		'TimeLength': rawSettings.TimeLength || '100',
		'TimeStart': rawSettings.TimeStart || '0',
		'TimeStep': rawSettings.TimeStep || '1',
		'TimePause': rawSettings.TimePause || rawSettings.PauseInterval || '0',
		'SolutionAlgorithm': rawSettings.Algorithm || 'Euler',
		'StrictUnits': rawSettings.StrictUnits || 'false',
		'StrictAgentResolution': rawSettings.StrictAgentResolution || 'false',
		'Units': rawSettings.Units || '',
		'RKOrder': rawSettings.RKOrder || '1',
		'StrictLinks': rawSettings.StrictLinks || 'false'
	};

	var _settingsWrapper = {
		getAttribute: function(name) {
			return settingMap[name] !== undefined ? settingMap[name] : undefined;
		}
	};

	// Save originals to restore after run
	var _origGetSetting = getSetting;
	global.getSetting = function() { return _settingsWrapper; };

	// Provide a handleErrorObject stub usable by the error path
	if (typeof handleErrorObject === 'undefined') {
		global.handleErrorObject = function(err) {
			console.error('Simulation error:', err && (err.stack || err.message || String(err)));
		};
	}

	// Run the simulation with silent=true to prevent async setTimeout sleep loop
	var simErr = null;
	try {
		runSimulation({
			entities: _modelPrimitives,
			silent: true
		});
	} catch (e) {
		simErr = e;
	}

	// Clean up any timer created by updateDisplayed (setInterval for advanceTimer)
	if (global.simulate && global.simulate.resultsWindow && global.simulate.resultsWindow.scripter) {
		var scripter = global.simulate.resultsWindow.scripter;
		if (scripter.animInter) {
			clearInterval(scripter.animInter);
			scripter.animInter = null;
		}
	}

	// Restore original stubs
	global.getSetting = _origGetSetting;

	if (simErr) {
		throw simErr;
	}

	// Extract results from the global simulate variable
	var results = null;
	if (global.simulate && global.simulate.results) {
		var sim = global.simulate;
		var series = [];
		var names = [];
		if (sim.results.data && sim.results.data.length > 0) {
			var firstRow = sim.results.data[0];
			for (var id in firstRow) {
				if (firstRow.hasOwnProperty(id) && id !== 'Time') {
					names.push(id);
					var dataPoints = [];
					for (var t = 0; t < sim.results.data.length; t++) {
						if (sim.results.data[t][id] !== undefined) {
							var val = sim.results.data[t][id];
							dataPoints.push(val && val.value !== undefined ? val.value : val);
						}
					}
					series.push(dataPoints);
				}
			}
		}
		results = {
			dataSeries: series,
			dataNames: names,
			maxTime: sim.results.Time ? sim.results.Time.length - 1 : 0,
			finalTime: sim.results.Time ? sim.results.Time[sim.results.Time.length - 1] : 0,
			time: sim.results.Time || []
		};
	}

	return results || { warning: 'No results captured' };
}



// ── Export helpers ────────────────────────────────────────────

/**
 * Build an id→name lookup map from a modelJSON elements array.
 * @param {Array} elements - modelJSON.elements
 * @returns {Object} id→name mapping
 */
function buildNameMap(elements) {
	var map = {};
	if (!elements) return map;
	for (var i = 0; i < elements.length; i++) {
		var el = elements[i];
		var id = el.id || el._id || '';
		var name = el.name || (el.getAttribute && el.getAttribute('name')) || '';
		if (id) map[id] = name;
	}
	return map;
}

/**
 * Export simulation results as CSV string.
 * @param {Object} results - The results object from runSimulationHeadless
 * @param {Object} [options]
 * @param {Object} [options.nameMap] - Optional id→name lookup for column headers
 * @param {string} [options.delimiter=',']
 * @param {boolean} [options.includeTime=true]
 * @returns {string} CSV formatted data
 */
function exportCSV(results, options) {
	options = options || {};
	var delim = options.delimiter || ',';
	var nameMap = options.nameMap || {};
	var includeTime = options.includeTime !== false;

	if (!results || !results.dataSeries || results.dataSeries.length === 0) {
		return '';
	}

	var names = results.dataNames || [];
	var series = results.dataSeries || [];
	var time = results.time || [];
	var lines = [];

	// Header row
	var header = [];
	if (includeTime) header.push('Time');
	for (var i = 0; i < names.length; i++) {
		header.push(nameMap[names[i]] || names[i]);
	}
	lines.push(header.map(escapeCSV).join(delim));

	// Data rows
	var rowCount = series[0] ? series[0].length : 0;
	for (var r = 0; r < rowCount; r++) {
		var row = [];
		if (includeTime) row.push(time[r] !== undefined ? time[r] : r);
		for (var i = 0; i < series.length; i++) {
			var val = series[i][r];
			row.push(val !== undefined && val !== null ? val : '');
		}
		lines.push(row.join(delim));
	}

	return lines.join('\n');

	function escapeCSV(str) {
		str = String(str);
		if (str.indexOf(',') >= 0 || str.indexOf('"') >= 0 || str.indexOf('\n') >= 0) {
			return '"' + str.replace(/"/g, '""') + '"';
		}
		return str;
	}
}

/**
 * Export simulation results as a JSON-compatible object with metadata.
 * @param {Object} results - The results object from runSimulationHeadless
 * @param {Object} [options]
 * @param {Object} [options.nameMap] - Optional id→name lookup for column headers
 * @param {boolean} [options.includeTimeArray=true]
 * @returns {Object} { metadata: {...}, columns: [...], rows: [...] }
 */
function exportJSON(results, options) {
	options = options || {};
	var nameMap = options.nameMap || {};
	var includeTime = options.includeTimeArray !== false;

	if (!results || !results.dataSeries || results.dataSeries.length === 0) {
		return { metadata: {}, columns: [], rows: [] };
	}

	var names = results.dataNames || [];
	var series = results.dataSeries || [];
	var time = results.time || [];
	var columns = [];

	if (includeTime) {
		columns.push({ id: 'Time', name: 'Time' });
	}
	for (var i = 0; i < names.length; i++) {
		columns.push({
			id: names[i],
			name: nameMap[names[i]] || names[i]
		});
	}

	var rowCount = series[0] ? series[0].length : 0;
	var rows = [];
	for (var r = 0; r < rowCount; r++) {
		var row = {};
		if (includeTime) row.Time = time[r] !== undefined ? time[r] : r;
		for (var i = 0; i < series.length; i++) {
			row[names[i]] = series[i][r] !== undefined ? series[i][r] : null;
		}
		rows.push(row);
	}

	return {
		metadata: {
			maxTime: results.maxTime,
			finalTime: results.finalTime,
			seriesCount: names.length,
			rowCount: rowCount
		},
		columns: columns,
		rows: rows
	};
}


// ── Export for Node.js consumers ─────────────────────────────────

module.exports = {
	runSimulationHeadless: runSimulationHeadless,
	exportCSV: exportCSV,
	exportJSON: exportJSON,
	buildNameMap: buildNameMap,
	version: '1.2.0'
};
