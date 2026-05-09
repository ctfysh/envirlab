"use strict";

/**
 * XMILEImporter.js — XMILE XML ↔ SimpleNode tree ↔ Model wrapper.
 *
 * Public API (mirrors ModelJSON.js):
 *   loadXMILE(xmlString)     → model wrapper (same shape as loadInsightMaker)
 *   toXMILEXML(model)        → XMILE XML string
 *
 * JSON import/export reuses toModelJSON / loadModelJSON from ModelJSON.js.
 */

// Ensure SimpleNode is available (from ModelJSON.js in Node.js, global in browser)
var _MJ = null;
if (typeof require !== "undefined") {
  try { _MJ = require("./ModelJSON.js"); } catch (e) { _MJ = null; }
}
var SimpleNode = (_MJ && _MJ.SimpleNode) ? _MJ.SimpleNode :
  (typeof SimpleNode !== "undefined" ? SimpleNode : null);

function _getMJ() {
  if (!_MJ && typeof require !== "undefined") {
    try { _MJ = require("./ModelJSON.js"); } catch (e) {}
  }
  return _MJ;
}

// ========================================================================
// Equation format helpers: XMILE ↔ Insight Maker
// ========================================================================

function xStr(str) {
  if (!str) return str;
  return str.replace(/_/g, " ").replace(/\\n/g, " ");
}

/**
 * Convert a XMILE equation to Insight Maker format (wrap names in []).
 */
function xmileEqToIM(eq) {
  if (!eq) return eq;
  eq = eq.replace(/\n/g, " ");
  eq = eq.replace(/\[(.*?)\]/g, '{"$1"}');
  eq = eq.replace(
    /([a-zA-z][^ ()+*/\-,\[\]{}><=!|]+) *([+*/\-),\[\]{}><=!|&]|$)/g,
    function (match, a, b) { return "[" + xStr(a) + "]" + b; }
  );
  eq = eq.replace(/\{"\[/g, "{\"").replace(/"\]\}/g, "\"\}");
  eq = eq.replace(/[a-zA-Z]+\./g, "");
  eq = eq.replace(/^(if\s+.*\s+then)\s+(.*)\s+else\s+(.*)\s*$/ig, "$1\n  $2\nelse\n  $3\nend if");
  return eq;
}

/**
 * Convert an Insight Maker equation back to XMILE format (unwrap [] names).
 */
function imEqToXMILE(eq) {
  if (!eq) return eq;
  eq = eq.replace(/\[([^\]]+)\]/g, "$1");
  return eq;
}

// ========================================================================
// XMILE XML → SimpleNode tree
// ========================================================================

/**
 * Get DOMParser (browser native or xmldom for Node.js).
 */
function _getParser() {
  if (typeof DOMParser !== "undefined") return new DOMParser();
  if (typeof require !== "undefined") {
    try {
      var xmldom = require("@xmldom/xmldom");
      return new xmldom.DOMParser();
    } catch (e) {
      throw new Error(
        "DOMParser not available. Install @xmldom/xmldom for Node.js."
      );
    }
  }
  throw new Error("DOMParser not available.");
}

function _attr(node, name, def) {
  var v = node.getAttribute ? node.getAttribute(name) : null;
  return v != null ? v : (def !== undefined ? def : null);
}

function _arrify(item) {
  if (!item) return [];
  if (item instanceof Array) return item;
  if (typeof item.length === "number" && typeof item !== "function" && typeof item !== "string") {
    return Array.prototype.slice.call(item);
  }
  return [item];
}

function _textContent(node) {
  if (!node) return "";
  if (node.textContent) return node.textContent;
  if (node.childNodes && node.childNodes.length > 0) {
    var s = "";
    for (var i = 0; i < node.childNodes.length; i++) {
      var c = node.childNodes[i];
      if (c.nodeType === 3 || c.nodeType === 4) s += c.nodeValue;
    }
    return s.trim();
  }
  return "";
}

/**
 * Parse XMILE XML into a SimpleNode tree compatible with ModelJSON.js.
 */
