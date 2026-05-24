"use strict";
/*

Copyright 2010-2018 Scott Fortmann-Roe. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License.

*/



Ext.onReady(function() {
	main();
});

if (require.config) {
	require.config({
		baseUrl: builder_path + "/resources"
	});
}

function isLocalStorageNameSupported() {
    var testKey = 'testLocalStorage', storage = window.sessionStorage;
    try {
        storage.setItem(testKey, '1');
        storage.removeItem(testKey);
        return true;
    } catch (error) {
        return false;
    }
}

if(isLocalStorageNameSupported()){
	Ext.state.Manager.setProvider(new Ext.state.LocalStorageProvider());
}else{
	Ext.state.Manager.setProvider(Ext.create('Ext.state.CookieProvider', {
    	expires: new Date(new Date().getTime()+(1000*60*60*24*100000))
	}));
}



//make html edit links target blank
Ext.override(Ext.form.HtmlEditor, {
	createLink: function() {
		var url = prompt(this.createLinkText, this.defaultLinkValue);

		if (url && url != 'http:/' + '/') {
			var txt = this.win.getSelection();
			if (txt == "") {
				txt = url;
			}
			txt = '<a href="' + url + '" target="_blank">' + txt + '</a>';

			if (Ext.isIE) {
				range = this.getDoc().selection.createRange();
				if (range) {
					range.pasteHTML(txt);
					this.syncValue();
					this.deferFocus();
				}
			} else {
				this.execCmd('InsertHTML', txt);
				this.deferFocus();
			}
		}
	}
});

function renderTimeBut(value) {
	var id = Ext.id();

	Ext.Function.defer(function() {
		new Ext.Button({
			text: getText("修改时间设置"),

			padding: 0,
			margin: 0,
			handler: function(btn, e) {
				var config = JSON.parse(getSelected()[0].getAttribute("Solver"))
				config.cell = getSelected()[0];

				showTimeSettings(config);

			}
		}).render(id);
	}, 15);
	return '<div id="' + id + '" style="height:24px"></div>';
}

window.addEventListener('message', callAPI, false);

function callAPI(e) {
	try {
		e.source.postMessage(eval(e.data), "*");
	} catch (err) {

	}
}

function isLocal() {
	return (document.location.hostname == "localhost") || (document.location.hostname == "insightmaker.test");
}

mxGraph.prototype.stopEditing = function(a) {
	if (this.cellEditor !== null) {
		this.cellEditor.stopEditing(a)
	}
}

mxObjectCodec.prototype.isExcluded = function(obj, attr, value, write)
{
	return attr == mxObjectIdentity.FIELD_NAME || (attr == 'origCache') ||
		mxUtils.indexOf(this.exclude, attr) >= 0;
};

mxGraph.prototype.duplicateCells = function(cells, append)
{
	cells = (cells != null) ? cells : this.getSelectionCells();
	append = (append != null) ? append : true;

	cells = this.model.getTopmostCells(cells);

	var model = this.getModel();
	var s = this.gridSize;
	var select = [];

	model.beginUpdate();
	try
	{
		for (var i = 0; i < cells.length; i++)
		{
			var parent = model.getParent(cells[i]);
			var child = this.moveCells([cells[i]], s, s, true, parent)[0];
			select.push(child);

			// Maintains child index by inserting after cloned in parent
			if (!append)
			{
				var index = parent.getIndex(cells[i]);
				model.add(parent, child, index + 1);
			}
		}
	}
	finally
	{
		model.endUpdate();
	}

	return select;
};


var equationRenderer = function(eq, perserveLines) {
	var res = eq;


	res = res.replace(/</g, "&lt;");
	res = res.replace(/>/g, "&gt;");
	res = res.replace(/\[(.*?)\]/g, "<font color='Green'>[$1]</font>");
	res = res.replace(/(&lt;&lt;.*?&gt;&gt;)/g, "<font color='Orange'>$1</font>");
	res = res.replace(/(«.*?»)/g, "<font color='Orange'>$1</font>");
	res = res.replace(/\b([\d\.e]+)\b/g, "<font color='DeepSkyBlue'>$1</font>");
	res = res.replace(/(\{.*?\})/g, "<font color='Orange'>$1</font>");

	if (/\\n/.test(res)) {
		if(perserveLines === true){
			res = res.replace(/\\n/g, "<br>");
			res = res.replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;");
			res = res.replace(/ /g, "&nbsp;");
		}else{
			var vals = res.match(/(.*?)\\n/);
			res = vals[1] + "...";
		}
	}

	return clean(res);
};


if (!isLocal()) {
	window.onerror = function(err, file, line, col, error) {
		if (!/removeChild/.test(err)) {
			var msg = [err, file, line].join(' : ');
			_gaq.push(['_trackEvent', 'Errors', 'App', msg, null, true]);
			//alert("Javascript Error\n\n" + err + "\n\n(" + file + " " + line + ")\n\nIf this error persists, please contact us for support.");
			console.log(msg);
			console.log(error)

			return true;
		}
	}
}

try {
	var showNotification = function(message, type, autoHide) {
		//type: error, warning, notice, success
		$().toastmessage('showToast', {
			text: message,
			sticky: !autoHide,
			type: type || "error"
		});
	}
	mxUtils.alert = showNotification;

} catch (err) {
			alert(getText('EnVirLab 资源加载失败，请检查网络连接后重试。'));
}

var GraphEditor = {};
var mainPanel;
var mxPanel;
var ribbonPanel;
var configPanel;
var sizeChanging;
var sliders = [];
var settingCell;
var clipboardListener;
var undoHistory;



