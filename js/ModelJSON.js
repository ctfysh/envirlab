"use strict";

/**
 * Safe DOMParser resolver for cross-environment (browser + Node.js).
 * In browsers the native DOMParser is used directly.
 * In Node.js we fall back to @xmldom/xmldom if available.
 */
function resolveDOMParser() {
  if (typeof DOMParser !== "undefined") return DOMParser;
  if (typeof require !== "undefined") {
    try {
      return require("@xmldom/xmldom").DOMParser;
    } catch (e) {
      throw new Error(
        "DOMParser is not available. " +
        "In Node.js, install @xmldom/xmldom: npm install @xmldom/xmldom"
      );
    }
  }
  throw new Error("DOMParser is not available in this environment.");
}

/**
 * ModelJSON.js — .evl ↔ JSON round-trip serialization for Insight Maker models.
 *
 * Public API:
 *   loadInsightMaker(xmlString) → model wrapper with _graph, find(), get(), simulate()
 *   toModelJSON(model)          → plain JSON object
 *   loadModelJSON(json)         → model wrapper (reconstructed)
 */

function SimpleNode() {
  this["@attributes"] = {};
  this.id = null;
  this.value = null;
  this.parent = null;
  this.parentNode = null;
  this.children = null;
  this.geometry = null;
  this.source = null;
  this.target = null;
}

SimpleNode.prototype.getAttribute = function (x) {
  var v = this["@attributes"][x];
  return v != null ? v : "";
};

SimpleNode.prototype.setAttribute = function (x, value) {
  this["@attributes"][x] = "" + value;
};

// ========================================================================
// XML → SimpleNode tree  (equivalent to mxGraphToJson from mxShim.js)
// ========================================================================

function xmlToSimpleNode(xml, parent) {
  var obj = new SimpleNode();
  obj.value = xml;
  obj.parent = parent;
  obj.parentNode = parent;

  if (xml.nodeType === 1) {
    for (var j = 0; j < xml.attributes.length; j++) {
      var attr = xml.attributes.item(j);
      obj["@attributes"][attr.nodeName] = attr.nodeValue;
    }
    obj.id = obj["@attributes"].id;
  } else if (xml.nodeType === 3) {
    return null; // skip text nodes
  }

  if (xml.hasChildNodes()) {
    obj.children = [];
    for (var i = 0; i < xml.childNodes.length; i++) {
      var child = xml.childNodes.item(i);
      var childObj = xmlToSimpleNode(child, obj);
      if (childObj) {
        obj.children.push(childObj);
      }
    }
  }
  return obj;
}

/**
 * Parse an Insight Maker XML string into a SimpleNode tree (the global `graph` equivalent).
 */
function parseInsightMakerXML(xmlString) {
  var Parser = resolveDOMParser();
  var parser = new Parser();
  var dom = parser.parseFromString(xmlString, "text/xml");
  var graph = xmlToSimpleNode(dom, null);

  // Ensure the root structure has proper value nodeNames
  // The InsightMaker XML has <InsightMakerModel><root>...</root></InsightMakerModel>
  if (graph.children && graph.children.length > 0) {
    var root = graph.children[0];
    root.value = { nodeName: "root" };
    root.id = root.getAttribute("id") || "1";
  }

  // Wire up mxCell metadata: extract geometry, source/target from mxCell children
  wireUpMxCells(graph);

  // Wire up source/target references for connectors (Flow, Link, Transition)
  wireUpConnections(graph);

  return graph;
}

/**
 * Extract geometry and source/target info from mxCell children and attach to parent nodes.
 */