function parseXMILEXML(xmlString) {
  var parser = _getParser();
  var dom = parser.parseFromString(xmlString, "text/xml");

  var xmile = dom.documentElement;
  if (xmile.nodeName !== "xmile") {
    throw new Error("Not a valid XMILE document: root is <" + xmile.nodeName + ">");
  }

  // Build the root SimpleNode tree (same shape as .evl parsing)
  var root = new SimpleNode();
  root.value = { nodeName: "root" };
  root.id = "1";
  root.children = [];

  // info node
  var info = new SimpleNode();
  info.value = { nodeName: "info" };
  info.id = "0";
  info.parent = root;
  info.children = [];
  root.children.push(info);

  // Extract sim_specs → Setting node
  var simSpecs = xmile.getElementsByTagName("sim_specs")[0];
  var setting = new SimpleNode();
  setting.value = { nodeName: "Setting" };
  setting.id = "2";
  setting.parent = root;
  setting.children = [];
  setting.setAttribute("id", "2");
  setting.setAttribute("Version", "39");
  setting.setAttribute("BackgroundColor", "white");

  if (simSpecs) {
    setting.setAttribute("TimeStart", _textContent(simSpecs.getElementsByTagName("start")[0]) || "0");
    setting.setAttribute("TimeLength",
      String((parseFloat(_textContent(simSpecs.getElementsByTagName("stop")[0]) || 100) -
              parseFloat(_textContent(simSpecs.getElementsByTagName("start")[0]) || 0))));
    setting.setAttribute("TimeStep", _textContent(simSpecs.getElementsByTagName("dt")[0]) || "1");
    setting.setAttribute("TimeUnits", _attr(simSpecs, "time_units", "Years"));
    setting.setAttribute("SolutionAlgorithm",
      _attr(simSpecs, "method", "RK1") === "euler" ? "Euler" : "RK1");
  }

  root.children.push(setting);

  // Parse model section
  var modelEl = xmile.getElementsByTagName("model")[0];
  if (!modelEl) return root;

  // Build a name → SimpleNode lookup for wiring
  var allPrims = {};
  var idCounter = 10;

  // Parse variables
  var varsEl = modelEl.getElementsByTagName("variables")[0];
  if (varsEl) {
    // Parse stocks
    var stocks = _arrify(varsEl.getElementsByTagName("stock"));
    for (var si = 0; si < stocks.length; si++) {
      var sEl = stocks[si];
      var sName = _attr(sEl, "name", "Stock_" + si);
      var sNode = new SimpleNode();
      sNode.value = { nodeName: "Stock" };
      sNode.id = String(++idCounter);
      sNode.parent = root;
      sNode.children = [];
      sNode.setAttribute("id", sNode.id);
      sNode.setAttribute("name", sName);

      var eqn = _textContent(sEl.getElementsByTagName("eqn")[0]);
      sNode.setAttribute("InitialValue", eqn ? xmileEqToIM(eqn) : "0");
      sNode.setAttribute("NonNegative", sEl.getElementsByTagName("non_negative").length > 0 ? "true" : "false");
      sNode.setAttribute("Units", _textContent(sEl.getElementsByTagName("units")[0]) || "");

      root.children.push(sNode);
      allPrims[_attr(sEl, "name")] = sNode;
    }

    // Parse flows
    var flows = _arrify(varsEl.getElementsByTagName("flow"));
    for (var fi = 0; fi < flows.length; fi++) {
      var fEl = flows[fi];
      var fName = _attr(fEl, "name", "Flow_" + fi);
      var fNode = new SimpleNode();
      fNode.value = { nodeName: "Flow" };
      fNode.id = String(++idCounter);
      fNode.parent = root;
      fNode.children = [];
      fNode.setAttribute("id", fNode.id);
      fNode.setAttribute("name", fName);

      var fEqn = _textContent(fEl.getElementsByTagName("eqn")[0]);
      fNode.setAttribute("FlowRate", fEqn ? xmileEqToIM(fEqn) : "0");
      fNode.setAttribute("NonNegative", fEl.getElementsByTagName("non_negative").length > 0 ? "true" : "false");
      fNode.setAttribute("Units", _textContent(fEl.getElementsByTagName("units")[0]) || "");

      root.children.push(fNode);
      allPrims[_attr(fEl, "name")] = fNode;
    }

    // Parse auxiliaries → Variable
    var auxes = _arrify(varsEl.getElementsByTagName("aux"));
    for (var ai = 0; ai < auxes.length; ai++) {
      var aEl = auxes[ai];
      var aName = _attr(aEl, "name", "Aux_" + ai);
      var aNode = new SimpleNode();
      aNode.value = { nodeName: "Variable" };
      aNode.id = String(++idCounter);
      aNode.parent = root;
      aNode.children = [];
      aNode.setAttribute("id", aNode.id);
      aNode.setAttribute("name", aName);

      var aEqn = _textContent(aEl.getElementsByTagName("eqn")[0]);
      aNode.setAttribute("Equation", aEqn ? xmileEqToIM(aEqn) : "0");
      aNode.setAttribute("Units", _textContent(aEl.getElementsByTagName("units")[0]) || "");

      root.children.push(aNode);
      allPrims[_attr(aEl, "name")] = aNode;
    }
  }

  // Wire flow inflow/outflow references
  if (varsEl) {
    var allStocks = root.children.filter(function (c) { return c.value.nodeName === "Stock"; });
    var allFlows = root.children.filter(function (c) { return c.value.nodeName === "Flow"; });
    var stockByName = {};
    var flowByName = {};
    allStocks.forEach(function (s) { stockByName[s.getAttribute("name")] = s; });
    allFlows.forEach(function (f) { flowByName[f.getAttribute("name")] = f; });

    // Collect inflow/outflow names from original XML
    stocks = _arrify(varsEl.getElementsByTagName("stock"));
    for (var si2 = 0; si2 < stocks.length; si2++) {
      var sEl2 = stocks[si2];
      var sName2 = _attr(sEl2, "name");
      var sNode2 = stockByName[sName2];
      if (!sNode2) continue;

      var inflows = _arrify(sEl2.getElementsByTagName("inflow"));
      var outflows = _arrify(sEl2.getElementsByTagName("outflow"));
      var inNames = [];
      var outNames = [];
      for (var ii = 0; ii < inflows.length; ii++) {
        inNames.push(_textContent(inflows[ii]) || inflows[ii].textContent || "");
      }
      for (var oi = 0; oi < outflows.length; oi++) {
        outNames.push(_textContent(outflows[oi]) || outflows[oi].textContent || "");
      }

      // Wire source/target for flows based on inflow/outflow names
      // Flow → Stock (flow's target = stock) for inflow
      // Stock → Flow (flow's source = stock) for outflow
      inNames.forEach(function (fname) {
        fname = fname.trim();
        if (!fname) return;
        var f = flowByName[fname];
        if (f) {
          f.target = sNode2;
          f.setAttribute("_targetId", sNode2.id);
        }
      });
      outNames.forEach(function (fname) {
        fname = fname.trim();
        if (!fname) return;
        var f = flowByName[fname];
        if (f) {
          f.source = sNode2;
          f.setAttribute("_sourceId", sNode2.id);
        }
      });
    }
  }

  // Parse views → geometry and connectors
  var viewsEl = modelEl.getElementsByTagName("views")[0];
  if (viewsEl) {
    var viewEl = viewsEl.getElementsByTagName("view")[0];
    if (viewEl) {
      // Collect all view elements for position
      var viewNodes = viewEl.childNodes;
      for (var vi = 0; vi < viewNodes.length; vi++) {
        var vn = viewNodes[vi];
        if (vn.nodeType !== 1) continue;
        var tag = vn.nodeName;
        var name = _attr(vn, "name");
        if (!name) continue;

        // Find matching primitive by name
        var cleanName = name.replace(/\n/g, " ");
        var prim = allPrims[name] || allPrims[cleanName];
        if (!prim) continue;

        var x = parseFloat(_attr(vn, "x", "0"));
        var y = parseFloat(_attr(vn, "y", "0"));
        var w = parseFloat(_attr(vn, "width", "40"));
        var h = parseFloat(_attr(vn, "height", "40"));

        prim.geometry = { x: x, y: y, width: w, height: h };

        // For flows, extract pts as sourcePoint/targetPoint
        if (tag === "flow") {
          var ptsEl = vn.getElementsByTagName("pts")[0];
          if (ptsEl) {
            var ptList = _arrify(ptsEl.getElementsByTagName("pt"));
            if (ptList.length >= 2) {
              var srcPt = ptList[0];
              var tgtPt = ptList[ptList.length - 1];
              prim.geometry.sourcePoint = {
                x: parseFloat(_attr(srcPt, "x", "0")),
                y: parseFloat(_attr(srcPt, "y", "0"))
              };
              prim.geometry.targetPoint = {
                x: parseFloat(_attr(tgtPt, "x", "0")),
                y: parseFloat(_attr(tgtPt, "y", "0"))
              };
            }
          }
        }
      }

      // Parse connectors → Link nodes
      var connectors = _arrify(viewEl.getElementsByTagName("connector"));
      for (var ci2 = 0; ci2 < connectors.length; ci2++) {
        var cEl = connectors[ci2];
        var fromName = _textContent(cEl.getElementsByTagName("from")[0]) || "";
        var toName = _textContent(cEl.getElementsByTagName("to")[0]) || "";
        fromName = fromName.trim();
        toName = toName.trim();
        if (!fromName || !toName) continue;

        var fromPrim = allPrims[fromName];
        var toPrim = allPrims[toName];
        if (!fromPrim || !toPrim) continue;

        var linkNode = new SimpleNode();
        linkNode.value = { nodeName: "Link" };
        linkNode.id = String(++idCounter);
        linkNode.parent = root;
        linkNode.children = [];
        linkNode.setAttribute("id", linkNode.id);
        linkNode.setAttribute("name", "");

        var cx = parseFloat(_attr(cEl, "x", "0"));
        var cy = parseFloat(_attr(cEl, "y", "0"));
        linkNode.geometry = {
          x: cx, y: cy, width: 100, height: 100,
          sourcePoint: { x: cx - 30, y: cy },
          targetPoint: { x: cx + 30, y: cy }
        };

        linkNode.source = fromPrim;
        linkNode.target = toPrim;
        linkNode._mxSource = fromPrim.id;
        linkNode._mxTarget = toPrim.id;

        root.children.push(linkNode);
      }
    }
  }

  return root;
}

