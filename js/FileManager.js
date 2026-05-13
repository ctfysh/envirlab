var InsightMakerFileExtension = "";

// Append file extension to file (if not already there)
function appendFileExtension(filename,extension) {
	var extension_position=filename.length-extension.length;
	var current_extension=filename.slice(extension_position);
	if(current_extension.toLowerCase()!=extension.toLowerCase()) {
		filename+=extension;
	}
	return filename;
}

// Set the title to include the model name
function setTitle(filename) {
	var title;
	if(filename) {
		title = filename+" | 环境虚拟仿真实验平台";
		
	} else {
		title = "环境虚拟仿真实验平台";
	}
	window.parent.document.title = title;
}

// Get xml data for the current model
function getModelXML2() {
	var enc = new mxCodec();
	var graph_dom=enc.encode(graph.getModel());
	var xml_data="<InsightMakerModel>"+graph_dom.innerHTML+"</InsightMakerModel>";
	return xml_data;
}

// Makes a new model — reload page to fully reset all settings and state
function newModel() {
	location.reload();
}

// Generate JSON data for current model (for save)
function getModelJSONData() {
	var enc = new mxCodec(mxUtils.createXmlDocument());
	var modelNode = enc.encode(graph.getModel());

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
	var mxCellAttrs = { parent: true, style: true, vertex: true, edge: true,
		source: true, target: true, visible: true, value: true };

	if (root) {
		for (var i = 0; i < root.childNodes.length; i++) {
			var cellEl = root.childNodes[i];
			if (cellEl.nodeType !== 1) continue;

			var typeEl = null;
			var mxCellEl = null;
			var id = null;

			if (cellEl.tagName === 'mxCell') {
				mxCellEl = cellEl;
				id = cellEl.getAttribute('id');
				if (id === '0' || id === '1') continue;
				var val = cellEl.getAttribute('value');
				if (val) {
					typeEl = { tagName: val, getAttribute: function() { return ''; }, attributes: [] };
				}
				for (var j = 0; j < cellEl.childNodes.length; j++) {
					var ch = cellEl.childNodes[j];
					if (ch.nodeType !== 1) continue;
					if (ch.tagName === 'mxGeometry') continue;
					typeEl = ch;
					break;
				}
			} else {
				typeEl = cellEl;
				id = cellEl.getAttribute('id');
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
			if (type === 'mxCell') {
				var mxVal = mxCellEl ? mxCellEl.getAttribute('value') : cellEl.getAttribute('value');
				if (mxVal) {
					type = mxVal;
				} else {
					continue;
				}
			}

			var el = { type: type, id: id };

			if (typeEl.attributes) {
				for (var j = 0; j < typeEl.attributes.length; j++) {
					var attr = typeEl.attributes[j];
					if (attr.name === 'id' || attr.name === 'xmlns') continue;
					if (mxCellAttrs[attr.name]) continue;
					el[attr.name] = attr.value;
				}
			}

			if (mxCellEl) {
				var cellParent = mxCellEl.getAttribute('parent');
				if (cellParent && cellParent !== '0' && cellParent !== '1') {
					el.parent = cellParent;
				}
				var cellStyle = mxCellEl.getAttribute('style');
				if (cellStyle) {
					el.style = cellStyle;
				}
				var cellVisible = mxCellEl.getAttribute('visible');
				if (cellVisible === '0') {
					el.visible = '0';
				}
				var source = mxCellEl.getAttribute('source');
				var target = mxCellEl.getAttribute('target');
				if (source) el.sourceId = source;
				if (target) el.targetId = target;

				for (var j = 0; j < mxCellEl.attributes.length; j++) {
					var attr = mxCellEl.attributes[j];
					if (attr.name === 'id' || attr.name === 'style' || attr.name === 'parent' || attr.name === 'visible' || mxCellAttrs[attr.name]) continue;
					el[attr.name] = attr.value;
				}

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
					for (var k = 0; k < pts.length; k++) {
						var pt = pts[k];
						var as = pt.getAttribute('as');
						var px = parseFloat(pt.getAttribute('x'));
						var py = parseFloat(pt.getAttribute('y'));
						if (as === 'sourcePoint') el.geometry.sourcePoint = { x: px, y: py };
						else if (as === 'targetPoint') el.geometry.targetPoint = { x: px, y: py };
					}

					// Extract Array as="points" (waypoints/bend points for connectors)
					var arrays = geoEl.getElementsByTagName('Array');
					for (var ai = 0; ai < arrays.length; ai++) {
						if (arrays[ai].getAttribute('as') === 'points') {
							var ptEls = arrays[ai].getElementsByTagName('mxPoint');
							if (ptEls.length > 0) {
								el.geometry.points = [];
								for (var pi = 0; pi < ptEls.length; pi++) {
									var ptn = ptEls[pi];
									var px = parseFloat(ptn.getAttribute('x'));
									var py = parseFloat(ptn.getAttribute('y'));
									if (!isNaN(px) && !isNaN(py)) {
										el.geometry.points.push({ x: px, y: py });
									}
								}
							}
						}
					}
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

	return JSON.stringify(json, null, 2);
}

// High-level File manager. Does save and load of models
var FileManagerWeb = new function() {
	var self = this;
	var filename = null;
	
	this.set_filename = function(filename) {
		self.filename=filename;
		setTitle(filename);
	}
	
	this.saveModel = function() {
		Ext.MessageBox.show({
			title: getText('保存格式'),
			msg: getText('请选择保存格式：'),
			buttons: Ext.MessageBox.YESNO,
			buttonText: {
				yes: getText('EVL (.evl)'),
				no: getText('JSON (.json)')
			},
			icon: Ext.MessageBox.QUESTION,
			fn: function(btn) {
				if (btn == 'cancel') {
					return;
				}
				var isJson = (btn == 'no');
				var formatLabel = isJson ? 'JSON (.json)' : 'EVL (.evl)';
				var extension = isJson ? '.json' : '.evl';
				
				Ext.MessageBox.prompt(
					getText('模型名称'),
					getText('输入模型名称（格式: ') + formatLabel + getText('）：'),
					function(btn2, model_name) {
						if (btn2 == 'cancel') {
							return;
						}
						if (btn2 == 'ok') {
							try {
								model_name = appendFileExtension(model_name, extension);
								self.set_filename(model_name);
								
								if (isJson) {
									var json_data = getModelJSONData();
									downloadFile(model_name, json_data, "application/json");
								} else {
									var xml_data = getModelXML2();
									downloadFile(model_name, xml_data);
								}
							} catch(e) {
								if (typeof showNotification === 'function') {
									showNotification(getText('保存失败: ') + e.message, "error");
								}
							}
						}
					}
				);
			}
		});
	};
	
	this.loadModel = function() {
		openFile({
			read: "text",
			multiple: false,
			accept: ".evl,.json,.xmile,.xml",
			onCompleted: function(model) {
				if (!model || !model.contents) return;
				var content = model.contents.trim();
				var fileName = model.name || "";
				
				try {
					if (content.charAt(0) === '{') {
						var json = JSON.parse(content);
						if (json.format === "InsightMaker-ModelJSON") {
							var xml = modelJSONToInsightMakerXML(json);
							importMXGraph(xml);
							if (typeof showNotification === 'function') {
								showNotification("JSON 模型导入成功。", "notice");
							}
						} else {
							if (typeof showNotification === 'function') {
								showNotification("无法识别的 JSON 模型格式。", "error");
							}
							return;
						}
					} else if (content.indexOf('<xmile') !== -1) {
						importXMILEFromContent(content, fileName);
					} else {
						importMXGraph(content);
					}
					self.set_filename(fileName);
				} catch(e) {
					var msg = "无法加载模型文件。请确保选择了有效的模型文件。";
					if (typeof showNotification === 'function') {
						showNotification(msg, "error");
					} else {
						alert(msg);
					}
					if (typeof console !== 'undefined') console.log(e);
				}
			}
		});
	};
	
	this.newModel = function() {
		self.set_filename(null);
		newModel();
	}
};

// FileMenu for environment.WebOffline
var FileMenuWeb = {
text: getText('文件'),
itemId: "filegroup",
glyph: 0xf15b,
menu: [
	{
		glyph: 0xf016,
		text: getText('新建'),
		tooltip: getText('新建模型'),
		handler: FileManagerWeb.newModel,
		scope: this
	}, 
	{
		glyph: 0xf115, /*0xf115 alternative icon we could have used */
		text: getText('加载'),
		tooltip: getText('加载模型'),
		handler: FileManagerWeb.loadModel,
		scope: this
	}, 
	{
		glyph: 0xf0c7,
		text: getText('保存'),
		tooltip: getText('保存模型'),
		handler: FileManagerWeb.saveModel,
		scope: this
	}
]
};

// Get the correct FileMenu depending on the environment
var FileMenu;
switch(viewConfig.environment) {
	case environment.InsightMakerOnline:
		FileMenu = [];
		break;
	case environment.WebOffline:
		FileMenu = [];
		break;
}