function wireUpMxCells(node) {
  if (!node || !node.children) return;

  // Find mxCell children and merge their attributes
  var mxCells = [];
  node.children = node.children.filter(function (child) {
    if (child.value && child.value.nodeName === "mxCell") {
      mxCells.push(child);
      return false;
    }
    return true;
  });

  if (mxCells.length > 0) {
    var mx = mxCells[0];
    // Merge mxCell attributes onto the parent node
    for (var key in mx["@attributes"]) {
      if (key !== "id" && !(key in node["@attributes"])) {
        node["@attributes"][key] = mx["@attributes"][key];
      }
    }
    // Extract geometry from mxCell children
    if (mx.children) {
      node.geometry = {};
      for (var gi = 0; gi < mx.children.length; gi++) {
        var gc = mx.children[gi];
        if (!gc.value) continue;
        var nn = gc.value.nodeName;
        if (nn === "mxGeometry") {
          var g = gc["@attributes"];
          node.geometry.x = parseFloat(g.x) || 0;
          node.geometry.y = parseFloat(g.y) || 0;
          node.geometry.width = parseFloat(g.width) || 40;
          node.geometry.height = parseFloat(g.height) || 40;
          // Process mxGeometry children: sourcePoint, targetPoint, bend points
          if (gc.children) {
            for (var gci = 0; gci < gc.children.length; gci++) {
              var gchild = gc.children[gci];
              if (!gchild.value) continue;
              var gchildNN = gchild.value.nodeName;
              if (gchildNN === "mxPoint") {
                var as = gchild.getAttribute("as");
                if (as === "sourcePoint") {
                  node.geometry.sourcePoint = {
                    x: parseFloat(gchild.getAttribute("x")) || 0,
                    y: parseFloat(gchild.getAttribute("y")) || 0
                  };
                } else if (as === "targetPoint") {
                  node.geometry.targetPoint = {
                    x: parseFloat(gchild.getAttribute("x")) || 0,
                    y: parseFloat(gchild.getAttribute("y")) || 0
                  };
                }
              } else if (gchildNN === "Array") {
                var arrayAs = gchild.getAttribute("as");
                if (arrayAs === "points" && gchild.children) {
                  var pts = [];
                  for (var pi = 0; pi < gchild.children.length; pi++) {
                    var pt = gchild.children[pi];
                    if (pt.value && pt.value.nodeName === "mxPoint") {
                      pts.push({
                        x: parseFloat(pt.getAttribute("x")) || 0,
                        y: parseFloat(pt.getAttribute("y")) || 0
                      });
                    }
                  }
                  if (pts.length > 0) {
                    node.geometry.points = pts;
                  }
                }
              }
            }
          }
        }
      }
    }
    // Store source/target IDs from mxCell attributes
    node._mxSource = mx.getAttribute("source") || null;
    node._mxTarget = mx.getAttribute("target") || null;
  }

  // Recurse
  for (var ci = 0; ci < node.children.length; ci++) {
    wireUpMxCells(node.children[ci]);
  }
}

/**
 * Wire up source/target references for connector primitives (Flow, Link, Transition).
 * Builds an ID→node lookup and resolves _mxSource/_mxTarget to actual node references.
 */
function wireUpConnections(root) {
  var allNodes = [];
  function collect(n) {
    if (n && n.value && n.value.nodeName && n.value.nodeName !== "mxCell") {
      allNodes.push(n);
    }
    if (n && n.children) {
      for (var i = 0; i < n.children.length; i++) collect(n.children[i]);
    }
  }
  collect(root);

  var byId = {};
  for (var i = 0; i < allNodes.length; i++) {
    byId[allNodes[i].id] = allNodes[i];
  }

  // Wire connectors
  var connectorTypes = { Flow: true, Link: true, Transition: true };
  for (var i = 0; i < allNodes.length; i++) {
    var n = allNodes[i];
    if (connectorTypes[n.value.nodeName]) {
      if (n._mxSource && byId[n._mxSource]) n.source = byId[n._mxSource];
      if (n._mxTarget && byId[n._mxTarget]) n.target = byId[n._mxTarget];
    }
  }
}

// ========================================================================
// Collect all primitives from the graph (like primitives() in Utilities.js)
// ========================================================================

function collectPrimitives(root) {
  var result = [];
  function walk(node) {
    if (!node || !node.value) return;
    var nn = node.value.nodeName;
    if (nn && nn !== "mxCell" && nn !== "root" && nn !== "info") {
      result.push(node);
    }
    if (node.children) {
      for (var i = 0; i < node.children.length; i++) {
        walk(node.children[i]);
      }
    }
  }
  if (root && root.children) {
    for (var i = 0; i < root.children.length; i++) {
      walk(root.children[i]);
    }
  }
  return result;
}

function findSetting(primitives) {
  for (var i = 0; i < primitives.length; i++) {
    if (primitives[i].value.nodeName === "Setting") return primitives[i];
  }
  return null;
}

// ========================================================================
// Model wrapper — provides the API surface the test expects
// ========================================================================