function setupFrozenHoverEffect(graph) {
	// Frozen hover effect

	function updateStyle(state, hover)
	{
		if(state.cell.value.nodeName == "Folder" && getFrozen(state.cell)){
			if (hover)
			{
				state.style[mxConstants.STYLE_STROKECOLOR] = '#05B8CC';
				//state.style[mxConstants.STYLE_FONTCOLOR] = '#05B8CC';
				state.style[mxConstants.STYLE_DASHED] = 0;
				//console.log(state.style);
			}

		}
	};

	graph.addMouseListener(
	{
	    currentState: null,
	    previousStyle: null,

	    mouseMove: function(sender, me)
	    {
	        if (this.currentState != null && me.getState() == this.currentState)
	        {
	            return;
	        }

	        var tmp = graph.view.getState(me.getCell());

	        // Ignores everything but vertices
	        if (graph.isMouseDown || (tmp != null && tmp.cell.value.nodeName != "Folder"))
	        {
	        	tmp = null;
	        }

	        if (tmp != this.currentState)
	        {
	            if (this.currentState != null)
	            {
	                this.dragLeave(me.getEvent(), this.currentState);
	            }

            this.currentState = tmp;

            if (this.currentState != null)
            {
                this.dragEnter(me.getEvent(), this.currentState);
            }
        }
    },
    dragEnter: function(evt, state)
    {
        if (state != null)
        {
        	this.previousStyle = state.style;
        	state.style = mxUtils.clone(state.style);
        	updateStyle(state, true);
			if(state.shape){

	        	state.shape.apply(state);
	        	state.shape.reconfigure();
			}
        }
    },
    dragLeave: function(evt, state)
    {
        if (state != null)
        {
        	state.style = this.previousStyle;
        	updateStyle(state, false);
			if(state.shape){
				if(getLineColor(state.cell) == undefined){
					state.style[mxConstants.STYLE_STROKECOLOR] = mxConstants.NONE;
				}

	        	state.shape.apply(state);
	        	state.shape.reconfigure();
			}
        }
    },
		mouseDown: function(){},
		mouseUp: function(){}
	});
};

function setupTooltipOverride(graph) {
	graph.getTooltipForCell = function(cell) {
		if (linkedResults && cell != null) {
			cell = orig(cell);
			var displayInformation = linkedResults.displayInformation;
			//console.log(displayInformation);

			var displaySeries = [];
			var displayIds = [];
			var defaultColorIndex = 0;
			for (var i = 0; i < displayInformation.ids.length; i++) {
				if (cell.id == displayInformation.ids[i]) {
					var x = displayInformation.elementIds[i];
					displayIds.push(x);

					var c = null;
					if (!isGray(displayInformation.colors[i])) {
						c = displayInformation.colors[i];
					} else {
						c = defaultColors[defaultColorIndex];
						defaultColorIndex++;
						defaultColorIndex = defaultColorIndex % defaultColors.length;
					}

					displaySeries.push({
						type: 'line',
						axis: "left",
						xField: "Time",
						yField: x,
						title: displayInformation.headers[i],
						showMarkers: false,
						colors: [c],
						smooth: false,
						style: {'stroke-width': 3}
					});

				}
			}

			if(displayIds.length == 0){
				return undefined;
			}

			return {
						flex: 1,
				width: 200,
				height: 160,
						animation: false,
						shadow: false,
						store: displayInformation.store,
						axes: [{
								type: 'numeric',
								position: 'left',
								fields: displayIds,
								grid: true,
								titleMargin: 0,
								renderer: commaStr,
								label: {
									fontSize: '11px'
								}
							},
							{
								type: 'numeric',
								position: 'bottom',
								fields: "Time",
								minimum: displayInformation.store.min("Time"),
								maximum:  displayInformation.store.max("Time"),
								grid: true,
								titleMargin: 0,
								renderer: function(x) {
									return round(x, 9);
								},
								label: {
									fontSize: '11px'
								}
							}
						],
						series: displaySeries
					};

		} else {
			return "";
		}
	}
};

function setupGraphAndRubberband(graph, mxPanel, viewConfig) {
	// Initializes the graph as the DOM for the panel has now been created
	graph.init(mxPanel.getEl().dom);
	graph.setConnectable(viewConfig.allowEdits);
	graph.setDropEnabled(true);
	graph.setSplitEnabled(false);
	graph.connectionHandler.connectImage = new mxImage(builder_path + '/images/connector.gif', 16, 16);
	graph.connectionHandler.isConnectableCell = function(cell) {
		if (!cell) {
			return false;
		}
		if (getOpacity(cell) === 0) {
			return false;
		}
		var type = connectionType();
		if (cell.value.nodeName == "Link" || type == "None") {
			return false;
		}
		if (type == "Link") {
			return true;
		} else {
			var o = orig(cell);
			return o.value.nodeName == "Stock" || o.value.nodeName == "State";
		}
	}
	graph.setPanning(true);
	graph.setTooltips(true);
	graph.connectionHandler.setCreateTarget(false);



	var rubberband = new mxRubberband(graph);
};

