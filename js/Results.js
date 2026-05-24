"use strict";
/*

Copyright 2010-2020 Scott Fortmann-Roe. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License.

*/

function createResultsWindow(displayInformation, config) {
	displayInformation.maps = [];
	displayInformation.histograms = [];

	analysisCount++;

	var displays = primitives("Display");

	var tabs = [];
	var scripter = {
		time: 0
	};

	displayInformation.scripter = scripter;

	var selectedTab = 0;
	for (var i = 0; i < displays.length; i++) {
		tabs.push({
			xtype: "panel",
			autoScroll: false,
			title: displays[i].getAttribute("name"),
			items: [renderDisplay(displays[i], displayInformation)],
			layout: "fit",
			display: displays[i]
		});
		if (config && displays[i] == config.selectedDisplay) {
			selectedTab = i;
		}
	}

	var rendered = new Ext.TabPanel({
		activeTab: selectedTab,
		flex: 1,
		deferredRender: false,
		frame: false,
		border: false,
		enableTabScroll: true,
		defaults: {
			autoScroll: true
		},
		items: tabs,
		listeners: {
			tabchange: enableTabs
		}
	});

	scripter.updatingSlider = false;
	scripter.timeIndex = 0;
	scripter.maxTime = function () {
		return this.simulator.displayInformation.store.maxLoaded;
	};
	scripter.minTime = 0;
	scripter.timeStep = 2;
	scripter.times = displayInformation.times;
	scripter.simulator = simulate;

	scripter.showSliders = function () {
		if (!scripter.slidersShown) {
			if (sliderPrimitives(["Variable", "Flow"]).length > 0) {
				scripter.dockedPanel = Ext.create("Ext.Panel", {
					xtype: "panel",
					layout: {
						type: "vbox",
						align: "stretch"
					},
					items: [createSliders(["Variable", "Flow"], function (cell, value) {
						if (!scripter.isFinished) {
							var val = new Material(value);
							for (var i = 0; i < simulate.sliders[cell.id].length; i++) {
								simulate.sliders[cell.id][i].equation = val;
							}
							simulate.sliders[cell.id][0].dna.equation = val;
							simulate.valueChange = true;
						} else {
							mxUtils.alert(getText("模拟已结束，无法更改滑块值。"))
						}
					}, function (slider, setValue, textField, newValue) {
						setValue(slider.sliderCell, newValue)
					})],
					dock: "right",
					width: 200,
					autoScroll: true,
					title: getText('滑块'),
					collapsible: true,
					split: true,
					border: true,
					bodyStyle: "background: none",
					collapseDirection: "right",
					animCollapse: false
				});
				win.addDocked(scripter.dockedPanel);
			}
			scripter.slidersShown = true
		}
	}

	scripter.slider = Ext.create("Ext.form.SliderField", {
		minValue: 0,
		animate: false,
		hideLabel: true,
		disabled: true,
		maxValue: displayInformation.times.length - 1,
		flex: 1,
		step: scripter.timeStep,
		margin: '0 10 0 10',
		useTips: true,
		tipText: function (thumb) {
			return "" + thumb.slider.s.times[thumb.slider.getValue()];
		}
	});

	scripter.combo = Ext.create("Ext.form.field.ComboBox", {
		fieldLabel: '',
		labelWidth: 0,
		allowBlank: false,
		store: [
			[0.2, getText("%s x 常速", "0.2")],
			[0.5, getText("%s x 常速", "0.5")],
			[1, getText("常速")],
			[1.5, getText("%s x 常速", "1.5")],
			[2, getText("%s x 常速", "2")],
			[5, getText("%s x 常速", "5")],
			[10, getText("%s x 常速", "10")],
			[-1, getText("满速")]
		],
		queryMode: 'local',
		value: window.storyConverter ? -1 : ((config && config.rate !== undefined) ? config.rate : parseFloat(getSetting()
			.getAttribute("Throttle"))),
		width: 140,
		forceSelection: true,
		listeners: {
			select: function (me) {
				setModelAttribute(getSetting(), "Throttle", me.getValue());
			}
		}
	});

	scripter.slider.s = scripter;

	scripter.slider.on('change', function (slider, newValue) {
		if (!this.s.updatingSlider) {
			if (newValue > this.s.maxTime()) {
				this.setValue(this.s.maxTime());
			} else {
				this.s.loadTime(newValue);
			}
		}
	});

	scripter.playBut = Ext.create("Ext.button.Button", {
		scale: 'medium',
		allowDepress: true,
		enableToggle: true,
		pressed: true,
		glyph: 0xf04c
	});

	scripter.stopBut = Ext.create("Ext.button.Button", {
		scale: 'medium',
		margin: '0 10 0 10',
		glyph: 0xf04d,
		handler: function (btn) {
			endRunningSimulation();
		}
	});

	scripter.finished = function () {
		this.isFinished = true;
		this.stopBut.hide();
		this.slider.setDisabled(false);
		if (this.dockedPanel) {
			this.dockedPanel.collapse();
		}
	}

	scripter.playBut.s = scripter;

	scripter.animInter = -1;
	scripter.playBut.on("toggle", function (b, pressed) {
		if (pressed) {

			scripter.endMode = "wait";

			if (scripter.slider.getValue() == displayInformation.times.length - 1) {
				scripter.slider.setValue(scripter.minTime);
			}
			scripter.playBut.setGlyph(0xf04c);
			scripter.advanceTimer();

			clearInterval(scripter.animInter);
			scripter.animInter = setInterval(function () {
				scripter.advanceTimer()
			}, 100 / Math.min(0.5, scripter.combo.getValue()));

			if (scripter.simulator && !scripter.simulator.completed()) {
				scripter.simulator.shouldSleep = false;
				scripter.simulator.resume();
			}

		} else {
			scripter.pause(true);
		}
	});

	scripter.pause = function (shouldSleep) {
		if (this.slider.isDisabled()) {
			this.showSliders();
		}

		if (shouldSleep && !this.isFinished) {
			this.slider.setValue(this.maxTime());
		}

		if (this.playBut.pressed) {
			this.playBut.toggle(false, true);
		}
		this.playBut.setGlyph(0xf04b);
		clearInterval(this.animInter);

		if (shouldSleep && !this.simulator.completed()) {
			this.simulator.sleep();
		}
	}

	scripter.endMode = "wait"; // "wait" or "pause"

	scripter.advanceTimer = function () {
		if ((this.slider.getValue() < this.maxTime()) || (this.maxTime() == displayInformation.times.length - 1)) {
			if (this.slider.getValue() < displayInformation.times.length - 1) {
				if (this.combo.getValue() == -1) {
					this.loadTime(this.maxTime());
				} else {
					this.loadTime(Math.min(this.maxTime(), this.slider.getValue() + this.timeStep * Math.max(0.5, this.combo.getValue())));
				}
			} else {
				this.playBut.toggle();
			}
		} else {
			if (this.endMode == "pause" || scripter.isFinished) {
				this.pause();
			}
		}
	}

	scripter.loadTime = function (time) {
		displayInformation.store.clearFilter(true);
		this.time = time;
		displayInformation.store.filter([{
			filterFn: function (item) {
				return item.get("id") <= time;
			}
		}]);

		displayInformation.maps.forEach(function (x) {
			buildMapStore(x, time);
		});
		displayInformation.histograms.forEach(function (x) {
			buildHistogramStore(x, time);
		});

		this.updatingSlider = true;
		this.slider.setValue(time);
		this.updatingSlider = false;
	}

	function enableTabs() {
		var tabs = win.tabs;
		var index = tabs.items.indexOf(tabs.getActiveTab())
		win.down("#delete").setDisabled(win.displays.length == 0);
		win.down("#left").setDisabled(win.displays.length < 2 || index == 0);
		win.down("#right").setDisabled(win.displays.length < 2 || index == win.displays.length - 1);
		win.down("#scratchpad").setDisabled(win.displays.length == 0 || win.displays[index].getAttribute("Type") == "Tabular");
		win.down("#configure").setDisabled(win.displays.length == 0);
	}

	var winConfig = {
		title: getText('模拟结果 %s', analysisCount),
		analysisCount: analysisCount,
		scratchPadStatus: {},
		closable: true,
		displays: displays,
		tabs: rendered,
		renderTo: 'ribbonPanel',
		constrain: true,
		maximized: viewConfig.fullScreenResults,
		expandedState: true,
		displayInformation: displayInformation,
		minWidth: 350,
		minHeight: 300,
		width: Math.min(Ext.getBody().getViewSize().width, 640),
		height: Math.min(Ext.getBody().getViewSize().height, (!viewConfig.showResultsEdit) ? 540 : 550),
		resizable: true,
		maximizable: true,
		minimizable: true,
		simulate: simulate,
		layout: {
			type: 'vbox',
			align: 'stretch'
		},
		items: [rendered, {
			xtype: 'container',
			layout: {
				type: "hbox",
				align: 'middle'
			},
			margin: '5 10 10 10',
			items: [scripter.playBut, scripter.slider, scripter.combo, scripter.stopBut]
		}],

		dockedItems: [{
			xtype: 'toolbar',
			enableOverflow: true,
			dock: 'top',
			hidden: (!viewConfig.showResultsEdit),
			items: [{
				glyph: 0xf055,
				scale: "large",
				text: getText('添加显示屏'),
				iconCls: 'green-icon',
				handler: function () {
					var parent = graph.getDefaultParent();
					var win = this.findParentByType("window");
					var vertex;
					var model = graph.getModel();
					model.beginUpdate();
					try {
						vertex = graph.insertVertex(parent, null, primitiveBank.display.cloneNode(true), 10, 10, 64, 64, "display");
						vertex.visible = false;

						setName(vertex, "新显示屏");
					} finally {
						model.endUpdate();
					}
					win.displays.push(vertex);
					win.tabs.add({
						title: vertex.getAttribute("name"),
						items: [renderDisplay(vertex, win.displayInformation)],
						layout: "fit",
						display: vertex
					});
					win.tabs.setActiveTab(primitives("Display")
						.length - 1);
					openDisplayConfigure(win);

					enableTabs();
				}
			}, {
				scale: "large",
				glyph: 0xf014,
				iconCls: 'red-icon',
				tooltip: getText('删除显示屏'),
				itemId: "delete",
				handler: function () {

					var win = this.findParentByType("window");
					if (win.displays.length > 0) {

						Ext.MessageBox.confirm('删除显示屏', '您确定要删除显示屏吗？这不能被撤消。', function (btn) {
							if (btn === 'yes') {

								var tabs = win.tabs;
								var tabIndex = tabs.items.indexOf(tabs.getActiveTab());

								var model = graph.getModel();
									model.beginUpdate();
								try {
									graph.removeCells([win.displays[tabIndex]], false);
								} finally {
									model.endUpdate();
								}
								win.displays.splice(tabIndex, 1);
								tabs.remove(tabs.getActiveTab());

								enableTabs();
							}
						});


					} else {

						mxUtils.alert(getText("没有要删除的图表或表格。"), "error", true);
					}
				}
			}, '-', {
				scale: "large",
				glyph: 0xf137,
				text: '',
				tooltip: getText("将显示屏移到左侧。"),
				itemId: "left",
				handler: function () {

					var win = this.findParentByType("window");
					if (win.displays.length > 0) {
						var tabs = win.tabs;
						var tabIndex = tabs.items.indexOf(tabs.getActiveTab());

						var display = win.displays[tabIndex];
						graph.orderCells(true, [display]);

						var child = tabs.getActiveTab();
						win.displays.splice(tabIndex, 1);
						win.displays = [display].concat(win.displays);

						tabs.remove(child, false);
						tabs.insert(0, child);
						tabs.setActiveTab(child);

					} else {
						mxUtils.alert(getText("没有要重新排序的图表或表格。"), "error", true);
					}
				}
			}, {
				scale: "large",
				glyph: 0xf138,
				text: '',
				tooltip: getText("将显示屏移到右侧。"),
				itemId: "right",
				handler: function () {

					var win = this.findParentByType("window");
					if (win.displays.length > 0) {
						var tabs = win.tabs;
						var tabIndex = tabs.items.indexOf(tabs.getActiveTab());

						var display = win.displays[tabIndex];
						graph.orderCells(false, [display]);

						win.displays.splice(tabIndex, 1);
						win.displays.push(display);

						var child = tabs.getActiveTab();
						tabs.remove(child, false);
						tabs.add(child);
						tabs.setActiveTab(child);
					} else {
						mxUtils.alert(getText("没有要重新排序的图表或表格。"), "error", true);
					}
				}
			}, '->', {
				scale: "large",
				glyph: 0xf040,
				text: getText(''),
				tooltip: getText('便笺'),
				itemId: "scratchpad",
				handler: function () {

					var win = this.findParentByType("window");
					if (win.displays.length > 0) {
						var tabs = win.tabs;
						var tabIndex = tabs.items.indexOf(tabs.getActiveTab());

						var display = win.displays[tabIndex];
						if (display.getAttribute("Type") != "Tabular") {

							var id = "scratchpad" + win.analysisCount + "_" + display.id;
							if (win.scratchPadStatus[id] == "shown") {
								Ext.get(id)
									.setDisplayed("none");
								win.scratchPadStatus[id] = "hidden";
							} else if (win.scratchPadStatus[id] == "hidden") {
								Ext.get(id)
									.setDisplayed("block");
								win.scratchPadStatus[id] = "shown";
							} else {
								if (Ext.get(id)) {
									Ext.get(id)
										.setDisplayed("block");
									Scratchpad($('#' + id));
									win.scratchPadStatus[id] = "shown";
								} else {
									mxUtils.alert(getText("便笺只能显示带有数据的图表。"), "error", true);
								}
							}
							return;
						}
					}
					mxUtils.alert(getText("便笺只能显示图表。"), "error", true);

				}
			}, {
				scale: "large",
				glyph: 0xf085,
				text: getText('配置'),
				itemId: "configure",
				handler: function () {
					var win = this.findParentByType("window");
					if (win.displays.length > 0) {
						openDisplayConfigure(win);
					} else {
						mxUtils.alert(getText("添加图表或表以进行配置。"), "notice", true);
					}
				}
			}

			]
		}]
	};

	if (is_ebook) {
		winConfig.maximizable = false;
		winConfig.closable = false;
		winConfig.resizable = false;
		winConfig.minimizable = false;
	}

	winConfig.stateful = is_editor && (!is_embed);
	winConfig.stateId = "results_window";

	winConfig.tools = [
		{
			type: 'pin',
			tooltip: getText('将结果链接到模型'),
			pinned: false,
			itemId: "pinTool",
			callback: function (panel, tool, event) {
				if (tool.pinned) {
					tool.pinned = false;
					tool.setStyle('opacity', 0.4);
					linkedResults = undefined;

				} else {
					tool.pinned = true;
					tool.setStyle('opacity', 1);
					linkedResults = win;

					Ext.WindowMgr.each(
						function (other) {
							if (win != other) {
								var t = other.down("#pinTool");
								if (t && t.pinned) {
									t.pinned = false;
									t.setStyle('opacity', 0.4);
								}
							}
						}
					);

					for (var id in win.sliders) {
						var cell = win.sliders[id][0];
						var v = evaluateTree(trimTree(cell.dna.value), varBank).value
						setValue(findID(id), v);
					}

					selectionChanged(true);

				}
			},
			style: {
				opacity: 0.4
			}
		},
		{
			type: 'gear',
			tooltip: getText('编辑标题'),
			handler: function () {
				Ext.Msg.prompt('编辑结果标题', '输入这些模拟结果的标题：', function (btn, text) {
					if (btn == 'ok') {
						win.setTitle(text);
					}
				}, this, false, win.getTitle());
			}
		}
	]

	var win = new Ext.Window(winConfig);
	win.on('minimize', function (w) {
		if (w.expandedState) {
			w.expandedState = false;
			w.collapse();
		} else {
			w.expandedState = true;
			win.expand();
		}
	});

	enableTabs();

	win.enableTabs = enableTabs;

	win.on('close', function (w) {
		if (linkedResults == win) {
			linkedResults = undefined;
		}
		if (!scripter.simulator.completed()) {
			scripter.simulator.terminate();
		}
		clearInterval(scripter.animInter);
	})

	win.scripter = scripter;
	win.show();

	return win;
}