// ========================================================================
// SimpleNode tree → XMILE XML
// ========================================================================

function _xmlAttr(s) {
  if (s == null) return "";
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;")
    .replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function _attrPair(key, value) {
  if (value == null) return "";
  return " " + key + '="' + _xmlAttr(String(value)) + '"';
}

function _flattenAttr(val) {
  if (typeof val === "boolean") return val ? "true" : "false";
  return String(val);
}

/**
 * Serialize a model's SimpleNode tree to XMILE XML.
 */
function toXMILEXML(model) {
  if (!model || !model._graph) {
    throw new Error("Invalid model: must have a _graph property");
  }

  var graph = model._graph;
  var prims = graph.children ? graph.children.filter(function (c) {
    return c && c.value && c.value.nodeName !== "info" && c.value.nodeName !== "mxCell";
  }) : [];

  // Separate Setting from other primitives
  var settingNode = null;
  var stocks = [];
  var flows = [];
  var auxes = [];
  var links = [];
  var others = [];

  prims.forEach(function (p) {
    switch (p.value.nodeName) {
      case "Setting": settingNode = p; break;
      case "Stock": stocks.push(p); break;
      case "Flow": flows.push(p); break;
      case "Variable": auxes.push(p); break;
      case "Link": links.push(p); break;
      default: others.push(p);
    }
  });

  var lines = [];
  var indent = "  ";

  // Declaration
  lines.push('<?xml version="1.0" encoding="utf-8" ?>');
  lines.push('<xmile version="1.0" xmlns="http://docs.oasis-open.org/xmile/ns/XMILE/v1.0">');
  lines.push("");

  // Header
  lines.push(indent + "<header>");
  lines.push(indent + indent + "<name>" + _xmlAttr("Imported Model") + "</name>");
  lines.push(indent + indent + "<options/>");
  lines.push(indent + "</header>");
  lines.push("");

  // sim_specs
  var start = 0, stop = 100, dt = 1, timeUnits = "Years", method = "euler";
  if (settingNode) {
    start = parseFloat(settingNode.getAttribute("TimeStart")) || 0;
    var length = parseFloat(settingNode.getAttribute("TimeLength")) || 100;
    stop = start + length;
    dt = parseFloat(settingNode.getAttribute("TimeStep")) || 1;
    timeUnits = settingNode.getAttribute("TimeUnits") || "Years";
    var algo = settingNode.getAttribute("SolutionAlgorithm") || "";
    method = (algo === "Euler" || algo === "euler") ? "euler" : "RK1";
  }
  lines.push(indent + '<sim_specs method="' + _xmlAttr(method) + '" time_units="' + _xmlAttr(timeUnits) + '">');
  lines.push(indent + indent + "<start>" + start + "</start>");
  lines.push(indent + indent + "<stop>" + stop + "</stop>");
  lines.push(indent + indent + "<dt>" + dt + "</dt>");
  lines.push(indent + "</sim_specs>");
  lines.push("");

  // Model
  lines.push(indent + "<model>");
  lines.push("");

  // Variables
  lines.push(indent + indent + "<variables>");

  // Stocks
  stocks.forEach(function (s) {
    var name = s.getAttribute("name") || "Stock";
    lines.push(indent + indent + indent + '<stock name="' + _xmlAttr(name) + '">');
    var iv = imEqToXMILE(s.getAttribute("InitialValue"));
    lines.push(indent + indent + indent + indent + "<eqn>" + _xmlAttr(iv || "0") + "</eqn>");
    if (s.getAttribute("NonNegative") === "true") {
      lines.push(indent + indent + indent + indent + "<non_negative/>");
    }
    var units = s.getAttribute("Units");
    if (units) lines.push(indent + indent + indent + indent + "<units>" + _xmlAttr(units) + "</units>");
    lines.push(indent + indent + indent + "</stock>");
  });

  // Flows
  flows.forEach(function (f) {
    var name = f.getAttribute("name") || "Flow";
    lines.push(indent + indent + indent + '<flow name="' + _xmlAttr(name) + '">');
    var fr = imEqToXMILE(f.getAttribute("FlowRate"));
    lines.push(indent + indent + indent + indent + "<eqn>" + _xmlAttr(fr || "0") + "</eqn>");
    var units = f.getAttribute("Units");
    if (units) lines.push(indent + indent + indent + indent + "<units>" + _xmlAttr(units) + "</units>");
    lines.push(indent + indent + indent + "</flow>");
  });

  // Auxiliaries
  auxes.forEach(function (a) {
    var name = a.getAttribute("name") || "Aux";
    lines.push(indent + indent + indent + '<aux name="' + _xmlAttr(name) + '">');
    var eq = imEqToXMILE(a.getAttribute("Equation"));
    lines.push(indent + indent + indent + indent + "<eqn>" + _xmlAttr(eq || "0") + "</eqn>");
    var units = a.getAttribute("Units");
    if (units) lines.push(indent + indent + indent + indent + "<units>" + _xmlAttr(units) + "</units>");
    lines.push(indent + indent + indent + "</aux>");
  });

  lines.push(indent + indent + "</variables>");
  lines.push("");

  // Views
  var hasLayout = stocks.concat(flows).concat(auxes).some(function (p) { return p.geometry; });
  if (hasLayout || links.length > 0) {
    // Compute view dimensions
    var maxX = 800, maxY = 600;
    stocks.concat(flows).concat(auxes).concat(links).forEach(function (p) {
      if (p.geometry) {
        maxX = Math.max(maxX, (p.geometry.x || 0) + (p.geometry.width || 40) + 50);
        maxY = Math.max(maxY, (p.geometry.y || 0) + (p.geometry.height || 40) + 50);
      }
    });

    lines.push(indent + indent + '<views>');
    lines.push(indent + indent + indent + '<view width="' + maxX + '" height="' + maxY + '">');

    // Stock positions
    stocks.forEach(function (s) {
      if (!s.geometry) return;
      var name = s.getAttribute("name") || "Stock";
      lines.push(indent + indent + indent + indent +
        '<stock name="' + _xmlAttr(name) + '" x="' + (s.geometry.x || 0) +
        '" y="' + (s.geometry.y || 0) +
        '" width="' + (s.geometry.width || 45) +
        '" height="' + (s.geometry.height || 35) + '"/>');
    });

    // Flow positions with pts
    flows.forEach(function (f) {
      if (!f.geometry) return;
      var name = f.getAttribute("name") || "Flow";
      var line = indent + indent + indent + indent +
        '<flow name="' + _xmlAttr(name) + '" x="' + (f.geometry.x || 0) +
        '" y="' + (f.geometry.y || 0) +
        '" width="' + (f.geometry.width || 18) +
        '" height="' + (f.geometry.height || 18) + '">';
      if (f.geometry.sourcePoint || f.geometry.targetPoint) {
        var sx = (f.geometry.sourcePoint && f.geometry.sourcePoint.x != null) ? f.geometry.sourcePoint.x : (f.geometry.x || 0) - 50;
        var sy = (f.geometry.sourcePoint && f.geometry.sourcePoint.y != null) ? f.geometry.sourcePoint.y : (f.geometry.y || 0);
        var tx = (f.geometry.targetPoint && f.geometry.targetPoint.x != null) ? f.geometry.targetPoint.x : (f.geometry.x || 0) + 50;
        var ty = (f.geometry.targetPoint && f.geometry.targetPoint.y != null) ? f.geometry.targetPoint.y : (f.geometry.y || 0);
        line += "\n" + indent + indent + indent + indent + indent + "<pts>";
        line += "\n" + indent + indent + indent + indent + indent + indent +
          '<pt x="' + sx + '" y="' + sy + '"/>';
        line += "\n" + indent + indent + indent + indent + indent + indent +
          '<pt x="' + tx + '" y="' + ty + '"/>';
        line += "\n" + indent + indent + indent + indent + indent + "</pts>";
      }
      line += "\n" + indent + indent + indent + indent + "</flow>";
      lines.push(line);
    });

    // Aux positions
    auxes.forEach(function (a) {
      if (!a.geometry) return;
      var name = a.getAttribute("name") || "Aux";
      lines.push(indent + indent + indent + indent +
        '<aux name="' + _xmlAttr(name) + '" x="' + (a.geometry.x || 0) +
        '" y="' + (a.geometry.y || 0) +
        '" width="' + (a.geometry.width || 18) +
        '" height="' + (a.geometry.height || 18) + '"/>');
    });

    // Connectors (from Link nodes)
    links.forEach(function (l, idx) {
      var srcName = l.source ? l.source.getAttribute("name") : null;
      var tgtName = l.target ? l.target.getAttribute("name") : null;
      if (!srcName || !tgtName) return;
      var cx = (l.geometry && l.geometry.x) || 0;
      var cy = (l.geometry && l.geometry.y) || 0;
      lines.push(indent + indent + indent + indent +
        '<connector x="' + cx + '" y="' + cy + '" uid="' + idx + '">');
      lines.push(indent + indent + indent + indent + indent +
        '<from>' + _xmlAttr(srcName) + '</from>');
      lines.push(indent + indent + indent + indent + indent +
        '<to>' + _xmlAttr(tgtName) + '</to>');
      lines.push(indent + indent + indent + indent + '</connector>');
    });

    lines.push(indent + indent + indent + '</view>');
    lines.push(indent + indent + '</views>');
  }

  lines.push(indent + "</model>");
  lines.push("</xmile>");

  return lines.join("\n");
}

// ========================================================================
// Public API
// ========================================================================

function loadXMILE(xmlString) {
  var graph = parseXMILEXML(xmlString);
  // Use createModelWrapper from ModelJSON if available
  var mj = _getMJ();
  if (mj && mj.createModelWrapper) {
    return mj.createModelWrapper(graph);
  }
  // Fallback: inline wrapper
  return _createFallbackWrapper(graph);
}

function _createFallbackWrapper(graph) {
  var allPrimitives = _collectPrimitives(graph);
  return {
    _graph: graph,
    find: function () { return allPrimitives.slice(); },
    get: function (predicate) { return allPrimitives.filter(predicate); },
    simulate: function () {
      var result = { Time: [], data: [], error: "none", errorPrimitive: null };
      result.value = function () { return []; };
      result.lastValue = function () { return undefined; };
      return result;
    },
    toString: function () { return "[XMILE Model]"; }
  };
}

function _collectPrimitives(root) {
  var result = [];
  function walk(node) {
    if (!node || !node.value) return;
    var nn = node.value.nodeName;
    if (nn && nn !== "mxCell" && nn !== "root" && nn !== "info") {
      result.push(node);
    }
    if (node.children) {
      for (var i = 0; i < node.children.length; i++) walk(node.children[i]);
    }
  }
  if (root && root.children) {
    for (var i = 0; i < root.children.length; i++) walk(root.children[i]);
  }
  return result;
}

// ========================================================================
// CommonJS exports
// ========================================================================

if (typeof exports !== "undefined") {
  exports.loadXMILE = loadXMILE;
  exports.toXMILEXML = toXMILEXML;
  exports.parseXMILEXML = parseXMILEXML;
}
if (typeof window !== "undefined") {
  window.loadXMILE = loadXMILE;
  window.toXMILEXML = toXMILEXML;
}