function loadSimulationEngine() {
  if (typeof runSimulation === "function") return true;
  if (typeof require === "undefined") return false;
  try {
    // Shim browser globals that the simulation engine expects
    if (typeof global !== "undefined") {
      if (typeof global.window === "undefined") {
        global.window = {};
      }
      if (typeof global.document === "undefined") {
        global.document = { location: { hostname: "node" } };
      }
      // Stub utility functions that are defined outside the engine
      // (e.g. in Localization.js, Utilities.js) but used by it
      if (typeof global.getText !== "function") {
        global.getText = function(s) { return s; };
      }
      if (typeof global.isLocal !== "function") {
        global.isLocal = function() { return false; };
      }
      if (typeof global.isUndefined !== "function") {
        global.isUndefined = function(item) { return typeof(item) == "undefined"; };
      }
      if (typeof global.isDefined !== "function") {
        global.isDefined = function(item) { return !global.isUndefined(item); };
      }
    }
    var vm = require("vm");
    var fs = require("fs");
    var path = require("path");
    var simDir = path.resolve(__dirname, "SimulationEngine");

    var engineFiles = [
      "OO.js", "calc/unitsStructure.js", "calc/units.js",
      "SimpleCalc.js", "calc/antlr3-all-min.js",
      "calc/output/FormulaLexer.js", "calc/output/FormulaParser.js",
      "calc/rand.js", "calc/random.js", "calc/formula.js",
      "calc/functions.js", "Functions.js", "Classes.js",
      "Primitives.js", "TaskScheduler.js", "Simulator.js", "Modeler.js"
    ];

    for (var i = 0; i < engineFiles.length; i++) {
      var code = fs.readFileSync(path.join(simDir, engineFiles[i]), "utf-8");
      vm.runInThisContext(code, engineFiles[i]);
    }
    return typeof runSimulation === "function";
  } catch (e) {
    console.warn("Simulation engine not available:", e.message);
    return false;
  }
}

function createModelWrapper(graph, options) {
  options = options || {};

  var allPrimitives = collectPrimitives(graph);

  var model = {
    _graph: graph,

    find: function () {
      return allPrimitives.slice();
    },

    get: function (predicate) {
      var matches = allPrimitives.filter(predicate);
      return matches.length > 0 ? matches[0] : null;
    },

    simulate: function (config) {
      // The simulation engine requires a full mxGraph instance.
      // SimpleNode graphs (from XML parsing) are incompatible.
      if (graph instanceof SimpleNode) {
        return { Time: [], data: [], error: "simulation requires mxGraph (browser only)", errorPrimitive: null };
      }
      loadSimulationEngine();
      if (typeof runSimulation === "function") {
        if (typeof global !== "undefined") {
          global.graph = graph;
        }
        config = config || {};
        if (config.silent === undefined) config.silent = true;
        return runSimulation(config);
      }
      return { Time: [], data: [], error: "engine not loaded", errorPrimitive: null };
    },

    toString: function () {
      return "[InsightMaker Model]";
    }
  };

  return model;
}

// ========================================================================
// Export: loadInsightMaker(xmlString)
// ========================================================================

function loadInsightMaker(xmlString) {
  var graph = parseInsightMakerXML(xmlString);
  return createModelWrapper(graph);
}

// ========================================================================
// Export: toModelJSON(model)
// ========================================================================

function toModelJSON(model) {
  var graph = model._graph;
  var prims = collectPrimitives(graph);
  var setting = findSetting(prims);

  // Serialize setting
  var settingObj = {};
  if (setting) {
    for (var key in setting["@attributes"]) {
      settingObj[key] = setting["@attributes"][key];
    }
    // Include geometry
    if (setting.geometry) {
      settingObj.geometry = {
        x: setting.geometry.x,
        y: setting.geometry.y,
        width: setting.geometry.width,
        height: setting.geometry.height
      };
    }
  }

  // Serialize elements (non-Setting primitives)
  var elements = [];
  for (var i = 0; i < prims.length; i++) {
    var p = prims[i];
    if (p.value.nodeName === "Setting") continue;

    var el = {
      type: p.value.nodeName,
      id: p.id
    };

    // Copy all attributes
    for (var key in p["@attributes"]) {
      el[key] = p["@attributes"][key];
    }

    // Geometry
    if (p.geometry) {
      el.geometry = {};
      if (p.geometry.x != null) el.geometry.x = p.geometry.x;
      if (p.geometry.y != null) el.geometry.y = p.geometry.y;
      if (p.geometry.width != null) el.geometry.width = p.geometry.width;
      if (p.geometry.height != null) el.geometry.height = p.geometry.height;
      if (p.geometry.sourcePoint) el.geometry.sourcePoint = p.geometry.sourcePoint;
      if (p.geometry.targetPoint) el.geometry.targetPoint = p.geometry.targetPoint;
      if (p.geometry.points) el.geometry.points = p.geometry.points;
    }

    // Parent reference (by ID)
    if (p.parent && p.parent.id) {
      el.parentId = p.parent.id;
    }

    // Source/target references (for connectors)
    if (p.source) el.sourceId = p.source.id;
    if (p.target) el.targetId = p.target.id;

    // mxCell-style source/target if not yet resolved
    if (!el.sourceId && p._mxSource) el.sourceId = p._mxSource;
    if (!el.targetId && p._mxTarget) el.targetId = p._mxTarget;

    elements.push(el);
  }

  return {
    format: "InsightMaker-ModelJSON",
    version: 1,
    setting: settingObj,
    elements: elements
  };
}