function buildMapStore(item, time) {
	var res = [];

	var connections = {};
	var locations = {};

	for (var i = 0; i < item.agents.length; i++) {
		var agent = item.agents[i];
		var xNull = -parseFloat(simpleNum(agent.data.width, agent.data.units));
		var yNull = -parseFloat(simpleNum(agent.data.height, agent.data.units));

		var data = item.agents[i].results[time].current;
		for (var j = 0; j < data.length; j++) {
			locations[data[j].instanceId] = data[j].location;
			connections[data[j].instanceId] = data[j].connected;

			if (data[j].state !== null) {
				var states = data[j].state.map(function (x) {
					return x.dna.name
				}).join(", ");
			} else {
				var states = "";
			}

			var x = createDummyBase();
			var base = "series_" + agent.id + "__";
			x[base + "x"] = data[j].location.items[0];
			x[base + "y"] = data[j].location.items[1];
			res.push(x);

			if (data[j].state !== null) {
				for (var k = 0; k < data[j].state.length; k++) {
					var x = createDummyBase();
					var base = "series_" + agent.id + "_" + data[j].state[k].id + "_";
					x[base + "x"] = data[j].location.items[0];
					x[base + "y"] = data[j].location.items[1];
					res.push(x);
				}
			}
		}
	}

	function createDummyBase() {
		var x = {
			"agentIndex": j + 1,
			states: states
		};
		for (var i = 0; i < item.bases.length; i++) {
			x[item.bases[i] + "x"] = xNull;
			x[item.bases[i] + "y"] = yNull;
		}
		return x;
	}

	var links = {};
	var connectKeys = Object.keys(connections);
	for (var j = 0; j < connectKeys.length; j++) {
		var id = connectKeys[j];
		for (var i = 0; i < connections[id].length; i++) {
			var key = [id, connections[id][i]].sort()
				.join("__");
			if (!links[key]) {
				links[key] = [locations[id], locations[connections[id][i]]];
			}
		}
	}
	item.chart.links = links;

	item.store.loadData(res);
}