function setupPopupMenuAndSettings(graph, viewConfig) {
	var parent = graph.getDefaultParent();

	graph.popupMenuHandler.factoryMethod = function(menu, cell, evt) {
		if (!evt.shiftKey) {
			if (viewConfig.enableContextMenu) {
				showContextMenu(null, evt);
			}
		}
	};


	graph.model.addListener(mxEvent.CHANGED, clearPrimitiveCache);



	settingCell = graph.insertVertex(parent, null, primitiveBank.setting, 20, 20, 80, 40);
	settingCell.visible = false;
	var firstdisp = graph.insertVertex(parent, null, primitiveBank.display.cloneNode(true), 50, 20, 64, 64, "roundImage;image=" + builder_path + "/images/DisplayFull.png;");
	firstdisp.visible = false;
	firstdisp.setAttribute("AutoAddPrimitives", true);
	firstdisp.setAttribute("name", getText("默认显示"));
};

function setupEdgeValidationAndModel(graph, viewConfig, graph_source_data) {
	graph.getEdgeValidationError = function(edge, source, target) {
		if ((edge != null && (edge.value.nodeName == "Flow" || edge.value.nodeName == "Transition")) || (this.model.getValue(edge) == null && connectionType == "Flow")) {
			if (isDefined(source) && source !== null && source.isConnectable()) {
				if (!(source.value.nodeName == "Stock" || (source.value.nodeName == "Ghost" && orig(source).value.nodeName == "Stock") || source.value.nodeName == "State" || (source.value.nodeName == "Ghost" && orig(source).value.nodeName == "State"))) {
					return getText('您无法建立这种联系。');
				}
			}
			if (isDefined(target) && target !== null && target.isConnectable()) {
				if (!(target.value.nodeName == "Stock" || (target.value.nodeName == "Ghost" && orig(target).value.nodeName == "Stock") || target.value.nodeName == "State" || (target.value.nodeName == "Ghost" && orig(target).value.nodeName == "State"))) {
					return getText('您无法建立这种联系。');
				}
				if (isDefined(source) && source !== null && source.isConnectable()) {
					if (orig(source).value.nodeName != orig(target).value.nodeName) {
						return getText("您无法将库连接到转换。");
					}
				}
			}
		}


		if ((edge != null && edge.value.nodeName == "Link") || (this.model.getValue(edge) == null && connectionType() == "Link")) {
			if (isDefined(source) && source !== null) {
				if (source.value.nodeName == "Link") {
					return getText('链接无法连接到链接。');
				}
			}
			if (isDefined(target) && target !== null) {
				if (target.value.nodeName == "Link") {
					return getText('链接无法连接到链接。');
				}
			}
		}

		if (connectionType() !== 'Link' && source && target) {
			if (orig(source).value.nodeName == 'Stock' || orig(source).value.nodeName == 'State') {
				if (orig(source).value.nodeName != orig(target).value.nodeName) {
					return getText('您无法使用流或转换将库连接到状态。');
				}
			}
		}

		if (edge) {
			if (edge.value.nodeName == 'Transition' && ((source && orig(source).value.nodeName == 'Stock') || (target && orig(target).value.nodeName == 'Stock'))) {
				return getText('您无法将转换连接到库。');
			}

			if (edge.value.nodeName == 'Flow' && ( (source && orig(source).value.nodeName == 'State') || (target && orig(target).value.nodeName == 'State'))) {
				return getText('您无法将流连接到状态。');
			}
		}

		return mxGraph.prototype.getEdgeValidationError.apply(this, arguments);
	};



	{
		var code = (graph_source_data != null && graph_source_data.length > 0) ? graph_source_data : blankGraphTemplate;

		var doc = mxUtils.parseXml(code);
		var dec = new mxCodec(doc);
		dec.decode(doc.documentElement, graph.getModel());

		updateModel();

		loadStyleSheet();

	}
};

function setupAutosave(graph, graph_title, saveModel) {
	if (viewConfig.saveEnabled) {
		var mgr = new mxAutoSaveManager(graph);
		mgr.autoSaveThreshold = 0;
		mgr.autoSaveDelay = 0;
		mgr.autoSaveThrottle = 0;
		mgr.save = function() {
			if (graph_title != "") {
				saveModel();
			}
		};
	}
};

function setupUndoAndFoldListeners(graph, undoHistory) {
	var listener = function(sender, evt) {
		undoHistory.undoableEditHappened(evt.getProperty('edit'));
	};

	graph.getModel().addListener(mxEvent.UNDO, listener);
	graph.getView().addListener(mxEvent.UNDO, listener);

	//Update folder displays between collapsed and full versions
	graph.addListener(mxEvent.CELLS_FOLDED, function(sender, evt) {
		var cells = evt.properties.cells;
		for (var i = 0; i < cells.length; i++) {
			setPicture(cells[i]);
			setLabelPosition(cells[i]);
		}
	});
};

function setupGroupCellAndConnection(graph, primitiveBank) {
	var previousCreateGroupCell = graph.createGroupCell;

	graph.createGroupCell = function() {
		var group = previousCreateGroupCell.apply(this, arguments);
		group.setStyle('folder');
		group.setValue(primitiveBank.folder.cloneNode(true));

		return group;
	};

	graph.connectionHandler.factoryMethod = function(source, target) {
		var style;
		var parent;
		var value;
		var conn;
		if (connectionType() == "Link") {
			style = 'link';
			parent = primitiveBank.link.cloneNode(true);
		} else {
			if ((source != null && source.value.nodeName == "Stock") || (target != null && target.value.nodeName == "Stock")) {
				style = 'flow';
				parent = primitiveBank.flow.cloneNode(true);
			} else {
				style = 'transition';
				parent = primitiveBank.transition.cloneNode(true);
			}
		}
		var cell = new mxCell(parent, new mxGeometry(0, 0, 100, 100), style);
		cell.geometry.setTerminalPoint(new mxPoint(0, 100), true);
		cell.geometry.setTerminalPoint(new mxPoint(100, 0), false);
		cell.edge = true;
		cell.connectable = true;

		return cell;
	};
};

