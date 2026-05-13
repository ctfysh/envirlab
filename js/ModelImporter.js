"use strict";
/*

Copyright 2010-2015 Scott Fortmann-Roe. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License.

*/



function showInsertModelWindow(pt) {
	Ext.Msg.prompt(getText('插入模型'), getText('输入要插入的模型文件的 URL（或本地文件路径）。此模型将作为组件插入到当前模型中。'), function(btn, url) {
		if (btn == 'ok') {
			var progress = Ext.MessageBox.wait(getText("插入模型..."), undefined, {
				icon: 'run-icon',
				width: 300,
				closable: false,
				modal: true,
				progress: true,
				progressText: ' '
			});
			$.ajax({
				url: url,
				dataType: "html",
				success: function(txt) {
					var matches = txt.match(/var graph_source_data = (".*?");\n/);

					if ((!matches) || matches[1].trim() == "") {
						mxUtils.alert("Model could not be inserted. Please ensure the model URL is correct.");
						progress.close();
					} else {
						var data = JSON.parse(matches[1]);

						var title = JSON.parse(txt.match(/var graph_title = (".*?");\n/)[1]);
						var description = JSON.parse(txt.match(/var graph_description = (".*?");\n/)[1]);

						var doc = mxUtils.parseXml(data);
						var dec = new mxCodec(doc);

						var model = dec.decode(doc.documentElement);

						var cells = model.cells;
						

						graph.getModel().beginUpdate();

						var folder = createPrimitive(title, "Folder", [pt.x, pt.y], [100, 100]);

						cells = cells[1].children;

						cells = excludeType(cells, "Setting");
						cells = excludeType(cells, "Display");

						var getEdgeValidationError = graph.getEdgeValidationError;
						graph.getEdgeValidationError = function(){
							return mxGraph.prototype.getEdgeValidationError.apply(this, arguments);
						};
						graph.importCells(cells, 0, 0, folder);
						graph.getEdgeValidationError = getEdgeValidationError;


						
						setImage(folder, "Plugin");
						setNote(folder, description);

						var geo = folder.geometry;
						geo.alternateBounds = new mxRectangle(0, 0, 128, 128);
						graph.getModel().setGeometry(folder, geo);

						collapseFolder(folder);
						folder.setAttribute("LabelPosition", "Bottom");
						setLabelPosition(folder);

						//Converter and agent population rewire

						graph.getModel().endUpdate();


						clearPrimitiveCache();
						setAllConnectable();
					}
				},
				error: function() {
					mxUtils.alert("Model could not be inserted. Please ensure the morel URL is correct.");
					progress.close();
				}
			})
		}
	})
}

// ========================================================================
// JSON Model import/export
// ========================================================================