function buildHistogramStore(item, time) {
	item.store.loadData(createHistogramData(item.data[time], item.min, item.max));
}

function createHistogramChart(displayInformation, i) {
	var store = new Ext.data.JsonStore({
		fields: [{
			name: 'Label',
			type: 'string'
		}, {
			name: 'Count',
			type: 'float'
		}],
		data: []
	});
	var histogram = {
		store: store,
		data: displayInformation.res[displayInformation.ids[i]].results
	};

	var vecs = histogram.data;

	try {
		histogram.min = Math.floor(0 + functionBank["min"](vecs)
			.value);
		histogram.max = Math.ceil(0 + functionBank["max"](vecs)
			.value);
	} catch (err) {
		histogram.min = -1;
		histogram.max = 1;
	}
	if (isNaN(histogram.min)) {
		histogram.min = -1;
		histogram.max = 1;
	}

	if (histogram.min == histogram.max) {
		histogram.min = histogram.min - 1;
		histogram.max = histogram.max + 1;
	}

	var chart = Ext.create("Ext.chart.CartesianChart", {
		xtype: 'chart',
		flex: 1,
		animation: false,
		interactions: ['crosszoom'],
		shadow: false,
		store: store,
		axes: [{
			type: 'category',
			position: 'bottom',
			fields: ['Label'],
			title: displayInformation.headers[i]
		}, {
			type: 'numeric',
			position: 'left',
			fields: 'Count',
			titleMargin: 20,
			decimals: 0,
			minimum: 0
		}],
		series: [{
			type: 'bar',
			xField: 'Label',
			yField: "Count",
			titleMargin: 16,
			gutter: 5,
			tooltip: {
				trackMouse: true,
				width: 80,
				renderer: function (_storeItem, item) {
					if (item.value) {
						this.setTitle("<center>" + clean(commaStr(item.value[1])) + "</center>");
					} else if (item.record && item.record.data) {
						this.setTitle("<center>" + clean(item.record.data.Label) + ' – ' + clean(commaStr(item.record.data.Count)) + "</center>");
					}
				}
			}
		}]
	});


	buildHistogramStore(histogram, displayInformation.scripter.time)
	displayInformation.histograms.push(histogram)

	return chart;
}

function createHistogramData(data, min, max) {
	var divisions = 20;
	var counts = [];
	var width = (max - min) / divisions;
	for (var i = 0; i < divisions; i++) {
		counts.push({
			Label: round(min + width / 2 + width * i, 9),
			Count: 0
		});
	}
	for (var i = 0; i < data.items.length; i++) {
		var index = +(data.items[i].value !== undefined ? data.items[i].value : data.items[i]);
		if (!isNaN(index)) {
			index = Math.max(0, Math.min(divisions - 1, Math.round((index - min) / width - 0.5)));
			counts[index].Count = counts[index].Count + 1;
		}
	}
	return counts;
}