function setupTouchConfig() {
	// Larger tolerance and grid for real touch devices
	if (!(mxClient.IS_TOUCH || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0)) {

	} else {

		mxGraph.prototype.collapsedImage=new mxImage(mxClient.imageBasePath+"/collapsed.gif", 18, 18);
		mxGraph.prototype.expandedImage=new mxImage(mxClient.imageBasePath+"/expanded.gif", 18, 18);


		mxShape.prototype.svgStrokeTolerance = 18;
		mxVertexHandler.prototype.tolerance = 12;
		mxEdgeHandler.prototype.tolerance = 12;
		mxGraph.prototype.tolerance = 12;
		mxConstants.DEFAULT_HOTSPOT = 0.5;
		mxConstants.HANDLE_SIZE = 16;
		mxConstants.LABEL_HANDLE_SIZE = 7;

		graph.addListener(mxEvent.TAP_AND_HOLD, function(sender, evt) {
			var me = evt.getProperty('event');
			var cell = evt.getProperty('cell');

			if (cell !== null && isValued(cell)) {
				showEditor(cell)
			} else {
				showContextMenu(null, me);
			}

			// Blocks further processing of the event
			evt.consume();
		});


		mxPanningHandler.prototype.isPanningTrigger = function(me) {
			var evt = me.getEvent();

			return (me.getState() == null && !mxEvent.isMouseEvent(evt)) ||
				(mxEvent.isPopupTrigger(evt) && (me.getState() == null || mxEvent.isControlDown(evt) || mxEvent.isShiftDown(evt)));
		};

		// Don't clear selection if multiple cells selected
		var graphHandlerMouseDown = mxGraphHandler.prototype.mouseDown;
		mxGraphHandler.prototype.mouseDown = function(sender, me) {
			graphHandlerMouseDown.apply(this, arguments);

			if (this.graph.isCellSelected(me.getCell()) && this.graph.getSelectionCount() > 1) {
				this.delayedSelection = false;
			}
		};



		// Overrides double click handling to use the tolerance
		var graphDblClick = mxGraph.prototype.dblClick;
		mxGraph.prototype.dblClick = function(evt, cell) {
			if (cell == null) {
				var pt = mxUtils.convertPoint(this.container,
					mxEvent.getClientX(evt), mxEvent.getClientY(evt));
				cell = this.getCellAt(pt.x, pt.y);
			}

			graphDblClick.call(this, evt, cell);
		};



		// Adds connect icon to selected vertex
		var connectorSrc = builder_path + '/images/touch-connector.png';


		new Image().src = connectorSrc;


		var vertexHandlerInit = mxVertexHandler.prototype.init;
		mxVertexHandler.prototype.init = function() {
			// TODO: Use 4 sizers, move outside of shape
			//this.singleSizer = this.state.width < 30 && this.state.height < 30;
			vertexHandlerInit.apply(this, arguments);

			// Only show connector image on one cell and do not show on containers
			if (this.graph.connectionHandler.isEnabled() &&
				this.graph.isCellConnectable(this.state.cell) &&
				this.graph.getSelectionCount() == 1 &&
				graph.connectionHandler.isConnectableCell(this.state.cell)
			) {
				this.connectorImg = mxUtils.createImage(connectorSrc);
				this.connectorImg.style.cursor = 'pointer';
				this.connectorImg.style.width = '29px';
				this.connectorImg.style.height = '29px';
				this.connectorImg.style.position = 'absolute';

				// Starts connecting on touch/mouse down
				mxEvent.addGestureListeners(this.connectorImg,
					mxUtils.bind(this, function(evt) {
						this.graph.popupMenuHandler.hideMenu();
						this.graph.stopEditing(false);

						var pt = mxUtils.convertPoint(this.graph.container,
							mxEvent.getClientX(evt), mxEvent.getClientY(evt));
						this.graph.connectionHandler.start(this.state, pt.x, pt.y);
						this.graph.isMouseDown = true;
						this.graph.isMouseTrigger = mxEvent.isMouseEvent(evt);
						mxEvent.consume(evt);
					})
				);

				this.graph.container.appendChild(this.connectorImg);
			}

			this.redrawHandles();
		};

		var vertexHandlerHideSizers = mxVertexHandler.prototype.hideSizers;
		mxVertexHandler.prototype.hideSizers = function() {
			vertexHandlerHideSizers.apply(this, arguments);

			if (this.connectorImg != null) {
				this.connectorImg.style.visibility = 'hidden';
			}
		};

		var vertexHandlerReset = mxVertexHandler.prototype.reset;
		mxVertexHandler.prototype.reset = function() {
			vertexHandlerReset.apply(this, arguments);

			if (this.connectorImg != null) {
				this.connectorImg.style.visibility = '';
			}
		};

		var vertexHandlerRedrawHandles = mxVertexHandler.prototype.redrawHandles;
		mxVertexHandler.prototype.redrawHandles = function() {
			vertexHandlerRedrawHandles.apply(this);

			if (this.state != null && this.connectorImg != null) {
				var pt = new mxPoint();
				var s = this.state;

				// Top right for single-sizer
				if (mxVertexHandler.prototype.singleSizer) {
					pt.x = s.x + s.width - this.connectorImg.offsetWidth / 2;
					pt.y = s.y - this.connectorImg.offsetHeight / 2;
				} else {
					pt.x = s.x + s.width + mxConstants.HANDLE_SIZE / 2 + 4 + this.connectorImg.offsetWidth / 2;
					pt.y = s.y + s.height / 2;
				}

				var alpha = mxUtils.toRadians(mxUtils.getValue(s.style, mxConstants.STYLE_ROTATION, 0));

				if (alpha != 0) {
					var cos = Math.cos(alpha);
					var sin = Math.sin(alpha);

					var ct = new mxPoint(s.getCenterX(), s.getCenterY());
					pt = mxUtils.getRotatedPoint(pt, cos, sin, ct);
				}

				this.connectorImg.style.left = (pt.x - this.connectorImg.offsetWidth / 2) + 'px';
				this.connectorImg.style.top = (pt.y - this.connectorImg.offsetHeight / 2) + 'px';
			}
		};

		var vertexHandlerDestroy = mxVertexHandler.prototype.destroy;
		mxVertexHandler.prototype.destroy = function(sender, me) {
			vertexHandlerDestroy.apply(this, arguments);

			if (this.connectorImg != null) {
				this.connectorImg.parentNode.removeChild(this.connectorImg);
				this.connectorImg = null;
			}
		};

	}
};