function modelJSONToInsightMakerXML(json) {
	if (json.format !== "InsightMaker-ModelJSON") {
		throw new Error("Unsupported format: " + json.format);
	}

	function esc(str) {
		if (str == null) return '';
		return String(str)
			.replace(/&/g, '&amp;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&apos;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
	}

	var mxCellAttrMap = { parent: true, style: true, vertex: true, edge: true,
		source: true, target: true, visible: true };
	function isMxCellAttr(k) { return mxCellAttrMap.hasOwnProperty(k); }

	var skipKeyMap = { type: true, id: true, geometry: true, sourceId: true,
		targetId: true, parentId: true, _xmlId: true };
	function isSkipped(k) { return skipKeyMap.hasOwnProperty(k) || k.charAt(0) === '_'; }

	var connectorTypes = { Flow: true, Link: true, Transition: true };

	var lines = [];
	lines.push('<InsightMakerModel>');
	lines.push('  <root>');
	lines.push('    <mxCell id="0"/>');
	lines.push('    <mxCell id="1" parent="0"/>');

	var idCounter = 100;
	function nextId() { return String(++idCounter); }

	function primAttrs(el) {
		var s = '';
		for (var key in el) {
			if (isSkipped(key) || isMxCellAttr(key)) continue;
			s += ' ' + key + '="' + esc(el[key]) + '"';
		}
		return s;
	}

	function emitVertex(el, isSetting) {
		var id = el.id || nextId();
		var type = isSetting ? 'Setting' : (el.type || 'Unknown');
		var style = el.style || type.toLowerCase();
		var parent = el.parent || el.parentId || '1';
		var visible = (isSetting || el.visible === '0' || el.visible === 0) ? ' visible="0"' : '';
		var g = el.geometry || {};
		var gx = g.x || 0, gy = g.y || 0, gw = g.width || 100, gh = g.height || 40;

		lines.push('    <' + type + primAttrs(el) + ' id="' + id + '">');
		lines.push('      <mxCell parent="' + parent + '" vertex="1" style="' + esc(style) + '"' + visible + '>');
		lines.push('        <mxGeometry x="' + gx + '" y="' + gy + '" width="' + gw + '" height="' + gh + '" as="geometry"/>');
		lines.push('      </mxCell>');
		lines.push('    </' + type + '>');
	}

	function emitConnector(el) {
		var id = el.id || nextId();
		var type = el.type;
		var style = el.style || type.toLowerCase();
		var src = el.sourceId || '';
		var tgt = el.targetId || '';
		var g = el.geometry || {};

		lines.push('    <' + type + primAttrs(el) + ' id="' + id + '">');
		var cellParent = el.parent || '1';
		var cellLine = '      <mxCell parent="' + cellParent + '" edge="1" style="' + esc(style) + '"';
		if (src) cellLine += ' source="' + src + '"';
		if (tgt) cellLine += ' target="' + tgt + '"';
		cellLine += '>';
		lines.push(cellLine);

		var hasPoints = g.points && g.points.length > 0;
		if (g.sourcePoint || g.targetPoint || hasPoints) {
			lines.push('        <mxGeometry as="geometry">');
			if (g.sourcePoint) {
				lines.push('          <mxPoint x="' + (g.sourcePoint.x || 0) + '" y="' +
					(g.sourcePoint.y || 0) + '" as="sourcePoint"/>');
			}
			if (g.targetPoint) {
				lines.push('          <mxPoint x="' + (g.targetPoint.x || 0) + '" y="' +
					(g.targetPoint.y || 0) + '" as="targetPoint"/>');
			}
			if (hasPoints) {
				lines.push('          <Array as="points">');
				for (var pi = 0; pi < g.points.length; pi++) {
					lines.push('            <mxPoint x="' + (g.points[pi].x || 0) + '" y="' +
						(g.points[pi].y || 0) + '"/>');
				}
				lines.push('          </Array>');
			}
			lines.push('        </mxGeometry>');
		} else if (g.x != null || g.y != null) {
			lines.push('        <mxGeometry x="' + (g.x || 0) + '" y="' + (g.y || 0) +
				'" width="100" height="100" as="geometry"/>');
		} else {
			lines.push('        <mxGeometry as="geometry"/>');
		}

		lines.push('      </mxCell>');
		lines.push('    </' + type + '>');
	}

	if (json.setting && Object.keys(json.setting).length > 0) {
		emitVertex(json.setting, true);
	}

	for (var i = 0; i < json.elements.length; i++) {
		var el = json.elements[i];
		if (!connectorTypes[el.type]) {
			emitVertex(el, false);
		}
	}

	for (var i = 0; i < json.elements.length; i++) {
		var el = json.elements[i];
		if (connectorTypes[el.type]) {
			emitConnector(el);
		}
	}

	lines.push('  </root>');
	lines.push('</InsightMakerModel>');

	return lines.join('\n');
}



function importMXGraph(txt) {
	graph_source_data = txt.replace(/InsightMakerModel/g, "mxGraphModel");
	var doc = mxUtils.parseXml(graph_source_data);
	var dec = new mxCodec(doc);
	dec.decode(doc.documentElement, graph.getModel());
	clearPrimitiveCache();
	setAllConnectable();
}

function importSimgua(txt) {

	clearModel();

	graph.getModel().beginUpdate();

	var tempStock = createPrimitive("temp stock xyzz", "Stock", [200, 200], [100, 100])

	//console.log("0");
	var rows = txt.split("\n");

	//console.log(rows);

	for (var i = 0; i < rows.length; i++) {
		var items = rows[i].split(" --- ");
		var type = items[0];
		if (type == "STOCK") {
			var s = createPrimitive(items[1], "Stock", [500 * Math.random(), 500 * Math.random()], [100, 40]);
			setValue(s, items[3]);
			setNonNegative(s, items[2] == "true");
		} else if (type == "VARIABLE") {
			var s = createPrimitive(items[1], "Variable", [500 * Math.random(), 500 * Math.random()], [120, 50]);
			setValue(s, items[2]);
		} else if (type == "CONVERTER") {
			var s = createPrimitive(items[1], "Converter", [500 * Math.random(), 500 * Math.random()], [120, 50]);
			setData(s, items[4]);
			setInterpolation(s, items[2] == 1 ? "Linear" : "Discrete");
		} else if (type == "SETTING") {
			setTimeStart(items[1]);
			setTimeLength(items[2]);
			setTimeStep(items[3]);
		}
	}

	//console.log("A");

	for (var i = 0; i < rows.length; i++) {
		var items = rows[i].split(" --- ");
		var type = items[0];
		if (type == "FLOW") {
			var s = createConnector(items[1], "Flow", simguaPrim(findName(items[2])), simguaPrim(findName(items[3])));
			setValue(s, items[5]);
			setNonNegative(s, items[4] == "true");
		}
	}

	//console.log("B");

	for (var i = 0; i < rows.length; i++) {
		var items = rows[i].split(" --- ");

		var type = items[0];
		if (type == "LINK") {
			var s = createConnector(items[1], "Link", findName(items[2]), findName(items[3]));
		} else if (type == "CONVERTER") {
			setConverterInput(findName(items[1]), findName(items[3]));
		}
	}

	//console.log("C");



	layoutModel("organic");


	graph.getModel().endUpdate();

	function simguaPrim(item) {
		if (item == null) {
			return tempStock;
		} else {
			return item;
		}
	}

}

function cleanMXGraphSnippet(xml) {
	var padding = "" + Math.floor(Math.random() * 10000);

	xml = xml.replace(/parent=\"1\"/g, "XXXROOT PARENTXXX");


	xml = xml.replace(/id=\"(\d+)\"/g, "id=\"" + padding + "$1\"");
	xml = xml.replace(/source=\"(\d+)\"/g, "source=\"" + padding + "$1\"");
	xml = xml.replace(/Source=\"(\d+)\"/g, "Source=\"" + padding + "$1\"");
	xml = xml.replace(/target=\"(\d+)\"/g, "target=\"" + padding + "$1\"");
	xml = xml.replace(/parent=\"(\d+)\"/g, "parent=\"" + padding + "$1\"");
	xml = xml.replace(/Agent=\"(\d+)\"/g, "Agent=\"" + padding + "$1\"");
	xml = xml.replace(/Primitives=\"([\d\,]+)\"/g, "Primitives=\"" + padding + "$1\""); //will be an issue when there are multiple primtives
	xml = xml.replace(/Primitives2=\"([\d\,]+)\"/g, "Primitives2=\"" + padding + "$1\""); //will be an issue when there are multiple primitives

	xml = xml.replace(/XXXROOT PARENTXXX/g, "parent=\"1\"");

	return xml;
}

function cleanMXGraph() {
	var xml = prompt("Enter mxGraphXML:");
	console.log(cleanMXGraphSnippet(xml));
}

function importInsightMaker() {
	openFile({
		read: "text",
		multiple: false,
		onCompleted: function(result) {
			importMXGraph(result.contents);
		}
	});
}

function importXMILEFromContent(contents, fileName) {
	function xStr(str) {
		if (!str) {
			return str;
		}
		return str.replace(/_/g, " ").replace(/\\n/g, " ");
	}

	function makeEq(a) {
		if (!a.array) {
			return xEq(a.eqn);
		} else {
			var res = "{\n";
			res += a.array.map(function(item) {
				return "\t\"" + xStr(item._subscript) + "\": " + xEq(item.eqn);
			}).join(",\n");
			res += "\n}";
			return res;
		}
	}

	function xEq(eq) {
		if (!eq) {
			return eq;
		}
		eq = eq.replace(/\n/g, " ");
		eq = eq.replace(/\[(.*?)\]/g, '{"$1"}');
		eq = eq.replace(/([a-zA-z][^ ()+*/\-,\[\]{}><=!|]+) *([+*/\-),\[\]{}><=!|&]|$)/g,
			function(match, a, b) {
				return "[" + xStr(a) + "]" + b;
			});
		eq = eq.replace(/\{"\[/g, "{\"").replace(/"\]\}/g, "\"\}");
		eq = eq.replace(/[a-zA-Z]+\./g, "");
		eq = eq.replace(/^(if\s+.*\s+then)\s+(.*)\s+else\s+(.*)\s*$/ig, "$1\n  $2\nelse\n  $3\nend if");
		return eq;
	}

	function arrify(item) {
		if (!item) {
			return [];
		}
		if (item.forEach) {
			return item;
		} else {
			return [item];
		}
	}

	try {
		var x2js = new X2JS();
		var json = x2js.xml_str2json(contents);
		if (!json.xmile) {
			showNotification("'" + fileName + "' 不是有效的 XMILE 模型文件。", "error");
			return;
		}

		var xmile = json.xmile;

		if(isLocal()){
			console.log("Import Object:");
			console.log(xmile);
		}

		setTimeStart(xmile.sim_specs.start);
		setTimeStep(xmile.sim_specs.dt);
		setTimeLength(parseFloat(xmile.sim_specs.stop) - parseFloat(xmile.sim_specs.start));

		var macros = "int(x) <- floor(x)";
		var dimensions = {};
		var scale = 1.1;

		var primitives = {};
		var alphas = {};
		var omegas = {};

		function getPrimitive(item, del) {
			if (item.alias) {
				item = item.alias._uid;
			}
			var obj = primitives[xStr(item)];
			if (del) {
				delete primitives[xStr(item)];
			}
			return obj;
		}

		function findAlpha(name) {
			if (alphas[name]) {
				return alphas[name];
			}
			return null;
		}

		function findOmega(name) {
			if (omegas[name]) {
				return omegas[name];
			}
			return null;
		}

		if (xmile.dimensions && xmile.dimensions.dim) {
			var addDim = function(d) {
				dimensions[d._name] = d;
			}
			arrify(xmile.dimensions.dim).forEach(addDim);
		}

		xmile.model.aux = arrify(xmile.model.aux);
		xmile.model.flow = arrify(xmile.model.flow);
		xmile.model.stock = arrify(xmile.model.stock);

		arrify(xmile.model.array).forEach(function(a) {
			if (a.stock) {
				xmile.model.stock.push(a);
				a.array = a.stock;
			}
			if (a.aux) {
				xmile.model.aux.push(a);
				a.array = a.aux;
			}
			if (a.flow) {
				xmile.model.flow.push(a);
				a.array = a.flow;
			}
		});

		arrify(xmile.model.aux).forEach(function(a) {
			var variable = createPrimitive(xStr(a._name), "Variable", [a.display._x * scale, a.display._y * scale], [100, 50]);
			primitives[xStr(a._name)] = variable;
			setValue(variable, makeEq(a));
			if (a.doc) {
				setNote(variable, a.doc);
			}
		});

		arrify(xmile.model.stock).forEach(function(a) {
			var stock = createPrimitive(xStr(a._name), "Stock", [a.display._x * scale, a.display._y * scale], [100, 40]);
			setValue(stock, makeEq(a));
			setNonNegative(stock, !!a.non_negative);
			primitives[xStr(a._name)] = stock;
			if (a.doc) {
				setNote(stock, a.doc);
			}
			if (a.inflow) {
				arrify(a.inflow).forEach(function(x) {
					omegas[x] = stock;
				});
			}
			if (a.outflow) {
				arrify(a.outflow).forEach(function(x) {
					alphas[x] = stock;
				});
			}
		});

		arrify(xmile.model.flow).forEach(function(a) {
			var flow = createConnector(xStr(a._name), "Flow", findAlpha(a._name), findOmega(a._name));
			primitives[xStr(a._name)] = flow;
			if (a.doc) {
				setNote(flow, a.doc);
			}
			setNonNegative(flow, !!a.non_negative);
			setValue(flow, makeEq(a));
		});

		if (xmile.model.display) {
			arrify(xmile.model.display.text_box).forEach(function(a) {
				if(a.__text){
					var text = createPrimitive(a.__text, "Text", [a._x * scale, a._y * scale], [a._width * scale, a._height * scale]);
					graph.toggleCellStyleFlags(mxConstants.STYLE_FONTSTYLE, mxConstants.FONT_UNDERLINE, [text]);
					if(a["_font-size"]){
						graph.setCellStyles(mxConstants.STYLE_FONTSIZE, a["_font-size"], [text]);
					}
					if(a["_font-family"]){
						graph.setCellStyles(mxConstants.STYLE_FONTFAMILY, a["_font-family"], [text]);
					}
					primitives[a._uid] = text;
				}
			});

			arrify(xmile.model.display.alias).forEach(function(a) {
				var orig = primitives[xStr(a.of)];
				if (orig.value.nodeName == "Flow") {
					primitives[a._uid] = orig;
					return;
				}
				var item = makeGhost(orig);
				setPosition(item, [a._x * scale, a._y * scale]);
				primitives[a._uid] = item;
			});

			arrify(xmile.model.display.connector).forEach(function(a) {
				createConnector("Link", "Link", getPrimitive(a.from), getPrimitive(a.to));
			});
		}

		if(xmile.model["interface"]){
			var findItems = function(a){
				a.sort(function(v1, v2){
					return v1._index - v2._index;
				});
				a = a.filter(function(item){
					return (!item._type) || (item._type=="variable");
				});
				var prims = a.map(function(item){
					var prim = getPrimitive(item.entity._name);
					if(prim.indexOf){
						return prim[0];
					}else{
						return prim;
					}
				});
				return prims.join(",");
			};

			arrify(xmile.model["interface"].stacked_container).forEach(function(a){
				arrify(a.table).forEach(function(table){
					var d = graph.insertVertex(graph.getDefaultParent(), null, primitiveBank.display.cloneNode(true), 10, 10, 64, 64, "display");
					d.visible = false;
					graph.getModel().execute(new mxCellAttributeChange(d, "name", table._title || "Table"));
					graph.getModel().execute(new mxCellAttributeChange(d, "AutoAddPrimitives", "false"));
					graph.getModel().execute(new mxCellAttributeChange(d, "Type", "Tabular"));
					graph.getModel().execute(new mxCellAttributeChange(d, "Primitives", findItems(arrify(table.item))));
				});

				arrify(a.graph).forEach(function(chart){
					if(chart._type == "time_series" || chart._type == "scatterplot"){
						var d = graph.insertVertex(graph.getDefaultParent(), null, primitiveBank.display.cloneNode(true), 10, 10, 64, 64, "display");
						d.visible = false;
						graph.getModel().execute(new mxCellAttributeChange(d, "name", chart._title || "Chart"));
						graph.getModel().execute(new mxCellAttributeChange(d, "AutoAddPrimitives", "false"));
						if(chart._type == "time_series"){
							graph.getModel().execute(new mxCellAttributeChange(d, "Type", "Time Series"));
							graph.getModel().execute(new mxCellAttributeChange(d, "xAxis", "Time (%u)"));
						}
						if(chart._type == "scatterplot"){
							graph.getModel().execute(new mxCellAttributeChange(d, "Type", "Scatterplot"));
							graph.getModel().execute(new mxCellAttributeChange(d, "xAxis", "%o"));
						}
						graph.getModel().execute(new mxCellAttributeChange(d, "yAxis", "%o"));
						graph.getModel().execute(new mxCellAttributeChange(d, "Primitives", findItems(arrify(chart.plot))));
					}
				});
			});
		}

		if (xmile.model.group) {
			arrify(xmile.model.group).forEach(function(a) {
				var toAdd = arrify(a.entity).map(function(entity) {
					return getPrimitive(entity._name, true);
				}).concat(
					arrify(a.display.item).map(function(item) {
						var obj = primitives[item._uid];
						delete primitives[item._uid];
						return obj;
					})
				).filter(function(x) {
					return x
				});

				var group = graph.groupCells(null, 30, toAdd);
				setName(group, xStr(a._name));
				group.setConnectable(true);
				graph.orderCells(true);
				primitives[a._name] = group;
			});
		}

		var group = graph.groupCells(null, 50, Object.keys(primitives).map(function(k) {
			return primitives[k]
		}));
		setName(group, xStr(xmile.header.name));
		group.setConnectable(true);
		graph.orderCells(true);

		for (var dimName in dimensions) {
			var dimension = dimensions[dimName];
			macros += "\n\n " + dimension._name + " <- ";
			if (dimension._size) {
				macros += "1:" + dimension._size;
			} else {
				macros += "{" + dimension.elem.map(function(e) {
					return '\"' + xStr(e._name) + '\"'
				}).join(", ") + "}";
			}
		}

		setMacros((getMacros() || "") + "\n\n" + macros);

		showNotification("XMILE 模型导入成功。部分方程可能需要手动调整。", "notice");
	} catch(err) {
		showNotification("XMILE 模型 \"" + fileName + "\" 导入失败。请确保文件有效。");
		if(isLocal()){
			console.log(err);
			throw(err);
		}
	}

	clearPrimitiveCache();
	setAllConnectable();
}

function importXMILE() {
	openFile({
		read: "text",
		multiple: true,
		onCompleted: function(result) {
			
			 var importProgress = Ext.MessageBox.show({msg:getText("正在导入 XMILE 模型...<br/><br/>这可能需要几分钟。"),icon:'run-icon',width:300, closable:false, modal:true});

			setTimeout(function(){
				try {
					for (var i = 0; i < result.length; i++) {
						importXMILEFromContent(result[i].contents, result[i].name);
					}
					showNotification("XMILE import completed successfully. Some equations may require manual adjustment in order to work with Insight Maker.", "notice");
				} catch(err) {
					showNotification("XMILE model could not be imported. Please ensure you have selected valid XMILE files.");
					if(isLocal()){ console.log(err); throw(err); }
				} finally {
					importProgress.close();
				}
			}, 15);

		}
	});

	clearPrimitiveCache();
	setAllConnectable();
}

function importModelJSON() {
	openFile({
		read: "text",
		multiple: false,
		onCompleted: function(result) {
			try {
				var json = JSON.parse(result.contents);
				var xml = modelJSONToInsightMakerXML(json);
				importMXGraph(xml);
				if (typeof showNotification === 'function') {
					showNotification("JSON 模型导入成功。", "notice");
				}
			} catch(e) {
				var msg = "无法导入 JSON 模型文件。请确保选择了有效的 ModelJSON 文件。";
				if (typeof showNotification === 'function') {
					showNotification(msg, "error");
				} else {
					alert(msg);
				}
				if (typeof console !== 'undefined') console.log(e);
			}
		}
	});
}

function exportModelJSON() {
	try {
		var enc = new mxCodec(mxUtils.createXmlDocument());
		var modelNode = enc.encode(graph.getModel());

		// Find <root> element in the encoded mxGraphModel
		var root = null;
		for (var ci = 0; ci < modelNode.childNodes.length; ci++) {
			var child = modelNode.childNodes[ci];
			if (child.nodeType === 1 && child.tagName === 'root') {
				root = child;
				break;
			}
		}
		if (!root && modelNode.firstElementChild) {
			root = modelNode.firstElementChild;
		}

		var elements = [];
		var setting = null;

		// mxCell-level attr names to skip when reading from both mxCell and type element
		var mxCellAttrs = { parent: true, style: true, vertex: true, edge: true,
			source: true, target: true, visible: true, value: true };

		if (root) {
			for (var i = 0; i < root.childNodes.length; i++) {
				var cellEl = root.childNodes[i];
				if (cellEl.nodeType !== 1) continue;

				// mxCodec encodes cells with DOM value as wrapper elements:
				//   <Stock id="2"><mxCell id="2" vertex="1" style="stock"><mxGeometry.../></mxCell></Stock>
				// Cells with null/empty value are encoded as bare <mxCell>:
				//   <mxCell id="2" vertex="1" style="stock"><mxGeometry.../></mxCell>
				// We need to handle BOTH formats.

				var typeEl = null;   // Element whose tagName is the primitive type (Stock, Variable, etc.)
				var mxCellEl = null; // The <mxCell> element containing geometry/style
				var id = null;

				if (cellEl.tagName === 'mxCell') {
					// Bare mxCell format: <mxCell id="2" value="Stock" vertex="1"...>
					mxCellEl = cellEl;
					id = cellEl.getAttribute('id');
					if (id === '0' || id === '1') continue;

					// Look for type info in value attribute or a child element
					var val = cellEl.getAttribute('value');
					if (val) {
						typeEl = { tagName: val, getAttribute: function() { return ''; }, attributes: [] };
					}
					// Check for a type child element (non-mxGeometry)
					for (var j = 0; j < cellEl.childNodes.length; j++) {
						var ch = cellEl.childNodes[j];
						if (ch.nodeType !== 1) continue;
						if (ch.tagName === 'mxGeometry') continue;
						typeEl = ch;
						break;
					}
				} else {
					// Wrapper format: <Stock id="2"><mxCell ...><mxGeometry.../></mxCell></Stock>
					typeEl = cellEl;
					id = cellEl.getAttribute('id');
					// Find child mxCell for metadata
					for (var j = 0; j < cellEl.childNodes.length; j++) {
						var ch = cellEl.childNodes[j];
						if (ch.nodeType !== 1) continue;
						if (ch.tagName === 'mxCell') {
							mxCellEl = ch;
							break;
						}
					}
				}

				if (!typeEl) continue;
				if (id === '0' || id === '1') continue;

				var type = typeEl.tagName;

				// If tagName is still mxCell, try to extract type from value attribute
				if (type === 'mxCell') {
					var mxVal = mxCellEl ? mxCellEl.getAttribute('value') : cellEl.getAttribute('value');
					if (mxVal) {
						type = mxVal;
					} else {
						continue;
					}
				}

				var el = { type: type, id: id };

				// Read type element attributes (skip mxCell attrs to keep JSON clean)
				if (typeEl.attributes) {
					for (var j = 0; j < typeEl.attributes.length; j++) {
						var attr = typeEl.attributes[j];
						if (attr.name === 'id' || attr.name === 'xmlns') continue;
						if (mxCellAttrs[attr.name]) continue;
						el[attr.name] = attr.value;
					}
				}

				// Read mxCell element attributes
				if (mxCellEl) {
					// Capture parent for folder nesting (import reads 'parent', not 'parentId')
					var cellParent = mxCellEl.getAttribute('parent');
					if (cellParent && cellParent !== '0' && cellParent !== '1') {
						el.parent = cellParent;
					}

					// Capture style string for visual rendering (colors, fonts, borders, opacity)
					var cellStyle = mxCellEl.getAttribute('style');
					if (cellStyle) {
						el.style = cellStyle;
					}

					// Capture visible flag (used to hide Setting, ghost layers, etc.)
					var cellVisible = mxCellEl.getAttribute('visible');
					if (cellVisible === '0') {
						el.visible = '0';
					}

					var source = mxCellEl.getAttribute('source');
					var target = mxCellEl.getAttribute('target');
					if (source) el.sourceId = source;
					if (target) el.targetId = target;

					// Other mxCell-level attributes (skip id and already-captured ones)
					for (var j = 0; j < mxCellEl.attributes.length; j++) {
						var attr = mxCellEl.attributes[j];
						if (attr.name === 'id' || attr.name === 'style' || attr.name === 'parent' || attr.name === 'visible' || mxCellAttrs[attr.name]) continue;
						el[attr.name] = attr.value;
					}

					// Geometry from mxCell's mxGeometry child
					var geoEl = null;
					for (var j = 0; j < mxCellEl.childNodes.length; j++) {
						var ch = mxCellEl.childNodes[j];
						if (ch.nodeType !== 1) continue;
						if (ch.tagName === 'mxGeometry') {
							geoEl = ch;
							break;
						}
					}

					if (geoEl) {
						el.geometry = {};
						var x = geoEl.getAttribute('x');
						var y = geoEl.getAttribute('y');
						var w = geoEl.getAttribute('width');
						var h = geoEl.getAttribute('height');
						if (x) el.geometry.x = parseFloat(x);
						if (y) el.geometry.y = parseFloat(y);
						if (w) el.geometry.width = parseFloat(w);
						if (h) el.geometry.height = parseFloat(h);

						var pts = geoEl.getElementsByTagName('mxPoint');
						var bendPoints = [];
						for (var k = 0; k < pts.length; k++) {
							var pt = pts[k];
							var as = pt.getAttribute('as');
							var px = parseFloat(pt.getAttribute('x'));
							var py = parseFloat(pt.getAttribute('y'));
							if (as === 'sourcePoint') el.geometry.sourcePoint = { x: px, y: py };
							else if (as === 'targetPoint') el.geometry.targetPoint = { x: px, y: py };
							else if (!isNaN(px) && !isNaN(py)) {
								bendPoints.push({ x: px, y: py });
							}
						}
						if (bendPoints.length > 0) el.geometry.points = bendPoints;
					}
				}

				if (type === 'Setting') {
					setting = el;
				} else {
					elements.push(el);
				}
			}
		}

		var json = {
			format: "InsightMaker-ModelJSON",
			version: 1,
			setting: setting,
			elements: elements
		};

		downloadFile("Model.json", JSON.stringify(json, null, 2), "application/json");
	} catch(e) {
		var msg = "无法导出模型为 JSON。";
		if (typeof showNotification === 'function') {
			showNotification(msg, "error");
		} else {
			alert(msg);
		}
		if (typeof console !== 'undefined') console.log(e);
	}
}