// ========================================================================
// Export: loadModelJSON(json)
// ========================================================================

function loadModelJSON(json) {
  // Check format
  if (json.format !== "InsightMaker-ModelJSON") {
    throw new Error("Unsupported format: " + json.format);
  }

  // First pass: create all nodes
  var root = new SimpleNode();
  root.value = { nodeName: "root" };
  root.id = "1";
  root.children = [];

  var infoNode = new SimpleNode();
  infoNode.value = { nodeName: "info" };
  infoNode.id = "0";
  infoNode.parent = root;
  infoNode.children = [];
  root.children.push(infoNode);

  var allNodes = [];  // all created nodes including root
  var byId = {};
  allNodes.push(root);
  byId[root.id] = root;
  allNodes.push(infoNode);
  byId[infoNode.id] = infoNode;

  // Create Setting node
  if (json.setting && Object.keys(json.setting).length > 0) {
    var settingNode = new SimpleNode();
    settingNode.value = { nodeName: "Setting" };
    settingNode.parent = root;
    settingNode.children = [];

    for (var key in json.setting) {
      if (key === "geometry") continue;
      settingNode["@attributes"][key] = json.setting[key];
    }
    // Assign or keep id
    if (!settingNode.id) settingNode.id = "2";
    if (json.setting.id) settingNode.id = json.setting.id;
    settingNode["@attributes"]["id"] = settingNode.id;

    if (json.setting.geometry) {
      settingNode.geometry = {
        x: json.setting.geometry.x || 0,
        y: json.setting.geometry.y || 0,
        width: json.setting.geometry.width || 80,
        height: json.setting.geometry.height || 40
      };
    }

    root.children.push(settingNode);
    allNodes.push(settingNode);
    byId[settingNode.id] = settingNode;
  }

  // Create element nodes
  var idCounter = 10;
  for (var i = 0; i < json.elements.length; i++) {
    var src = json.elements[i];
    var node = new SimpleNode();
    node.value = { nodeName: src.type };
    node.children = [];
    node.parent = root;

    // Copy attributes
    for (var key in src) {
      if (key === "type" || key === "id" || key === "geometry" ||
          key === "sourceId" || key === "targetId" || key === "parentId") continue;
      node["@attributes"][key] = src[key];
    }

    // ID
    node.id = src.id || String(++idCounter);
    node["@attributes"]["id"] = node.id;

    // Geometry
    if (src.geometry) {
      node.geometry = {};
      if (src.geometry.x != null) node.geometry.x = src.geometry.x;
      if (src.geometry.y != null) node.geometry.y = src.geometry.y;
      if (src.geometry.width != null) node.geometry.width = src.geometry.width;
      if (src.geometry.height != null) node.geometry.height = src.geometry.height;
      if (src.geometry.sourcePoint) node.geometry.sourcePoint = src.geometry.sourcePoint;
      if (src.geometry.targetPoint) node.geometry.targetPoint = src.geometry.targetPoint;
      if (src.geometry.points) node.geometry.points = src.geometry.points;
    }

    // Stash source/target ID references for post-processing
    if (src.sourceId) node._mxSource = src.sourceId;
    if (src.targetId) node._mxTarget = src.targetId;

    root.children.push(node);
    allNodes.push(node);
    byId[node.id] = node;
  }

  // Second pass: wire up source/target references
  var connectorTypes = { Flow: true, Link: true, Transition: true };
  for (var i = 0; i < allNodes.length; i++) {
    var n = allNodes[i];
    if (connectorTypes[n.value.nodeName]) {
      if (n._mxSource && byId[n._mxSource]) n.source = byId[n._mxSource];
      if (n._mxTarget && byId[n._mxTarget]) n.target = byId[n._mxTarget];
    }
  }

  // Create root wrapper: add mxCell children (as expected by some exporters)
  var rootMxCell = new SimpleNode();
  rootMxCell.value = { nodeName: "mxCell" };
  rootMxCell.id = "1";
  rootMxCell.parent = root;
  rootMxCell["@attributes"] = { id: "1", parent: "0" };

  var infoMxCell = new SimpleNode();
  infoMxCell.value = { nodeName: "mxCell" };
  infoMxCell.id = "0";
  infoMxCell.parent = infoNode;
  infoMxCell["@attributes"] = { id: "0" };

  infoNode.children.push(infoMxCell);

  return createModelWrapper(root);
}

// ========================================================================
// CommonJS exports
// ========================================================================

if (typeof exports !== "undefined") {
  exports.loadInsightMaker = loadInsightMaker;
  exports.toModelJSON = toModelJSON;
  exports.loadModelJSON = loadModelJSON;
  exports.createModelWrapper = createModelWrapper;
  exports.SimpleNode = SimpleNode;
}