function setupKeyboardShortcuts(clipboardListener) {
	mxKeyHandler.prototype.isGraphEvent = function(e) {

		if (e.altKey || e.shiftKey) {
			return false;
		}
		var w = Ext.WindowManager.getActive();
		if (isDefined(w) && w !== null && (w.modal || w.getId()=="unfold-window") ) {
			return false;
		}
		//console.log(Ext.FocusManager.focusedCmp);
		var c = Ext.get(Ext.Element.getActiveElement());
		if(c.hasCls && c.hasCls('x-form-field')){
			return false;
		}
		var x = (! c) || (! c.component) || c.component.componentCls == 'x-container' || c.component.componentCls == 'x-window' || c.component.componentCls == 'x-panel' || c.component.componentCls == 'x-panel-header' || c.component.componentCls == 'x-window-header' || c.component.componentCls == 'x-btn-group' || c.component.componentCls == 'x-form-field';
		//console.log(x);
		return x;
	}

	var keyHandler = new mxKeyHandler(graph);

	keyHandler.getFunction = function(evt) {
		if (evt != null) {
			return (mxEvent.isControlDown(evt) || (mxClient.IS_MAC && evt.metaKey)) ? this.controlKeys[evt.keyCode] : this.normalKeys[evt.keyCode];
		}

		return null;
	};

	keyHandler.bindKey(13, function() {
		graph.foldCells(false);
	});



	keyHandler.bindControlKey(65, function() {
		graph.selectAll();
	});

	// Ctrl+D
	keyHandler.bindControlKey(68, function(){
		graph.setSelectionCells(graph.duplicateCells());
	});

	//bold
	keyHandler.bindControlKey(66, function() {
		if (viewConfig.allowEdits) {
			graph.toggleCellStyleFlags(mxConstants.STYLE_FONTSTYLE, mxConstants.FONT_BOLD, excludeType(graph.getSelectionCells(), "Ghost"));
			setStyles();
		}
	});

	//italics
	keyHandler.bindControlKey(73, function() {
		if (viewConfig.allowEdits) {
			graph.toggleCellStyleFlags(mxConstants.STYLE_FONTSTYLE, mxConstants.FONT_ITALIC, excludeType(graph.getSelectionCells(), "Ghost"));
			setStyles();
		}
	});

	//underline
	keyHandler.bindControlKey(85, function() {
		if (viewConfig.allowEdits) {
			graph.toggleCellStyleFlags(mxConstants.STYLE_FONTSTYLE, mxConstants.FONT_UNDERLINE, excludeType(graph.getSelectionCells(), "Ghost"));
			setStyles();
		}
	});

	keyHandler.bindControlKey(89, function() {
		undoHistory.redo();
	});

	keyHandler.bindControlKey(90, function() {
		undoHistory.undo();
	});


	keyHandler.bindControlKey(67, function() {
		mxClipboard.copy(graph);
		clipboardListener();
	});

	keyHandler.bindControlKey(13, function() { // Return
		runModel();
	});

	keyHandler.bindControlKey(75, function() { // K
		scratchpadFn();
	});

	keyHandler.bindControlKey(191, function() { // ]
		if (!Ext.getCmp("unfoldToolbar").isHidden()) {
			if (!Ext.getCmp("nextUnfoldBut").isHidden) {
				if (!Ext.getCmp("nextUnfoldBut").isDisabled()) {
					doUnfoldStep();
				}
			}
		}
	});

	if (viewConfig.allowEdits) {

		keyHandler.bindKey(8, function() {
			graph.removeCells(graph.getSelectionCells(), false);
		});

		keyHandler.bindKey(46, function() {
			graph.removeCells(graph.getSelectionCells(), false);
		});

		keyHandler.bindControlKey(88, function() {
			mxClipboard.cut(graph);
			clipboardListener();
		});

		keyHandler.bindControlKey(83, function() {
			FileManagerWeb.saveModel();
		});

		keyHandler.bindControlKey(86, function() {
			mxClipboard.paste(graph);
			clipboardListener()
		});

		keyHandler.bindControlKey(190, function() { // .
			var primitive = graph.getSelectionCell();
			if (isDefined(primitive) && primitive != null) {
				var editorWindow = new RichTextWindow({
					parent: "",
					cell: primitive,
					html: getNote(primitive)
				});
				editorWindow.show();
			}
		});
	}

	keyHandler.bindControlKey(69, function() { // E
		doSensitivity();
	});

	keyHandler.bindControlKey(76, function() { // L
		timeSettingsFn();
	});

	keyHandler.bindControlKey(70, function() { // F
		showFindAndReplace();
	});

	keyHandler.bindControlKey(71, function() { // G
		var but = Ext.getCmp('findNextBut');
		if (but && (!but.disabled)) {
			findNext();
		}
	});


	keyHandler.bindControlKey(80, printGraph);

	// Ctrl+Alt+N / ⌥⌘N for New model (browser-safe alternative to Ctrl+N)
	// Ctrl+Alt+O / ⌥⌘O for Load model (browser-safe alternative to Ctrl+O)
	mxEvent.addListener(document, 'keydown', function(e) {
		var isCtrl = mxClient.IS_MAC ? e.metaKey : e.ctrlKey;
		if (isCtrl && e.altKey && !e.shiftKey) {
			// Don't intercept when editing form fields
			var c = Ext.get(Ext.Element.getActiveElement());
			if (c && c.hasCls && c.hasCls('x-form-field')) return;
			// Don't intercept when a modal window is open
			var w = Ext.WindowManager.getActive();
			if (w && w.modal) return;

			switch (e.keyCode) {
				case 78: // N
					e.preventDefault();
					FileManagerWeb.newModel();
					break;
				case 79: // O
					e.preventDefault();
					FileManagerWeb.loadModel();
					break;
			}
		}
	});
};

function main() {
	Ext.QuickTips.init();


	mxConstants.DEFAULT_HOTSPOT = 0.3;
	mxConstants.LINE_HEIGHT = 1.2075;

	//Change the settings for touch devices


	graph = new mxGraph();

	undoHistory = new mxUndoManager();


	graph.alternateEdgeStyle = 'vertical';
	graph.connectableEdges = true;
	graph.disconnectOnMove = false;
	graph.edgeLabelsMovable = true;
	graph.enterStopsCellEditing = true;
	graph.allowLoops = false;



	if (viewConfig.allowEdits) {
		mxVertexHandler.prototype.rotationEnabled = true;
	}
	// Enables managing of sizers
	mxVertexHandler.prototype.manageSizers = true;

	// Enables live preview
	mxVertexHandler.prototype.livePreview = true;

	mxEvent.addMouseWheelListener(function(evt, up) {
		if (mxEvent.isControlDown(evt)) {
			if (up) {
				graph.zoomIn();
			} else {
				graph.zoomOut();
			}

			mxEvent.consume(evt);
		}
	});


	setupTouchConfig();


	// Rounded edge and vertex handles
	var touchHandle = new mxImage(builder_path + '/images/touch-handle.png', 16, 16);
	mxVertexHandler.prototype.handleImage = touchHandle;
	mxEdgeHandler.prototype.handleImage = touchHandle;
	mxOutline.prototype.sizerImage = touchHandle;
	// Pre-fetches touch handle
	new Image().src = touchHandle.src;


	mxEdgeHandler.prototype.addEnabled = true;
	mxEdgeHandler.prototype.removeEnabled = true;

	setupGraphConfig();
	setupCellIDManager();
	setupHoverIcons();

	mxPanel = Ext.create('Ext.Component', {
		border: false,
		id: "mxPanelForModelGraph",
		style: {'line-height': 0}
	});



	mainPanel = Ext.create('Ext.Panel', {
		region: 'center',

		border: false,
		layout: "fit",
		items: [mxPanel]
	});

	mainPanel.on('resize', function() {
		graph.sizeDidChange();
	});

	configPanel = Ext.create('Ext.Panel', ConfigPanel());
	ribbonPanel = Ext.create('Ext.Panel', RibbonPanel(graph, mainPanel, configPanel));

	window.toNum = 0;
	var viewport = new Ext.Viewport({
		layout: 'border',
		padding: (viewConfig.showTopLinks ? '22 0 0 0' : 0),
		id: 'overall-viewport',
		items: [ribbonPanel, {
			xtype: 'toolbar',
			region: 'south',
			dock: 'bottom',
			hidden: false,
			id: 'unfoldToolbar',
			layout: {
				align: "bottom"
			},
			items: [{
				glyph: 0xf0e6,
				text: getText('查看故事'),
				iconCls: 'blue-icon',
				scope: this,
				id: 'unfoldUnfoldBut',
				handler: function() {

					revealUnfoldButtons(true);
					beginUnfolding();
				}
			},{
				glyph: 0xf044,
				text: getText('编辑故事'),
				scope: this,
				id: 'editUnfoldBut',
				handler: showUnfoldingWin
			}, {
				scale: "large",
				iconAlign: 'top',
				glyph: 0xf021,
				text: getText('初始化'),
				scope: this,
				id: 'reloadUnfoldBut',
				handler: function() {
					restartUnfolding();
				}
			}, {
				hidden: is_ebook,
				scale: "large",
				iconAlign: 'top',
				glyph: 0xf05c,
				iconCls: 'red-icon',
				text: getText('退出故事'),
				scope: this,
				id: 'exitUnfoldBut',
				handler: function() {
					revealUnfoldButtons(false);
					finishUnfolding();
				}
			}, {
				html: "",
				id: 'messageUnfoldBut',
				flex: 1,
				xtype: "box",
				style: {
					"font-size": "larger"
				},
				margin: '4 10 4 10',
				align: "middle",
				minHeight: 64
			}, {
				scale: "large",
				iconCls: 'green-icon',
				iconAlign: 'top',
				glyph: 0xf138,
				text: getText('前进'),
				scope: this,
				id: 'nextUnfoldBut',
				handler: function() {
					doUnfoldStep()
				}
			}]
		}]
	});

  $(mxPanel.getEl().dom)
    .on('touchstart tap  ', function(e) { /*touch move touchend*/
		e.stopPropagation();
		if(document.activeElement && document.activeElement.blur){
			document.activeElement.blur()
		}
    });

	graph.addListener(mxEvent.CELL_CONNECTED, function(sender, evt) {
		var item = evt.getProperty("edge");
		if (item.value.nodeName == "Link") {
			linkBroken(item);
		}
	});

	graph.addListener(mxEvent.CELLS_FOLDED, function(graph, e) {
		if (!e.properties.collapse) {
			graph.orderCells(false, e.properties.cells);
		}
	});


	mainPanel.getEl().insertHtml("beforeBegin", "<div id='mainGraph'  style='z-index:1000;position:absolute; width:100%;height:100%;display:none;'></div>");


	mxEvent.disableContextMenu(mxPanel.getEl().dom);


	mxPanel.getEl().dom.style.overflow = 'auto';


	graph.model.styleForCellChanged = function(cell, style) {
		var x = mxGraphModel.prototype.styleForCellChanged(cell, style);
		propogateGhosts(cell);
		return x;
	}

	graph.model.addListener(mxEvent.CHANGED, function(graph) {
		setSaveEnabled(true);
	});

	graph.model.addListener(mxEvent.CHANGE, function(sender, evt) {
		var changes = evt.getProperty('changes');

		if ((changes.length < 10) && changes.animate) {
			mxEffects.animateChanges(graph, changes);
		}
	});

	graph.addListener(mxEvent.CELLS_REMOVED, function(sender, evt) {
		var cells = evt.getProperty('cells');
		for (var i = 0; i < cells.length; i++) {
			deletePrimitive(cells[i]);
			if (cells[i].value.nodeName == "Folder") {
				var children = childrenCells(cells[i]);
				if (children != null) {
					for (var j = 0; j < children.length; j++) {
						deletePrimitive(children[j]);
					}
				}
			}
		}
		selectionChanged(true);
	});

	graph.addListener(mxEvent.CLICK, function(sender, evt) {
		var cell = evt.getProperty('cell');
		if (!evt.isConsumed()) {
			if (cell == null) {
				graph.clearSelection();
			}
		}
	});


	setupGraphAndRubberband(graph, mxPanel, viewConfig);

	setupPopupMenuAndSettings(graph, viewConfig);

	setupEdgeValidationAndModel(graph, viewConfig, graph_source_data);

	loadBackgroundColor();

	setupAutosave(graph, graph_title, saveModel);

	setupUndoAndFoldListeners(graph, undoHistory);

	var toolbarItems = ribbonPanelItems();
	var selectionListener = function() {
		var selected = !graph.isSelectionEmpty();
		if(selected){
			if(document.activeElement && document.activeElement.blur){
				document.activeElement.blur()
			}
		}
		var selectedNonGhost = selected && (graph.getSelectionCount() == 1 ? graph.getSelectionCell().value.nodeName != "Ghost" : true);


		toolbarItems.down('#folder').setDisabled(graph.getSelectionCount() <= 0);
		toolbarItems.down('#ghostBut').setDisabled(graph.getSelectionCount() != 1 || ((!isValued(graph.getSelectionCell()) && graph.getSelectionCell().value.nodeName != "Picture" && graph.getSelectionCell().value.nodeName != "Agents")) || graph.getSelectionCell().value.nodeName == "Flow" || graph.getSelectionCell().value.nodeName == "Transition" || graph.getSelectionCell().value.nodeName == "Ghost");

		toolbarItems.down('#cut').setDisabled(!selected);
		toolbarItems.down('#copy').setDisabled(!selected);
		toolbarItems.down('#delete').setDisabled(!selected);
		toolbarItems.down('#fillcolor').setDisabled(!((!selected) || selectedNonGhost));
		toolbarItems.down('#fontcolor').setDisabled(!selectedNonGhost);
		toolbarItems.down('#linecolor').setDisabled(!selectedNonGhost);
		toolbarItems.down('#bold').setDisabled(!selectedNonGhost);
		toolbarItems.down('#italic').setDisabled(!selectedNonGhost);
		toolbarItems.down('#underline').setDisabled(!selectedNonGhost);
		toolbarItems.down('#fontCombo').setDisabled(!selectedNonGhost);
		toolbarItems.down('#sizeCombo').setDisabled(!selectedNonGhost);
		toolbarItems.down('#align').setDisabled(!selectedNonGhost);
		toolbarItems.down('#movemenu').setDisabled(!selected);
		toolbarItems.down('#picturemenu').setDisabled(!selected);
		toolbarItems.down('#useAsDefaultStyle').setDisabled(!selectedNonGhost);
		var reverseBtn = toolbarItems.down('#reverse');
		if (reverseBtn) reverseBtn.setDisabled(!(selected && (cellsContainNodename(graph.getSelectionCells(), "Link") || cellsContainNodename(graph.getSelectionCells(), "Flow") || cellsContainNodename(graph.getSelectionCells(), "Transition"))));

		setStyles();
	};

	graph.getSelectionModel().addListener(mxEvent.CHANGED, selectionListener);



	clipboardListener = function() {
		var pasteBtn = toolbarItems.down('#paste');
		if (pasteBtn) pasteBtn.setDisabled(mxClipboard.isEmpty());
	};
	clipboardListener();


	// Updates the states of the undo/redo buttons in the toolbar
	var historyListener = function() {
		var undoBtn = toolbarItems.down('#undo');
		var redoBtn = toolbarItems.down('#redo');
		if (undoBtn) undoBtn.setDisabled(!undoHistory.canUndo());
		if (redoBtn) redoBtn.setDisabled(!undoHistory.canRedo());
	};

	undoHistory.addListener(mxEvent.ADD, historyListener);
	undoHistory.addListener(mxEvent.UNDO, historyListener);
	undoHistory.addListener(mxEvent.REDO, historyListener);

	// Updates the button states once
	selectionListener();
	historyListener();


	setupGroupCellAndConnection(graph, primitiveBank);

	setupTooltipOverride(graph);

	// Redirects tooltips to ExtJs tooltips. First a tooltip object
	// is created that will act as the tooltip for all cells.
	var tooltip = new Ext.ToolTip({
		html: '',
		hideDelay: 0,
		dismissDelay: 0,
		showDelay: 0
	});

	// Installs the tooltip by overriding the hooks in mxGraph to
	// show and hide the tooltip.
	graph.tooltipHandler.show = function(tip, x, y) {
		if (tip != null && tip.length != '') {
			tooltip.items.each(function(childItem){
				this.remove(childItem);
			}, tooltip);
			tooltip.add(Ext.create("Ext.chart.CartesianChart", tip));
			tooltip.showAt([x, y + mxConstants.TOOLTIP_VERTICAL_OFFSET]);
		} else {
			tooltip.hide();
		}
	};

	graph.tooltipHandler.hide = function() {
		tooltip.hide();
	};

	graph.tooltipHandler.hideTooltip = function() {
		tooltip.hide();
	};

	// Enables guides
	mxGraphHandler.prototype.guidesEnabled = true;

	// we don't want a click for a cell in a folder to propagate up to the group
	mxGraphHandler.prototype.isPropagateSelectionCell = function(cell, immediate, me)
	{
		return false;
	};

	mxGraphHandler.prototype.mouseDown = function(sender, me) {
		if (!me.isConsumed() && this.isEnabled() && this.graph.isEnabled() && me.getState() != null) {
			var cell = this.getInitialCellForEvent(me);

			if (cell !== null && cell.value.nodeName == "Button" && (!graph.getSelectionModel().isSelected(cell))) {

				if (me.evt.shiftKey == false) {
					pressButton(cell);
					me.consume();
					graph.allowButtonSelect = false;
					return false;
				} else {
					graph.allowButtonSelect = true;
				}
			}

			this.delayedSelection = this.isDelayedSelection(cell, me);
			this.cell = null;

			if (this.isSelectEnabled() && !this.delayedSelection) {
				this.graph.selectCellForEvent(cell, me.getEvent());
			}

			if (this.isMoveEnabled()) {
				var model = this.graph.model;
				var geo = model.getGeometry(cell);

				if (this.graph.isCellMovable(cell) && ((!model.isEdge(cell) || this.graph.getSelectionCount() > 1 ||
						(geo.points != null && geo.points.length > 0) || model.getTerminal(cell, true) == null ||
						model.getTerminal(cell, false) == null) || this.graph.allowDanglingEdges ||
					(this.graph.isCloneEvent(me.getEvent()) && this.graph.isCellsCloneable()))) {
					this.start(cell, me.getX(), me.getY());
				}

				this.cellWasClicked = true;

				// Workaround for SELECT element not working in Webkit, this blocks moving
				// of the cell if the select element is clicked in Safari which is needed
				// because Safari doesn't seem to route the subsequent mouseUp event via
				// this handler which leads to an inconsistent state (no reset called).
				// Same for cellWasClicked which will block clearing the selection when
				// clicking the background after clicking on the SELECT element in Safari.
				if ((!mxClient.IS_SF && !mxClient.IS_GC) || me.getSource().nodeName != 'SELECT') {
					me.consume();
				} else if (mxClient.IS_SF && me.getSource().nodeName == 'SELECT') {
					this.cellWasClicked = false;
					this.first = null;
				}
			}
		}
	};





	// Alt disables guides
	mxGuide.prototype.isEnabledForEvent = function(evt) {
		return !mxEvent.isAltDown(evt);
	};

	var undoHandler = function(sender, evt) {
		var changes = evt.getProperty('edit').changes;
		graph.setSelectionCells(graph.getSelectionCellsForChanges(changes));
	};

	undoHistory.addListener(mxEvent.UNDO, undoHandler);
	undoHistory.addListener(mxEvent.REDO, undoHandler);

	if (viewConfig.focusDiagram) {
		//stealing focus in embedded frames scrolls the page to the frame
		graph.container.focus();
	}

	setTopLinks();
	if (!is_topBar) {
		toggleTopBar();
	}
	if (!is_sideBar) {
		configPanel.collapse(Ext.Component.DIRECTION_RIGHT, false);
	}



	setupKeyboardShortcuts(clipboardListener);

	graph.getSelectionModel().addListener(mxEvent.CHANGE, function(sender, evt) {

			selectionChanged(false);

	});





	// selectionChanged moved to PropertyPanel.js (global function)


	selectionChanged(false);

	setSaveEnabled(true);

	updateWindowTitle();


	handelCursors();

	handleUnfoldToolbar();

	if (is_embed && (is_zoom == 1)) {
		graph.getView().setScale(0.25);
		graph.fit();
		graph.fit();
	}



	setupFrozenHoverEffect(graph);


	window.doneLoading = true;

};



